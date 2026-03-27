import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom Emoji Map Markers to match your app's aesthetic
const createEmojiIcon = (emoji, bgColor) => L.divIcon({
  html: `<div style="background-color: ${bgColor}; width: 36px; height: 36px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); border: 2px solid white;">${emoji}</div>`,
  className: 'custom-emoji-icon',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const icons = {
  fire: createEmojiIcon('🔥', '#d9534f'),
  flood: createEmojiIcon('🌊', '#337ab7'),
  earthquake: createEmojiIcon('⚠️', '#f0ad4e')
};

const DashboardMapScreen = () => {
  // Calgary coordinates
  const calgaryCenter = [51.0447, -114.0719]; 
  
  // Incident coordinates based on your mockup distances
  const incidents = [
    { id: 1, pos: [50.9300, -114.0500], type: 'fire', title: 'Fish Creek Fire', popup: 'Active wildfire in Fish Creek Provincial Park.' },
    { id: 2, pos: [52.2690, -113.8116], type: 'flood', title: 'Red Deer Flood', popup: 'LVL 4 Flood - 139km away.' },
    { id: 3, pos: [53.5461, -113.4938], type: 'earthquake', title: 'Edmonton Quake', popup: 'LVL 5 Earthquake - 580km away.' }
  ];

  return (
    <div style={{ backgroundColor: '#1a1a1a', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
      
      {/* Mobile App Container */}
      <div style={{ 
        width: '100%', 
        maxWidth: '400px', 
        height: '800px', 
        borderRadius: '35px', 
        position: 'relative',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        overflow: 'hidden',
        backgroundColor: '#2b2b2b'
      }}>
        
        {/* The Interactive Map Layer */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }}>
          <MapContainer center={calgaryCenter} zoom={10} style={{ height: '100%', width: '100%' }} zoomControl={false}>
            {/* Dark mode map tiles */}
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {incidents.map(inc => (
              <Marker key={inc.id} position={inc.pos} icon={icons[inc.type]}>
                <Popup><strong>{inc.title}</strong><br/>{inc.popup}</Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* UI Overlay Layer (Pointer events 'none' lets you click through to the map) */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2, display: 'flex', flexDirection: 'column', pointerEvents: 'none' }}>
          
          {/* Top Status Bar */}
          <div style={{ padding: '15px 25px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
            <span>9:41</span>
            <span style={{ letterSpacing: '2px' }}>📶 🔋</span>
          </div>

          {/* Incident Cards (Pointer events 'auto' makes them clickable again) */}
          <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '15px', pointerEvents: 'auto' }}>
            {/* Flood Card */}
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '20px', padding: '18px', boxShadow: '0 8px 20px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#d9534f', border: '1.5px solid #d9534f', padding: '4px 8px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '14px' }}>⊘</span> UNVERIFIED
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ fontSize: '36px', backgroundColor: '#e6f0fa', padding: '10px', borderRadius: '15px' }}>🌊</div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#2c3e50' }}>Flood</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#7f8c8d', fontWeight: '500' }}>139 km away <br/><span style={{ color: '#34495e', fontWeight: '700' }}>LVL 4</span></p>
                </div>
                <div style={{ textAlign: 'center', borderLeft: '1px solid #eee', paddingLeft: '15px' }}>
                  <span style={{ color: '#d9534f', fontWeight: '900', fontSize: '22px' }}>400+</span>
                  <p style={{ margin: 0, fontSize: '11px', color: '#7f8c8d', fontWeight: '600', textTransform: 'uppercase' }}>Affected</p>
                </div>
              </div>
            </div>

            {/* Earthquake Card */}
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '20px', padding: '18px', boxShadow: '0 8px 20px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ fontSize: '36px', backgroundColor: '#fff3e0', padding: '10px', borderRadius: '15px' }}>⚠️</div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#2c3e50' }}>Earthquake</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#7f8c8d', fontWeight: '500' }}>580 km away <br/><span style={{ color: '#34495e', fontWeight: '700' }}>LVL 5</span></p>
                </div>
                <div style={{ textAlign: 'center', borderLeft: '1px solid #eee', paddingLeft: '15px' }}>
                  <span style={{ color: '#d9534f', fontWeight: '900', fontSize: '22px' }}>250+</span>
                  <p style={{ margin: 0, fontSize: '11px', color: '#7f8c8d', fontWeight: '600', textTransform: 'uppercase' }}>Affected</p>
                </div>
              </div>
            </div>
          </div>

          <div style={{ flex: 1 }} /> {/* Spacer to push nav to bottom */}

          {/* Bottom Navigation Bar */}
          <div style={{ 
            backgroundColor: '#cbdab7', 
            padding: '25px 30px', 
            borderTopLeftRadius: '35px', 
            borderTopRightRadius: '35px',
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            position: 'relative',
            boxShadow: '0 -10px 20px rgba(0,0,0,0.15)',
            pointerEvents: 'auto'
          }}>
            <span style={{ fontSize: '26px', color: '#4a5d4e', cursor: 'pointer' }}>◎</span>
            <span style={{ fontSize: '26px', color: '#4a5d4e', cursor: 'pointer' }}>ⓘ</span>
            
            <button style={{ 
              position: 'absolute', top: '-35px', left: '50%', transform: 'translateX(-50%)',
              width: '75px', height: '75px', borderRadius: '37.5px', backgroundColor: '#d9534f', 
              border: '4px solid #cbdab7', color: '#fff', fontSize: '40px', display: 'flex', 
              justifyContent: 'center', alignItems: 'center', boxShadow: '0 8px 20px rgba(217,83,79,0.5)', cursor: 'pointer', paddingBottom: '5px' 
            }}>
              +
            </button>

            <span style={{ fontSize: '26px', color: '#4a5d4e', cursor: 'pointer', marginLeft: '40px' }}>△</span>
            <span style={{ fontSize: '26px', color: '#4a5d4e', cursor: 'pointer' }}>👤</span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DashboardMapScreen;