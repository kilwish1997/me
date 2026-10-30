import { calculateGeometryArea } from './area.js';
import { computeDatasetFingerprint } from './fingerprint.js';
import type {
  BoundingBox,
  Diagnostic,
  FieldMapping,
  Parcel,
  ParcelCollection,
  ParcelGeometry,
  ParcelProperties,
  ParcelStatus,
  ParseOptions,
  ParseResult,
  PolygonGeometry,
  Position,
  StatusCounts,
  ValidationLimits,
} from './types.js';
import { PARCEL_STATUSES } from './types.js';

export const DEFAULT_LIMITS: ValidationLimits = {
  maxByteSize: 15 * 1024 * 1024, // 15 Megabytes
  maxFeatures: 10000,
  maxVertices: 100000,
  maxRingVertices: 5000,
};

/**
 * Checks if a string representation of property could contain script tags or dangerous patterns.
 * Used to flag warnings for suspicious property payloads.
 */
function containsScriptPattern(val: unknown): boolean {
  if (typeof val !== 'string') return false;
  return /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(val) || /javascript:/gi.test(val);
}

/**
 * Validates and maps a caller's parcel properties into normalized ParcelProperties.
 */
export function mapParcelProperties(
  rawProps: Record<string, unknown> | null | undefined,
  rawId: unknown,
  mapping: FieldMapping = {}
): {
  properties: ParcelProperties;
  id: string;
  errors: Diagnostic[];
  warnings: Diagnostic[];
} {
  const errors: Diagnostic[] = [];
  const warnings: Diagnostic[] = [];
  const props = rawProps ?? {};

  // 1. Resolve ID
  const idKey = mapping.idKey ?? 'id';
  let resolvedId = rawId !== undefined && rawId !== null ? String(rawId).trim() : '';
  if (!resolvedId && props[idKey] !== undefined && props[idKey] !== null) {
    resolvedId = String(props[idKey]).trim();
  }

  if (!resolvedId) {
    errors.push({
      code: 'MISSING_ID',
      message: 'Feature must have a stable, non-empty string ID in "id" or properties.',
      severity: 'error',
      path: 'id',
    });
  }

  // 2. Resolve Label
  const labelKey = mapping.labelKey ?? (props['label'] !== undefined ? 'label' : 'name');
  let label = props[labelKey] !== undefined && props[labelKey] !== null ? String(props[labelKey]).trim() : '';
  if (!label && resolvedId) {
    label = resolvedId; // fallback to ID if explicit label missing
    warnings.push({
      code: 'FALLBACK_LABEL',
      message: `Feature missing explicit label; defaulted to ID "${resolvedId}".`,
      severity: 'warning',
      featureId: resolvedId,
      path: `properties.${labelKey}`,
    });
  } else if (!label) {
    errors.push({
      code: 'MISSING_LABEL',
      message: 'Feature must have a non-empty string label.',
      severity: 'error',
      featureId: resolvedId,
      path: `properties.${labelKey}`,
    });
  }

  // 3. Resolve Status
  const statusKey = mapping.statusKey ?? 'status';
  const rawStatus = props[statusKey];
  let resolvedStatus: ParcelStatus | undefined;

  if (typeof rawStatus === 'string') {
    const normalized = rawStatus.toLowerCase().trim();
    if (mapping.statusMap && mapping.statusMap[normalized]) {
      resolvedStatus = mapping.statusMap[normalized];
    } else if (PARCEL_STATUSES.includes(normalized as ParcelStatus)) {
      resolvedStatus = normalized as ParcelStatus;
    }
  }

  if (!resolvedStatus) {
    errors.push({
      code: 'INVALID_STATUS',
      message: `Invalid or missing status "${String(rawStatus)}". Accepted values are: ${PARCEL_STATUSES.join(', ')}.`,
      severity: 'error',
      featureId: resolvedId,
      path: `properties.${statusKey}`,
    });
    resolvedStatus = 'unavailable'; // placeholder to satisfy type
  }

  // 4. Resolve Surveyed Area (if present)
  const surveyedKey = mapping.surveyedAreaKey ?? (props['surveyedAreaSqm'] !== undefined ? 'surveyedAreaSqm' : 'surveyedArea');
  let surveyedAreaSqm: number | undefined;
  if (props[surveyedKey] !== undefined && props[surveyedKey] !== null) {
    const num = Number(props[surveyedKey]);
    if (Number.isFinite(num) && num > 0) {
      surveyedAreaSqm = num;
    } else {
      warnings.push({
        code: 'INVALID_SURVEYED_AREA',
        message: `Property "${surveyedKey}" is not a positive finite number; ignored.`,
        severity: 'warning',
        featureId: resolvedId,
        path: `properties.${surveyedKey}`,
      });
    }
  }

  // Check for script tags in textual properties
  for (const [k, v] of Object.entries(props)) {
    if (containsScriptPattern(v)) {
      warnings.push({
        code: 'SCRIPT_TAG_IN_PROPERTY',
        message: `Property "${k}" contains HTML/script-like characters. It will be treated strictly as harmless text.`,
        severity: 'warning',
        featureId: resolvedId,
        path: `properties.${k}`,
      });
    }
  }

  const normalizedProperties: ParcelProperties = {
    ...props,
    id: resolvedId,
    label: label,
    status: resolvedStatus,
    ...(surveyedAreaSqm !== undefined ? { surveyedAreaSqm } : {}),
  };

  return { properties: normalizedProperties, id: resolvedId, errors, warnings };
}

