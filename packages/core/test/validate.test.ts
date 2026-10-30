import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  parseParcelCollection,
  mapParcelProperties,
  DEFAULT_LIMITS,
} from '../src/index.js';

const FIXTURES_DIR = path.resolve(__dirname, '../../../fixtures');

describe('parseParcelCollection & Validation', () => {
  it('successfully parses and validates synthetic-50.geojson', () => {
    const raw = fs.readFileSync(path.join(FIXTURES_DIR, 'synthetic-50.geojson'), 'utf-8');
    const result = parseParcelCollection(raw);

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.dataset.featureCount).toBe(50);
    expect(result.dataset.features.length).toBe(50);
    expect(result.dataset.datasetFingerprint).toMatch(/^pw_[0-9a-f]{16}$/);
    expect(result.dataset.statusCounts.total).toBe(50);
    expect(result.dataset.statusCounts.available).toBeGreaterThan(0);
    expect(result.dataset.approximateTotalAreaSqm).toBeGreaterThan(0);
  });

  it('successfully parses and validates synthetic-500.geojson', () => {
    const raw = fs.readFileSync(path.join(FIXTURES_DIR, 'synthetic-500.geojson'), 'utf-8');
    const result = parseParcelCollection(raw);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.dataset.featureCount).toBe(500);
  });

  it('atomically rejects duplicate IDs with structured diagnostic', () => {
    const raw = fs.readFileSync(path.join(FIXTURES_DIR, 'invalid-duplicate-ids.geojson'), 'utf-8');
    const result = parseParcelCollection(raw);

    expect(result.success).toBe(false);
    if (result.success) return;

    const dupError = result.diagnostics.find((d) => d.code === 'DUPLICATE_ID');
    expect(dupError).toBeDefined();
    expect(dupError?.severity).toBe('error');
    expect(dupError?.featureId).toBeDefined();
  });

  it('rejects coordinate order inversion (latitude > 90)', () => {
    const raw = fs.readFileSync(path.join(FIXTURES_DIR, 'invalid-coordinate-order.geojson'), 'utf-8');
    const result = parseParcelCollection(raw);

    expect(result.success).toBe(false);
    if (result.success) return;

    const error = result.diagnostics.find((d) => d.code === 'COORDINATE_OUT_OF_RANGE');
    expect(error).toBeDefined();
    expect(error?.message).toContain('exceeds valid WGS84 range');
  });

  it('rejects coordinates out of range (lon < -180)', () => {
    const raw = fs.readFileSync(path.join(FIXTURES_DIR, 'invalid-out-of-range.geojson'), 'utf-8');
    const result = parseParcelCollection(raw);

    expect(result.success).toBe(false);
    if (result.success) return;

    const error = result.diagnostics.find((d) => d.code === 'COORDINATE_OUT_OF_RANGE');
    expect(error).toBeDefined();
  });

  it('rejects unclosed rings with descriptive error', () => {
    const raw = fs.readFileSync(path.join(FIXTURES_DIR, 'invalid-unclosed-ring.geojson'), 'utf-8');
    const result = parseParcelCollection(raw);

    expect(result.success).toBe(false);
    if (result.success) return;

    const error = result.diagnostics.find((d) => d.code === 'UNCLOSED_RING');
    expect(error).toBeDefined();
  });

  it('rejects antimeridian-crossing geometry with clear diagnostic', () => {
    const raw = fs.readFileSync(path.join(FIXTURES_DIR, 'invalid-antimeridian.geojson'), 'utf-8');
    const result = parseParcelCollection(raw);

    expect(result.success).toBe(false);
    if (result.success) return;

    const error = result.diagnostics.find((d) => d.code === 'ANTIMERIDIAN_CROSSING');
    expect(error).toBeDefined();
    expect(error?.message).toContain('antimeridian');
  });

  it('rejects unsupported geometries like Point with structured diagnostic', () => {
    const raw = fs.readFileSync(path.join(FIXTURES_DIR, 'invalid-unsupported-geometry.geojson'), 'utf-8');
    const result = parseParcelCollection(raw);

    expect(result.success).toBe(false);
    if (result.success) return;

    const error = result.diagnostics.find((d) => d.code === 'UNSUPPORTED_GEOMETRY');
    expect(error).toBeDefined();
  });

  it('enforces vertex limit breaches atomically', () => {
    const raw = fs.readFileSync(path.join(FIXTURES_DIR, 'invalid-resource-limits.geojson'), 'utf-8');
    // Configure small vertex limit
    const result = parseParcelCollection(raw, { limits: { maxVertices: 500 } });

    expect(result.success).toBe(false);
    if (result.success) return;

    const error = result.diagnostics.find((d) => d.code === 'VERTEX_LIMIT_EXCEEDED');
    expect(error).toBeDefined();
  });

  it('enforces file byte limit breaches', () => {
    const smallPayload = JSON.stringify({ type: 'FeatureCollection', features: [] });
    const result = parseParcelCollection(smallPayload, { limits: { maxByteSize: 10 } });

    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.diagnostics[0]?.code).toBe('FILE_SIZE_LIMIT_EXCEEDED');
  });

  it('supports custom field mapping for non-standard property keys', () => {
    const customFeature = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-121.315, 44.058],
                [-121.314, 44.058],
                [-121.314, 44.059],
                [-121.315, 44.059],
                [-121.315, 44.058],
              ],
            ],
          },
          properties: {
            parcel_code: 'PARCEL-99',
            lot_title: 'Custom Title',
            sale_state: 'for_sale',
          },
        },
      ],
    };

    const result = parseParcelCollection(customFeature, {
      fieldMapping: {
        idKey: 'parcel_code',
        labelKey: 'lot_title',
        statusKey: 'sale_state',
        statusMap: {
          for_sale: 'available',
        },
      },
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.dataset.features[0]?.id).toBe('PARCEL-99');
    expect(result.dataset.features[0]?.properties.label).toBe('Custom Title');
    expect(result.dataset.features[0]?.properties.status).toBe('available');
  });

  it('flags script-like property values as warning and preserves harmless text', () => {
    const payload = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id: 'LOT-XSS',
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-121.315, 44.058],
                [-121.314, 44.058],
                [-121.314, 44.059],
                [-121.315, 44.059],
                [-121.315, 44.058],
              ],
            ],
          },
          properties: {
            id: 'LOT-XSS',
            label: '<script>alert(1)</script>',
            status: 'available',
          },
        },
      ],
    };

    const result = parseParcelCollection(payload);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.warnings.some((w) => w.code === 'SCRIPT_TAG_IN_PROPERTY')).toBe(true);
    // Preserved harmlessly as literal string
    expect(result.dataset.features[0]?.properties.label).toBe('<script>alert(1)</script>');
  });
});
