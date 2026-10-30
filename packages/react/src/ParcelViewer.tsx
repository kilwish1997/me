import React, { useState } from 'react';
import type { ParcelCollection } from '@kilwish1997/plotwise-core';
import { exportParcelCollection, exportParcelsToCsv } from '@kilwish1997/plotwise-core';
import { ParcelDetails } from './ParcelDetails.js';
import { ParcelFiltersComponent } from './ParcelFilters.js';
import { ParcelImportModal } from './ParcelImportModal.js';
import { ParcelList } from './ParcelList.js';
import { ParcelMap } from './ParcelMap.js';
import { ParcelToolbar } from './ParcelToolbar.js';
import { useParcelViewerState } from './hooks/useParcelViewerState.js';
import type { ParcelViewerProps } from './types.js';

export const ParcelViewer: React.FC<ParcelViewerProps> = ({
  dataset: propDataset,
  selectedId: propSelectedId,
  onSelectParcel: propOnSelectParcel,
  filters: propFilters,
  onFiltersChange: propOnFiltersChange,
  unit: propUnit,
  onUnitChange: propOnUnitChange,
  tileLayerUrl: initialTileUrl,
  tileLayerAttribution,
  enableNoBasemapMode: _enableNoBasemapMode = true,
  onImportDataset,
  onExportGeoJson,
  onExportCsv,
  customToolbarContent,
  className = '',
}) => {
  // Use state hook for complete state management
  const state = useParcelViewerState({
    initialDataset: propDataset,
  });

  const activeDataset = state.dataset;
  const activeSelectedId = propSelectedId !== undefined ? propSelectedId : state.selectedId;
  const activeFilters = propFilters !== undefined ? propFilters : state.filters;
  const activeUnit = propUnit !== undefined ? propUnit : state.unit;

  const handleSelectParcel = (id: string | null) => {
    state.selectParcel(id);
    if (propOnSelectParcel) propOnSelectParcel(id);
  };

  const handleFiltersChange = (newFilters: typeof state.filters) => {
    state.setFilters(newFilters);
    if (propOnFiltersChange) propOnFiltersChange(newFilters);
  };

  const handleUnitChange = (newUnit: typeof state.unit) => {
    state.setUnit(newUnit);
    if (propOnUnitChange) propOnUnitChange(newUnit);
  };

  // Basemap tile state (offline no-basemap mode by default)
  const [activeTileUrl, setActiveTileUrl] = useState<string | undefined>(initialTileUrl);
  const [importModalOpen, setImportModalOpen] = useState(false);

  // Mobile tab switcher: 'map' | 'list'
  const [mobileTab, setMobileTab] = useState<'map' | 'list'>('map');

  const handleToggleTileLayer = () => {
    if (activeTileUrl) {
      setActiveTileUrl(undefined);
    } else {
      setActiveTileUrl('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
    }
  };

  const handleDefaultExportGeoJson = () => {
    if (onExportGeoJson) {
      onExportGeoJson();
      return;
    }
    const jsonStr = exportParcelCollection(activeDataset, { pretty: true });
    const blob = new Blob([jsonStr], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `parcels-${activeDataset.datasetFingerprint}.geojson`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDefaultExportCsv = () => {
    if (onExportCsv) {
      onExportCsv();
      return;
    }
    const csvStr = exportParcelsToCsv(state.filteredParcels);
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `parcels-${activeDataset.datasetFingerprint}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportSuccess = (newDataset: ParcelCollection, name: string) => {
    state.setDataset(newDataset, name);
    if (onImportDataset) {
      onImportDataset(newDataset);
    }
  };

  return (
    <div className={`pw-viewer-root ${className}`}>
      {/* 1. Header Toolbar */}
      <ParcelToolbar
        datasetName={state.datasetName}
        totalParcels={activeDataset.featureCount}
        unit={activeUnit}
        onUnitChange={handleUnitChange}
        hasTileLayer={Boolean(activeTileUrl)}
        onToggleTileLayer={handleToggleTileLayer}
        onOpenImportModal={() => setImportModalOpen(true)}
        onExportGeoJson={handleDefaultExportGeoJson}
        onExportCsv={handleDefaultExportCsv}
        extraContent={customToolbarContent}
      />

      {/* 2. Filter Bar */}
      <ParcelFiltersComponent
        filters={activeFilters}
        onFiltersChange={handleFiltersChange}
        statusCounts={activeDataset.statusCounts}
        totalParcelsCount={activeDataset.featureCount}
        unit={activeUnit}
      />

      {/* 3. Mobile View Switcher */}
      <div className="pw-mobile-tabs" role="tablist" aria-label="Mobile workspace view">
        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === 'map'}
          onClick={() => setMobileTab('map')}
          className={`pw-mobile-tab-btn ${mobileTab === 'map' ? 'pw-tab-active' : ''}`}
        >
          Map View
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === 'list'}
          onClick={() => setMobileTab('list')}
          className={`pw-mobile-tab-btn ${mobileTab === 'list' ? 'pw-tab-active' : ''}`}
        >
          List View ({state.filteredParcels.length})
        </button>
      </div>

      {/* 4. Main Body Workspace */}
      <main className="pw-workspace-body">
        {/* Map Pane */}
        <div className={`pw-map-column ${mobileTab === 'list' ? 'pw-mobile-hidden' : ''}`}>
          <ParcelMap
            dataset={activeDataset}
            parcels={state.filteredParcels}
            selectedId={activeSelectedId}
            onSelectParcel={handleSelectParcel}
            tileLayerUrl={activeTileUrl}
            tileLayerAttribution={tileLayerAttribution}
            unit={activeUnit}
          />
        </div>

        {/* List & Details Sidebar */}
        <aside className={`pw-sidebar-column ${mobileTab === 'map' ? 'pw-mobile-hidden' : ''}`}>
          <ParcelList
            parcels={state.filteredParcels}
            totalFeatureCount={activeDataset.featureCount}
            selectedId={activeSelectedId}
            onSelectParcel={handleSelectParcel}
            unit={activeUnit}
            query={activeFilters.query}
            onQueryChange={(q) => handleFiltersChange({ ...activeFilters, query: q })}
            onResetFilters={state.resetFilters}
          />

          <ParcelDetails
            parcel={state.selectedParcel}
            isHiddenByFilters={state.isSelectedHiddenByFilters}
            onRevealParcel={state.revealSelectedParcel}
            onClose={() => handleSelectParcel(null)}
            unit={activeUnit}
            shareableUrl={state.shareableUrl}
          />
        </aside>
      </main>

      {/* 5. Accessible Live Announcement */}
      <div className="pw-sr-only" aria-live="polite" aria-atomic="true">
        {state.selectedParcel
          ? `Selected parcel ${state.selectedParcel.properties.label}, status ${state.selectedParcel.properties.status}`
          : 'No parcel selected'}
      </div>

      {/* 6. Import Modal */}
      <ParcelImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  );
};
