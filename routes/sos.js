const express = require('express');

const router = express.Router();
import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';

// --- Fix for Leaflet Default Icon Bug ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper component to auto-pan map as Sarah Wilson moves
const MapRecenter = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) map.panTo([position.lat, position.lng]);
  }, [position, map]);
  return null;
};

const SafeHerDashboard = ({ journeyId }) => {
  const [location, setLocation] = useState({ lat: 21.1458, lng: 79.0882 }); // Default Nagpur
  const [isSOSActive, setIsSOSActive] = useState(false);
  const watchId = useRef(null);

  // 1. Live Tracking Logic
  useEffect(() => {
    if ("geolocation" in navigator) {
      watchId.current = navigator.geolocation.watchPosition(
        async (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setLocation(coords);

          // Update backend Journey route
          if (journeyId) {
            try {
              await axios.put(`/api/journey/${journeyId}/update`, coords);
            } catch (err) { console.error("Sync error:", err); }
          }
        },
        (err) => console.error(err),
        { enableHighAccuracy: true, distanceFilter: 5 }
      );
    }
    return () => navigator.geolocation.clearWatch(watchId.current);
  }, [journeyId]);

  // 2. SOS Trigger Logic
  const handleSOS = async () => {
    try {
      setIsSOSActive(true);
      await axios.post('/api/sos/send', { 
        location: { ...location, accuracy: 10 },
        message: "EMERGENCY SOS activated! I need help immediately."
      });
      alert("SOS Alert Sent Successfully!");
    } catch (err) {
      setIsSOSActive(false);
      alert("Failed to send SOS. Please check connection.");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white p-4">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-pink-500">SafeHer Dashboard</h1>
      </header>

      <div className="flex-1 rounded-xl overflow-hidden relative border-2 border-gray-800">
        <MapContainer center={[location.lat, location.lng]} zoom={15} className="h-full w-full">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[location.lat, location.lng]}>
            <Popup>You are here</Popup>
          </Marker>
          <MapRecenter position={location} />
        </MapContainer>

        {/* Floating SOS Button */}
        <button 
          onClick={handleSOS}
          disabled={isSOSActive}
          className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000] px-10 py-5 rounded-full font-bold shadow-2xl transition-all ${
            isSOSActive ? 'bg-gray-600 animate-pulse' : 'bg-red-600 hover:bg-red-700 active:scale-95'
          }`}
        >
          {isSOSActive ? "SOS ACTIVE" : "TRIGGER SOS"}
        </button>
      </div>
    </div>
  );
};

export default SafeHerDashboard;