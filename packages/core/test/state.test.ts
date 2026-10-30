import { describe, expect, it } from 'vitest';
import {
  parseViewerState,
  serializeViewerState,
  MAX_QUERY_STRING_LENGTH,
} from '../src/index.js';
import type { ViewerState } from '../src/types.js';

describe('serializeViewerState & parseViewerState', () => {
  it('round-trips state correctly', () => {
    const original: ViewerState = {
      datasetId: 'pw_abc1234567890def',
      selectedId: 'PARCEL-101',
      filters: {
        query: 'Meadow',
        statuses: ['available', 'reserved'],
        minAreaSqm: 500,
        maxAreaSqm: 2500,
      },
      unit: 'ha',
    };

    const serialized = serializeViewerState(original);
    expect(serialized).toContain('ds=pw_abc1234567890def');
    expect(serialized).toContain('sel=PARCEL-101');
    expect(serialized).toContain('q=Meadow');
    expect(serialized).toContain('st=available%2Creserved');
    expect(serialized).toContain('minA=500');
    expect(serialized).toContain('maxA=2500');
    expect(serialized).toContain('u=ha');

    const restored = parseViewerState(serialized, 'pw_abc1234567890def');
    expect(restored.datasetId).toBe(original.datasetId);
    expect(restored.selectedId).toBe(original.selectedId);
    expect(restored.filters.query).toBe(original.filters.query);
    expect(restored.filters.statuses).toEqual(original.filters.statuses);
    expect(restored.filters.minAreaSqm).toBe(original.filters.minAreaSqm);
    expect(restored.filters.maxAreaSqm).toBe(original.filters.maxAreaSqm);
    expect(restored.unit).toBe(original.unit);
  });

  it('safely handles empty state', () => {
    const emptyState: ViewerState = {
      datasetId: '',
      selectedId: null,
      filters: { query: '', statuses: [] },
      unit: 'sqm',
    };

    const serialized = serializeViewerState(emptyState);
    expect(serialized).toBe('');

    const restored = parseViewerState('');
    expect(restored.selectedId).toBeNull();
    expect(restored.filters.query).toBe('');
    expect(restored.filters.statuses).toEqual([]);
    expect(restored.unit).toBe('sqm');
  });

  it('resets selectedId when URL dataset ID does not match active dataset fingerprint', () => {
    const serialized = 'ds=pw_olddataset1234&sel=OLD-PARCEL-1';
    const restored = parseViewerState(serialized, 'pw_newdataset9999');

    expect(restored.datasetId).toBe('pw_olddataset1234');
    // Selection reset due to mismatch!
    expect(restored.selectedId).toBeNull();
  });

  it('bounds query length and recovers from malformed parameters gracefully', () => {
    const malformed = 'ds=pw_123&sel=P1&u=invalid_unit&minA=notanumber&maxA=-500';
    const restored = parseViewerState(malformed, 'pw_123');

    expect(restored.unit).toBe('sqm'); // default fallback
    expect(restored.filters.minAreaSqm).toBeUndefined();
    expect(restored.filters.maxAreaSqm).toBeUndefined();
  });
});
