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

const SEVERITY_MARKER_COLORS = { low: '#22c55e', medium: '#f59e0b', high: '#f97316', critical: '#ef4444' };

const getIncidentIcon = (incident, role) => {
  if (role === 'government' && incident.is_verified && incident.severity) {
    return createEmojiIcon('⚠️', SEVERITY_MARKER_COLORS[incident.severity] || '#337ab7');
  }
  return icons.flood;
};

const STATUS_COLORS = { 'En Route': '#3b82f6', 'On Scene': '#22c55e', 'Need Assistance': '#ef4444', 'Complete': '#6b7280' };

// ─── Routing Functions ────────────────────────────────────────────────────────
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

const CACHE_KEY = 'drcs_offline_map_cache';

// ─── Main Component ───────────────────────────────────────────────────────────
const DashboardMapScreen = ({ onNavigate, role }) => {
  const calgaryCenter = [51.0447, -114.0719];

  const [isOffline, setIsOffline]                 = useState(false);
  const [cacheActive, setCacheActive]             = useState(false);
  const [evacuationPath, setEvacuationPath]       = useState(null);
  const [nearestZoneInfo, setNearestZoneInfo]     = useState(null);
  const [userPosition, setUserPosition]           = useState(null);
  const [teamPanelOpen, setTeamPanelOpen]         = useState(false);
  const [responderStatuses, setResponderStatuses] = useState([]);

  const [incidents, setIncidents] = useState([
    { id: 1, pos: [51.0447, -114.1219], type: 'flood', title: 'Flood Alert — West Calgary', is_verified: true,  severity: 'critical' },
    { id: 2, pos: [51.0200, -113.9800], type: 'flood', title: 'Flood Alert — SE Calgary',  is_verified: true,  severity: 'high'     },
  ]);
  const [safeZones, setSafeZones] = useState([
    { id: 101, pos: [51.0900, -114.1300], title: 'Safe Zone A — NW Rec Centre' },
    { id: 102, pos: [51.0050, -114.0300], title: 'Safe Zone B — South Community Hall' },
    { id: 103, pos: [51.0750, -113.9400], title: 'Safe Zone C — NE Arena' },
  ]);

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

  // Fetch live team statuses for government dashboard
  useEffect(() => {
    if (role !== 'government' || isOffline) return;
    fetch('http://127.0.0.1:8000/api/responders/status')
      .then(res => res.ok ? res.json() : [])
      .then(data => setResponderStatuses(data))
      .catch(err => console.error('[DRCS] Responder fetch error:', err));
  }, [role, isOffline]);

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
    <div style={{ minHeight: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '0 20px 20px', width: '100%' }}>
      {/* Mobile Device Container */}
      <div style={{ width: '100%', maxWidth: '400px', height: '800px', borderRadius: '40px', position: 'relative', overflow: 'hidden', border: '8px solid #333', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', backgroundColor: '#000' }}>

        {/* ── Map Layer ── */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
          <MapContainer center={calgaryCenter} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              errorTileUrl="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
            />
            {incidents.map(inc => (
              <Marker key={inc.id} position={inc.pos} icon={getIncidentIcon(inc, role)}>
                <Popup>
                  <strong>{inc.title}</strong>
                  {inc.is_verified && inc.severity && <><br /><span>Severity: {inc.severity}</span></>}
                  {inc.is_verified === false && <><br /><span style={{ color: '#f59e0b' }}>Unverified</span></>}
                </Popup>
              </Marker>
            ))}
            {safeZones.map(zone => (
              <Marker key={zone.id} position={zone.pos} icon={icons.safe}><Popup>{zone.title}</Popup></Marker>
            ))}
            {userPosition && (
              <Marker position={userPosition} icon={icons.user}><Popup>Your Location</Popup></Marker>
            )}
            {evacuationPath && (
              <Polyline positions={evacuationPath} color="#f5a623" weight={6} dashArray="15, 10" opacity={0.9} />
            )}
          </MapContainer>

          {isOffline && (
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 500, backgroundImage: `linear-gradient(rgba(0,191,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,191,255,0.06) 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
          )}
        </div>

        {/* ── Top UI Overlay ── */}
        <div style={{ position: 'absolute', top: 0, width: '100%', zIndex: 10, pointerEvents: 'none', paddingTop: '15px' }}>
          
          {/* Status Bar */}
          <div style={{ padding: '0 25px 15px', display: 'flex', justifyContent: 'space-between', color: '#fff', fontWeight: 'bold', fontSize: '14px' }}>
            <span>9:41</span>
            <div style={{ display: 'flex', gap: '5px' }}>
              <span>{isOffline ? '📵' : '📶'}</span>
              <span>🔋</span>
            </div>
          </div>

          <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '15px', pointerEvents: 'auto' }}>
            
            {/* Action Buttons (Side by Side) */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleCacheMap}
                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(50,50,50,0.85)', backdropFilter: 'blur(5px)', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
              >
                {cacheActive ? '✅ CACHED' : '📥 CACHE MAP'}
              </button>
              <button
                onClick={handleToggleOffline}
                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(50,50,50,0.85)', backdropFilter: 'blur(5px)', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
              >
                {isOffline ? '📵 OFFLINE' : '📶 ONLINE'}
              </button>
            </div>

            {/* Find Nearest Exit Button */}
            <button
              onClick={handleFindNearestExit}
              style={{ width: '100%', padding: '16px', borderRadius: '12px', border: 'none', backgroundColor: '#eeb030', color: '#fff', fontWeight: '800', fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(238, 176, 48, 0.3)' }}
            >
              FIND NEAREST EXIT
            </button>

            {/* Government: Generate Report */}
            {role === 'government' && (
              <button
                onClick={() => onNavigate('postreport')}
                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(44,74,122,0.88)', backdropFilter: 'blur(5px)', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
              >
                📋 GENERATE REPORT
              </button>
            )}

          </div>

          {/* Dynamic Warnings */}
          {isOffline && (
            <div style={{ backgroundColor: '#d9534f', color: '#fff', padding: '10px', textAlign: 'center', fontWeight: 'bold', fontSize: '12px', marginTop: '15px' }}>
              USING DEVICE CACHE
            </div>
          )}
          {nearestZoneInfo && (
            <div style={{ backgroundColor: 'rgba(245,166,35,0.95)', color: '#fff', padding: '10px', textAlign: 'center', fontWeight: 'bold', fontSize: '13px', marginTop: '15px' }}>
              🧭 Route to {nearestZoneInfo.title} — {nearestZoneInfo.distanceKm} km
            </div>
          )}
        </div>

        {/* ── Team Status Panel (Government only) ── */}
        {role === 'government' && teamPanelOpen && (
          <div style={{
            position: 'absolute', bottom: '80px', left: 0, right: 0, zIndex: 10,
            backgroundColor: 'rgba(15,25,45,0.96)', backdropFilter: 'blur(8px)',
            maxHeight: '220px', overflowY: 'auto', padding: '12px 16px',
            borderTop: '1px solid rgba(154,170,221,0.3)',
          }}>
            <p style={{ color: '#9aaadd', fontWeight: '800', fontSize: '12px', letterSpacing: '1px', margin: '0 0 10px 0' }}>
              TEAM STATUS
            </p>
            {responderStatuses.length === 0 ? (
              <p style={{ color: '#666', fontSize: '12px', textAlign: 'center', padding: '10px 0' }}>No responder updates yet.</p>
            ) : (
              [...responderStatuses].reverse().map(u => (
                <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div>
                    <span style={{ fontWeight: '700', fontSize: '12px', color: STATUS_COLORS[u.status] || '#fff' }}>{u.status}</span>
                    {u.notes && <span style={{ fontSize: '11px', color: '#888', marginLeft: '6px' }}>— {u.notes}</span>}
                  </div>
                  <span style={{ fontSize: '11px', color: '#666' }}>{u.responder_id}</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Bottom Navigation Bar ── */}
        <div style={{ 
          position: 'absolute', bottom: 0, width: '100%', zIndex: 10, 
          backgroundColor: '#cde0c5', // Sage green from your mockup
          height: '80px', 
          borderTopLeftRadius: '40px', borderTopRightRadius: '40px', 
          display: 'flex', justifyContent: 'space-around', alignItems: 'center',
          padding: '0 20px', boxSizing: 'border-box'
        }}>
          
          {/* Left Icon — verify for government, admin panel for system_admin, playbook for others */}
          <button
            onClick={() => onNavigate(
              role === 'government'   ? 'verify' :
              role === 'system_admin' ? 'admin'  :
              'playbook'
            )}
            style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', opacity: 0.7 }}
            title={
              role === 'government'   ? 'Incident Verification' :
              role === 'system_admin' ? 'Admin Panel' :
              'Safety Playbooks'
            }
          >
            {role === 'government' ? '🔍' : role === 'system_admin' ? '⚙️' : '📖'}
          </button>

          {/* Center Floating Action Button (Dynamic based on Role) */}
          <div style={{ position: 'relative', width: '70px', height: '70px' }}>
            <button
              onClick={() => onNavigate(
                role === 'government'     ? 'official' :
                role === 'first_responder' ? 'firstresponder' :
                'report'
              )}
              style={{
                position: 'absolute', top: '-35px', left: '0',
                width: '70px', height: '70px', borderRadius: '50%',
                backgroundColor:
                  role === 'government'      ? '#9aaadd' :
                  role === 'first_responder' ? '#c8851a' :
                  '#cd5c5c',
                border: '6px solid #cde0c5',
                color: '#fff',
                fontSize: role === 'citizen' ? '36px' : '28px',
                fontWeight: '300',
                cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center',
                boxSizing: 'border-box'
              }}
              title={
                role === 'government'      ? 'Issue Dispatch' :
                role === 'first_responder' ? 'Update Status' :
                'Report Disaster'
              }
            >
              {role === 'government' ? '📢' : role === 'first_responder' ? '🚒' : '+'}
            </button>
          </div>

          {/* Right Icon — team status for government, bluetooth chat for others */}
          <button
            onClick={() => role === 'government'
              ? setTeamPanelOpen(prev => !prev)
              : role === 'system_admin'
              ? alert('Logged in as: System Admin')
              : onNavigate('bluetooth')
            }
            style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', opacity: teamPanelOpen ? 1 : 0.5 }}
            title={role === 'government' ? 'Team Status' : role === 'system_admin' ? 'Profile' : 'Mesh Chat'}
          >
            {role === 'government' ? '👥' : role === 'system_admin' ? '👤' : '💬'}
          </button>
          
        </div>
      </div>
    </div>
  );
};

export default DashboardMapScreen;