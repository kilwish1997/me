import React, { useEffect, useRef, useState } from 'react';
import type { Diagnostic, ParcelCollection } from '@kilwish1997/plotwise-core';
import {
  formatArea,
  formatDiagnosticJson,
  formatDiagnosticReport,
  parseParcelCollection,
} from '@kilwish1997/plotwise-core';
import type { ParcelImportModalProps } from './types.js';

export const ParcelImportModal: React.FC<ParcelImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rawText, setRawText] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [warnings, setWarnings] = useState<Diagnostic[]>([]);
  const [validatedDataset, setValidatedDataset] = useState<ParcelCollection | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Focus trap & Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setRawText('');
      setFileName('');
      setDiagnostics([]);
      setWarnings([]);
      setValidatedDataset(null);
      setIsProcessing(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleValidate = (textToValidate: string, name: string) => {
    setIsProcessing(true);
    setDiagnostics([]);
    setWarnings([]);
    setValidatedDataset(null);

    // Run core parser atomically
    const result = parseParcelCollection(textToValidate, { datasetName: name });

    setIsProcessing(false);

    if (result.success) {
      setValidatedDataset(result.dataset);
      setWarnings(result.warnings);
    } else {
      setDiagnostics(result.diagnostics);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setRawText(content);
        handleValidate(content, file.name);
      }
    };
    reader.readAsText(file);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setRawText(val);
    setFileName('Pasted GeoJSON');
    if (val.trim()) {
      handleValidate(val, 'Pasted GeoJSON');
    } else {
      setDiagnostics([]);
      setWarnings([]);
      setValidatedDataset(null);
    }
  };

  const handleDownloadReport = (format: 'txt' | 'json') => {
    const reportContent =
      format === 'json'
        ? formatDiagnosticJson(diagnostics, { datasetName: fileName })
        : formatDiagnosticReport(diagnostics, { datasetName: fileName });

    const blob = new Blob([reportContent], {
      type: format === 'json' ? 'application/json' : 'text/plain',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plotwise-diagnostic-report.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleApply = () => {
    if (validatedDataset) {
      onImportSuccess(validatedDataset, fileName || 'Imported Dataset');
      onClose();
    }
  };

  return (
    <div className="pw-modal-backdrop" onClick={onClose} role="presentation">
      <div
        ref={modalRef}
        className="pw-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pw-import-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pw-modal-header">
          <h2 id="pw-import-title" className="pw-modal-title">
            Import Local Parcel GeoJSON
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="pw-modal-close-btn"
            aria-label="Close import dialog"
          >
            ✕
          </button>
        </div>

        <div className="pw-modal-body">
          <p className="pw-modal-desc">
            All validation and parsing happen locally in your browser. Files are never uploaded
            to any server or external service.
          </p>

          {/* File Picker Zone */}
          <div className="pw-file-dropzone">
            <input
              ref={fileInputRef}
              type="file"
              accept=".geojson,.json"
              onChange={handleFileChange}
              className="pw-file-input"
              id="pw-geojson-file-input"
            />
            <label htmlFor="pw-geojson-file-input" className="pw-file-dropzone-label">
              <span className="pw-dropzone-prompt">
                {fileName ? `Selected: ${fileName}` : 'Choose a GeoJSON file or drag here'}
              </span>
              <span className="pw-dropzone-hint">Supports Polygon and MultiPolygon parcels</span>
            </label>
          </div>

          <div className="pw-modal-divider">or paste GeoJSON text below:</div>

          {/* Textarea Paste */}
          <textarea
            value={rawText}
            onChange={handleTextChange}
            placeholder='{"type": "FeatureCollection", "features": [...]}'
            className="pw-geojson-textarea"
            rows={5}
            aria-label="GeoJSON input text"
          />

          {/* Diagnostics / Error Report */}
          {diagnostics.length > 0 && (
            <div className="pw-import-alert pw-alert-error" role="alert">
              <div className="pw-alert-header">
                <strong>Validation Rejected ({diagnostics.length} errors)</strong>
                <div className="pw-report-download-btns">
                  <button
                    type="button"
                    onClick={() => handleDownloadReport('txt')}
                    className="pw-btn pw-btn-xs pw-btn-secondary"
                  >
                    Download Report (.txt)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadReport('json')}
                    className="pw-btn pw-btn-xs pw-btn-secondary"
                  >
                    JSON
                  </button>
                </div>
              </div>
              <p className="pw-alert-subtext">
                Plotwise Kit enforces atomic validation. Current active dataset has not been
                modified.
              </p>
              <ul className="pw-diagnostics-list">
                {diagnostics.slice(0, 10).map((d, i) => (
                  <li key={i} className="pw-diagnostic-item">
                    <span className="pw-diag-code">[{d.code}]</span>
                    {d.featureId && <span className="pw-diag-id">Feature: {d.featureId}</span>}
                    <span className="pw-diag-path">{d.path}:</span>
                    <span className="pw-diag-msg">{d.message}</span>
                  </li>
                ))}
                {diagnostics.length > 10 && (
                  <li className="pw-diag-more">
                    ...and {diagnostics.length - 10} more errors (see full downloaded report).
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Valid Dataset Summary */}
          {validatedDataset && (
            <div className="pw-import-alert pw-alert-success" role="status">
              <div className="pw-alert-header">
                <strong>✓ Validation Passed</strong>
              </div>
              <div className="pw-valid-summary">
                <div>Parcels: {validatedDataset.featureCount}</div>
                <div>
                  Approximate Total Area:{' '}
                  {formatArea(validatedDataset.approximateTotalAreaSqm, 'sqm')}
                </div>
                <div>
                  Status Breakdown: {validatedDataset.statusCounts.available} Available,{' '}
                  {validatedDataset.statusCounts.reserved} Reserved,{' '}
                  {validatedDataset.statusCounts.sold} Sold,{' '}
                  {validatedDataset.statusCounts.unavailable} Unavailable
                </div>
              </div>
              {warnings.length > 0 && (
                <div className="pw-warnings-box">
                  <strong>{warnings.length} warning(s):</strong>
                  <ul>
                    {warnings.map((w, i) => (
                      <li key={i}>{w.message}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="pw-modal-footer">
          <button type="button" onClick={onClose} className="pw-btn pw-btn-secondary">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={!validatedDataset || isProcessing}
            className="pw-btn pw-btn-primary"
          >
            Apply Validated Dataset
          </button>
        </div>
      </div>
    </div>
  );
};
