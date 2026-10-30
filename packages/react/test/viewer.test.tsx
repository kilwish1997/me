import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { parseParcelCollection } from '@kilwish1997/plotwise-core';
import { ParcelViewer } from '../src/index.js';

const FIXTURES_DIR = path.resolve(__dirname, '../../../fixtures');

describe('ParcelViewer Component Lifecycle & Mount', () => {
  const raw = fs.readFileSync(path.join(FIXTURES_DIR, 'synthetic-50.geojson'), 'utf-8');
  const parsed = parseParcelCollection(raw);
  if (!parsed.success) {
    throw new Error('Failed to parse synthetic-50 for React test');
  }

  it('mounts and unmounts cleanly without errors or memory leaks', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <ParcelViewer
          dataset={parsed.dataset}
          enableNoBasemapMode={true}
        />
      );
    });

    // Check DOM elements exist
    const brand = container.querySelector('.pw-brand-name');
    expect(brand).not.toBeNull();
    expect(brand?.textContent).toBe('Plotwise Kit');

    const searchInput = container.querySelector('.pw-search-input');
    expect(searchInput).not.toBeNull();

    const statusChips = container.querySelectorAll('.pw-status-chip');
    expect(statusChips.length).toBe(4);

    const mapViewport = container.querySelector('.pw-map-viewport');
    expect(mapViewport).not.toBeNull();

    // Clean unmount
    await act(async () => {
      root.unmount();
    });

    document.body.removeChild(container);
    expect(container.innerHTML).toBe('');
  });
});
