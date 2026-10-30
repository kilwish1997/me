# Third-Party Notices & Provenance Inventory

This document lists the third-party software components, licenses, and mathematical algorithms utilized in Plotwise Kit.

---

## 1. Provenance & Code Attribution

All TypeScript code in `packages/core` and `packages/react` was newly authored for Plotwise Kit under the MIT License. No proprietary client datasets, private coordinates, or non-permissive assets were copied. All sample parcel datasets in `fixtures/` are original synthetic geometries generated deterministically for testing and demonstration.

---

## 2. Third-Party Dependencies

### Leaflet
- **License**: BSD 2-Clause License
- **Copyright**: (c) 2010-2024, Volodymyr Agafonkin; (c) 2010-2011, CloudMade
- **Purpose**: Map viewport orchestration and canvas polygon rendering in `@kilwish1997/plotwise-react`.
- **Notice**:
```text
Copyright (c) 2010-2024, Volodymyr Agafonkin
Copyright (c) 2010-2011, CloudMade
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are
permitted provided that the following conditions are met:

   1. Redistributions of source code must retain the above copyright notice, this list of
      conditions and the following disclaimer.

   2. Redistributions in binary form must reproduce the above copyright notice, this list
      of conditions and the following disclaimer in the documentation and/or other materials
      provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

### React & React-DOM
- **License**: MIT License
- **Copyright**: (c) Meta Platforms, Inc. and affiliates.
- **Purpose**: UI component framework for `@kilwish1997/plotwise-react` and `apps/demo`.

### Vite & Vitest
- **License**: MIT License
- **Copyright**: (c) 2019-present, Yuxi (Evan) You and Vite contributors; (c) 2021-present, Anthony Fu and Vitest contributors.
- **Purpose**: Build bundling and test execution.

---

## 3. Mathematical Algorithms

### Chamberlain & Duquette Spherical Excess Formula
- **Formulation**: Chamberlain, R. G., and Duquette, W. H. (2007), *Some Algorithms for Evaluating Areas of Polygons on a Sphere*, JPL Publication 07-03.
- **Implementation**: Pure TypeScript implementation in `packages/core/src/area.ts`. Standard spherical excess algorithm used across open-source GIS software (Turf.js, OpenLayers).
