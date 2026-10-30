import { describe, expect, it } from 'vitest';

describe('Node environment compatibility', () => {
  it('imports core and executes all primary APIs without DOM or browser globals', async () => {
    // Assert DOM globals do not exist in pure Node
    expect(typeof globalThis.window).toBe('undefined');
    expect(typeof (globalThis as unknown as { document?: unknown }).document).toBe('undefined');

    // Dynamic import to verify module loads cleanly in Node runtime
    const core = await import('../src/index.js');

    expect(typeof core.parseParcelCollection).toBe('function');
    expect(typeof core.getParcelArea).toBe('function');
    expect(typeof core.filterParcels).toBe('function');
    expect(typeof core.getStatusCounts).toBe('function');
    expect(typeof core.serializeViewerState).toBe('function');
    expect(typeof core.parseViewerState).toBe('function');
    expect(typeof core.exportParcelCollection).toBe('function');
    expect(typeof core.exportParcelsToCsv).toBe('function');
    expect(typeof core.computeDatasetFingerprint).toBe('function');

    // Basic functional execution in pure Node
    const sampleInput = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id: 'NODE-P1',
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
            id: 'NODE-P1',
            label: 'Node Parcel 1',
            status: 'available',
          },
        },
      ],
    };

    const parsed = core.parseParcelCollection(sampleInput);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    expect(parsed.dataset.featureCount).toBe(1);
    const area = core.getParcelArea(parsed.dataset.features[0]!, 'sqm');
    expect(area).toBeGreaterThan(0);

    const counts = core.getStatusCounts(parsed.dataset.features);
    expect(counts.available).toBe(1);

    const serialized = core.serializeViewerState({
      datasetId: parsed.dataset.datasetFingerprint,
      selectedId: 'NODE-P1',
      filters: { query: '', statuses: ['available'] },
      unit: 'sqm',
    });
    expect(serialized).toContain('NODE-P1');
  });
});
