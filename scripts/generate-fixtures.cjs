// @ts-check
const fs = require('fs');
const path = require('path');

const FIXTURES_DIR = path.resolve(__dirname, '../fixtures');

if (!fs.existsSync(FIXTURES_DIR)) {
  fs.mkdirSync(FIXTURES_DIR, { recursive: true });
}

// Base origin for synthetic datasets (synthetic subdivision in central Oregon, flat terrain)
const BASE_LON = -121.3150;
const BASE_LAT = 44.0580;

// Coordinate helpers: convert meter offsets (dx, dy) to approx delta lon/lat
// At 44 degrees N, 1 deg lat ~= 111,100 m, 1 deg lon ~= 111,100 * cos(44 deg) ~= 79,900 m
const METERS_PER_DEG_LAT = 111100;
const METERS_PER_DEG_LON = 111100 * Math.cos((BASE_LAT * Math.PI) / 180);

/**
 * @param {number} lon
 * @param {number} lat
 * @param {number} dxMeters
 * @param {number} dyMeters
 * @returns {[number, number]}
 */
function offsetCoord(lon, lat, dxMeters, dyMeters) {
  const dLon = dxMeters / METERS_PER_DEG_LON;
  const dLat = dyMeters / METERS_PER_DEG_LAT;
  return [Number((lon + dLon).toFixed(6)), Number((lat + dLat).toFixed(6))];
}

const STATUSES = ['available', 'reserved', 'sold', 'unavailable'];

/**
 * Generate 50 synthetic parcels with rich geometric diversity:
 * - concave shapes (L-shaped, T-shaped)
 * - polygons with holes (courtyards, interior easements)
 * - multipolygons
 * - varied statuses & metadata
 */
