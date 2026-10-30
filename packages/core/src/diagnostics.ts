import type { Diagnostic } from './types.js';

export interface DiagnosticReportOptions {
  datasetName?: string;
  sourceType?: string;
  timestamp?: string;
}

/**
 * Generates a human-readable text and structured diagnostic report
 * suitable for download when an import fails.
 */
export function formatDiagnosticReport(
  diagnostics: readonly Diagnostic[],
  options: DiagnosticReportOptions = {}
): string {
  const timestamp = options.timestamp ?? new Date().toISOString();
  const datasetName = options.datasetName ?? 'Uploaded GeoJSON Dataset';

  const errors = diagnostics.filter((d) => d.severity === 'error');
  const warnings = diagnostics.filter((d) => d.severity === 'warning');

  const lines: string[] = [
    '======================================================================',
    'PLOTWISE KIT - PARCEL IMPORT DIAGNOSTIC REPORT',
    '======================================================================',
    `Timestamp:    ${timestamp}`,
    `Dataset:      ${datasetName}`,
    `Status:       ${errors.length > 0 ? 'REJECTED (Atomic Import Pre-check Failed)' : 'VALID WITH WARNINGS'}`,
    `Total Errors: ${errors.length}`,
    `Warnings:     ${warnings.length}`,
    '----------------------------------------------------------------------',
    'IMPORT INTEGRITY NOTICE:',
    'Plotwise Kit enforces atomic validation. No geometry was silently',
    'repaired or loaded in a corrupted state.',
    '----------------------------------------------------------------------',
    '',
  ];

  if (errors.length > 0) {
    lines.push('ERRORS (MUST BE RESOLVED BEFORE IMPORT):');
    errors.forEach((err, idx) => {
      lines.push(`  [${idx + 1}] Code:     ${err.code}`);
      if (err.featureId) {
        lines.push(`      Feature:  ${err.featureId}`);
      }
      lines.push(`      Path:     ${err.path}`);
      lines.push(`      Message:  ${err.message}`);
      lines.push('');
    });
  }

  if (warnings.length > 0) {
    lines.push('WARNINGS (ADVISORY NOTICES):');
    warnings.forEach((warn, idx) => {
      lines.push(`  [${idx + 1}] Code:     ${warn.code}`);
      if (warn.featureId) {
        lines.push(`      Feature:  ${warn.featureId}`);
      }
      lines.push(`      Path:     ${warn.path}`);
      lines.push(`      Message:  ${warn.message}`);
      lines.push('');
    });
  }

  lines.push('======================================================================');
  lines.push('End of Report');
  lines.push('======================================================================');

  return lines.join('\n');
}

/**
 * Returns diagnostic report as formatted JSON string for programmatic consumption.
 */
export function formatDiagnosticJson(
  diagnostics: readonly Diagnostic[],
  options: DiagnosticReportOptions = {}
): string {
  const timestamp = options.timestamp ?? new Date().toISOString();
  const errors = diagnostics.filter((d) => d.severity === 'error');
  const warnings = diagnostics.filter((d) => d.severity === 'warning');

  return JSON.stringify(
    {
      reportTitle: 'Plotwise Kit Parcel Validation Diagnostics',
      timestamp,
      datasetName: options.datasetName ?? 'Uploaded GeoJSON Dataset',
      success: errors.length === 0,
      summary: {
        errorCount: errors.length,
        warningCount: warnings.length,
      },
      errors,
      warnings,
    },
    null,
    2
  );
}
