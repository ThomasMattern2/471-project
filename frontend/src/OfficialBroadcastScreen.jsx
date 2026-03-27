import React, { useState } from 'react';

const OfficialBroadcastScreen = () => {
  const [broadcastData, setBroadcastData] = useState({
    message: '',
    radius_km: 5, // Default 5km radius
    center_coordinates: [-114.0719, 51.0447] // Defaulting to Calgary coords for demo
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Sending targeted broadcast:', broadcastData);
    
    try {
      const response = await fetch('http://127.0.0.1:8000/api/broadcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(broadcastData)
      });
      if (response.ok) {
        alert("Broadcast dispatched successfully to the targeted zone.");
        setBroadcastData({ ...broadcastData, message: '' }); // Clear message on success
      }
    } catch (error) {
      console.error("Error sending broadcast:", error);
    }
  };

  return (
    <div style={{ backgroundColor: '#1a1a1a', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
      
      <div style={{ 
        backgroundColor: '#b7c8da', // Official Blue theme
        width: '100%', 
        maxWidth: '400px', 
        minHeight: '800px',
        borderRadius: '35px', 
        padding: '30px 25px', 
        color: '#1a1a1a', 
        fontFamily: 'system-ui, -apple-system, sans-serif',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column'
      }}>
        
        <div style={{ backgroundColor: '#92a8d1', padding: '10px', borderRadius: '10px', marginBottom: '25px', textAlign: 'center' }}>
          <span style={{ fontWeight: 'bold', fontSize: '14px', letterSpacing: '1px', color: '#fff' }}>OFFICIAL DISPATCH</span>
        </div>

        <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '25px', color: '#1a1a1a' }}>
          Targeted Alert
        </h1>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '25px', flex: 1 }}>
          
          {/* Message Input */}
          <div>
            <h2 style={{ fontSize: '20px', margin: '0 0 10px 0', fontWeight: 'bold' }}>Alert Message:</h2>
            <textarea 
              required
              value={broadcastData.message}
              style={{ 
                width: '100%', height: '150px', borderRadius: '12px', padding: '15px', 
                fontSize: '16px', border: '2px solid #fff', backgroundColor: '#e2e9f0', 
                color: '#1a1a1a', boxSizing: 'border-box', resize: 'none'
              }}
              placeholder="Enter urgent instructions here..."
              onChange={(e) => setBroadcastData({...broadcastData, message: e.target.value})}
            />
          </div>

          {/* Geo-fencing Radius */}
          <div style={{ backgroundColor: '#a3b8cc', padding: '20px', borderRadius: '16px' }}>
            <h2 style={{ fontSize: '20px', margin: '0 0 12px 0', fontWeight: 'bold' }}>Target Radius (km):</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <input 
                type="range" 
                min="1" max="50" 
                value={broadcastData.radius_km}
                onChange={(e) => setBroadcastData({...broadcastData, radius_km: Number(e.target.value)})}
                style={{ flex: 1, accentColor: '#d9534f' }}
              />
              <span style={{ fontSize: '24px', fontWeight: 'bold', width: '50px', textAlign: 'right' }}>
                {broadcastData.radius_km}
              </span>
            </div>
            <p style={{ fontSize: '13px', marginTop: '10px', opacity: 0.8 }}>
              This will only alert users inside this geo-fence relative to the incident epicenter.
            </p>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '15px', marginTop: 'auto', paddingTop: '20px' }}>
            <button type="submit" style={{ flex: 1, padding: '16px', fontSize: '18px', borderRadius: '30px', border: 'none', backgroundColor: '#d9534f', color: '#fff', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 6px rgba(217,83,79,0.3)' }}>
              BROADCAST
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default OfficialBroadcastScreen;