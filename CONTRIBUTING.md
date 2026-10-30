# Contributing to Plotwise Kit

Thank you for your interest in contributing to Plotwise Kit!

## Development Setup

1. Ensure Node.js `>= 20.0.0` (LTS) is installed.
2. Clone repository and install dependencies:
   ```bash
   npm install
   ```
3. Run tests across the workspace:
   ```bash
   npm test
   ```
4. Run typechecking:
   ```bash
   npm run typecheck
   ```
5. Launch the demo:
   ```bash
   npm run demo
   ```

## Guidelines

- **Code Quality**: All packages enforce strict TypeScript checking (`noImplicitAny`, `strictNullChecks`, `noUncheckedIndexedAccess`).
- **Core Isolation**: `@kilwish1997/plotwise-core` must never depend on React, Leaflet, DOM globals, or browser APIs.
- **Package Boundary**: The demo app and consumer examples must only import from package public exports.
- **Testing**: Add unit tests for any new geometry checks, filters, or area calculations.
