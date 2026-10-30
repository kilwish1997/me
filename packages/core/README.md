# @kilwish1997/plotwise-core

Pure TypeScript core for Plotwise Kit: parcel geometry, area calculation, atomic validation, filtering, state serialization, and safe export.

## Features

- **Atomic GeoJSON Validation**: Strict WGS84 validation for Polygon and MultiPolygon parcel features with configurable resource limits.
- **Accurate Geographic Area**: Spherical excess calculation using Chamberlain-Duquette algorithm, properly subtracting interior holes and summing multipolygon tract areas.
- **Unit Conversions**: Supports square meters (`sqm`), square feet (`sqft`), square yards (`sqyd`), hectares (`ha`), and acres (`ac`).
- **Deterministic Filtering**: Filter by parcel label/ID query, inventory status, and inclusive area range.
- **Stable Dataset Fingerprints**: Computes deterministic identity fingerprints so selection state cannot accidentally apply to a mismatched dataset.
- **Safe Export**: GeoJSON export preserving geometry and CSV inventory export with formula injection defense.
- **Node & Browser Compatible**: Zero DOM globals, zero Leaflet or React dependencies; imports safely in pure Node.

## Installation

```bash
npm install @kilwish1997/plotwise-core
```

## Quick Example

```ts
import { parseParcelCollection, getParcelArea, formatArea } from '@kilwish1997/plotwise-core';

const result = parseParcelCollection(geoJsonString);

if (result.success) {
  const parcel = result.dataset.features[0];
  const areaSqm = getParcelArea(parcel, 'sqm');
  console.log(`Parcel ${parcel.properties.label}: ${formatArea(areaSqm, 'ha')}`);
} else {
  console.error('Validation diagnostics:', result.diagnostics);
}
```

## License

MIT © kilwish1997
