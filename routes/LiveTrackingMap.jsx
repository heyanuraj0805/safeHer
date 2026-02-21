import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { updateJourneyLocation } from '../services/api';

// Fix for missing marker icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper component to keep map centered on Sarah Wilson
const RecenterMap = ({ coords }) => {
  const map = useMap();
  useEffect(() => { if (coords) map.setView([coords.lat, coords.lng], 15); }, [coords]);
  return null;
};

const LiveTrackingMap = ({ journeyId, isActive }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const watchId = useRef(null);

  useEffect(() => {
    if (isActive && navigator.geolocation) {
      // Use watchPosition for "Live" tracking
      watchId.current = navigator.geolocation.watchPosition(
        (position) => {
          const newCoords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(newCoords);

          // Sync with your PUT /api/journey/:id/update route
          if (journeyId) {
            updateJourneyLocation(journeyId, newCoords);
          }
        },
        (error) => console.error("Location Error:", error),
        { enableHighAccuracy: true, distanceFilter: 10 } // Update every 10 meters
      );
    }

    return () => {
      if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
    };
  }, [isActive, journeyId]);

  return (
    <div className="h-full w-full rounded-lg overflow-hidden border border-gray-700">
      <MapContainer 
        center={[21.1458, 79.0882]} // Initial center (Nagpur)
        zoom={13} 
        className="h-full w-full"
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        {currentLocation && (
          <>
            <Marker position={[currentLocation.lat, currentLocation.lng]}>
              <Popup>Sarah Wilson's Live Location</Popup>
            </Marker>
            <RecenterMap coords={currentLocation} />
          </>
        )}
      </MapContainer>
    </div>
  );
};

export default LiveTrackingMap;