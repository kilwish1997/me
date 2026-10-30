import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  AreaUnit,
  Parcel,
  ParcelCollection,
  ParcelFilters,
  ParcelStatus,
  ViewerState,
} from '@kilwish1997/plotwise-core';
import {
  filterParcels,
  parseViewerState,
  serializeViewerState,
} from '@kilwish1997/plotwise-core';

export interface UseParcelViewerStateOptions {
  initialDataset: ParcelCollection;
  datasetName?: string;
  syncWithUrl?: boolean;
}

export interface UseParcelViewerStateReturn {
  dataset: ParcelCollection;
  datasetName: string;
  setDataset: (dataset: ParcelCollection, name?: string) => void;
  selectedId: string | null;
  selectedParcel: Parcel | null;
  selectParcel: (id: string | null) => void;
  filters: ParcelFilters;
  setFilters: (filters: ParcelFilters) => void;
  setQuery: (query: string) => void;
  toggleStatus: (status: ParcelStatus) => void;
  setAreaRange: (min?: number, max?: number) => void;
  resetFilters: () => void;
  revealSelectedParcel: () => void;
  filteredParcels: Parcel[];
  isSelectedHiddenByFilters: boolean;
  unit: AreaUnit;
  setUnit: (unit: AreaUnit) => void;
  shareableUrl: string;
}

export function useParcelViewerState({
  initialDataset,
  datasetName = 'Synthetic Dataset',
  syncWithUrl = true,
}: UseParcelViewerStateOptions): UseParcelViewerStateReturn {
  const [dataset, setDatasetInternal] = useState<ParcelCollection>(initialDataset);
  const [currentDatasetName, setCurrentDatasetName] = useState<string>(datasetName);

  // Initialize state from URL if available
  const initialUrlState = useMemo(() => {
    if (typeof window === 'undefined' || !syncWithUrl) return null;
    return parseViewerState(window.location.search, initialDataset.datasetFingerprint);
  }, [initialDataset.datasetFingerprint, syncWithUrl]);

  const [selectedId, setSelectedId] = useState<string | null>(() => {
    if (initialUrlState?.selectedId) {
      const exists = initialDataset.features.some((p) => p.id === initialUrlState.selectedId);
      return exists ? initialUrlState.selectedId : null;
    }
    return null;
  });

  const [filters, setFilters] = useState<ParcelFilters>(() => {
    return (
      initialUrlState?.filters ?? {
        query: '',
        statuses: [],
      }
    );
  });

  const [unit, setUnit] = useState<AreaUnit>(() => {
    return initialUrlState?.unit ?? 'sqm';
  });

  // Switch dataset cleanly and reset incompatible selections
  const setDataset = useCallback((newDataset: ParcelCollection, name?: string) => {
    setDatasetInternal(newDataset);
    if (name) setCurrentDatasetName(name);
    setSelectedId(null);
    setFilters({ query: '', statuses: [] });
  }, []);

  const selectParcel = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);

  const setQuery = useCallback((query: string) => {
    setFilters((prev) => ({ ...prev, query }));
  }, []);

  const toggleStatus = useCallback((status: ParcelStatus) => {
    setFilters((prev) => {
      const current = prev.statuses ?? [];
      const next = current.includes(status)
        ? current.filter((s) => s !== status)
        : [...current, status];
      return { ...prev, statuses: next };
    });
  }, []);

  const setAreaRange = useCallback((minAreaSqm?: number, maxAreaSqm?: number) => {
    setFilters((prev) => ({
      ...prev,
      minAreaSqm,
      maxAreaSqm,
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ query: '', statuses: [] });
  }, []);

  // Compute filtered parcels deterministically
  const filteredParcels = useMemo(() => {
    return filterParcels(dataset.features, filters);
  }, [dataset.features, filters]);

  // Lookup selected parcel
  const selectedParcel = useMemo(() => {
    if (!selectedId) return null;
    return dataset.features.find((p) => p.id === selectedId) ?? null;
  }, [dataset.features, selectedId]);

  // Check if selected parcel is hidden by current active filters
  const isSelectedHiddenByFilters = useMemo(() => {
    if (!selectedId || !selectedParcel) return false;
    return !filteredParcels.some((p) => p.id === selectedId);
  }, [selectedId, selectedParcel, filteredParcels]);

  // If parcel is hidden by filters, provide clear action to reveal it
  const revealSelectedParcel = useCallback(() => {
    if (!selectedParcel) return;
    setFilters({ query: '', statuses: [] });
  }, [selectedParcel]);

  // Shareable URL string
  const shareableUrl = useMemo(() => {
    const state: ViewerState = {
      datasetId: dataset.datasetFingerprint,
      selectedId,
      filters,
      unit,
    };
    const query = serializeViewerState(state);
    if (typeof window === 'undefined') return `?${query}`;
    return `${window.location.origin}${window.location.pathname}${query ? `?${query}` : ''}`;
  }, [dataset.datasetFingerprint, selectedId, filters, unit]);

  // Synchronize to browser URL history without reload
  useEffect(() => {
    if (typeof window === 'undefined' || !syncWithUrl) return;

    const state: ViewerState = {
      datasetId: dataset.datasetFingerprint,
      selectedId,
      filters,
      unit,
    };
    const query = serializeViewerState(state);
    const newUrl = `${window.location.pathname}${query ? `?${query}` : ''}`;

    if (window.location.search !== (query ? `?${query}` : '')) {
      window.history.replaceState({}, '', newUrl);
    }
  }, [dataset.datasetFingerprint, selectedId, filters, unit, syncWithUrl]);

  return {
    dataset,
    datasetName: currentDatasetName,
    setDataset,
    selectedId,
    selectedParcel,
    selectParcel,
    filters,
    setFilters,
    setQuery,
    toggleStatus,
    setAreaRange,
    resetFilters,
    revealSelectedParcel,
    filteredParcels,
    isSelectedHiddenByFilters,
    unit,
    setUnit,
    shareableUrl,
  };
}
