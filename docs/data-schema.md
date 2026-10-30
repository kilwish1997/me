# Plotwise Kit — Data Contract & Geometry Schema

Plotwise Kit ingests GeoJSON parcel data following the [RFC 7946](https://datatracker.ietf.org/doc/html/rfc7946) standard.

## 1. Supported Geometry Types

Only two geometry types are accepted for parcel features:
- `Polygon`: Exterior linear ring plus optional interior linear rings (holes).
- `MultiPolygon`: Array of polygon coordinate structures.

Other geometry types (e.g. `Point`, `LineString`, `GeometryCollection`) are rejected with diagnostic code `UNSUPPORTED_GEOMETRY`.

## 2. Coordinate System & Validity

- **Coordinate Reference System**: WGS84 (`urn:ogc:def:crs:OGC:1.3:CRS84`), standard longitude and latitude in degrees.
- **Coordinate Order**: `[longitude, latitude]` or `[longitude, latitude, elevation]`.
  - Longitude must be finite and within `[-180, 180]`.
  - Latitude must be finite and within `[-90, 90]`.
- **Rings**:
  - Must have at least 4 coordinate positions.
  - Must be closed: the first and last coordinates must be identical (`coords[0] === coords[length - 1]`).
- **Antimeridian Crossings**: Geometry rings that cross the 180° meridian (>180° longitude difference between adjacent vertices) are rejected with `ANTIMERIDIAN_CROSSING`. Version 0.1 does not split or re-project antimeridian-spanning parcels.

## 3. Required Feature Properties

Each parcel feature must provide:
- `id`: Non-empty string. Must be unique across the entire FeatureCollection.
- `label`: Non-empty string. Displayed in list, tooltips, and details.
- `status`: One of the following four values:
  - `available`
  - `reserved`
  - `sold`
  - `unavailable`

### Field Mapping

If incoming data uses alternative property keys (e.g. `parcel_num` instead of `id`), provide a `FieldMapping` to `parseParcelCollection`:

```ts
const mapping: FieldMapping = {
  idKey: 'parcel_num',
  labelKey: 'lot_name',
  statusKey: 'state',
  statusMap: {
    for_sale: 'available',
    under_contract: 'reserved',
    closed: 'sold',
  },
};
```

## 4. Area Metrics Contract

- **`approximateAreaSqm`**: Computed by Plotwise Kit using spherical excess on the WGS84 authalic sphere model.
  *Notice*: This computed area is approximate and is not a certified land survey or legal title record.
- **`surveyedAreaSqm`**: Optional property supplied in caller metadata. Plotwise Kit stores and displays this value separately and never silently replaces it with computed area.

## 5. Resource Limits

Configurable validation thresholds:
- File byte size: 15 MB
- Feature count: 10,000 features
- Total vertex count: 100,000 vertices
- Single ring vertex count: 5,000 vertices

Input exceeding any threshold is atomically rejected before heavy computation.