/**
 * Validates a single linear ring of coordinates.
 */
function validateRing(
  ring: unknown,
  featureId: string,
  path: string,
  maxRingVertices: number
): { ring?: Position[]; errors: Diagnostic[]; vertexCount: number } {
  const errors: Diagnostic[] = [];

  if (!Array.isArray(ring)) {
    errors.push({
      code: 'INVALID_RING',
      message: 'Linear ring must be an array of coordinate positions.',
      severity: 'error',
      featureId,
      path,
    });
    return { errors, vertexCount: 0 };
  }

  if (ring.length < 4) {
    errors.push({
      code: 'INSUFFICIENT_RING_VERTICES',
      message: `Linear ring has ${ring.length} vertices; standard GeoJSON polygons require at least 4.`,
      severity: 'error',
      featureId,
      path,
    });
    return { errors, vertexCount: ring.length };
  }

  if (ring.length > maxRingVertices) {
    errors.push({
      code: 'RING_VERTEX_LIMIT_EXCEEDED',
      message: `Ring vertex count (${ring.length}) exceeds configured limit (${maxRingVertices}).`,
      severity: 'error',
      featureId,
      path,
    });
    return { errors, vertexCount: ring.length };
  }

  const parsedRing: Position[] = [];

  for (let i = 0; i < ring.length; i++) {
    const pt = ring[i];
    const ptPath = `${path}[${i}]`;

    if (!Array.isArray(pt) || pt.length < 2) {
      errors.push({
        code: 'INVALID_COORDINATE_FORMAT',
        message: 'Coordinate must be a 2-element array [longitude, latitude].',
        severity: 'error',
        featureId,
        path: ptPath,
      });
      continue;
    }

    const lon = Number(pt[0]);
    const lat = Number(pt[1]);

    if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
      errors.push({
        code: 'NON_FINITE_COORDINATE',
        message: `Coordinate values must be finite numbers; received [${String(pt[0])}, ${String(pt[1])}].`,
        severity: 'error',
        featureId,
        path: ptPath,
      });
      continue;
    }

    // Swapped lat/lon detection: latitude position > 90 is definitely invalid
    if (Math.abs(lat) > 90) {
      errors.push({
        code: 'COORDINATE_OUT_OF_RANGE',
        message: `Latitude (${lat}) exceeds valid WGS84 range [-90, 90]. (Check coordinate order: GeoJSON requires [lon, lat]).`,
        severity: 'error',
        featureId,
        path: ptPath,
      });
    }

    if (Math.abs(lon) > 180) {
      errors.push({
        code: 'COORDINATE_OUT_OF_RANGE',
        message: `Longitude (${lon}) exceeds valid WGS84 range [-180, 180].`,
        severity: 'error',
        featureId,
        path: ptPath,
      });
    }

    // Antimeridian crossing check with previous point
    if (parsedRing.length > 0) {
      const prev = parsedRing[parsedRing.length - 1];
      if (prev && Math.abs(lon - prev[0]) > 180) {
        errors.push({
          code: 'ANTIMERIDIAN_CROSSING',
          message: `Geometry ring crosses the 180° antimeridian between vertex ${i - 1} (${prev[0]}) and ${i} (${lon}). Antimeridian-spanning parcels are not supported in version 0.1.`,
          severity: 'error',
          featureId,
          path: ptPath,
        });
      }
    }

    parsedRing.push([lon, lat, pt[2] !== undefined ? Number(pt[2]) : undefined]);
  }

  // Check ring closure (first point equals last point)
  if (parsedRing.length >= 4) {
    const first = parsedRing[0];
    const last = parsedRing[parsedRing.length - 1];
    if (!first || !last || first[0] !== last[0] || first[1] !== last[1]) {
      errors.push({
        code: 'UNCLOSED_RING',
        message: `Linear ring is unclosed: first coordinate [${first?.[0]}, ${first?.[1]}] does not match last coordinate [${last?.[0]}, ${last?.[1]}].`,
        severity: 'error',
        featureId,
        path,
      });
    }
  }

  return { ring: errors.length === 0 ? parsedRing : undefined, errors, vertexCount: ring.length };
}

