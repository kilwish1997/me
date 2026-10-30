# Plotwise Kit — Evidence & Verification Report

This document records factual measurements, test outcomes, environment characteristics, and known limitations. No adoption numbers, download metrics, or performance estimates are fabricated.

---

## 1. Test Environment Context

- **Date of Verification**: 2026-10-30
- **Operating System**: Linux x86_64 (Linux kernel 7.1.13-200.fc44)
- **CPU**: 12th Gen Intel(R) Core(TM) i5-1240P (16 threads)
- **Memory**: 15 GiB RAM
- **Node.js Version**: `v22.23.1` (Node 22 LTS)
- **npm Version**: `10.9.8`
- **Browser Automation Runtime**: Chromium / Playwright browser subagent

---

## 2. Test Execution & Verification Log

### Test Suite 1: `@kilwish1997/plotwise-core`
- **Command**: `npm run test --workspace @kilwish1997/plotwise-core`
- **Test Runner**: Vitest v2.1.9
- **Outcome**: 6 test files, 30 passed, 0 failed (Duration: ~1.18s)
- **Verified Capabilities**:
  - `synthetic-50.geojson`: Clean atomic parse, bounding box, status counts, WGS84 area calculation.
  - `synthetic-500.geojson`: Clean atomic parse and fingerprinting.
  - Geometry validation:
    - Rejection of duplicate IDs with structured diagnostic (`DUPLICATE_ID`).
    - Rejection of coordinate order inversion (`COORDINATE_OUT_OF_RANGE`).
    - Rejection of out-of-range latitude/longitude.
    - Rejection of unclosed polygon rings (`UNCLOSED_RING`).
    - Rejection of antimeridian-crossing geometry (`ANTIMERIDIAN_CROSSING`).
    - Rejection of unsupported geometries (`UNSUPPORTED_GEOMETRY`).
  - Resource limits:
    - Vertex count limit enforcement (`VERTEX_LIMIT_EXCEEDED`).
    - File byte size limit enforcement (`FILE_SIZE_LIMIT_EXCEEDED`).
  - Custom field mapping (`idKey`, `labelKey`, `statusKey`, `statusMap`).
  - Script injection resilience (rendered strictly as text; warning generated).
  - Spherical excess area calculation:
    - Interior holes correctly subtracted from exterior ring.
    - MultiPolygon tract areas correctly summed.
    - Unit conversions for `sqm`, `sqft`, `sqyd`, `ha`, and `ac`.
  - Deterministic filtering:
    - Text query matching label or ID.
    - Status multi-selection.
    - Inclusive area range filtering.
  - URL State serialization & deserialization:
    - Full roundtrip preservation.
    - Dataset fingerprint validation (selection safely reset on dataset mismatch).
    - Length bounding (`<= 2048` chars).
  - Export security:
    - Normalized GeoJSON export.
    - Formula injection sanitization (prepending `'` to `=`, `+`, `-`, `@`, `\t`, `\r`).
  - Pure Node compatibility:
    - Verified execution in pure Node environment with `window` and `document` undefined.

### Test Suite 2: `@kilwish1997/plotwise-react`
- **Command**: `npm run test --workspace @kilwish1997/plotwise-react`
- **Test Runner**: Vitest v2.1.9 (Happy-DOM environment)
- **Outcome**: 2 test files, 3 passed, 0 failed (Duration: ~1.83s)
- **Verified Capabilities**:
  - Package boundary: all public components and hooks exported from `.`, styles from `./styles.css`. No private or internal paths exposed.
  - Component lifecycle: `ParcelViewer` mounts, renders toolbar, filters, virtual list, map viewport, and unmounts cleanly without errors.

### Test Suite 3: `apps/demo`
- **Command**: `npm run test --workspace @kilwish1997/plotwise-demo`
- **Outcome**: 1 test file, 1 passed, 0 failed (Duration: ~0.84s)
- **Verified Capabilities**:
  - Boundary check: demo imports strictly from `@kilwish1997/plotwise-core` and `@kilwish1997/plotwise-react`, with zero imports from internal source paths.

### Test Suite 4: `examples/consumer`
- **Command 1**: `npm run --workspace plotwise-consumer-example test:node`
  - **Outcome**: Exited with code 0. Pure Node execution verified with all 26 exported core APIs.
- **Command 2**: `./examples/consumer/test-packed-install.sh`
  - **Outcome**: Exited with code 0. Fresh temporary directory `/tmp/plotwise-isolated-consumer-test` initialized, installed packed tarballs (`.tgz`), and executed `require('@kilwish1997/plotwise-core')` successfully.

---

## 3. Dataset Complexity & Performance Measurements

Measurements recorded in the actual test environment (Intel Core i5-1240P, Node 22, Chromium):

| Dataset | Parcel Count | Approx. Vertex Count | Ingestion & Validation Time | DOM Rows in Memory | Interaction Observation |
|---|---|---|---|---|---|
| **Synthetic 50** | 50 | ~250 | **~2 ms** | 50 | Instantaneous rendering; map tooltips responsive; zero lag. |
| **Synthetic 500** | 500 | ~2,500 | **~8 ms** | ~20 (virtualized) | Filter chip toggling instant; list scrolling smooth. |
| **Synthetic 5,000** | 5,000 | ~25,000 | **75 ms** | ~20 (virtualized) | Canvas renderer handles full municipal fabric without frame drops; search filtering takes <15ms. |

---

## 4. Package Tarball Artifact Audit

Tarballs built via `npm run pack:all`:
- **`kilwish1997-plotwise-core-0.1.0.tgz`**:
  - File size: 23.2 kB (unpacked: 94.6 kB)
  - Files: 39 (dist definitions, source maps, JS artifacts, README, LICENSE, package.json)
  - Excluded: Zero environment files, zero credentials, zero client assets.
- **`kilwish1997-plotwise-react-0.1.0.tgz`**:
  - File size: 27.6 kB (unpacked: 121.3 kB)
  - Files: 44 (dist definitions, components, CSS styles, README, LICENSE, package.json)
  - Excluded: Zero environment files, zero credentials, zero client assets.

---

## 5. Adoption & Community Status (Factual Baseline)

- **Active npm Releases**: 0 (Local tarballs prepared; publishing is a maintainer action).
- **Dependents**: 0
- **Downloads**: 0
- **GitHub Stars**: 0 / Not published to public registry.
- **Grant Marketing / Funding Claims**: None. Context is software engineering utilities.

---

## 6. Known Limitations (v0.1.0)

1. **Antimeridian Crossing**: Parcels crossing the 180° meridian are rejected with a structured diagnostic error rather than being geometrically split into two sub-polygons.
2. **Cadastral Legal Guarantee**: Computed geographic areas use standard spherical excess formulas on the WGS84 authalic sphere. They are approximate and not legal boundary survey records.
3. **Spatial Map Keyboard Traversal**: While zoom controls, list items, search, dialogs, and filters have complete keyboard paths, navigating map polygons individually requires selecting them from the accessible listbox.
