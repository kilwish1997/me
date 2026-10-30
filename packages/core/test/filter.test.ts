import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { filterParcels, getStatusCounts, parseParcelCollection } from '../src/index.js';

const FIXTURES_DIR = path.resolve(__dirname, '../../../fixtures');

describe('filterParcels & getStatusCounts', () => {
  const raw = fs.readFileSync(path.join(FIXTURES_DIR, 'synthetic-50.geojson'), 'utf-8');
  const parsed = parseParcelCollection(raw);
  if (!parsed.success) {
    throw new Error('Failed to parse synthetic-50 for filter test');
  }
  const parcels = parsed.dataset.features;

  it('filters deterministically by text query matching label', () => {
    const results = filterParcels(parcels, { query: 'Corner Lot' });
    expect(results.length).toBe(5);
    for (const r of results) {
      expect(r.properties.label).toContain('Corner Lot');
    }
  });

  it('filters deterministically by text query matching parcel ID', () => {
    const results = filterParcels(parcels, { query: 'SYN-50-001' });
    expect(results.length).toBe(1);
    expect(results[0]?.id).toBe('SYN-50-001');
  });

  it('filters deterministically by status list', () => {
    const available = filterParcels(parcels, { statuses: ['available'] });
    for (const p of available) {
      expect(p.properties.status).toBe('available');
    }
    expect(available.length).toBeGreaterThan(0);

    const availableOrSold = filterParcels(parcels, { statuses: ['available', 'sold'] });
    expect(availableOrSold.length).toBe(
      parcels.filter((p) => p.properties.status === 'available' || p.properties.status === 'sold').length
    );
  });

  it('filters deterministically by inclusive area range', () => {
    // Check parcels with area >= 1500 and <= 2000
    const filtered = filterParcels(parcels, { minAreaSqm: 1500, maxAreaSqm: 2000 });
    for (const p of filtered) {
      const area = p.properties.approximateAreaSqm ?? 0;
      expect(area).toBeGreaterThanOrEqual(1500);
      expect(area).toBeLessThanOrEqual(2000);
    }
  });

  it('correctly aggregates status counts for all and filtered scopes', () => {
    const counts = getStatusCounts(parcels);
    expect(counts.total).toBe(50);
    expect(counts.available + counts.reserved + counts.sold + counts.unavailable).toBe(50);

    const subList = parcels.slice(0, 10);
    const subCounts = getStatusCounts(subList);
    expect(subCounts.total).toBe(10);
  });
});