/**
 * Validates Parcel geometry (Polygon or MultiPolygon).
 */
function validateGeometry(
  geom: unknown,
  featureId: string,
  limits: ValidationLimits
): { geometry?: ParcelGeometry; errors: Diagnostic[]; vertexCount: number } {
  const errors: Diagnostic[] = [];

  if (!geom || typeof geom !== 'object') {
    errors.push({
      code: 'MISSING_GEOMETRY',
      message: 'Feature must contain a valid geometry object.',
      severity: 'error',
      featureId,
      path: 'geometry',
    });
    return { errors, vertexCount: 0 };
  }

  const raw = geom as { type?: unknown; coordinates?: unknown };

  if (raw.type !== 'Polygon' && raw.type !== 'MultiPolygon') {
    errors.push({
      code: 'UNSUPPORTED_GEOMETRY',
      message: `Geometry type "${String(raw.type)}" is not supported. Only "Polygon" and "MultiPolygon" parcel geometries are permitted.`,
      severity: 'error',
      featureId,
      path: 'geometry.type',
    });
    return { errors, vertexCount: 0 };
  }

  let totalVertices = 0;

  if (raw.type === 'Polygon') {
    if (!Array.isArray(raw.coordinates)) {
      errors.push({
        code: 'INVALID_COORDINATES',
        message: 'Polygon coordinates must be an array of linear rings.',
        severity: 'error',
        featureId,
        path: 'geometry.coordinates',
      });
      return { errors, vertexCount: 0 };
    }

    const validatedRings: Position[][] = [];
    for (let r = 0; r < raw.coordinates.length; r++) {
      const { ring, errors: ringErrors, vertexCount } = validateRing(
        raw.coordinates[r],
        featureId,
        `geometry.coordinates[${r}]`,
        limits.maxRingVertices
      );
      totalVertices += vertexCount;
      errors.push(...ringErrors);
      if (ring) {
        validatedRings.push(ring);
      }
    }

    if (errors.length === 0) {
      return {
        geometry: { type: 'Polygon', coordinates: validatedRings } as PolygonGeometry,
        errors,
        vertexCount: totalVertices,
      };
    }
  }

  if (raw.type === 'MultiPolygon') {
    if (!Array.isArray(raw.coordinates)) {
      errors.push({
        code: 'INVALID_COORDINATES',
        message: 'MultiPolygon coordinates must be an array of polygon coordinate arrays.',
        severity: 'error',
        featureId,
        path: 'geometry.coordinates',
      });
      return { errors, vertexCount: 0 };
    }

    const validatedMulti: Position[][][] = [];
    for (let p = 0; p < raw.coordinates.length; p++) {
      const poly = raw.coordinates[p];
      if (!Array.isArray(poly)) {
        errors.push({
          code: 'INVALID_COORDINATES',
          message: `MultiPolygon part at index ${p} must be an array of linear rings.`,
          severity: 'error',
          featureId,
          path: `geometry.coordinates[${p}]`,
        });
        continue;
      }

      const validatedRings: Position[][] = [];
      for (let r = 0; r < poly.length; r++) {
        const { ring, errors: ringErrors, vertexCount } = validateRing(
          poly[r],
          featureId,
          `geometry.coordinates[${p}][${r}]`,
          limits.maxRingVertices
        );
        totalVertices += vertexCount;
        errors.push(...ringErrors);
        if (ring) {
          validatedRings.push(ring);
        }
      }
      validatedMulti.push(validatedRings);
    }

    if (errors.length === 0) {
      return {
        geometry: { type: 'MultiPolygon', coordinates: validatedMulti },
        errors,
        vertexCount: totalVertices,
      };
    }
  }

  return { errors, vertexCount: totalVertices };
}

