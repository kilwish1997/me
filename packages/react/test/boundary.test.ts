import { describe, expect, it } from 'vitest';
import * as reactPkg from '../src/index.js';

describe('React Package Boundary & Public Exports', () => {
  it('exports all expected components and hooks from index', () => {
    expect(typeof reactPkg.ParcelViewer).toBe('function');
    expect(typeof reactPkg.ParcelMap).toBe('function');
    expect(typeof reactPkg.ParcelList).toBe('function');
    expect(typeof reactPkg.ParcelFiltersComponent).toBe('function');
    expect(typeof reactPkg.ParcelDetails).toBe('function');
    expect(typeof reactPkg.ParcelToolbar).toBe('function');
    expect(typeof reactPkg.ParcelImportModal).toBe('function');
    expect(typeof reactPkg.useParcelViewerState).toBe('function');
  });

  it('only exports declared public artifacts and does not expose internal files', async () => {
    const pkgJson = await import('../package.json', { with: { type: 'json' } });
    const exports = pkgJson.default.exports;

    expect(exports['.']).toBeDefined();
    expect(exports['./styles.css']).toBeDefined();

    // Verify no private or src paths in exports
    for (const key of Object.keys(exports)) {
      expect(key.startsWith('./src')).toBe(false);
      expect(key.startsWith('./test')).toBe(false);
    }
  });
});
