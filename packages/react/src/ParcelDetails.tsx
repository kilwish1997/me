import React, { useState } from 'react';
import type { ParcelStatus } from '@kilwish1997/plotwise-core';
import { formatArea } from '@kilwish1997/plotwise-core';
import type { ParcelDetailsProps } from './types.js';

const STATUS_ICONS: Record<ParcelStatus, string> = {
  available: '●',
  reserved: '◐',
  sold: '■',
  unavailable: '✖',
};

export const ParcelDetails: React.FC<ParcelDetailsProps> = ({
  parcel,
  isHiddenByFilters = false,
  onRevealParcel,
  onClose,
  unit,
  shareableUrl,
  className = '',
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  if (!parcel) {
    return (
      <div className={`pw-details-card pw-details-empty ${className}`} role="region" aria-label="Parcel details">
        <div className="pw-empty-content">
          <p className="pw-details-placeholder-title">No parcel selected</p>
          <p className="pw-details-placeholder-desc">
            Select a parcel on the map or from the list to view dimensions, status, and metadata.
          </p>
        </div>
      </div>
    );
  }

  const status = parcel.properties.status;
  const statusIcon = STATUS_ICONS[status];
  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
  const approxArea = parcel.properties.approximateAreaSqm ?? 0;
  const surveyedArea = parcel.properties.surveyedAreaSqm;

  const handleCopyLink = () => {
    if (shareableUrl && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareableUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Filter out internal/core keys from custom metadata table
  const reservedKeys = new Set(['id', 'label', 'status', 'surveyedAreaSqm', 'approximateAreaSqm']);
  const customProps = Object.entries(parcel.properties).filter(([k]) => !reservedKeys.has(k));

  return (
    <div
      className={`pw-details-card ${isHiddenByFilters ? 'pw-details-hidden-by-filter' : ''} ${className}`}
      role="region"
      aria-labelledby="pw-details-parcel-label"
    >
      {/* Header */}
      <div className="pw-details-header">
        <div>
          <h2 id="pw-details-parcel-label" className="pw-details-title">
            {parcel.properties.label}
          </h2>
          <span className="pw-details-id">ID: {parcel.id}</span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="pw-details-close-btn"
            aria-label="Close parcel details"
          >
            ✕
          </button>
        )}
      </div>

      {/* Hidden-by-filter explanation and action */}
      {isHiddenByFilters && (
        <div className="pw-details-hidden-banner" role="alert">
          <div className="pw-banner-text">
            <strong>Hidden by active filters.</strong>
            <span> This parcel is currently filtered out of the list view.</span>
          </div>
          {onRevealParcel && (
            <button
              type="button"
              onClick={onRevealParcel}
              className="pw-btn pw-btn-sm pw-btn-secondary"
            >
              Clear filters to reveal in list
            </button>
          )}
        </div>
      )}

      {/* Status Badge */}
      <div className="pw-details-status-row">
        <span className="pw-meta-label">Inventory Status:</span>
        <span className={`pw-status-badge pw-status-${status}`}>
          <span className="pw-badge-icon" aria-hidden="true">
            {statusIcon}
          </span>
          <span className="pw-badge-text">{statusLabel}</span>
        </span>
      </div>

      {/* Area & Geometry Metrics */}
      <div className="pw-details-metrics-grid">
        <div className="pw-metric-card">
          <span className="pw-metric-label">Approximate Area</span>
          <span className="pw-metric-value">{formatArea(approxArea, unit)}</span>
          <span className="pw-metric-note">
            Approximate WGS84 geographic area. Not a legal survey or title record.
          </span>
        </div>

        {surveyedArea !== undefined && (
          <div className="pw-metric-card pw-metric-surveyed">
            <span className="pw-metric-label">Supplied Surveyed Area</span>
            <span className="pw-metric-value">{formatArea(surveyedArea, unit)}</span>
            <span className="pw-metric-note">
              Supplied record data; kept separate from computed area.
            </span>
          </div>
        )}

        <div className="pw-metric-card">
          <span className="pw-metric-label">Geometry Type</span>
          <span className="pw-metric-value">{parcel.geometry.type}</span>
          <span className="pw-metric-note">
            {parcel.geometry.type === 'Polygon'
              ? `${parcel.geometry.coordinates.length} ring(s)${
                  parcel.geometry.coordinates.length > 1 ? ' (includes interior holes)' : ''
                }`
              : `${parcel.geometry.coordinates.length} multipolygon tract(s)`}
          </span>
        </div>
      </div>

      {/* Safe Custom Metadata */}
      {customProps.length > 0 && (
        <div className="pw-details-custom-props">
          <h3 className="pw-custom-props-heading">Supplied Attributes</h3>
          <table className="pw-props-table">
            <tbody>
              {customProps.map(([key, val]) => (
                <tr key={key}>
                  <td className="pw-prop-key">{key}</td>
                  {/* Values rendered strictly as harmless text, never raw HTML */}
                  <td className="pw-prop-val">{String(val)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Action Footer */}
      <div className="pw-details-footer">
        {shareableUrl && (
          <button
            type="button"
            onClick={handleCopyLink}
            className="pw-btn pw-btn-secondary pw-btn-sm"
          >
            {copiedLink ? '✓ Link Copied!' : 'Copy Shareable Link'}
          </button>
        )}
      </div>
    </div>
  );
};
