import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix broken default marker icons in Vite/React builds
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Fly to new position when coordinates change
const FlyTo = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.flyTo(coords, 13, { duration: 1.5 });
    }
  }, [coords, map]);
  return null;
};

/**
 * MapComponent
 * Props:
 *   location {string} - A city/location name to geocode and pin on the map.
 *   label    {string} - Optional popup label text.
 */
const MapComponent = ({ location, label }) => {
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!location) return;

    const geocode = async () => {
      setLoading(true);
      setError(null);
      try {
        const encoded = encodeURIComponent(location);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = await res.json();
        if (data && data.length > 0) {
          setCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        } else {
          setError(`Could not find location: "${location}"`);
        }
      } catch {
        setError('Failed to load map location.');
      } finally {
        setLoading(false);
      }
    };

    geocode();
  }, [location]);

  if (!location) return null;

  if (loading) {
    return (
      <div style={{ height: '300px' }} className="flex items-center justify-center bg-gray-100 rounded-xl border">
        <p className="text-gray-400 text-sm animate-pulse">Loading map...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ height: '200px' }} className="flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
        <p className="text-gray-400 text-sm">{error}</p>
      </div>
    );
  }

  if (!coords) return null;

  return (
    <div style={{ height: '320px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
      <MapContainer
        center={coords}
        zoom={13}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={false}
      >
        <FlyTo coords={coords} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={coords}>
          <Popup>{label || location}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default MapComponent;
