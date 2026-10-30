# @kilwish1997/plotwise-react

Accessible, responsive React parcel viewer, virtualized list, and mapping controls for Plotwise Kit.

## Features

- **No-Basemap Vector Mode by Default**: Completely functional offline with zero external network requests or tile download requirements.
- **High-Performance Canvas Renderer**: Effortlessly renders 5,000+ parcels at 60fps without DOM SVG bloat.
- **Virtualized Parcel List**: Smooth, instant rendering of up to 5,000 items in a lightweight virtual list with full keyboard navigation (arrow keys, Enter).
- **Visible Non-Color Status Cues**: Distinguishes parcel statuses (`available`, `reserved`, `sold`, `unavailable`) using text, distinctive badge icons, and stroke patterns.
- **Map & List Synchronization**: Bidirectional selection synchronization with smooth centering and highlighting.
- **Hidden Parcel Explanations**: When a selected parcel is hidden by active filters, displays a clear explanation with a one-click reveal button.
- **Atomic Local Import & Diagnostics**: In-browser local GeoJSON import with structured diagnostic reports and zero data tracking.

## Installation

```bash
npm install @kilwish1997/plotwise-react @kilwish1997/plotwise-core leaflet
```

## Quick Example

```tsx
import React from 'react';
import { parseParcelCollection } from '@kilwish1997/plotwise-core';
import { ParcelViewer } from '@kilwish1997/plotwise-react';
import '@kilwish1997/plotwise-react/styles.css';

const { dataset } = parseParcelCollection(geoJsonString);

export function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ParcelViewer dataset={dataset} />
    </div>
  );
}
```

## License

MIT © kilwish1997
