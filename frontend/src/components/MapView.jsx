import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const userIcon = L.divIcon({
  className: 'user-location-marker',
  html: '<div class="user-dot"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function FlyToCenter({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, { duration: 1 });
    }
  }, [center, zoom, map]);
  return null;
}

function computeCenter(banks) {
  if (banks.length === 0) return null;
  const lat = banks.reduce((s, b) => s + (b.latitude || 0), 0) / banks.length;
  const lng = banks.reduce((s, b) => s + (b.longitude || 0), 0) / banks.length;
  if (lat && lng) return [lat, lng];
  return null;
}

export default function MapView({ banks = [], center, zoom = 12, height = '400px', singleBank = false }) {
  const [userPos, setUserPos] = useState(null);
  const avgCenter = useMemo(() => computeCenter(banks), [banks]);
  const initialCenter = center || avgCenter || [20.5937, 78.9629];
  const initialZoom = center ? zoom : (avgCenter ? zoom : 5);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserPos([pos.coords.latitude, pos.coords.longitude]);
        },
        () => {}
      );
    }
  }, []);

  const hasCoords = (b) => b.latitude && b.longitude;
  const activeCenter = center || userPos || avgCenter;

  return (
    <div style={{ height, width: '100%', borderRadius: '8px', overflow: 'hidden' }}>
      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {activeCenter && <FlyToCenter center={activeCenter} zoom={zoom} />}

        {userPos && (
          <Marker position={userPos} icon={userIcon}>
            <Popup>Your Location</Popup>
          </Marker>
        )}

        {banks.filter(hasCoords).map((bank) => (
          <Marker
            key={bank._id}
            position={[bank.latitude, bank.longitude]}
            icon={defaultIcon}
          >
            <Popup>
              <strong>{bank.name}</strong>
              <br />
              {bank.city}{bank.address ? ` - ${bank.address}` : ''}
              <br />
              {bank.phone && <>Phone: {bank.phone}<br /></>}
              {bank.services && bank.services.length > 0 && (
                <>Services: {bank.services.join(', ')}</>
              )}
            </Popup>
          </Marker>
        ))}

        {singleBank && banks.length === 1 && banks[0]?.latitude && banks[0]?.longitude && (
          <FlyToCenter center={[banks[0].latitude, banks[0].longitude]} zoom={15} />
        )}
      </MapContainer>
    </div>
  );
}
