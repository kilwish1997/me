import type { ReactNode } from 'react';
import type {
  AreaUnit,
  Parcel,
  ParcelCollection,
  ParcelFilters,
  ParcelStatus,
} from '@kilwish1997/plotwise-core';

export interface ParcelViewerProps {
  dataset: ParcelCollection;
  selectedId?: string | null;
  onSelectParcel?: (parcelId: string | null) => void;
  filters?: ParcelFilters;
  onFiltersChange?: (filters: ParcelFilters) => void;
  unit?: AreaUnit;
  onUnitChange?: (unit: AreaUnit) => void;
  tileLayerUrl?: string;
  tileLayerAttribution?: string;
  enableNoBasemapMode?: boolean;
  onImportDataset?: (dataset: ParcelCollection, name?: string) => void;
  onExportGeoJson?: () => void;
  onExportCsv?: () => void;
  customToolbarContent?: ReactNode;
  className?: string;
}

export interface ParcelMapProps {
  dataset: ParcelCollection;
  parcels: readonly Parcel[];
  selectedId: string | null;
  onSelectParcel: (id: string | null) => void;
  tileLayerUrl?: string;
  tileLayerAttribution?: string;
  unit: AreaUnit;
  className?: string;
}

export interface ParcelListProps {
  parcels: readonly Parcel[];
  totalFeatureCount: number;
  selectedId: string | null;
  onSelectParcel: (id: string) => void;
  unit: AreaUnit;
  query: string;
  onQueryChange: (query: string) => void;
  onResetFilters?: () => void;
  className?: string;
}

export interface ParcelFiltersProps {
  filters: ParcelFilters;
  onFiltersChange: (filters: ParcelFilters) => void;
  statusCounts: Record<ParcelStatus, number>;
  totalParcelsCount: number;
  minDatasetAreaSqm?: number;
  maxDatasetAreaSqm?: number;
  unit: AreaUnit;
  className?: string;
}

export interface ParcelDetailsProps {
  parcel: Parcel | null;
  isHiddenByFilters?: boolean;
  onRevealParcel?: () => void;
  onClose?: () => void;
  unit: AreaUnit;
  shareableUrl?: string;
  className?: string;
}

export interface ParcelToolbarProps {
  datasetName?: string;
  totalParcels: number;
  unit: AreaUnit;
  onUnitChange: (unit: AreaUnit) => void;
  hasTileLayer: boolean;
  onToggleTileLayer: () => void;
  onOpenImportModal: () => void;
  onExportGeoJson: () => void;
  onExportCsv: () => void;
  extraContent?: ReactNode;
  className?: string;
}

export interface ParcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (dataset: ParcelCollection, name: string) => void;
}
