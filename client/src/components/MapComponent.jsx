import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';

// Fix for default marker icons in Leaflet with React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom hook to automatically adjust map bounds to fit all markers
const ChangeView = ({ center, zoom, bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, bounds, map]);
  return null;
};

const MapComponent = ({ cars }) => {
  const navigate = useNavigate();
  // Default center (e.g., somewhere central or dynamic based on active data)
  const defaultCenter = [40.7128, -74.0060]; // NYC as default
  
  const generateHashCoords = (str) => {
    let hash = 0;
    const safeStr = str || "unknown";
    for (let i = 0; i < safeStr.length; i++) {
      hash = safeStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    const plat = defaultCenter[0] + (hash % 100) / 1000;
    const plng = defaultCenter[1] + ((hash >> 4) % 100) / 1000;
    return [plat, plng];
  };

  const markers = cars.filter(c => c.isAvailable).map(car => {
    const lat = car.latitude !== undefined && car.latitude !== null ? car.latitude : generateHashCoords(car.location)[0];
    const lng = car.longitude !== undefined && car.longitude !== null ? car.longitude : generateHashCoords(car.location)[1];
    return {
      ...car,
      position: [lat, lng]
    };
  });

  const bounds = markers.length > 0 ? markers.map(m => m.position) : [];

  return (
    <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 0 }}>
      <MapContainer 
        center={defaultCenter} 
        zoom={12} 
        style={{ width: '100%', height: '100%', minHeight: '100%' }}
        scrollWheelZoom={true}
      >
        <ChangeView center={defaultCenter} zoom={12} bounds={bounds.length > 0 ? bounds : null} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((car, idx) => (
          <Marker key={car._id || idx} position={car.position}>
            <Popup>
              <div 
                className="cursor-pointer" 
                onClick={() => navigate(`/car-details/${car._id}`)}
              >
                <img src={car.image} alt={car.brand} className="w-full h-24 object-cover rounded-md mb-2" />
                <p className="font-semibold text-sm">{car.brand} {car.model}</p>
                <p className="text-xs text-gray-500">{car.location}</p>
                <p className="font-bold text-primary mt-1">${car.pricePerDay}/day</p>
                <p className="text-xs text-yellow-500 mt-1">★ {car.rating || 5}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapComponent;
