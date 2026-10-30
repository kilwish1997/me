import type { Parcel, ParcelFilters, StatusCounts } from './types.js';

/**
 * Computes status counts across an arbitrary array of parcels.
 */
export function getStatusCounts(parcels: readonly Parcel[]): StatusCounts {
  const counts: StatusCounts = {
    available: 0,
    reserved: 0,
    sold: 0,
    unavailable: 0,
    total: parcels.length,
  };

  for (const p of parcels) {
    const status = p.properties.status;
    if (status in counts) {
      counts[status]++;
    }
  }

  return counts;
}

/**
 * Deterministically filters parcels according to search text, status selection,
 * and inclusive area bounds.
 *
 * Immutability: Does not mutate the input array or parcel objects.
 */
export function filterParcels(
  parcels: readonly Parcel[],
  filters: Partial<ParcelFilters>
): Parcel[] {
  const query = filters.query?.trim().toLowerCase();
  const statuses = filters.statuses && filters.statuses.length > 0 ? new Set(filters.statuses) : null;
  const minArea = filters.minAreaSqm;
  const maxArea = filters.maxAreaSqm;

  return parcels.filter((parcel) => {
    // 1. Query filter (matches parcel label or id)
    if (query) {
      const labelMatch = parcel.properties.label.toLowerCase().includes(query);
      const idMatch = parcel.id.toLowerCase().includes(query);
      if (!labelMatch && !idMatch) {
        return false;
      }
    }

    // 2. Status filter
    if (statuses && !statuses.has(parcel.properties.status)) {
      return false;
    }

    // 3. Min area filter (inclusive)
    const area = parcel.properties.approximateAreaSqm ?? 0;
    if (minArea !== undefined && Number.isFinite(minArea) && area < minArea) {
      return false;
    }

    // 4. Max area filter (inclusive)
    if (maxArea !== undefined && Number.isFinite(maxArea) && area > maxArea) {
      return false;
    }

    return true;
  });
}
