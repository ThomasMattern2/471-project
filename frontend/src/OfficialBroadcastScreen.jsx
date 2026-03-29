import React, { useState } from 'react';

const OfficialBroadcastScreen = ({ onNavigate }) => {
  const [broadcastData, setBroadcastData] = useState({
    message: '',
    radius_km: 28, // Updated default to match your mockup
    center_coordinates: [-114.0719, 51.0447] // Defaulting to Calgary coords for demo
  });
  
  const [isSubmitting, setIsSubmitting]             = useState(false);
  const [showNotificationPreview, setShowPreview]   = useState(false);
  const [sentMessage, setSentMessage]               = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/broadcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(broadcastData)
      });
      if (response.ok) {
        setSentMessage(broadcastData.message);
        setBroadcastData({ ...broadcastData, message: '' });
        setShowPreview(true); // Show simulated device notification
      }
    } catch (error) {
      console.error("Error sending broadcast:", error);
      alert("Error dispatching broadcast. Ensure the backend is running.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#1a1a1a', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', position: 'relative' }}>

      {/* ── Simulated Device Notification Preview (S4G3A-20) ── */}
      {showNotificationPreview && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.88)', zIndex: 100, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '30px' }}>
          <p style={{ color: '#888', fontSize: '13px', marginBottom: '16px', textAlign: 'center', letterSpacing: '0.5px' }}>
            📱 SIMULATED DEVICE NOTIFICATION
          </p>

          {/* Mock lock-screen notification card */}
          <div style={{ backgroundColor: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(24px)', borderRadius: '18px', padding: '18px', width: '100%', maxWidth: '340px', border: '1px solid rgba(255,255,255,0.18)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
              <span style={{ fontSize: '26px' }}>🚨</span>
              <div>
                <p style={{ color: '#fff', fontWeight: '800', fontSize: '14px', margin: 0 }}>Emergency Alert</p>
                <p style={{ color: '#aaa', fontSize: '11px', margin: '2px 0 0 0' }}>now · DRCS · Critical Priority</p>
              </div>
            </div>
            <p style={{ color: '#f0f0f0', fontSize: '14px', lineHeight: '1.5', margin: 0 }}>{sentMessage}</p>
          </div>

          <p style={{ color: '#666', fontSize: '11px', marginTop: '14px', textAlign: 'center', maxWidth: '280px' }}>
            In production, this alert overrides Do Not Disturb via OS-level Critical Alert priority.
          </p>

          <button
            onClick={() => { setShowPreview(false); onNavigate('dashboard'); }}
            style={{ marginTop: '24px', padding: '14px 48px', borderRadius: '30px', border: 'none', backgroundColor: '#fff', color: '#1a1a1a', fontWeight: '800', fontSize: '15px', cursor: 'pointer' }}
          >
            Done
          </button>
        </div>
      )}
      
      <div style={{ 
        backgroundColor: '#c4d0df', // Cool slate blue matching your mockup
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
        
        {/* Top Banner */}
        <div style={{ backgroundColor: '#9aaadd', padding: '12px', borderRadius: '10px', marginBottom: '30px', textAlign: 'center' }}>
          <span style={{ fontWeight: '800', fontSize: '14px', letterSpacing: '1px', color: '#fff' }}>OFFICIAL DISPATCH</span>
        </div>

        <h1 style={{ fontSize: '26px', fontWeight: '900', marginBottom: '25px', color: '#1a1a1a', textAlign: 'center' }}>
          Targeted Alert
        </h1>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '25px', flex: 1 }}>
          
          {/* Message Input */}
          <div>
            <h2 style={{ fontSize: '18px', margin: '0 0 10px 0', fontWeight: '800', color: '#fff', textAlign: 'center', textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>Alert Message:</h2>
            <textarea 
              required
              value={broadcastData.message}
              style={{ 
                width: '100%', height: '180px', borderRadius: '12px', padding: '15px', 
                fontSize: '15px', border: 'none', backgroundColor: '#eef1f6', 
                color: '#1a1a1a', boxSizing: 'border-box', resize: 'none',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
              }}
              placeholder="Enter urgent instructions here..."
              onChange={(e) => setBroadcastData({...broadcastData, message: e.target.value})}
            />
          </div>

          {/* Geo-fencing Radius */}
          <div style={{ backgroundColor: '#a8b8cc', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '18px', margin: '0 0 12px 0', fontWeight: '800', color: '#fff', textAlign: 'center', textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>Target Radius (km):</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <input 
                type="range" 
                min="1" max="50" 
                value={broadcastData.radius_km}
                onChange={(e) => setBroadcastData({...broadcastData, radius_km: Number(e.target.value)})}
                style={{ flex: 1, accentColor: '#d9534f' }}
              />
              <span style={{ fontSize: '24px', fontWeight: '900', width: '40px', textAlign: 'right', color: '#1a1a1a' }}>
                {broadcastData.radius_km}
              </span>
            </div>
            <p style={{ fontSize: '12px', marginTop: '12px', opacity: 0.8, textAlign: 'center', color: '#1a1a1a', fontWeight: '500' }}>
              This will only alert users inside this geo-fence relative to the incident epicenter.
            </p>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '15px', marginTop: 'auto', paddingTop: '20px' }}>
            <button 
              type="button" 
              onClick={() => onNavigate('dashboard')}
              style={{ flex: 1, padding: '16px', fontSize: '16px', borderRadius: '30px', border: 'none', backgroundColor: '#fff', color: '#1a1a1a', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              style={{ flex: 1, padding: '16px', fontSize: '16px', borderRadius: '30px', border: 'none', backgroundColor: '#d9534f', color: '#fff', fontWeight: '800', cursor: isSubmitting ? 'wait' : 'pointer', boxShadow: '0 4px 6px rgba(217,83,79,0.3)' }}
            >
              {isSubmitting ? 'SENDING...' : 'BROADCAST'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default OfficialBroadcastScreen;