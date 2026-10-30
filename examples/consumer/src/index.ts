import type { ParcelCollection, StatusCounts } from '@kilwish1997/plotwise-core';
import {
  parseParcelCollection,
  getParcelArea,
  formatArea,
  filterParcels,
  getStatusCounts,
  serializeViewerState,
  parseViewerState,
} from '@kilwish1997/plotwise-core';
import type { ParcelViewerProps } from '@kilwish1997/plotwise-react';

/**
 * Minimal TypeScript consumer verifying types and compile-time correctness.
 */
export function verifyConsumerTypes(rawGeoJson: string): {
  dataset: ParcelCollection;
  areaString: string;
  queryString: string;
  props: ParcelViewerProps;
  counts: StatusCounts;
} {
  const result = parseParcelCollection(rawGeoJson);
  if (!result.success) {
    throw new Error(`Validation failed: ${result.diagnostics.length} errors`);
  }

  const dataset = result.dataset;
  const first = dataset.features[0];
  if (!first) {
    throw new Error('No features found');
  }

  const area = getParcelArea(first, 'ha');
  const areaString = formatArea(area, 'ha');

  const filtered = filterParcels(dataset.features, { statuses: ['available'] });
  const counts = getStatusCounts(filtered);

  const queryString = serializeViewerState({
    datasetId: dataset.datasetFingerprint,
    selectedId: first.id,
    filters: { query: '', statuses: ['available'] },
    unit: 'ha',
  });

  const parsedState = parseViewerState(queryString, dataset.datasetFingerprint);

  const props: ParcelViewerProps = {
    dataset,
    selectedId: parsedState.selectedId,
    unit: parsedState.unit,
  };

  return { dataset, areaString, queryString, props, counts };
}
