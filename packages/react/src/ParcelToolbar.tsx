import React, { useState } from 'react';
import type { AreaUnit } from '@kilwish1997/plotwise-core';
import { AREA_UNITS, AREA_UNIT_SYMBOLS } from '@kilwish1997/plotwise-core';
import type { ParcelToolbarProps } from './types.js';

export const ParcelToolbar: React.FC<ParcelToolbarProps> = ({
  datasetName = 'Parcel Dataset',
  totalParcels,
  unit,
  onUnitChange,
  hasTileLayer,
  onToggleTileLayer,
  onOpenImportModal,
  onExportGeoJson,
  onExportCsv,
  extraContent,
  className = '',
}) => {
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  return (
    <header className={`pw-toolbar ${className}`} role="toolbar" aria-label="Parcel viewer controls">
      {/* Left: Brand & Dataset Info */}
      <div className="pw-toolbar-left">
        <div className="pw-brand">
          <span className="pw-brand-name">Plotwise Kit</span>
        </div>

        <div className="pw-dataset-meta">
          <span className="pw-dataset-name">{datasetName}</span>
          <span className="pw-dataset-count">({totalParcels} parcels)</span>
        </div>
      </div>

      {/* Center: Extra content (e.g. sample fixture switchers) */}
      {extraContent && <div className="pw-toolbar-center">{extraContent}</div>}

      {/* Right: Actions (Units, Basemap, Import, Export) */}
      <div className="pw-toolbar-right">
        {/* Unit Selector */}
        <div className="pw-unit-selector-wrapper">
          <label htmlFor="pw-unit-select" className="pw-sr-only">
            Display Area Unit
          </label>
          <select
            id="pw-unit-select"
            value={unit}
            onChange={(e) => onUnitChange(e.target.value as AreaUnit)}
            className="pw-select pw-unit-select"
            aria-label="Select display area unit"
          >
            {AREA_UNITS.map((u) => (
              <option key={u} value={u}>
                {AREA_UNIT_SYMBOLS[u]} ({u})
              </option>
            ))}
          </select>
        </div>

        {/* Basemap Toggle */}
        <button
          type="button"
          onClick={onToggleTileLayer}
          className={`pw-btn pw-btn-sm ${hasTileLayer ? 'pw-btn-primary' : 'pw-btn-secondary'}`}
          title={hasTileLayer ? 'Switch to offline Vector Grid mode' : 'Enable OpenStreetMap tiles'}
          aria-pressed={hasTileLayer}
        >
          {hasTileLayer ? 'Tiles Active' : 'Vector Grid (Offline)'}
        </button>

        {/* Import GeoJSON */}
        <button
          type="button"
          onClick={onOpenImportModal}
          className="pw-btn pw-btn-secondary pw-btn-sm"
          aria-label="Import local GeoJSON parcel dataset"
        >
          Import GeoJSON
        </button>

        {/* Export Dropdown */}
        <div className="pw-export-dropdown-wrapper">
          <button
            type="button"
            onClick={() => setExportMenuOpen(!exportMenuOpen)}
            className="pw-btn pw-btn-secondary pw-btn-sm"
            aria-haspopup="true"
            aria-expanded={exportMenuOpen}
          >
            Export ▾
          </button>

          {exportMenuOpen && (
            <div className="pw-export-menu" role="menu">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setExportMenuOpen(false);
                  onExportGeoJson();
                }}
                className="pw-menu-item"
              >
                Export GeoJSON (.geojson)
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setExportMenuOpen(false);
                  onExportCsv();
                }}
                className="pw-menu-item"
              >
                Export CSV Inventory (.csv)
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
