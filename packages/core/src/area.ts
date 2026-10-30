import type { AreaUnit, Parcel, ParcelGeometry, Position } from './types.js';

/**
 * Standard WGS84 authalic equatorial radius in meters (6,378,137m).
 * Consistent with standard GIS algorithms (Turf, OpenLayers, PostGIS spherical).
 */
export const WGS84_EQUATORIAL_RADIUS = 6378137;

/**
 * Unit conversion factors from square meters.
 */
export const AREA_CONVERSIONS: Record<AreaUnit, number> = {
  sqm: 1,
  sqft: 10.763910416709722,
  sqyd: 1.1959900463010802,
  ha: 0.0001,
  ac: 0.0002471053814671653,
};

/**
 * Unit display symbols.
 */
export const AREA_UNIT_SYMBOLS: Record<AreaUnit, string> = {
  sqm: 'm²',
  sqft: 'ft²',
  sqyd: 'yd²',
  ha: 'ha',
  ac: 'ac',
};

/**
 * Unit human-readable names.
 */
export const AREA_UNIT_LABELS: Record<AreaUnit, string> = {
  sqm: 'Square Meters',
  sqft: 'Square Feet',
  sqyd: 'Square Yards',
  ha: 'Hectares',
  ac: 'Acres',
};

/**
 * Computes the spherical area of a single linear ring in square meters
 * using the Chamberlain and Duquette spherical excess formula.
 *
 * @param ring Array of [longitude, latitude] coordinates in WGS84 degrees.
 * @returns Approximate geographic area in square meters.
 */
export function calculateRingArea(ring: readonly Position[]): number {
  if (ring.length < 4) {
    return 0;
  }

  let total = 0;
  const len = ring.length - 1;

  for (let i = 0; i < len; i++) {
    const p1 = ring[i];
    const p2 = ring[i + 1];
    if (!p1 || !p2) continue;

    const lon1 = (p1[0] * Math.PI) / 180;
    const lat1 = (p1[1] * Math.PI) / 180;
    const lon2 = (p2[0] * Math.PI) / 180;
    const lat2 = (p2[1] * Math.PI) / 180;

    total += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  return Math.abs((total * WGS84_EQUATORIAL_RADIUS * WGS84_EQUATORIAL_RADIUS) / 2.0);
}

/**
 * Computes approximate geographic area of a Polygon or MultiPolygon in square meters,
 * explicitly subtracting interior rings (holes) and summing multipolygon components.
 *
 * Notice: This is an approximate geographic calculation on the WGS84 authalic sphere.
 * It is not a certified land survey or legal title record.
 */
export function calculateGeometryArea(geometry: ParcelGeometry): number {
  if (geometry.type === 'Polygon') {
    const rings = geometry.coordinates;
    if (rings.length === 0 || !rings[0]) return 0;

    const exteriorArea = calculateRingArea(rings[0]);
    let holeArea = 0;

    for (let i = 1; i < rings.length; i++) {
      const hole = rings[i];
      if (hole) {
        holeArea += calculateRingArea(hole);
      }
    }

    return Math.max(0, exteriorArea - holeArea);
  }

  if (geometry.type === 'MultiPolygon') {
    let total = 0;
    for (const polyCoordinates of geometry.coordinates) {
      if (polyCoordinates.length === 0 || !polyCoordinates[0]) continue;
      const exteriorArea = calculateRingArea(polyCoordinates[0]);
      let holeArea = 0;
      for (let i = 1; i < polyCoordinates.length; i++) {
        const hole = polyCoordinates[i];
        if (hole) {
          holeArea += calculateRingArea(hole);
        }
      }
      total += Math.max(0, exteriorArea - holeArea);
    }
    return total;
  }

  return 0;
}

/**
 * Returns approximate geographic area of a parcel in the requested unit.
 */
export function getParcelArea(parcel: Parcel, unit: AreaUnit = 'sqm'): number {
  const areaSqm = calculateGeometryArea(parcel.geometry);
  return convertArea(areaSqm, unit);
}

/**
 * Converts square meters into the specified unit.
 */
export function convertArea(areaSqm: number, unit: AreaUnit): number {
  const factor = AREA_CONVERSIONS[unit];
  return areaSqm * factor;
}

/**
 * Converts an area in a given unit back to square meters.
 */
export function convertToSqm(area: number, unit: AreaUnit): number {
  const factor = AREA_CONVERSIONS[unit];
  return area / factor;
}

/**
 * Formats an area with appropriate precision and unit symbol.
 */
export function formatArea(
  areaSqm: number,
  unit: AreaUnit = 'sqm',
  options: { decimals?: number; locale?: string } = {}
): string {
  const converted = convertArea(areaSqm, unit);
  const symbol = AREA_UNIT_SYMBOLS[unit];
  const locale = options.locale ?? 'en-US';

  let decimals = options.decimals;
  if (decimals === undefined) {
    if (unit === 'ha' || unit === 'ac') {
      decimals = converted < 10 ? 2 : 1;
    } else {
      decimals = converted < 100 ? 1 : 0;
    }
  }

  const formattedNumber = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(converted);

  return `${formattedNumber} ${symbol}`;
}
