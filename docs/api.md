# Plotwise Kit — API Documentation

Plotwise Kit consists of two primary packages:
- `@kilwish1997/plotwise-core`: Pure TypeScript data models, validation, spherical area calculation, filtering, and state serialization.
- `@kilwish1997/plotwise-react`: React components, Leaflet map integration, virtualized accessible parcel list, filters, and import/export modals.

---

## `@kilwish1997/plotwise-core`

### `parseParcelCollection(input, options)`

Atomically parses and validates a GeoJSON FeatureCollection.

- **Parameters**:
  - `input`: `string | unknown` — GeoJSON string or parsed object.
  - `options.limits`: `Partial<ValidationLimits>` — Optional resource thresholds:
    - `maxByteSize` (default: 15MB)
    - `maxFeatures` (default: 10,000)
    - `maxVertices` (default: 100,000)
    - `maxRingVertices` (default: 5,000)
  - `options.fieldMapping`: `FieldMapping` — Custom property names mapping (`idKey`, `labelKey`, `statusKey`, `statusMap`).
- **Returns**: `ParseResult`
  - `{ success: true, dataset: ParcelCollection, warnings: Diagnostic[] }`
  - `{ success: false, diagnostics: Diagnostic[] }`

### `getParcelArea(parcel, unit)`

Calculates approximate geographic area of a parcel on the WGS84 authalic sphere model. Properly subtracts interior rings (holes) and sums multipolygon tracts.

- **Parameters**:
  - `parcel`: `Parcel`
  - `unit`: `AreaUnit` (`'sqm' | 'sqft' | 'sqyd' | 'ha' | 'ac'`) — Default: `'sqm'`.
- **Returns**: `number` (approximate area in requested unit).

### `formatArea(areaSqm, unit, options)`

Formats an area with appropriate precision and localized unit symbol (`m²`, `ft²`, `yd²`, `ha`, `ac`).

- **Parameters**:
  - `areaSqm`: `number`
  - `unit`: `AreaUnit`
  - `options.decimals`: `number` (optional fraction digits override).
  - `options.locale`: `string` (default: `'en-US'`).
- **Returns**: `string` (e.g. `"1,200 m²"` or `"0.45 ha"`).

### `filterParcels(parcels, filters)`

Deterministically filters parcels array without mutating inputs.

- **Parameters**:
  - `parcels`: `readonly Parcel[]`
  - `filters.query`: `string` — Case-insensitive search on label or ID.
  - `filters.statuses`: `ParcelStatus[]` — Filter by inventory statuses.
  - `filters.minAreaSqm`: `number` — Inclusive minimum area in m².
  - `filters.maxAreaSqm`: `number` — Inclusive maximum area in m².
- **Returns**: `Parcel[]`

### `getStatusCounts(parcels)`

Aggregates counts for each inventory status.

- **Returns**: `StatusCounts` (`available`, `reserved`, `sold`, `unavailable`, `total`).

### `serializeViewerState(state)` & `parseViewerState(query, fingerprint)`

Serializes and restores URL parameters (`ds`, `sel`, `q`, `st`, `minA`, `maxA`, `u`) with size bounds and dataset identity checks.

### `exportParcelCollection(dataset, options)`

Exports validated GeoJSON FeatureCollection with permitted metadata.

### `exportParcelsToCsv(parcels, options)`

Exports parcel inventory into CSV format with formula injection neutralization (prepends single quote to cells beginning with `=`, `+`, `-`, `@`, `\t`, `\r`).

---

## `@kilwish1997/plotwise-react`

### `<ParcelViewer />`

Top-level component assembling the complete parcel workspace.

```tsx
<ParcelViewer
  dataset={dataset}
  selectedId={selectedId}
  onSelectParcel={(id) => setSelectedId(id)}
  filters={filters}
  onFiltersChange={(f) => setFilters(f)}
  unit="sqm"
  tileLayerUrl={optionalTileUrl}
  tileLayerAttribution={optionalAttribution}
  enableNoBasemapMode={true}
  customToolbarContent={<CustomButtons />}
/>
```

### `<ParcelMap />`

Interactive Leaflet map utilizing `L.canvas()` renderer for rendering up to 5,000+ parcels at 60fps.

### `<ParcelList />`

Lightweight virtual windowed list supporting keyboard navigation (Arrow Up, Arrow Down, Home, End, Enter).

### `<ParcelFiltersComponent />`

Status filter chips with live parcel counts, visible icons, and min/max area inputs.

### `<ParcelDetails />`

Details card displaying parcel metadata, computed area, surveyed area, and an alert when a selected parcel is hidden by active filters.

### `useParcelViewerState(options)`

Hook providing state management and automatic URL synchronization without page reload.
