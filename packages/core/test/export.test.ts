import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  exportParcelCollection,
  exportParcelsToCsv,
  parseParcelCollection,
  sanitizeCsvCell,
} from '../src/index.js';
import type { Parcel } from '../src/types.js';

const FIXTURES_DIR = path.resolve(__dirname, '../../../fixtures');

describe('Export Functions & Security', () => {
  const raw = fs.readFileSync(path.join(FIXTURES_DIR, 'synthetic-50.geojson'), 'utf-8');
  const parsed = parseParcelCollection(raw);
  if (!parsed.success) {
    throw new Error('Failed to parse synthetic-50 for export tests');
  }

  it('exports normalized valid GeoJSON preserving holes and properties', () => {
    const exportedJson = exportParcelCollection(parsed.dataset, { pretty: true });
    const reParsed = JSON.parse(exportedJson);

    expect(reParsed.type).toBe('FeatureCollection');
    expect(reParsed.features.length).toBe(50);

    const holeFeature = reParsed.features.find((f: { geometry: { coordinates: unknown[] } }) => f.geometry.coordinates.length > 1);
    expect(holeFeature).toBeDefined();
  });

  it('neutralizes spreadsheet formula injection in CSV cells', () => {
    // Dangerous spreadsheet prefixes: =, +, -, @, \t, \r
    expect(sanitizeCsvCell('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)");
    expect(sanitizeCsvCell('+cmd|/c calc')).toBe("'+cmd|/c calc");
    expect(sanitizeCsvCell('-2+5')).toBe("'-2+5");
    expect(sanitizeCsvCell('@exploit')).toBe("'@exploit");
    expect(sanitizeCsvCell('\tsecret')).toBe("'\tsecret");
  });

  it('correctly escapes quotes and commas in CSV output', () => {
    const maliciousParcel: Parcel = {
      type: 'Feature',
      id: 'TEST-CSV-01',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-121.315, 44.058],
            [-121.314, 44.058],
            [-121.314, 44.059],
            [-121.315, 44.059],
            [-121.315, 44.058],
          ],
        ],
      },
      properties: {
        id: 'TEST-CSV-01',
        label: 'Lot with "Quotes" and, Comma',
        status: 'available',
        approximateAreaSqm: 1200,
        notes: '=HYPERLINK("http://attacker.com","Click")',
      },
    };

    const csv = exportParcelsToCsv([maliciousParcel]);
    // Checks that formula was neutralized with leading quote
    expect(csv).toContain("\"'=HYPERLINK(");
    // Checks quotes were escaped as ""
    expect(csv).toContain('"Lot with ""Quotes"" and, Comma"');
  });
});
