/**
 * Core types for Plotwise Kit
 */

export type ParcelStatus = 'available' | 'reserved' | 'sold' | 'unavailable';

export const PARCEL_STATUSES: readonly ParcelStatus[] = [
  'available',
  'reserved',
  'sold',
  'unavailable',
] as const;

export type AreaUnit = 'sqm' | 'sqft' | 'sqyd' | 'ha' | 'ac';

export const AREA_UNITS: readonly AreaUnit[] = [
  'sqm',
  'sqft',
  'sqyd',
  'ha',
  'ac',
] as const;

export type Position = [longitude: number, latitude: number, elevation?: number];

export type LinearRing = Position[];

export type PolygonCoordinates = LinearRing[];

export type MultiPolygonCoordinates = PolygonCoordinates[];

export interface PolygonGeometry {
  type: 'Polygon';
  coordinates: PolygonCoordinates;
}

export interface MultiPolygonGeometry {
  type: 'MultiPolygon';
  coordinates: MultiPolygonCoordinates;
}

export type ParcelGeometry = PolygonGeometry | MultiPolygonGeometry;

export interface ParcelProperties {
  id: string;
  label: string;
  status: ParcelStatus;
  surveyedAreaSqm?: number;
  approximateAreaSqm?: number;
  [key: string]: unknown;
}

export interface Parcel {
  type: 'Feature';
  id: string;
  geometry: ParcelGeometry;
  properties: ParcelProperties;
}

export type BoundingBox = [minLon: number, minLat: number, maxLon: number, maxLat: number];

export interface StatusCounts {
  available: number;
  reserved: number;
  sold: number;
  unavailable: number;
  total: number;
}

export interface ParcelCollection {
  type: 'FeatureCollection';
  features: Parcel[];
  datasetFingerprint: string;
  featureCount: number;
  approximateTotalAreaSqm: number;
  statusCounts: StatusCounts;
  boundingBox: BoundingBox;
}

export type DiagnosticSeverity = 'error' | 'warning';

export interface Diagnostic {
  code: string;
  message: string;
  severity: DiagnosticSeverity;
  featureId?: string;
  path: string;
}

export interface ValidationLimits {
  /** Maximum allowable file byte size (default: 15MB) */
  maxByteSize: number;
  /** Maximum allowable parcel features (default: 10,000) */
  maxFeatures: number;
  /** Maximum allowable vertices across all polygons (default: 100,000) */
  maxVertices: number;
  /** Maximum allowable vertices in a single linear ring (default: 5,000) */
  maxRingVertices: number;
}

export interface FieldMapping {
  idKey?: string;
  labelKey?: string;
  statusKey?: string;
  surveyedAreaKey?: string;
  statusMap?: Record<string, ParcelStatus>;
}

export interface ParseOptions {
  limits?: Partial<ValidationLimits>;
  fieldMapping?: FieldMapping;
  datasetName?: string;
}

export type ParseResult =
  | { success: true; dataset: ParcelCollection; warnings: Diagnostic[] }
  | { success: false; dataset?: undefined; diagnostics: Diagnostic[] };

export interface ParcelFilters {
  query: string;
  statuses: ParcelStatus[];
  minAreaSqm?: number;
  maxAreaSqm?: number;
}

export interface ViewerState {
  datasetId: string;
  selectedId: string | null;
  filters: ParcelFilters;
  unit: AreaUnit;
}
