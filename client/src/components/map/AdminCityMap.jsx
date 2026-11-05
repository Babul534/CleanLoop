import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import Supercluster from 'supercluster';
import {
  MapPin,
  Flame,
  Layers,
  ZoomIn,
  ZoomOut,
  Crosshair,
  AlertTriangle
} from 'lucide-react';

// Default Metropolitan Civic Center (New Delhi)
const DEFAULT_CENTER = [28.6139, 77.2090];

// Custom Cluster Icon Generator
const createClusterCustomIcon = (count) => {
  let size = 38;
  let bg = '#16a34a'; // Green for small clusters
  let border = '#14532d';

  if (count >= 15) {
    size = 48;
    bg = '#dc2626'; // Red for dense hotspots
    border = '#991b1b';
  } else if (count >= 5) {
    size = 42;
    bg = '#d97706'; // Amber for medium clusters
    border = '#92400e';
  }

  return L.divIcon({
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${bg};
        border: 3px solid #ffffff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        font-family: var(--font-heading, sans-serif);
        font-weight: 800;
        font-size: ${count >= 100 ? '11px' : '13px'};
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
        cursor: pointer;
        transition: transform 0.15s ease;
      ">
        ${count}
      </div>
    `,
    className: 'cleanloop-cluster-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};

// Custom Individual Pin Icon Generator
const createSinglePinIcon = (complaint, isSelected) => {
  let pinColor = '#0284c7'; // default low
  if (complaint.priority === 'high') pinColor = '#dc2626';
  else if (complaint.priority === 'medium') pinColor = '#d97706';

  const ringStyle = isSelected
    ? 'box-shadow: 0 0 0 4px #D9F36A, 0 6px 14px rgba(0, 0, 0, 0.4); transform: scale(1.15) rotate(-45deg);'
    : 'box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3); transform: rotate(-45deg);';

  return L.divIcon({
    html: `
      <div style="
        background-color: ${pinColor};
        width: 28px;
        height: 28px;
        border-radius: 50% 50% 50% 0;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid #ffffff;
        position: relative;
        cursor: pointer;
        transition: all 0.2s ease;
        ${ringStyle}
      ">
        <div style="
          width: 8px;
          height: 8px;
          background-color: #ffffff;
          border-radius: 50%;
          transform: rotate(45deg);
        "></div>
      </div>
    `,
    className: 'cleanloop-pin-marker',
    iconSize: [28, 28],
    iconAnchor: [14, 28]
  });
};

// Heatmap Sub-layer (uses leaflet.heat)
const HeatmapLayer = ({ heatPoints }) => {
  const map = useMap();

  useEffect(() => {
    if (!heatPoints || heatPoints.length === 0) return;

    // Format points as [lat, lng, intensity]
    const validPoints = heatPoints.filter(
      (p) => Array.isArray(p) && p.length >= 2 && !Number.isNaN(p[0]) && !Number.isNaN(p[1])
    );

    const heatLayer = L.heatLayer(validPoints, {
      radius: 28,
      blur: 18,
      maxZoom: 16,
      max: 1.0,
      gradient: {
        0.2: '#0284c7', // Blue (low)
        0.4: '#16a34a', // Green
        0.6: '#eab308', // Yellow
        0.8: '#f97316', // Orange
        1.0: '#dc2626'  // Red (critical density)
      }
    });

    heatLayer.addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, heatPoints]);

  return null;
};

// Map View Bounds Listener for Supercluster Dynamic Querying
const SuperclusterRenderer = ({
  clusterIndex,
  onSelectComplaint,
  selectedComplaintId
}) => {
  const map = useMap();
  const [clusters, setClusters] = useState([]);

  const updateClusters = useCallback(() => {
    if (!clusterIndex) return;

    const bounds = map.getBounds();
    const bbox = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth()
    ];
    const zoom = Math.floor(map.getZoom());

    const result = clusterIndex.getClusters(bbox, zoom);
    setClusters(result);
  }, [map, clusterIndex]);

  useMapEvents({
    moveend: updateClusters,
    zoomend: updateClusters
  });

  useEffect(() => {
    updateClusters();
  }, [updateClusters]);

  const handleClusterClick = (clusterId, lat, lng) => {
    if (!clusterIndex) return;
    const expansionZoom = Math.min(clusterIndex.getClusterExpansionZoom(clusterId), 18);
    map.setView([lat, lng], expansionZoom, { animate: true, duration: 0.6 });
  };

  return (
    <>
      {clusters.map((feature) => {
        const [lng, lat] = feature.geometry.coordinates;
        const isCluster = feature.properties.cluster;

        if (isCluster) {
          const count = feature.properties.point_count;
          const clusterId = feature.properties.cluster_id;

          return (
            <Marker
              key={`cluster-${clusterId}`}
              position={[lat, lng]}
              icon={createClusterCustomIcon(count)}
              eventHandlers={{
                click: () => handleClusterClick(clusterId, lat, lng)
              }}
            >
              <Tooltip direction="top" offset={[0, -18]} opacity={0.95}>
                <span>{count} nearby waste complaints (Click to expand)</span>
              </Tooltip>
            </Marker>
          );
        }

        const complaint = feature.properties.complaint;
        const isSelected = selectedComplaintId === complaint._id;

        return (
          <Marker
            key={`marker-${complaint._id}`}
            position={[lat, lng]}
            icon={createSinglePinIcon(complaint, isSelected)}
            eventHandlers={{
              click: () => onSelectComplaint(complaint)
            }}
          >
            <Tooltip direction="top" offset={[0, -26]} opacity={0.95}>
              <div style={{ textAlign: 'center', fontWeight: 600 }}>
                <div>{complaint.complaintCode}</div>
                <div style={{ fontSize: '0.75rem', textTransform: 'capitalize', color: '#4b5563' }}>
                  {complaint.category} • {complaint.priority} priority
                </div>
              </div>
            </Tooltip>
          </Marker>
        );
      })}
    </>
  );
};

// Map Recenter Controller
const MapRecenterController = ({ targetCenter, bounds }) => {
  const map = useMap();

  useEffect(() => {
    if (bounds && bounds.minLat !== Infinity && bounds.maxLat !== -Infinity) {
      map.fitBounds(
        [
          [bounds.minLat, bounds.minLng],
          [bounds.maxLat, bounds.maxLng]
        ],
        { padding: [50, 50], maxZoom: 15, animate: true }
      );
    } else if (targetCenter && Array.isArray(targetCenter) && targetCenter.length === 2) {
      map.setView(targetCenter, 13, { animate: true });
    }
  }, [map, targetCenter, bounds]);

  return null;
};

/**
 * AdminCityMap Component
 * Interactive city map featuring dual-mode Marker Clustering and Density Heatmaps
 */
export const AdminCityMap = ({
  complaints = [],
  heatPoints = [],
  center = DEFAULT_CENTER,
  bounds = null,
  viewMode = 'cluster', // 'cluster' | 'heat'
  onSelectComplaint = () => {},
  selectedComplaintId = null,
  flyToCoords = null,
  height = '580px'
}) => {
  const mapRef = useRef(null);

  // Initialize Supercluster instance
  const clusterIndex = useMemo(() => {
    const sc = new Supercluster({
      radius: 65,
      maxZoom: 17
    });

    const points = complaints
      .filter((c) => typeof c.lat === 'number' && typeof c.lng === 'number' && !Number.isNaN(c.lat) && !Number.isNaN(c.lng))
      .map((c) => ({
        type: 'Feature',
        properties: {
          cluster: false,
          complaintId: c._id,
          complaint: c
        },
        geometry: {
          type: 'Point',
          coordinates: [c.lng, c.lat] // Supercluster uses GeoJSON [lng, lat]
        }
      }));

    sc.load(points);
    return sc;
  }, [complaints]);

  // Handle external fly-to (e.g. from hotspot click)
  useEffect(() => {
    if (flyToCoords && mapRef.current) {
      mapRef.current.flyTo(flyToCoords, 16, { animate: true, duration: 1.2 });
    }
  }, [flyToCoords]);

  const tileUrl =
    import.meta.env.VITE_MAP_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height,
        borderRadius: 'var(--radius-sm)',
        overflow: 'hidden',
        border: '1px solid var(--color-border)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
      }}
    >
      <MapContainer
        ref={mapRef}
        center={center}
        zoom={13}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={tileUrl}
          maxZoom={19}
        />

        {/* Dynamic Bounds / Recenter */}
        <MapRecenterController targetCenter={center} bounds={bounds} />

        {/* View Mode: Heatmap vs Clustering */}
        {viewMode === 'heat' ? (
          <HeatmapLayer heatPoints={heatPoints} />
        ) : (
          <SuperclusterRenderer
            clusterIndex={clusterIndex}
            onSelectComplaint={onSelectComplaint}
            selectedComplaintId={selectedComplaintId}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default AdminCityMap;

