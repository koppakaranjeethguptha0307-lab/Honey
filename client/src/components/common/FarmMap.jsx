import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { MapPin } from 'lucide-react';

// Custom Leaflet marker icon fix
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export function FarmMap({ lat, lng, farmName, farmerName, location, height = '250px' }) {
  const hasValidCoords = lat !== null && lat !== undefined && lng !== null && lng !== undefined && !isNaN(Number(lat)) && !isNaN(Number(lng)) && Number(lat) !== 0;

  if (!hasValidCoords) {
    return (
      <div 
        style={{ height }}
        className="w-full flex flex-col items-center justify-center p-6 bg-stone-900/60 rounded-xl border border-stone-800 text-stone-400 text-center"
      >
        <MapPin className="w-8 h-8 text-amber-500/50 mb-2 stroke-[1.5]" />
        <p className="text-sm font-medium text-stone-300">Geolocation coordinates not specified</p>
        <p className="text-xs text-stone-500 mt-1">{location || farmName || 'Location data pending'}</p>
      </div>
    );
  }

  const position = [Number(lat), Number(lng)];

  return (
    <div style={{ height }} className="w-full rounded-xl overflow-hidden border border-amber-500/20 shadow-lg">
      <MapContainer 
        center={position} 
        zoom={12} 
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position} icon={customIcon}>
          <Popup>
            <div className="p-1 font-['Plus_Jakarta_Sans']">
              <h4 className="font-bold text-stone-900 text-sm">{farmName || 'Apiary Farm'}</h4>
              {farmerName && <p className="text-xs text-stone-700">Farmer: {farmerName}</p>}
              {location && <p className="text-xs text-amber-700 font-medium mt-1">{location}</p>}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
