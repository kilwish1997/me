# Changelog

All notable changes to Plotwise Kit will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-10-30

### Added
- `@kilwish1997/plotwise-core`:
  - Atomic GeoJSON validation for `Polygon` and `MultiPolygon` parcel features.
  - Spherical excess geographic area calculation with support for interior holes.
  - Unit conversions and localized formatting for `sqm`, `sqft`, `sqyd`, `ha`, and `ac`.
  - Deterministic parcel filtering (search query, status multiselect, inclusive area range).
  - Status counts aggregation across all and filtered scopes.
  - Stable dataset identity fingerprinting via deterministic FNV-1a hashing.
  - Shareable URL state serialization and parsing with parameter length bounds.
  - Safe GeoJSON export and CSV export with formula injection sanitization.
  - Structured diagnostic error generator with downloadable report formatting.
- `@kilwish1997/plotwise-react`:
  - Leaflet map integration with high-performance `L.canvas()` renderer.
  - Default vector grid mode (no external basemap network dependency).
  - Optional tile layer configuration with graceful failure handling.
  - Lightweight virtualized parcel list supporting 5,000+ items at 60fps.
  - Full keyboard accessibility (Arrow Up/Down, Enter, Home, End).
  - Non-color status cues with distinctive symbols (`●`, `◐`, `■`, `✖`) and stroke patterns.
  - Parcel details panel with supplied surveyed area vs approximate computed area distinction.
  - Hidden parcel explanation banner with reveal/reset button.
  - Accessible modal dialogs for local GeoJSON import and tour guidance.
- `apps/demo`:
  - Interactive demonstration application loading 50, 500, and 5,000 synthetic parcel datasets.
  - Guided 6-step verification walkthrough.
  - Package boundary enforcement test.
- `examples/consumer`:
  - Isolated installation verification using local `.tgz` tarballs.
  - Pure Node compatibility test suite.
