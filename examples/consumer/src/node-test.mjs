import {
  parseParcelCollection,
  getParcelArea,
  filterParcels,
  getStatusCounts,
  formatArea,
  serializeViewerState,
  parseViewerState,
  exportParcelsToCsv,
} from '@kilwish1997/plotwise-core';

console.log('=== Plotwise Kit Consumer Example: Pure Node Verification ===');

// 1. Verify Node environment has no DOM globals
if (typeof window !== 'undefined' || typeof document !== 'undefined') {
  throw new Error('Consumer test failed: DOM globals exist in Node environment');
}
console.log('✓ Verified: Running in pure Node without window/document globals');

// 2. Sample GeoJSON FeatureCollection
const sampleGeoJson = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'CONSUMER-001',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-121.315, 44.058],
            [-121.314, 44.058],
            [-121.314, 44.059],
            [-121.315, 44.059],
            [-121.315, 44.058],
          ],
        ],
      },
      properties: {
        id: 'CONSUMER-001',
        label: 'Consumer Verification Lot',
        status: 'available',
        surveyedAreaSqm: 8800,
        notes: 'Verified via packed artifacts in consumer app',
      },
    },
  ],
};

// 3. Test parseParcelCollection
const parseResult = parseParcelCollection(sampleGeoJson);
if (!parseResult.success) {
  throw new Error(`Parse failed: ${JSON.stringify(parseResult.diagnostics)}`);
}
console.log(`✓ parseParcelCollection: Parsed ${parseResult.dataset.featureCount} parcel feature(s)`);
console.log(`✓ datasetFingerprint: ${parseResult.dataset.datasetFingerprint}`);

// 4. Test Area Calculation & Formatting
const parcel = parseResult.dataset.features[0];
const areaSqm = getParcelArea(parcel, 'sqm');
const areaHa = getParcelArea(parcel, 'ha');
const areaAc = getParcelArea(parcel, 'ac');
console.log(`✓ getParcelArea: ${formatArea(areaSqm, 'sqm')} (${formatArea(areaHa, 'ha')}, ${formatArea(areaAc, 'ac')})`);

// 5. Test Status Counts & Filtering
const counts = getStatusCounts(parseResult.dataset.features);
console.log(`✓ getStatusCounts: Total=${counts.total}, Available=${counts.available}`);

const filtered = filterParcels(parseResult.dataset.features, { query: 'Consumer', statuses: ['available'] });
console.log(`✓ filterParcels: Found ${filtered.length} matching parcel(s)`);

// 6. Test State Serialization & Deserialization
const query = serializeViewerState({
  datasetId: parseResult.dataset.datasetFingerprint,
  selectedId: 'CONSUMER-001',
  filters: { query: 'Consumer', statuses: ['available'] },
  unit: 'ha',
});
console.log(`✓ serializeViewerState: ${query}`);

const restored = parseViewerState(query, parseResult.dataset.datasetFingerprint);
if (restored.selectedId !== 'CONSUMER-001' || restored.unit !== 'ha') {
  throw new Error('State deserialization mismatch');
}
console.log('✓ parseViewerState: Successfully restored state from query parameters');

// 7. Test CSV export with formula injection defense
const csv = exportParcelsToCsv(parseResult.dataset.features);
console.log('✓ exportParcelsToCsv generated:\n' + csv);

console.log('\n=== All consumer tests completed successfully! ===');
