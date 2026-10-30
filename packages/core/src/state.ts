import type { AreaUnit, ParcelFilters, ParcelStatus, ViewerState } from './types.js';
import { AREA_UNITS, PARCEL_STATUSES } from './types.js';

export const MAX_QUERY_STRING_LENGTH = 2048;

/**
 * Serializes ViewerState into a compact URL query string.
 * Omits default/empty values to keep URL readable and concise.
 */
export function serializeViewerState(state: ViewerState): string {
  const params = new URLSearchParams();

  if (state.datasetId) {
    params.set('ds', state.datasetId);
  }

  if (state.selectedId) {
    params.set('sel', state.selectedId);
  }

  if (state.filters.query && state.filters.query.trim().length > 0) {
    params.set('q', state.filters.query.trim().slice(0, 100));
  }

  if (state.filters.statuses && state.filters.statuses.length > 0) {
    params.set('st', state.filters.statuses.join(','));
  }

  if (state.filters.minAreaSqm !== undefined && Number.isFinite(state.filters.minAreaSqm)) {
    params.set('minA', Math.round(state.filters.minAreaSqm).toString());
  }

  if (state.filters.maxAreaSqm !== undefined && Number.isFinite(state.filters.maxAreaSqm)) {
    params.set('maxA', Math.round(state.filters.maxAreaSqm).toString());
  }

  if (state.unit && state.unit !== 'sqm') {
    params.set('u', state.unit);
  }

  const result = params.toString();
  if (result.length > MAX_QUERY_STRING_LENGTH) {
    // Truncate or drop non-essential query
    params.delete('q');
    return params.toString();
  }

  return result;
}

/**
 * Parses and sanitizes URL query parameters into a validated ViewerState.
 *
 * If activeDatasetFingerprint is provided and differs from URL dataset identity,
 * selection and filters that depend on the dataset are safely reset.
 */
export function parseViewerState(
  input: string | URLSearchParams,
  activeDatasetFingerprint?: string
): ViewerState {
  let params: URLSearchParams;

  if (typeof input === 'string') {
    const cleanStr = input.startsWith('?') ? input.slice(1) : input;
    params = new URLSearchParams(cleanStr.slice(0, MAX_QUERY_STRING_LENGTH));
  } else {
    params = input;
  }

  const urlDatasetId = params.get('ds')?.trim() || '';
  const urlSelectedId = params.get('sel')?.trim() || null;
  const rawQuery = params.get('q')?.trim() || '';
  const rawStatuses = params.get('st')?.split(',') || [];
  const rawMinA = params.get('minA');
  const rawMaxA = params.get('maxA');
  const rawUnit = params.get('u')?.trim() || 'sqm';

  // Validate unit
  const unit: AreaUnit = AREA_UNITS.includes(rawUnit as AreaUnit)
    ? (rawUnit as AreaUnit)
    : 'sqm';

  // Validate statuses
  const statuses: ParcelStatus[] = rawStatuses
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is ParcelStatus => PARCEL_STATUSES.includes(s as ParcelStatus));

  // Validate areas
  let minAreaSqm: number | undefined;
  if (rawMinA) {
    const val = Number(rawMinA);
    if (Number.isFinite(val) && val >= 0) {
      minAreaSqm = val;
    }
  }

  let maxAreaSqm: number | undefined;
  if (rawMaxA) {
    const val = Number(rawMaxA);
    if (Number.isFinite(val) && val >= 0) {
      maxAreaSqm = val;
    }
  }

  // Cross-check dataset fingerprint
  let selectedId = urlSelectedId ? urlSelectedId.slice(0, 100) : null;
  if (
    activeDatasetFingerprint &&
    urlDatasetId &&
    urlDatasetId !== activeDatasetFingerprint &&
    !urlDatasetId.startsWith('SYN-') // synthetic presets can share IDs if valid
  ) {
    // Mismatched dataset: selection cannot safely apply
    selectedId = null;
  }

  const filters: ParcelFilters = {
    query: rawQuery.slice(0, 100),
    statuses,
    minAreaSqm,
    maxAreaSqm,
  };

  return {
    datasetId: urlDatasetId,
    selectedId,
    filters,
    unit,
  };
}
