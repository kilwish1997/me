# Migration Guide: Moving from a Hand-Built Leaflet Viewer to Plotwise Kit

This document guides developers migrating from a bespoke Leaflet-based parcel viewer to Plotwise Kit.

## Key Architectural Differences

| Feature | Bespoke Hand-Built Viewer | Plotwise Kit |
|---|---|---|
| **Runtime Isolation** | Coupled to DOM and `window.L` | Core library runs in Node and browsers with zero DOM dependencies |
| **Rendering Scalability** | Default SVG path elements; bogs down around 500+ polygons | Canvas renderer handles 5,000+ parcels at 60fps |
| **Offline Reliability** | Dependent on public tile servers; breaks if offline | Vector grid mode by default; zero network dependencies |
| **Validation** | Weak or implicit checks; silent geometry corruption | Atomic pre-check with structured diagnostic codes and reports |
| **Area Calculation** | Flat planar formula or unhandled holes | WGS84 spherical excess formula with explicit hole subtraction |
| **Accessibility** | Color-only status codes; keyboard focus trapped in SVG map paths | Non-color badges + stroke patterns; virtualized keyboard-accessible list |
| **Export Safety** | Raw unescaped CSV export vulnerable to CSV injection | Sanitized CSV export neutralizing formula injection triggers |

---

## Migration Steps

### Step 1: Replace Custom GeoJSON Ingestion with `parseParcelCollection`

```ts
// Before:
const raw = JSON.parse(uploadedFile);
const features = raw.features; // unchecked

// After:
import { parseParcelCollection } from '@kilwish1997/plotwise-core';

const result = parseParcelCollection(uploadedFile, {
  fieldMapping: {
    idKey: 'lot_id',
    labelKey: 'lot_name',
    statusKey: 'status',
  },
});

if (!result.success) {
  console.error('Validation errors:', result.diagnostics);
  return;
}
const dataset = result.dataset;
```

### Step 2: Use `<ParcelViewer />`

Replace your manual Leaflet container and list markup with the unified `<ParcelViewer />` component:

```tsx
// Before:
// Manual L.map initialization, custom event listeners, unvirtualized list mapping

// After:
import { ParcelViewer } from '@kilwish1997/plotwise-react';
import '@kilwish1997/plotwise-react/styles.css';

export function Viewer() {
  return <ParcelViewer dataset={dataset} />;
}
```

### Step 3: URL State Migration

If your previous viewer used ad-hoc query string parameters, adopt `serializeViewerState` and `parseViewerState`:

```ts
import { serializeViewerState, parseViewerState } from '@kilwish1997/plotwise-core';

const queryString = serializeViewerState(state);
const restoredState = parseViewerState(window.location.search, dataset.datasetFingerprint);
```