/**
 * Computes bounding box from a collection of parcels: [minLon, minLat, maxLon, maxLat].
 */
function computeBoundingBox(parcels: readonly Parcel[]): BoundingBox {
  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;

  for (const parcel of parcels) {
    const geom = parcel.geometry;
    const processRing = (ring: readonly Position[]) => {
      for (const pt of ring) {
        if (pt[0] < minLon) minLon = pt[0];
        if (pt[0] > maxLon) maxLon = pt[0];
        if (pt[1] < minLat) minLat = pt[1];
        if (pt[1] > maxLat) maxLat = pt[1];
      }
    };

    if (geom.type === 'Polygon') {
      for (const ring of geom.coordinates) {
        processRing(ring);
      }
    } else if (geom.type === 'MultiPolygon') {
      for (const poly of geom.coordinates) {
        for (const ring of poly) {
          processRing(ring);
        }
      }
    }
  }

  if (!Number.isFinite(minLon)) {
    return [-180, -90, 180, 90];
  }

  return [minLon, minLat, maxLon, maxLat];
}

/**
 * Parses and strictly validates a GeoJSON Parcel FeatureCollection.
 *
 * Implements atomic validation: if any feature or coordinate is invalid,
 * structured diagnostics are returned and no partial dataset is created.
 */
