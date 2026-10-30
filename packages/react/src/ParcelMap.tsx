import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import type { ParcelStatus } from '@kilwish1997/plotwise-core';
import { formatArea } from '@kilwish1997/plotwise-core';
import type { ParcelMapProps } from './types.js';

// Status colors and stroke patterns for visible non-color cues
const STATUS_STYLES: Record<
  ParcelStatus,
  { fillColor: string; color: string; dashArray?: string; weight: number; fillOpacity: number }
> = {
  available: {
    fillColor: '#10b981',
    color: '#047857',
    weight: 1.5,
    fillOpacity: 0.28,
  },
  reserved: {
    fillColor: '#f59e0b',
    color: '#b45309',
    dashArray: '5, 4', // dashed cue
    weight: 1.8,
    fillOpacity: 0.28,
  },
  sold: {
    fillColor: '#64748b',
    color: '#475569',
    dashArray: '2, 3', // dotted cue
    weight: 1.5,
    fillOpacity: 0.2,
  },
  unavailable: {
    fillColor: '#94a3b8',
    color: '#64748b',
    dashArray: '1, 4', // sparse dotted cue
    weight: 1.2,
    fillOpacity: 0.12,
  },
};

const SELECTED_STYLE = {
  fillColor: '#2563eb',
  color: '#1d4ed8',
  weight: 3.5,
  fillOpacity: 0.45,
  dashArray: undefined,
};

export const ParcelMap: React.FC<ParcelMapProps> = ({
  dataset,
  parcels,
  selectedId,
  onSelectParcel,
  tileLayerUrl,
  tileLayerAttribution,
  unit,
  className = '',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.FeatureGroup | null>(null);
  const parcelLayerMapRef = useRef<Map<string, L.Polygon>>(new Map());
  const tileLayerInstanceRef = useRef<L.TileLayer | null>(null);

  const [tileErrorNotice, setTileErrorNotice] = useState<string | null>(null);

  // 1. Initialize Map instance once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: true,
      // Use Canvas renderer for fast 60fps rendering of thousands of parcels
      renderer: L.canvas({ padding: 0.5 }),
      preferCanvas: true,
    });

    // Scale bar
    L.control.scale({ imperial: true, metric: true }).addTo(map);

    const layerGroup = L.featureGroup().addTo(map);
    layerGroupRef.current = layerGroup;
    mapInstanceRef.current = map;

    // Deselect if user clicks on empty map space
    map.on('click', () => {
      onSelectParcel(null);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [onSelectParcel]);

  // 2. Handle optional basemap tile layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerInstanceRef.current) {
      map.removeLayer(tileLayerInstanceRef.current);
      tileLayerInstanceRef.current = null;
    }

    if (tileLayerUrl) {
      const tileLayer = L.tileLayer(tileLayerUrl, {
        attribution: tileLayerAttribution ?? '© OpenStreetMap contributors',
        maxZoom: 19,
      });

      tileLayer.on('tileerror', () => {
        setTileErrorNotice('Basemap tile server unreachable. Vector parcels remain fully interactive.');
      });

      tileLayer.on('tileload', () => {
        setTileErrorNotice(null);
      });

      tileLayer.addTo(map);
      tileLayerInstanceRef.current = tileLayer;
      setTileErrorNotice(null);
    } else {
      setTileErrorNotice(null);
    }
  }, [tileLayerUrl, tileLayerAttribution]);

  // 3. Render parcels and update layers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();
    parcelLayerMapRef.current.clear();

    for (const parcel of parcels) {
      const geom = parcel.geometry;
      const isSelected = parcel.id === selectedId;
      const baseStyle = isSelected ? SELECTED_STYLE : STATUS_STYLES[parcel.properties.status];

      let layer: L.Polygon | null = null;

      if (geom.type === 'Polygon') {
        // GeoJSON is [lon, lat], Leaflet LatLngExpression is [lat, lon]
        const latLngs = geom.coordinates.map((ring) =>
          ring.map((pt) => [pt[1], pt[0]] as [number, number])
        );
        layer = L.polygon(latLngs, baseStyle);
      } else if (geom.type === 'MultiPolygon') {
        const multiLatLngs = geom.coordinates.map((poly) =>
          poly.map((ring) => ring.map((pt) => [pt[1], pt[0]] as [number, number]))
        );
        layer = L.polygon(multiLatLngs as unknown as [number, number][][], baseStyle);
      }

      if (layer) {
        // Tooltip with non-color status icon and formatted area
        const approxArea = parcel.properties.approximateAreaSqm ?? 0;
        const areaStr = formatArea(approxArea, unit);
        const statusLabel =
          parcel.properties.status.charAt(0).toUpperCase() + parcel.properties.status.slice(1);

        layer.bindTooltip(
          `<strong>${escapeHtml(parcel.properties.label)}</strong><br/>` +
            `<span class="pw-tooltip-status pw-status-${parcel.properties.status}">` +
            `● ${statusLabel}</span> • ${areaStr}`,
          { direction: 'top', sticky: true, opacity: 0.95 }
        );

        layer.on('click', (e: L.LeafletMouseEvent) => {
          L.DomEvent.stopPropagation(e);
          onSelectParcel(parcel.id);
        });

        layerGroup.addLayer(layer);
        parcelLayerMapRef.current.set(parcel.id, layer);

        if (isSelected) {
          layer.bringToFront();
        }
      }
    }
  }, [parcels, selectedId, unit, onSelectParcel]);

  // 4. Fit bounds when dataset changes or when empty
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const [minLon, minLat, maxLon, maxLat] = dataset.boundingBox;
    if (Number.isFinite(minLat) && Number.isFinite(minLon)) {
      const bounds = L.latLngBounds([minLat, minLon], [maxLat, maxLon]);
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 18 });
    }
  }, [dataset.datasetFingerprint, dataset.boundingBox]);

  // 5. Pan smoothly to selected parcel when selection changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedId) return;

    const layer = parcelLayerMapRef.current.get(selectedId);
    if (layer) {
      layer.bringToFront();
      const bounds = layer.getBounds();
      if (bounds.isValid()) {
        map.panTo(bounds.getCenter(), { animate: true, duration: 0.5 });
      }
    }
  }, [selectedId]);

  return (
    <div className={`pw-map-container ${className}`}>
      <div
        ref={mapContainerRef}
        className={`pw-map-viewport ${!tileLayerUrl ? 'pw-no-basemap' : ''}`}
        role="region"
        aria-label="Parcel map workspace"
      />
      {tileErrorNotice && (
        <div className="pw-map-notice pw-map-notice-warning" role="status">
          <span>{tileErrorNotice}</span>
        </div>
      )}
      {!tileLayerUrl && (
        <div className="pw-map-mode-indicator" aria-hidden="true">
          <span>Vector Grid Mode (No network calls)</span>
        </div>
      )}
    </div>
  );
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