function generateSynthetic50() {
  const features = [];
  let count = 0;

  // 1. Regular parcels in rows (35 parcels)
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 7; col++) {
      count++;
      const id = `SYN-50-${String(count).padStart(3, '0')}`;
      const status = STATUSES[(row * 7 + col) % STATUSES.length];
      const x0 = col * 35;
      const y0 = row * 45;
      const w = 30;
      const h = 40;

      const p1 = offsetCoord(BASE_LON, BASE_LAT, x0, y0);
      const p2 = offsetCoord(BASE_LON, BASE_LAT, x0 + w, y0);
      const p3 = offsetCoord(BASE_LON, BASE_LAT, x0 + w, y0 + h);
      const p4 = offsetCoord(BASE_LON, BASE_LAT, x0, y0 + h);

      features.push({
        type: 'Feature',
        id: id,
        geometry: {
          type: 'Polygon',
          coordinates: [[p1, p2, p3, p4, p1]],
        },
        properties: {
          id: id,
          label: `Lot ${count} (Meadow View)`,
          status: status,
          surveyedAreaSqm: w * h,
          zoning: col % 2 === 0 ? 'R-1 Low Density' : 'R-2 Medium Density',
          notes: `Synthetic test parcel ${count}`,
        },
      });
    }
  }

  // 2. Concave L-shaped parcels (5 parcels)
  for (let i = 0; i < 5; i++) {
    count++;
    const id = `SYN-50-${String(count).padStart(3, '0')}`;
    const status = STATUSES[(count) % STATUSES.length];
    const x0 = i * 45;
    const y0 = 240;

    // L-shape coordinates
    const p1 = offsetCoord(BASE_LON, BASE_LAT, x0, y0);
    const p2 = offsetCoord(BASE_LON, BASE_LAT, x0 + 40, y0);
    const p3 = offsetCoord(BASE_LON, BASE_LAT, x0 + 40, y0 + 20);
    const p4 = offsetCoord(BASE_LON, BASE_LAT, x0 + 20, y0 + 20);
    const p5 = offsetCoord(BASE_LON, BASE_LAT, x0 + 20, y0 + 40);
    const p6 = offsetCoord(BASE_LON, BASE_LAT, x0, y0 + 40);

    features.push({
      type: 'Feature',
      id: id,
      geometry: {
        type: 'Polygon',
        coordinates: [[p1, p2, p3, p4, p5, p6, p1]],
      },
      properties: {
        id: id,
        label: `Corner Lot ${count} (L-Shaped)`,
        status: status,
        surveyedAreaSqm: 40 * 20 + 20 * 20, // 1200 sqm
        zoning: 'C-1 Commercial',
        notes: 'Corner concave lot with dual road frontage',
      },
    });
  }

  // 3. Polygons with interior holes (5 parcels with courtyard/retention pond holes)
  for (let i = 0; i < 5; i++) {
    count++;
    const id = `SYN-50-${String(count).padStart(3, '0')}`;
    const status = STATUSES[(count + 1) % STATUSES.length];
    const x0 = i * 50;
    const y0 = 300;

    // Outer ring (50m x 50m)
    const o1 = offsetCoord(BASE_LON, BASE_LAT, x0, y0);
    const o2 = offsetCoord(BASE_LON, BASE_LAT, x0 + 45, y0);
    const o3 = offsetCoord(BASE_LON, BASE_LAT, x0 + 45, y0 + 45);
    const o4 = offsetCoord(BASE_LON, BASE_LAT, x0, y0 + 45);

    // Inner hole (15m x 15m in the center)
    const h1 = offsetCoord(BASE_LON, BASE_LAT, x0 + 15, y0 + 15);
    const h2 = offsetCoord(BASE_LON, BASE_LAT, x0 + 30, y0 + 15);
    const h3 = offsetCoord(BASE_LON, BASE_LAT, x0 + 30, y0 + 30);
    const h4 = offsetCoord(BASE_LON, BASE_LAT, x0 + 15, y0 + 30);

    features.push({
      type: 'Feature',
      id: id,
      geometry: {
        type: 'Polygon',
        coordinates: [
          [o1, o2, o3, o4, o1],
          [h1, h2, h3, h4, h1], // Hole
        ],
      },
      properties: {
        id: id,
        label: `Atrium Estate ${count} (With Courtyard)`,
        status: status,
        surveyedAreaSqm: 45 * 45 - 15 * 15, // 2025 - 225 = 1800 sqm
        zoning: 'PUD Planned Development',
        notes: 'Contains internal excluded courtyard hole',
      },
    });
  }

  // 4. MultiPolygon parcels (5 parcels split across an easement/trail)
  for (let i = 0; i < 5; i++) {
    count++;
    const id = `SYN-50-${String(count).padStart(3, '0')}`;
    const status = STATUSES[(count + 2) % STATUSES.length];
    const x0 = i * 50;
    const y0 = 360;

    // Part A (west parcel: 20m x 40m)
    const a1 = offsetCoord(BASE_LON, BASE_LAT, x0, y0);
    const a2 = offsetCoord(BASE_LON, BASE_LAT, x0 + 20, y0);
    const a3 = offsetCoord(BASE_LON, BASE_LAT, x0 + 20, y0 + 40);
    const a4 = offsetCoord(BASE_LON, BASE_LAT, x0, y0 + 40);

    // Part B (east parcel: 15m x 40m, separated by 5m trail)
    const b1 = offsetCoord(BASE_LON, BASE_LAT, x0 + 25, y0);
    const b2 = offsetCoord(BASE_LON, BASE_LAT, x0 + 40, y0);
    const b3 = offsetCoord(BASE_LON, BASE_LAT, x0 + 40, y0 + 40);
    const b4 = offsetCoord(BASE_LON, BASE_LAT, x0 + 25, y0 + 40);

    features.push({
      type: 'Feature',
      id: id,
      geometry: {
        type: 'MultiPolygon',
        coordinates: [
          [[a1, a2, a3, a4, a1]],
          [[b1, b2, b3, b4, b1]],
        ],
      },
      properties: {
        id: id,
        label: `Dual Tract ${count} (Trail-Separated)`,
        status: status,
        surveyedAreaSqm: 20 * 40 + 15 * 40, // 800 + 600 = 1400 sqm
        zoning: 'A-1 Agricultural Residential',
        notes: 'MultiPolygon parcel split by pedestrian right-of-way',
      },
    });
  }

  return {
    type: 'FeatureCollection',
    features: features,
  };
}

/**
 * Generate ~500 synthetic parcels (20 rows x 25 columns master planned community)
 */
