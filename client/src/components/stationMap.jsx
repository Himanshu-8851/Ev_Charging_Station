import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon issue in React Leaflet
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function StationMap({ stations, onSelectStation }) {
  // Default center (e.g., New Delhi / your target area)
  const defaultCenter = [28.6139, 77.2090]; 

  return (
    <div style={{ height: '400px', width: '100%', borderRadius: '12px', overflow: 'hidden' }}>
      <MapContainer center={defaultCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {stations.map((station) => (
          <Marker 
            key={station.id} 
            position={[station.latitude, station.longitude]}
            eventHandlers={{
              click: () => onSelectStation(station),
            }}
          >
            <Popup>
              <strong>{station.name}</strong><br />
              Status: {station.status || 'Available'}<br />
              <button 
                onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`, '_blank')}
                style={{ marginTop: '6px', padding: '4px 8px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Get Directions (Google Maps)
              </button>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}