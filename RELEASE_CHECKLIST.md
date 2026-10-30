# Plotwise Kit — Release Checklist (v0.1.0)

This checklist documents the verification, license review, package artifact validation, and remaining publication steps.

---

## 1. Local Verification (Pre-Release Gate)

- [x] **Node LTS Compatibility**: Verified on Node `v22.23.1` (Node 22 LTS) and npm `10.9.8`.
- [x] **Clean Dependency Installation**: `npm install` executes with zero peer dependency conflicts.
- [x] **Strict Typechecking**: `npm run typecheck` passes across `packages/core`, `packages/react`, `apps/demo`, and `examples/consumer`.
- [x] **Unit & Boundary Tests**:
  - `packages/core`: 30 unit tests passed (geometry, area, holes, multipolygons, atomic validation, resource limits, CSV formula neutralization, pure Node import).
  - `packages/react`: 3 tests passed (package boundary, public export constraints, mount/unmount lifecycle).
  - `apps/demo`: 1 test passed (package boundary enforcement ensuring no internal paths leaked).
- [x] **Isolated Consumer Validation**:
  - Pure Node consumer test passed (`examples/consumer/src/node-test.mjs`).
  - Isolated tarball install script passed (`examples/consumer/test-packed-install.sh`).
- [x] **Browser Demonstration Execution**:
  - Verified on `http://localhost:5173/` via automated browser subagent.
  - 50 parcels: load, search, filter, select, map/list synchronization verified.
  - 5,000 parcels: parsed in **75ms**; 60fps interaction without DOM SVG lag.
  - Modal tour guide and atomic diagnostic rejection verified.

---

## 2. Tarball Content & Privacy Audit

Tarballs generated in `tarballs/`:
- `kilwish1997-plotwise-core-0.1.0.tgz` (23.2 kB, 39 files)
- `kilwish1997-plotwise-react-0.1.0.tgz` (27.6 kB, 44 files)

### Audit Criteria:
- [x] Excludes `.env`, `.env.local`, and credential files.
- [x] Excludes client datasets, proprietary shapefiles, and private coordinates.
- [x] Excludes temporary scratch files, test directories, and editor configurations.
- [x] Includes only compiled distribution artifacts (`dist/`), `README.md`, `LICENSE`, and `package.json`.

---

## 3. Licensing & Provenance Review

- [x] MIT License applied to all newly authored code in root, `packages/core`, and `packages/react`.
- [x] Third-party attribution documented in `THIRD_PARTY_NOTICES.md` (Leaflet BSD 2-Clause, React MIT, Vite MIT, Chamberlain-Duquette algorithm JPL publication).
- [x] All sample datasets in `fixtures/` are original synthetic test parcels.

---

## 4. Remaining Steps for the Maintainer (Publishing)

The following steps are explicit later actions for maintainer `kilwish1997`:

1. **Verify npm Scope & Authentication**:
   ```bash
   npm whoami
   ```
   Ensure access to the `@kilwish1997` npm scope. If publishing under a different scope or unscoped name, update `package.json` names accordingly.

2. **Publish Core Package**:
   ```bash
   cd packages/core
   npm publish --access public
   ```

3. **Publish React Package**:
   ```bash
   cd ../react
   npm publish --access public
   ```

4. **Tag Release in Git**:
   ```bash
   git tag -a v0.1.0 -m "Release v0.1.0 - Plotwise Kit"
   git push origin main --tags
   ```

5. **Deploy Demo Application (Optional)**:
   The built demo in `apps/demo/dist/` can be deployed to GitHub Pages, Cloudflare Pages, or Vercel with zero environment variables or server dependencies.