function generateSynthetic500() {
  const features = [];
  let count = 0;
  const rows = 20;
  const cols = 25;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      count++;
      const id = `SYN-500-${String(count).padStart(4, '0')}`;
      const status = STATUSES[(r * cols + c) % STATUSES.length];
      const x0 = c * 32;
      const y0 = r * 38;
      const w = 28;
      const h = 34;

      const p1 = offsetCoord(BASE_LON, BASE_LAT, x0, y0);
      const p2 = offsetCoord(BASE_LON, BASE_LAT, x0 + w, y0);
      const p3 = offsetCoord(BASE_LON, BASE_LAT, x0 + w, y0 + h);
      const p4 = offsetCoord(BASE_LON, BASE_LAT, x0, y0 + h);

      features.push({
        type: 'Feature',
        id: id,
        geometry: {
          type: 'Polygon',
          coordinates: [[p1, p2, p3, p4, p1]],
        },
        properties: {
          id: id,
          label: `Block ${r + 1} Lot ${c + 1}`,
          status: status,
          surveyedAreaSqm: w * h,
          zoning: r < 5 ? 'Commercial' : r < 15 ? 'Single Family Residential' : 'Mixed Use',
          phase: Math.floor(count / 100) + 1,
        },
      });
    }
  }

  return {
    type: 'FeatureCollection',
    features: features,
  };
}

/**
 * Generate ~5,000 synthetic parcels (50 rows x 100 cols municipal fabric)
 */
function generateSynthetic5000() {
  const features = [];
  let count = 0;
  const rows = 50;
  const cols = 100;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      count++;
      const id = `SYN-5000-${String(count).padStart(5, '0')}`;
      const status = STATUSES[(r * cols + c) % STATUSES.length];
      const x0 = c * 25;
      const y0 = r * 28;
      const w = 22;
      const h = 25;

      const p1 = offsetCoord(BASE_LON, BASE_LAT, x0, y0);
      const p2 = offsetCoord(BASE_LON, BASE_LAT, x0 + w, y0);
      const p3 = offsetCoord(BASE_LON, BASE_LAT, x0 + w, y0 + h);
      const p4 = offsetCoord(BASE_LON, BASE_LAT, x0, y0 + h);

      features.push({
        type: 'Feature',
        id: id,
        geometry: {
          type: 'Polygon',
          coordinates: [[p1, p2, p3, p4, p1]],
        },
        properties: {
          id: id,
          label: `Parcel ${count}`,
          status: status,
          surveyedAreaSqm: w * h,
          taxDistrict: (count % 8) + 1,
        },
      });
    }
  }

  return {
    type: 'FeatureCollection',
    features: features,
  };
}

/**
 * Generate Invalid Fixtures
 */
