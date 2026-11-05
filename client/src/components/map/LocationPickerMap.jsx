import React, { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix Leaflet's default marker icon resolution for Vite bundler
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
});

// Custom CleanLoop Civic Pin Icon
const civicIcon = L.divIcon({
  className: 'cleanloop-map-pin',
  html: `
    <div style="
      background-color: #193A2E;
      color: #D9F36A;
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid #FFFFFF;
      box-shadow: 0 4px 10px rgba(25, 58, 46, 0.35);
      position: relative;
    ">
      <div style="
        width: 8px;
        height: 8px;
        background-color: #D9F36A;
        border-radius: 50%;
        transform: rotate(45deg);
      "></div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32]
});

// Component to handle map clicks and marker updates
const MapClickHandler = ({ onChange, disabled }) => {
  useMapEvents({
    click(e) {
      if (disabled) return;
      onChange({
        lat: Number(e.latlng.lat.toFixed(6)),
        lng: Number(e.latlng.lng.toFixed(6))
      });
    }
  });
  return null;
};

// Component to smoothly pan the map view when coordinates change from GPS/inputs
const MapRecenter = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    if (typeof lat === 'number' && typeof lng === 'number' && !Number.isNaN(lat) && !Number.isNaN(lng)) {
      map.setView([lat, lng], Math.max(map.getZoom(), 15), {
        animate: true,
        duration: 0.8
      });
    }
  }, [lat, lng, map]);
  return null;
};

/**
 * LocationPickerMap Component
 * Interactive Leaflet + OpenStreetMap component for picking and visualizing waste coordinates.
 */
export const LocationPickerMap = ({
  latitude,
  longitude,
  onChange,
  height = '360px',
  readOnly = false,
  className = ''
}) => {
  const hasCoords =
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    !Number.isNaN(latitude) &&
    !Number.isNaN(longitude);

  // Default initial center if no coordinates selected (Civic default: New Delhi / Metropolitan)
  const defaultCenter = [28.6139, 77.2090];
  const center = hasCoords ? [latitude, longitude] : defaultCenter;
  const zoom = hasCoords ? 15 : 12;

  const tileUrl =
    import.meta.env.VITE_MAP_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

  const markerRef = useRef(null);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null && onChange) {
          const latLng = marker.getLatLng();
          onChange({
            lat: Number(latLng.lat.toFixed(6)),
            lng: Number(latLng.lng.toFixed(6))
          });
        }
      }
    }),
    [onChange]
  );

  return (
    <div
      className={`cleanloop-map-container ${className}`}
      style={{
        height,
        width: '100%',
        borderRadius: 'var(--radius-md, 10px)',
        overflow: 'hidden',
        border: '1.5px solid var(--color-border, #DFE4DC)',
        position: 'relative'
      }}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
        attributionControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
          url={tileUrl}
          maxZoom={19}
        />

        {!readOnly && <MapClickHandler onChange={onChange} disabled={readOnly} />}
        {hasCoords && <MapRecenter lat={latitude} lng={longitude} />}

        {hasCoords && (
          <Marker
            position={[latitude, longitude]}
            icon={civicIcon}
            draggable={!readOnly}
            eventHandlers={!readOnly ? eventHandlers : undefined}
            ref={markerRef}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default LocationPickerMap;

