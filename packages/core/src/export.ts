import type { Parcel, ParcelCollection } from './types.js';

export interface ExportGeoJsonOptions {
  pretty?: boolean;
  permittedPropertyKeys?: string[];
}

export interface ExportCsvOptions {
  includeHeader?: boolean;
  permittedPropertyKeys?: string[];
}

/**
 * Neutralizes spreadsheet formula injection in textual CSV cells.
 * Prepends a single quote if string begins with =, +, -, @, tab, or carriage return.
 */
export function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  let str = String(value);

  // Formula injection triggers: =, +, -, @, \t, \r
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // If contains comma, quote, or newline, escape quotes and wrap
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Exports a validated ParcelCollection as standard normalized GeoJSON.
 * Retains permitted metadata and preserves holes and multipolygons.
 */
export function exportParcelCollection(
  dataset: ParcelCollection,
  options: ExportGeoJsonOptions = {}
): string {
  const permittedKeys = options.permittedPropertyKeys;

  const features = dataset.features.map((p) => {
    let cleanProps = { ...p.properties };

    if (permittedKeys && permittedKeys.length > 0) {
      const filtered: Record<string, unknown> = {
        id: p.properties.id,
        label: p.properties.label,
        status: p.properties.status,
      };
      for (const k of permittedKeys) {
        if (k in p.properties) {
          filtered[k] = p.properties[k];
        }
      }
      cleanProps = filtered as typeof p.properties;
    }

    return {
      type: 'Feature' as const,
      id: p.id,
      geometry: p.geometry,
      properties: cleanProps,
    };
  });

  const output = {
    type: 'FeatureCollection' as const,
    features,
  };

  return options.pretty ? JSON.stringify(output, null, 2) : JSON.stringify(output);
}

/**
 * Exports an array of Parcels into safe CSV inventory format,
 * fully protected against formula injection.
 */
export function exportParcelsToCsv(
  parcels: readonly Parcel[],
  options: ExportCsvOptions = {}
): string {
  const includeHeader = options.includeHeader ?? true;
  const rows: string[] = [];

  if (includeHeader) {
    rows.push(['id', 'label', 'status', 'approximate_area_sqm', 'surveyed_area_sqm', 'notes'].join(','));
  }

  for (const p of parcels) {
    const row = [
      sanitizeCsvCell(p.id),
      sanitizeCsvCell(p.properties.label),
      sanitizeCsvCell(p.properties.status),
      sanitizeCsvCell(p.properties.approximateAreaSqm !== undefined ? Math.round(p.properties.approximateAreaSqm) : ''),
      sanitizeCsvCell(p.properties.surveyedAreaSqm !== undefined ? p.properties.surveyedAreaSqm : ''),
      sanitizeCsvCell(p.properties.notes ?? ''),
    ];
    rows.push(row.join(','));
  }

  return rows.join('\r\n');
}
