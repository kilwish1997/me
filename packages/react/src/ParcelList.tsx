import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { ParcelStatus } from '@kilwish1997/plotwise-core';
import { formatArea } from '@kilwish1997/plotwise-core';
import type { ParcelListProps } from './types.js';

const ITEM_HEIGHT = 64; // height in pixels of each list row
const OVERSCAN = 6; // number of buffer items to render above/below viewport

const STATUS_ICONS: Record<ParcelStatus, string> = {
  available: '●',
  reserved: '◐',
  sold: '■',
  unavailable: '✖',
};

export const ParcelList: React.FC<ParcelListProps> = ({
  parcels,
  totalFeatureCount,
  selectedId,
  onSelectParcel,
  unit,
  query,
  onQueryChange,
  onResetFilters,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(500);

  // Measure container height on mount and resize
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Update scrollTop on scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Virtual windowing calculations
  const totalCount = parcels.length;
  const totalHeight = totalCount * ITEM_HEIGHT;
  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(totalCount, Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + OVERSCAN);
  const visibleParcels = parcels.slice(startIndex, endIndex);
  const offsetY = startIndex * ITEM_HEIGHT;

  // Scroll to selected parcel if changed from map
  useEffect(() => {
    if (!selectedId || !containerRef.current) return;
    const index = parcels.findIndex((p) => p.id === selectedId);
    if (index === -1) return;

    const itemTop = index * ITEM_HEIGHT;
    const itemBottom = itemTop + ITEM_HEIGHT;
    const currentScrollTop = containerRef.current.scrollTop;
    const currentScrollBottom = currentScrollTop + containerHeight;

    if (itemTop < currentScrollTop || itemBottom > currentScrollBottom) {
      containerRef.current.scrollTo({
        top: Math.max(0, itemTop - ITEM_HEIGHT),
        behavior: 'smooth',
      });
    }
  }, [selectedId, parcels, containerHeight]);

  // Keyboard navigation within listbox
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (parcels.length === 0) return;
      const currentIndex = selectedId ? parcels.findIndex((p) => p.id === selectedId) : -1;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = currentIndex < parcels.length - 1 ? currentIndex + 1 : 0;
        const target = parcels[nextIndex];
        if (target) onSelectParcel(target.id);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : parcels.length - 1;
        const target = parcels[prevIndex];
        if (target) onSelectParcel(target.id);
      } else if (e.key === 'Home') {
        e.preventDefault();
        const target = parcels[0];
        if (target) onSelectParcel(target.id);
      } else if (e.key === 'End') {
        e.preventDefault();
        const target = parcels[parcels.length - 1];
        if (target) onSelectParcel(target.id);
      }
    },
    [parcels, selectedId, onSelectParcel]
  );

  return (
    <div className={`pw-parcel-list-pane ${className}`}>
      {/* Search Header */}
      <div className="pw-list-search-bar">
        <div className="pw-search-input-wrapper">
          <input
            ref={searchInputRef}
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search by lot, name, or ID..."
            aria-label="Search parcels by label or ID"
            className="pw-search-input"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange('')}
              className="pw-search-clear-btn"
              aria-label="Clear search text"
            >
              ✕
            </button>
          )}
        </div>

        <div className="pw-list-counter" aria-live="polite">
          Showing <strong>{parcels.length}</strong> of <strong>{totalFeatureCount}</strong> parcels
        </div>
      </div>

      {/* Empty State */}
      {parcels.length === 0 && (
        <div className="pw-list-empty-state" role="status">
          <p className="pw-empty-title">No matching parcels</p>
          <p className="pw-empty-desc">
            No parcel polygons match the active search query or filter criteria.
          </p>
          {onResetFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="pw-btn pw-btn-secondary pw-btn-sm"
            >
              Reset All Filters
            </button>
          )}
        </div>
      )}

      {/* Virtualized List Container */}
      {parcels.length > 0 && (
        <div
          ref={containerRef}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="listbox"
          aria-label="Parcels list. Use arrow keys to navigate."
          className="pw-virtual-list-container"
        >
          <div
            className="pw-virtual-list-scroller"
            style={{ height: `${totalHeight}px`, position: 'relative' }}
          >
            <div
              className="pw-virtual-list-viewport"
              style={{
                transform: `translateY(${offsetY}px)`,
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
              }}
            >
              {visibleParcels.map((parcel) => {
                const isSelected = parcel.id === selectedId;
                const approxArea = parcel.properties.approximateAreaSqm ?? 0;
                const status = parcel.properties.status;
                const statusSymbol = STATUS_ICONS[status];
                const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);

                return (
                  <div
                    key={parcel.id}
                    id={`pw-list-item-${parcel.id}`}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => onSelectParcel(parcel.id)}
                    className={`pw-list-row ${isSelected ? 'pw-row-selected' : ''}`}
                    style={{ height: `${ITEM_HEIGHT}px` }}
                  >
                    <div className="pw-row-main">
                      <div className="pw-row-title">
                        <span className="pw-row-label">{parcel.properties.label}</span>
                        <span className="pw-row-id">({parcel.id})</span>
                      </div>
                      <div className="pw-row-meta">
                        <span className={`pw-status-badge pw-status-${status}`}>
                          <span className="pw-badge-icon" aria-hidden="true">
                            {statusSymbol}
                          </span>
                          <span className="pw-badge-text">{statusLabel}</span>
                        </span>
                        <span className="pw-row-area">{formatArea(approxArea, unit)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
