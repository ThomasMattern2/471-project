import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for Leaflet marker icons in Vite/React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// ─── Tactical Marker Styling ──────────────────────────────────────────────────
const createEmojiIcon = (emoji, color) => L.divIcon({
  html: `
    <div style="position: relative;">
      <div style="background-color: ${color}; width: 44px; height: 44px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 22px; border: 3px solid white; box-shadow: 0 4px 15px rgba(0,0,0,0.4);">${emoji}</div>
      ${emoji === '✅' ? '' : `<div style="position: absolute; top: 0; left: 0; width: 44px; height: 44px; border-radius: 50%; background-color: ${color}; opacity: 0.3; animation: pulse 2s infinite;"></div>`}
    </div>
    <style>@keyframes pulse { 0% { transform: scale(1); opacity: 0.4; } 70% { transform: scale(1.6); opacity: 0; } 100% { transform: scale(1); opacity: 0; } }</style>
  `,
  className: 'custom-marker',
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

const icons = {
  flood: createEmojiIcon('🌊', '#337ab7'),
  safe:  createEmojiIcon('✅', '#5cb85c'),
  user:  createEmojiIcon('📍', '#f5a623'),
};

// ─── S4G3A-26: Haversine Distance ────────────────────────────────────────────
const EARTH_RADIUS_KM = 6371;
const toRad = (deg) => (deg * Math.PI) / 180;

function haversineDistance([lat1, lon1], [lat2, lon2]) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findNearestZone(userPos, safeZones) {
  if (!safeZones || safeZones.length === 0) return null;
  let nearest = null;
  let minDist = Infinity;
  for (const zone of safeZones) {
    const dist = haversineDistance(userPos, zone.pos);
    if (dist < minDist) { minDist = dist; nearest = zone; }
  }
  return { zone: nearest, distanceKm: minDist };
}

function buildEvacuationRoute(origin, destination) {
  const steps = 6;
  const waypoints = [origin];
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const jitter = (i === 2 || i === 3) ? 0.0012 * (i % 2 === 0 ? 1 : -1) : 0;
    waypoints.push([
      origin[0] + t * (destination[0] - origin[0]) + jitter,
      origin[1] + t * (destination[1] - origin[1]),
    ]);
  }
  waypoints.push(destination);
  return waypoints;
}

// ─── Cache Key ────────────────────────────────────────────────────────────────
const CACHE_KEY = 'drcs_offline_map_cache';

// ─── Main Component ───────────────────────────────────────────────────────────
const DashboardMapScreen = () => {
  const calgaryCenter = [51.0447, -114.0719];

  const [isOffline, setIsOffline]             = useState(false);
  const [cacheActive, setCacheActive]         = useState(false);
  const [evacuationPath, setEvacuationPath]   = useState(null);
  const [nearestZoneInfo, setNearestZoneInfo] = useState(null);
  const [userPosition, setUserPosition]       = useState(null);

  // Safe zones spread across Calgary — NW, S, NE — so they don't overlap at zoom 12
  const [incidents, setIncidents] = useState([
    { id: 1, pos: [51.0447, -114.1219], type: 'flood', title: 'Flood Alert — West Calgary' },
    { id: 2, pos: [51.0200, -113.9800], type: 'flood', title: 'Flood Alert — SE Calgary' },
  ]);
  const [safeZones, setSafeZones] = useState([
    { id: 101, pos: [51.0900, -114.1300], title: 'Safe Zone A — NW Rec Centre' },
    { id: 102, pos: [51.0050, -114.0300], title: 'Safe Zone B — South Community Hall' },
    { id: 103, pos: [51.0750, -113.9400], title: 'Safe Zone C — NE Arena' },
  ]);

  // Real browser online/offline events
  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline  = () => setIsOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online',  goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online',  goOnline);
    };
  }, []);

  // S4G3A-25: Restore from cache when going offline
  useEffect(() => {
    if (isOffline) {
      try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (raw) {
          const { incidents: ci, safeZones: cz } = JSON.parse(raw);
          if (ci) setIncidents(ci);
          if (cz) setSafeZones(cz);
        }
      } catch (e) {
        console.error('[DRCS] Cache read error:', e);
      }
    }
  }, [isOffline]);

  // S4G3A-25: Write cache
  const handleCacheMap = useCallback(() => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        incidents, safeZones, cachedAt: new Date().toISOString(),
      }));
      setCacheActive(true);
      setTimeout(() => setCacheActive(false), 2000);
    } catch (e) {
      console.error('[DRCS] Cache write error:', e);
    }
  }, [incidents, safeZones]);

  // S4G3A-26: Real Haversine routing
  const handleFindNearestExit = useCallback(() => {
    const computeRoute = (origin) => {
      const result = findNearestZone(origin, safeZones);
      if (!result) return;
      setUserPosition(origin);
      setEvacuationPath(buildEvacuationRoute(origin, result.zone.pos));
      setNearestZoneInfo({
        title: result.zone.title.split('—')[0].trim(),
        distanceKm: result.distanceKm.toFixed(2),
      });
    };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => computeRoute([coords.latitude, coords.longitude]),
        ()           => computeRoute(calgaryCenter),
        { timeout: 4000 }
      );
    } else {
      computeRoute(calgaryCenter);
    }
  }, [safeZones]);

  const handleToggleOffline = () => {
    setEvacuationPath(null);
    setNearestZoneInfo(null);
    setUserPosition(null);
    setIsOffline(prev => !prev);
  };

  return (
    <div style={{ backgroundColor: '#111', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '400px', height: '800px', borderRadius: '40px', position: 'relative', overflow: 'hidden', border: '10px solid #222' }}>

        {/* ── Map Layer ─────────────────────────────────────────────────────────
            KEY FIX: TileLayer is ALWAYS present regardless of isOffline.
            - Online:  tiles load from CDN normally.
            - Offline: tiles the browser already cached still render fine.
                       Uncached tiles show as grey squares — far better than a void.
            The blueprint grid is a CSS overlay ON TOP of the tile layer in offline
            mode, not a replacement for it.
        ──────────────────────────────────────────────────────────────────────── */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
          <MapContainer
            center={calgaryCenter}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              // Transparent 1x1 GIF for tiles that can't load offline (no ugly broken-image)
              errorTileUrl="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
            />

            {incidents.map(inc => (
              <Marker key={inc.id} position={inc.pos} icon={icons.flood}>
                <Popup>{inc.title}</Popup>
              </Marker>
            ))}

            {safeZones.map(zone => (
              <Marker key={zone.id} position={zone.pos} icon={icons.safe}>
                <Popup>{zone.title}</Popup>
              </Marker>
            ))}

            {userPosition && (
              <Marker position={userPosition} icon={icons.user}>
                <Popup>Your Location</Popup>
              </Marker>
            )}

            {evacuationPath && (
              <Polyline
                positions={evacuationPath}
                color="#f5a623"
                weight={6}
                dashArray="15, 10"
                opacity={0.9}
              />
            )}
          </MapContainer>

          {/* Blueprint grid overlaid ON the map in offline mode (NFR-02) */}
          {isOffline && (
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 500,
              backgroundImage: `
                linear-gradient(rgba(0,191,255,0.06) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,191,255,0.06) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
            }} />
          )}
        </div>

        {/* ── UI Overlay ── */}
        <div style={{ position: 'absolute', top: 0, width: '100%', zIndex: 10, pointerEvents: 'none' }}>
          <div style={{ padding: '10px 25px', display: 'flex', justifyContent: 'space-between', color: '#fff', fontWeight: 'bold' }}>
            <span>9:41</span>
            <div>{isOffline ? '📵' : '📶'} 🔋</div>
          </div>

          {isOffline && (
            <div style={{ backgroundColor: '#d9534f', color: '#fff', padding: '14px', textAlign: 'center', fontWeight: '900', pointerEvents: 'auto' }}>
              ⚠️ NO SIGNAL — USING DEVICE CACHE
            </div>
          )}

          {nearestZoneInfo && (
            <div style={{ backgroundColor: 'rgba(245,166,35,0.95)', color: '#fff', padding: '10px 20px', textAlign: 'center', fontWeight: '800', pointerEvents: 'auto' }}>
              🧭 Route to <strong>{nearestZoneInfo.title}</strong> — {nearestZoneInfo.distanceKm} km
            </div>
          )}

          <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: '12px', pointerEvents: 'auto' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleCacheMap}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: cacheActive ? '#5cb85c' : '#444', color: '#fff', fontWeight: '900', cursor: 'pointer' }}
              >
                {cacheActive ? '✓ CACHED' : '📥 CACHE MAP'}
              </button>
              <button
                onClick={handleToggleOffline}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: isOffline ? '#d9534f' : '#333', color: '#fff', fontWeight: '900', cursor: 'pointer' }}
              >
                {isOffline ? '📡 OFFLINE' : '📶 ONLINE'}
              </button>
            </div>
            <button
              onClick={handleFindNearestExit}
              style={{ width: '100%', padding: '18px', borderRadius: '16px', border: 'none', backgroundColor: '#f5a623', color: '#fff', fontWeight: '900', fontSize: '16px', cursor: 'pointer' }}
            >
              FIND NEAREST EXIT
            </button>
          </div>
        </div>

        {/* ── Navigation Bar ── */}
        <div style={{ position: 'absolute', bottom: 0, width: '100%', zIndex: 10, backgroundColor: '#cbdab7', padding: '30px', borderTopLeftRadius: '40px', borderTopRightRadius: '40px', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '30px', opacity: 0.6 }}>◎</span>
          <button style={{ position: 'absolute', top: '-45px', left: '50%', transform: 'translateX(-50%)', width: '90px', height: '90px', borderRadius: '50%', backgroundColor: '#d9534f', border: '8px solid #cbdab7', color: '#fff', fontSize: '50px', cursor: 'pointer' }}>
            +
          </button>
          <span style={{ fontSize: '30px', opacity: 0.6 }}>👤</span>
        </div>
      </div>
    </div>
  );
};

export default DashboardMapScreen;