export function parseParcelCollection(input: unknown, options: ParseOptions = {}): ParseResult {
  const limits: ValidationLimits = {
    ...DEFAULT_LIMITS,
    ...options.limits,
  };

  const diagnostics: Diagnostic[] = [];
  const warnings: Diagnostic[] = [];

  let parsed: unknown = input;

  // 1. File size check for string inputs
  if (typeof input === 'string') {
    const byteLength = new TextEncoder().encode(input).length;
    if (byteLength > limits.maxByteSize) {
      return {
        success: false,
        diagnostics: [
          {
            code: 'FILE_SIZE_LIMIT_EXCEEDED',
            message: `Input size (${(byteLength / 1024 / 1024).toFixed(2)} MB) exceeds configured limit (${(limits.maxByteSize / 1024 / 1024).toFixed(2)} MB).`,
            severity: 'error',
            path: 'root',
          },
        ],
      };
    }

    try {
      parsed = JSON.parse(input);
    } catch (err) {
      return {
        success: false,
        diagnostics: [
          {
            code: 'INVALID_JSON',
            message: `Failed to parse GeoJSON string: ${err instanceof Error ? err.message : String(err)}`,
            severity: 'error',
            path: 'root',
          },
        ],
      };
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    return {
      success: false,
      diagnostics: [
        {
          code: 'INVALID_GEOJSON',
          message: 'Input must be a valid GeoJSON object.',
          severity: 'error',
          path: 'root',
        },
      ],
    };
  }

  const rawCollection = parsed as { type?: unknown; features?: unknown };

  if (rawCollection.type !== 'FeatureCollection') {
    return {
      success: false,
      diagnostics: [
        {
          code: 'INVALID_FEATURE_COLLECTION',
          message: `Expected GeoJSON type "FeatureCollection", found "${String(rawCollection.type)}".`,
          severity: 'error',
          path: 'type',
        },
      ],
    };
  }

  if (!Array.isArray(rawCollection.features)) {
    return {
      success: false,
      diagnostics: [
        {
          code: 'INVALID_FEATURES_ARRAY',
          message: 'FeatureCollection must contain a "features" array.',
          severity: 'error',
          path: 'features',
        },
      ],
    };
  }

  const rawFeatures = rawCollection.features;

  if (rawFeatures.length > limits.maxFeatures) {
    return {
      success: false,
      diagnostics: [
        {
          code: 'FEATURE_LIMIT_EXCEEDED',
          message: `Dataset contains ${rawFeatures.length} features, exceeding configured limit of ${limits.maxFeatures}.`,
          severity: 'error',
          path: 'features',
        },
      ],
    };
  }

  const seenIds = new Set<string>();
  const validatedParcels: Parcel[] = [];
  let totalDatasetVertices = 0;
  let approximateTotalAreaSqm = 0;

  const statusCounts: StatusCounts = {
    available: 0,
    reserved: 0,
    sold: 0,
    unavailable: 0,
    total: 0,
  };

  for (let i = 0; i < rawFeatures.length; i++) {
    const rawFeat = rawFeatures[i] as {
      type?: unknown;
      id?: unknown;
      geometry?: unknown;
      properties?: Record<string, unknown>;
    };

    if (!rawFeat || typeof rawFeat !== 'object' || rawFeat.type !== 'Feature') {
      diagnostics.push({
        code: 'INVALID_FEATURE',
        message: `Feature at index ${i} is not a valid GeoJSON Feature object.`,
        severity: 'error',
        path: `features[${i}]`,
      });
      continue;
    }

    // Properties mapping & normalization
    const { properties, id, errors: propErrors, warnings: propWarnings } = mapParcelProperties(
      rawFeat.properties,
      rawFeat.id,
      options.fieldMapping
    );

    diagnostics.push(...propErrors);
    warnings.push(...propWarnings);

    // ID uniqueness
    if (id) {
      if (seenIds.has(id)) {
        diagnostics.push({
          code: 'DUPLICATE_ID',
          message: `Duplicate parcel ID "${id}" detected. Each parcel must have a unique ID.`,
          severity: 'error',
          featureId: id,
          path: `features[${i}].id`,
        });
      } else {
        seenIds.add(id);
      }
    }

    // Geometry validation
    const { geometry, errors: geomErrors, vertexCount } = validateGeometry(
      rawFeat.geometry,
      id || `index_${i}`,
      limits
    );

    totalDatasetVertices += vertexCount;
    diagnostics.push(...geomErrors);

    if (totalDatasetVertices > limits.maxVertices) {
      diagnostics.push({
        code: 'VERTEX_LIMIT_EXCEEDED',
        message: `Total vertex count (${totalDatasetVertices}) exceeds limit of ${limits.maxVertices}.`,
        severity: 'error',
        path: 'features',
      });
      break;
    }

    if (geometry && id && propErrors.length === 0 && geomErrors.length === 0) {
      const approxArea = calculateGeometryArea(geometry);
      properties.approximateAreaSqm = approxArea;
      approximateTotalAreaSqm += approxArea;

      statusCounts[properties.status]++;
      statusCounts.total++;

      validatedParcels.push({
        type: 'Feature',
        id,
        geometry,
        properties,
      });
    }
  }

  // Atomic check: any error causes failure
  const errors = diagnostics.filter((d) => d.severity === 'error');
  if (errors.length > 0) {
    return {
      success: false,
      diagnostics: errors,
    };
  }

  const fingerprint = computeDatasetFingerprint(validatedParcels);
  const bbox = computeBoundingBox(validatedParcels);

  const dataset: ParcelCollection = {
    type: 'FeatureCollection',
    features: validatedParcels,
    datasetFingerprint: fingerprint,
    featureCount: validatedParcels.length,
    approximateTotalAreaSqm,
    statusCounts,
    boundingBox: bbox,
  };

  return {
    success: true,
    dataset,
    warnings,
  };
}
