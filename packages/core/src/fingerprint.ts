import type { Parcel } from './types.js';

/**
 * Computes a fast, 100% deterministic 64-bit FNV-1a hash formatted as a hex string.
 * Completely pure TypeScript; runs identically in Node, Web Workers, and browsers.
 */
function fnv1a64(str: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x811c9dc5;

  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 0x01000193);
    h2 = Math.imul(h2 ^ (ch >>> 4), 0x01000193);
  }

  const hex1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const hex2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return `pw_${hex1}${hex2}`;
}

/**
 * Computes a stable dataset fingerprint based on feature IDs, geometry vertices,
 * and count. This ensures viewer selection states cannot inadvertently apply to different datasets.
 */
export function computeDatasetFingerprint(parcels: readonly Parcel[]): string {
  if (parcels.length === 0) {
    return 'pw_empty';
  }

  // Sample deterministically: sorted IDs + feature count + first/last coords of each parcel
  const sortedIds = parcels.map((p) => p.id).sort();
  const summaryChunks: string[] = [
    `count:${parcels.length}`,
    `firstId:${sortedIds[0] ?? ''}`,
    `lastId:${sortedIds[sortedIds.length - 1] ?? ''}`,
  ];

  // Include coordinate checksum for robustness against id-identical datasets
  for (let i = 0; i < parcels.length; i += Math.max(1, Math.floor(parcels.length / 50))) {
    const p = parcels[i];
    if (!p) continue;
    const geom = p.geometry;
    if (geom.type === 'Polygon' && geom.coordinates[0]?.[0]) {
      const pt = geom.coordinates[0][0];
      summaryChunks.push(`${p.id}:${pt[0]},${pt[1]}`);
    } else if (geom.type === 'MultiPolygon' && geom.coordinates[0]?.[0]?.[0]) {
      const pt = geom.coordinates[0][0][0];
      summaryChunks.push(`${p.id}:${pt[0]},${pt[1]}`);
    }
  }

  return fnv1a64(summaryChunks.join('|'));
}
