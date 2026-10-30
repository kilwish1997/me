import type { ParcelStatus } from '@kilwish1997/plotwise-core';
import {
  AREA_UNIT_SYMBOLS,
  PARCEL_STATUSES,
  convertArea,
  convertToSqm,
} from '@kilwish1997/plotwise-core';
import type { ParcelFiltersProps } from './types.js';

const STATUS_ICONS: Record<ParcelStatus, string> = {
  available: '●',
  reserved: '◐',
  sold: '■',
  unavailable: '✖',
};

export const ParcelFiltersComponent: React.FC<ParcelFiltersProps> = ({
  filters,
  onFiltersChange,
  statusCounts,
  totalParcelsCount: _totalParcelsCount,
  unit,
  className = '',
}) => {
  const activeStatuses = filters.statuses ?? [];
  const symbol = AREA_UNIT_SYMBOLS[unit];

  const handleToggleStatus = (status: ParcelStatus) => {
    const next = activeStatuses.includes(status)
      ? activeStatuses.filter((s) => s !== status)
      : [...activeStatuses, status];

    onFiltersChange({ ...filters, statuses: next });
  };

  const handleMinAreaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    if (val === '') {
      onFiltersChange({ ...filters, minAreaSqm: undefined });
      return;
    }
    const num = Number(val);
    if (Number.isFinite(num) && num >= 0) {
      onFiltersChange({ ...filters, minAreaSqm: convertToSqm(num, unit) });
    }
  };

  const handleMaxAreaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    if (val === '') {
      onFiltersChange({ ...filters, maxAreaSqm: undefined });
      return;
    }
    const num = Number(val);
    if (Number.isFinite(num) && num >= 0) {
      onFiltersChange({ ...filters, maxAreaSqm: convertToSqm(num, unit) });
    }
  };

  const hasActiveFilters =
    activeStatuses.length > 0 ||
    filters.query.trim().length > 0 ||
    filters.minAreaSqm !== undefined ||
    filters.maxAreaSqm !== undefined;

  const handleReset = () => {
    onFiltersChange({ query: '', statuses: [], minAreaSqm: undefined, maxAreaSqm: undefined });
  };

  // Display min/max area converted to active unit
  const minDisplay =
    filters.minAreaSqm !== undefined ? Math.round(convertArea(filters.minAreaSqm, unit)) : '';
  const maxDisplay =
    filters.maxAreaSqm !== undefined ? Math.round(convertArea(filters.maxAreaSqm, unit)) : '';

  return (
    <div className={`pw-filters-panel ${className}`} role="search" aria-label="Parcel filters">
      {/* Status Chips */}
      <div className="pw-filter-group">
        <span className="pw-filter-title" id="pw-status-filter-label">
          Status:
        </span>
        <div
          className="pw-status-chips"
          role="group"
          aria-labelledby="pw-status-filter-label"
        >
          {PARCEL_STATUSES.map((status) => {
            const isSelected = activeStatuses.includes(status);
            const count = statusCounts[status] ?? 0;
            const icon = STATUS_ICONS[status];
            const label = status.charAt(0).toUpperCase() + status.slice(1);

            return (
              <button
                key={status}
                type="button"
                role="checkbox"
                aria-checked={isSelected}
                onClick={() => handleToggleStatus(status)}
                className={`pw-status-chip pw-chip-${status} ${isSelected ? 'pw-chip-active' : ''}`}
                title={`Filter by ${label} (${count})`}
              >
                <span className="pw-chip-icon" aria-hidden="true">
                  {icon}
                </span>
                <span className="pw-chip-label">{label}</span>
                <span className="pw-chip-count" aria-label={`${count} parcels`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Area Range Filter */}
      <div className="pw-filter-group pw-area-filter-group">
        <span className="pw-filter-title" id="pw-area-filter-label">
          Area ({symbol}):
        </span>
        <div className="pw-area-inputs" role="group" aria-labelledby="pw-area-filter-label">
          <input
            type="number"
            min="0"
            placeholder="Min"
            value={minDisplay}
            onChange={handleMinAreaChange}
            aria-label={`Minimum area in ${symbol}`}
            className="pw-area-input"
          />
          <span className="pw-range-separator" aria-hidden="true">
            –
          </span>
          <input
            type="number"
            min="0"
            placeholder="Max"
            value={maxDisplay}
            onChange={handleMaxAreaChange}
            aria-label={`Maximum area in ${symbol}`}
            className="pw-area-input"
          />
        </div>
      </div>

      {/* Reset Action */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={handleReset}
          className="pw-btn pw-btn-ghost pw-btn-sm pw-reset-btn"
          aria-label="Reset all active filters"
        >
          Reset Filters
        </button>
      )}
    </div>
  );
};
