import React from 'react';

const DashboardMapScreen = () => {
  return (
    <div style={{ backgroundColor: '#1a1a1a', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
      
      {/* Mobile App Container - Upgraded Faux Map Background */}
      <div style={{ 
        backgroundColor: '#2b2b2b', 
        // Simulating a dark mode street map with CSS gradients
        backgroundImage: `
          linear-gradient(45deg, #333 25%, transparent 25%, transparent 75%, #333 75%, #333), 
          linear-gradient(45deg, #333 25%, transparent 25%, transparent 75%, #333 75%, #333)
        `,
        backgroundSize: '40px 40px',
        backgroundPosition: '0 0, 20px 20px',
        width: '100%', 
        maxWidth: '400px', 
        height: '800px', 
        borderRadius: '35px', 
        position: 'relative',
        color: '#1a1a1a', 
        fontFamily: 'system-ui, -apple-system, sans-serif',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        
        {/* Top Status Bar */}
        <div style={{ padding: '15px 25px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.8)', zIndex: 2 }}>
          <span>9:41</span>
          <span style={{ letterSpacing: '2px' }}>📶 🔋</span>
        </div>

        {/* Incident Cards Container */}
        <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '15px', flex: 1, overflowY: 'auto', zIndex: 2 }}>
          
          {/* Flood Card (Unverified) */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '10px' }}>
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

        {/* Floating Map Controls */}
        <div style={{ position: 'absolute', right: '20px', bottom: '120px', display: 'flex', flexDirection: 'column', gap: '10px', zIndex: 2 }}>
          <button style={{ width: '45px', height: '45px', borderRadius: '22.5px', backgroundColor: 'rgba(255,255,255,0.9)', border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.2)', fontSize: '20px', cursor: 'pointer' }}>🎯</button>
          <button style={{ width: '45px', height: '45px', borderRadius: '22.5px', backgroundColor: 'rgba(255,255,255,0.9)', border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.2)', fontSize: '20px', cursor: 'pointer' }}>🗺️</button>
        </div>

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
          zIndex: 10
        }}>
          <span style={{ fontSize: '26px', color: '#4a5d4e', cursor: 'pointer' }}>◎</span>
          <span style={{ fontSize: '26px', color: '#4a5d4e', cursor: 'pointer' }}>ⓘ</span>
          
          {/* Big Red Floating Action Button */}
          <button style={{ 
            position: 'absolute', 
            top: '-35px', 
            left: '50%', 
            transform: 'translateX(-50%)',
            width: '75px', 
            height: '75px', 
            borderRadius: '37.5px', 
            backgroundColor: '#d9534f', 
            border: '4px solid #cbdab7', // Creates the "cutout" look
            color: '#fff', 
            fontSize: '40px', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            boxShadow: '0 8px 20px rgba(217,83,79,0.5)',
            cursor: 'pointer',
            paddingBottom: '5px' // Vertically center the '+'
          }}>
            +
          </button>

          <span style={{ fontSize: '26px', color: '#4a5d4e', cursor: 'pointer', marginLeft: '40px' }}>△</span>
          <span style={{ fontSize: '26px', color: '#4a5d4e', cursor: 'pointer' }}>👤</span>
        </div>

      </div>
    </div>
  );
};

export default DashboardMapScreen;