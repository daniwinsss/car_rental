import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';

// Fix broken default marker icons in Vite/React builds
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Auto-fit bounds when markers change
const FitBounds = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }
  }, [bounds, map]);
  return null;
};

const generateHashCoords = (str) => {
  const base = [40.7128, -74.006]; // NYC fallback center
  let hash = 0;
  const safeStr = str || 'unknown';
  for (let i = 0; i < safeStr.length; i++) {
    hash = safeStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  return [base[0] + (hash % 100) / 500, base[1] + ((hash >> 4) % 100) / 500];
};

const MapComponent = ({ cars }) => {
  const navigate = useNavigate();

  const markers = (cars || [])
    .filter(c => c && c.isAvailable)
    .map(car => {
      const lat =
        car.latitude != null && !isNaN(car.latitude)
          ? car.latitude
          : generateHashCoords(car.location)[0];
      const lng =
        car.longitude != null && !isNaN(car.longitude)
          ? car.longitude
          : generateHashCoords(car.location)[1];
      return { ...car, position: [lat, lng] };
    });

  const bounds = markers.map(m => m.position);

  return (
    <MapContainer
      center={[40.7128, -74.006]}
      zoom={10}
      style={{ width: '100%', height: '100%' }}
      scrollWheelZoom
      zoomControl
    >
      {bounds.length > 0 && <FitBounds bounds={bounds} />}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markers.map((car, idx) => (
        <Marker key={car._id || idx} position={car.position}>
          <Popup minWidth={180}>
            <div
              onClick={() => navigate(`/car-details/${car._id}`)}
              style={{ cursor: 'pointer' }}
            >
              <img
                src={car.image}
                alt={car.brand}
                style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '6px', marginBottom: '6px' }}
              />
              <p style={{ fontWeight: 600, fontSize: '13px', margin: 0 }}>
                {car.brand} {car.model}
              </p>
              <p style={{ color: '#888', fontSize: '11px', margin: '2px 0' }}>{car.location}</p>
              <p style={{ fontWeight: 700, fontSize: '13px', color: '#2563eb', margin: '4px 0 2px' }}>
                ${car.pricePerDay}/day
              </p>
              <p style={{ color: '#f59e0b', fontSize: '11px', margin: 0 }}>
                {'★'.repeat(Math.round(car.rating || 5))} {car.rating || 5}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapComponent;