function generateInvalidFixtures() {
  // 1. Duplicate IDs
  const dup50 = generateSynthetic50();
  const dupFeatures = JSON.parse(JSON.stringify(dup50.features.slice(0, 5)));
  dupFeatures[1].id = dupFeatures[0].id;
  dupFeatures[1].properties.id = dupFeatures[0].properties.id;
  fs.writeFileSync(
    path.join(FIXTURES_DIR, 'invalid-duplicate-ids.geojson'),
    JSON.stringify({ type: 'FeatureCollection', features: dupFeatures }, null, 2)
  );

  // 2. Coordinate order inverted (lat > 90 in lon position)
  const invertedFeatures = [
    {
      type: 'Feature',
      id: 'INV-COORD-001',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [122.4194, 37.7749], // Inverted! Lon is 122, Lat is 37
            [122.4194, 95.0000], // Lat 95 > 90!
            [122.4200, 95.0000],
            [122.4200, 37.7749],
            [122.4194, 37.7749],
          ],
        ],
      },
      properties: { id: 'INV-COORD-001', label: 'Inverted Coordinates', status: 'available' },
    },
  ];
  fs.writeFileSync(
    path.join(FIXTURES_DIR, 'invalid-coordinate-order.geojson'),
    JSON.stringify({ type: 'FeatureCollection', features: invertedFeatures }, null, 2)
  );

  // 3. Out of range coordinates (Lon > 180 or Lat > 90)
  const outOfRange = [
    {
      type: 'Feature',
      id: 'INV-RANGE-001',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-185.0, 44.0], // Lon < -180
            [-184.9, 44.0],
            [-184.9, 44.1],
            [-185.0, 44.1],
            [-185.0, 44.0],
          ],
        ],
      },
      properties: { id: 'INV-RANGE-001', label: 'Out of Range', status: 'available' },
    },
  ];
  fs.writeFileSync(
    path.join(FIXTURES_DIR, 'invalid-out-of-range.geojson'),
    JSON.stringify({ type: 'FeatureCollection', features: outOfRange }, null, 2)
  );

  // 4. Unclosed ring (first != last)
  const unclosed = [
    {
      type: 'Feature',
      id: 'INV-UNCLOSED-001',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-121.315, 44.058],
            [-121.314, 44.058],
            [-121.314, 44.059],
            [-121.315, 44.059], // Missing 5th closing point matching 1st point!
          ],
        ],
      },
      properties: { id: 'INV-UNCLOSED-001', label: 'Unclosed Ring', status: 'available' },
    },
  ];
  fs.writeFileSync(
    path.join(FIXTURES_DIR, 'invalid-unclosed-ring.geojson'),
    JSON.stringify({ type: 'FeatureCollection', features: unclosed }, null, 2)
  );

  // 5. Antimeridian crossing (>180 degree jump)
  const antimeridian = [
    {
      type: 'Feature',
      id: 'INV-ANTIMERIDIAN-001',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [179.5, 10.0],
            [-179.5, 10.0], // Jumps across 180 antimeridian
            [-179.5, 11.0],
            [179.5, 11.0],
            [179.5, 10.0],
          ],
        ],
      },
      properties: { id: 'INV-ANTIMERIDIAN-001', label: 'Antimeridian Crosser', status: 'available' },
    },
  ];
  fs.writeFileSync(
    path.join(FIXTURES_DIR, 'invalid-antimeridian.geojson'),
    JSON.stringify({ type: 'FeatureCollection', features: antimeridian }, null, 2)
  );

  // 6. Unsupported geometry (Point / LineString)
  const unsupported = [
    {
      type: 'Feature',
      id: 'INV-UNSUPPORTED-001',
      geometry: {
        type: 'Point',
        coordinates: [-121.315, 44.058],
      },
      properties: { id: 'INV-UNSUPPORTED-001', label: 'Point Geometry', status: 'available' },
    },
  ];
  fs.writeFileSync(
    path.join(FIXTURES_DIR, 'invalid-unsupported-geometry.geojson'),
    JSON.stringify({ type: 'FeatureCollection', features: unsupported }, null, 2)
  );

  // 7. Resource limit exceeded (creates a fixture with 12,000 vertices or 15,000 features when tested)
  const limitFeatures = [];
  for (let i = 0; i < 100; i++) {
    const ring = [];
    // 150 vertices per polygon => 15,000 vertices total
    for (let v = 0; v < 150; v++) {
      const angle = (v / 150) * Math.PI * 2;
      const x = BASE_LON + Math.cos(angle) * 0.001;
      const y = BASE_LAT + Math.sin(angle) * 0.001;
      ring.push([Number(x.toFixed(6)), Number(y.toFixed(6))]);
    }
    ring.push([...ring[0]]);
    limitFeatures.push({
      type: 'Feature',
      id: `LIMIT-${i}`,
      geometry: { type: 'Polygon', coordinates: [ring] },
      properties: { id: `LIMIT-${i}`, label: `Limit Test ${i}`, status: 'available' },
    });
  }
  fs.writeFileSync(
    path.join(FIXTURES_DIR, 'invalid-resource-limits.geojson'),
    JSON.stringify({ type: 'FeatureCollection', features: limitFeatures }, null, 2)
  );
}

console.log('Generating synthetic-50.geojson...');
fs.writeFileSync(
  path.join(FIXTURES_DIR, 'synthetic-50.geojson'),
  JSON.stringify(generateSynthetic50(), null, 2)
);

console.log('Generating synthetic-500.geojson...');
fs.writeFileSync(
  path.join(FIXTURES_DIR, 'synthetic-500.geojson'),
  JSON.stringify(generateSynthetic500(), null, 2)
);

console.log('Generating synthetic-5000.geojson...');
fs.writeFileSync(
  path.join(FIXTURES_DIR, 'synthetic-5000.geojson'),
  JSON.stringify(generateSynthetic5000())
);

console.log('Generating invalid fixtures...');
generateInvalidFixtures();

console.log('All fixtures generated successfully in fixtures/');
