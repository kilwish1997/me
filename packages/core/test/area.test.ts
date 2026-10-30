import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  calculateGeometryArea,
  calculateRingArea,
  convertArea,
  formatArea,
  getParcelArea,
  parseParcelCollection,
} from '../src/index.js';
import type { ParcelGeometry } from '../src/types.js';

const FIXTURES_DIR = path.resolve(__dirname, '../../../fixtures');

describe('Area Calculation & Unit Conversion', () => {
  it('correctly calculates area for a planar-approximating small geographic rectangle', () => {
    // 30m x 40m rectangle = 1200 sqm
    // From synthetic-50, first parcel has w=30, h=40
    const raw = fs.readFileSync(path.join(FIXTURES_DIR, 'synthetic-50.geojson'), 'utf-8');
    const result = parseParcelCollection(raw);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const firstParcel = result.dataset.features[0];
    expect(firstParcel).toBeDefined();
    if (!firstParcel) return;

    const computedArea = getParcelArea(firstParcel, 'sqm');
    const surveyedArea = firstParcel.properties.surveyedAreaSqm ?? 1200;

    // Geographic spherical calculation should be within 0.5% of surveyed flat rectangle at this scale
    const diffRatio = Math.abs(computedArea - surveyedArea) / surveyedArea;
    expect(diffRatio).toBeLessThan(0.005);
  });

  it('correctly handles interior holes by subtracting hole area from exterior ring', () => {
    // Polygon with exterior (45m x 45m = 2025 sqm) and interior hole (15m x 15m = 225 sqm) => net 1800 sqm
    const raw = fs.readFileSync(path.join(FIXTURES_DIR, 'synthetic-50.geojson'), 'utf-8');
    const result = parseParcelCollection(raw);
    expect(result.success).toBe(true);
    if (!result.success) return;

    // In synthetic-50, Atrium Estate parcels (e.g. index 40-44) have holes
    const holeParcel = result.dataset.features.find((p) => p.geometry.coordinates.length > 1);
    expect(holeParcel).toBeDefined();
    if (!holeParcel) return;

    const netArea = getParcelArea(holeParcel, 'sqm');
    const surveyed = holeParcel.properties.surveyedAreaSqm ?? 1800;

    const diffRatio = Math.abs(netArea - surveyed) / surveyed;
    expect(diffRatio).toBeLessThan(0.01);
  });

  it('correctly sums multipolygon parcel components', () => {
    const raw = fs.readFileSync(path.join(FIXTURES_DIR, 'synthetic-50.geojson'), 'utf-8');
    const result = parseParcelCollection(raw);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const multiParcel = result.dataset.features.find((p) => p.geometry.type === 'MultiPolygon');
    expect(multiParcel).toBeDefined();
    if (!multiParcel) return;

    const area = getParcelArea(multiParcel, 'sqm');
    const surveyed = multiParcel.properties.surveyedAreaSqm ?? 1400;

    const diffRatio = Math.abs(area - surveyed) / surveyed;
    expect(diffRatio).toBeLessThan(0.01);
  });

  it('accurately converts square meters across all supported units', () => {
    const sqm = 10000; // 10,000 sqm = 1 hectare

    expect(convertArea(sqm, 'sqm')).toBe(10000);
    expect(convertArea(sqm, 'ha')).toBeCloseTo(1.0, 5);
    expect(convertArea(sqm, 'ac')).toBeCloseTo(2.47105, 3);
    expect(convertArea(sqm, 'sqft')).toBeCloseTo(107639.1, 1);
    expect(convertArea(sqm, 'sqyd')).toBeCloseTo(11959.9, 1);
  });

  it('formats area with correct unit symbols and decimals', () => {
    const area = 1500;
    expect(formatArea(area, 'sqm')).toContain('m²');
    expect(formatArea(area, 'sqft')).toContain('ft²');
    expect(formatArea(area, 'sqyd')).toContain('yd²');
    expect(formatArea(area, 'ha')).toContain('ha');
    expect(formatArea(area, 'ac')).toContain('ac');
  });
});
