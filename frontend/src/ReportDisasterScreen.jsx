import React, { useState } from 'react';

const ReportDisasterScreen = () => {
  const [formData, setFormData] = useState({
    type: '',
    location: '',
    hasCasualties: false,
    otherInfo: ''
  });

  const handleAutoSelect = () => {
    setFormData({ ...formData, location: '12th ave, 13th street' }); // Example from your mockups
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Submitting report:', formData);
    // Future integration: send to FastAPI backend
  };

  return (
    // Outer wrapper to center the "mobile app" on a desktop screen
    <div style={{ backgroundColor: '#1a1a1a', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
      
      {/* Mobile App Container */}
      <div style={{ 
        backgroundColor: '#cbdab7', // Matching your Figma sage green
        width: '100%', 
        maxWidth: '400px', // Constrain to mobile width
        minHeight: '800px',
        borderRadius: '35px', // Phone-like rounded corners
        padding: '30px 25px', 
        color: '#1a1a1a', // Force dark text
        fontFamily: 'system-ui, -apple-system, sans-serif',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        boxSizing: 'border-box'
      }}>
        
        <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '25px', color: '#1a1a1a' }}>
          Report a disaster
        </h1>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          
          {/* Disaster Type */}
          <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {['Fire', 'Flood', 'Earthquake', 'Other'].map(type => (
                <label key={type} style={{ fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#1a1a1a' }}>
                  <input 
                    type="radio" 
                    name="disasterType" 
                    value={type}
                    style={{ width: '18px', height: '18px', accentColor: '#333' }}
                    onChange={(e) => setFormData({...formData, type: e.target.value})} 
                  />
                  {type}
                </label>
              ))}
            </div>
          </fieldset>

          {/* Location */}
          <div style={{ backgroundColor: '#a3b899', padding: '20px', borderRadius: '16px' }}>
            <h2 style={{ fontSize: '20px', margin: '0 0 12px 0', fontWeight: 'bold', color: '#1a1a1a' }}>Location:</h2>
            <button 
              type="button" 
              onClick={handleAutoSelect}
              style={{ 
                width: '100%', padding: '12px', fontSize: '15px', borderRadius: '10px', 
                border: '1px solid rgba(0,0,0,0.1)', cursor: 'pointer', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', 
                backgroundColor: '#fff', color: '#666', fontWeight: '500'
              }}
            >
              📍 Auto select from map
            </button>
            {formData.location && <p style={{ marginTop: '12px', fontWeight: 'bold', color: '#1a1a1a', textAlign: 'center' }}>{formData.location}</p>}
          </div>

          {/* Photos */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <h2 style={{ fontSize: '20px', margin: 0, fontWeight: 'bold', color: '#1a1a1a' }}>Photos:</h2>
            <button type="button" style={{ width: '50px', height: '50px', fontSize: '20px', borderRadius: '10px', border: '2px dashed #666', backgroundColor: 'rgba(255,255,255,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🖼️</button>
            <button type="button" style={{ width: '50px', height: '50px', fontSize: '20px', borderRadius: '10px', border: '2px dashed #666', backgroundColor: 'rgba(255,255,255,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📸</button>
          </div>

          {/* Casualties */}
          <label style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontWeight: 'bold', color: '#1a1a1a' }}>
            Casualties?
            <input 
              type="checkbox" 
              style={{ width: '22px', height: '22px', accentColor: '#603ba8' }}
              onChange={(e) => setFormData({...formData, hasCasualties: e.target.checked})}
            />
          </label>

          {/* Other Info */}
          <div>
            <h2 style={{ fontSize: '20px', margin: '0 0 10px 0', fontWeight: 'bold', color: '#1a1a1a' }}>Other info?</h2>
            <textarea 
              style={{ 
                width: '100%', height: '100px', borderRadius: '12px', padding: '15px', 
                fontSize: '15px', border: 'none', backgroundColor: '#e2e9d7', 
                color: '#1a1a1a', boxSizing: 'border-box', resize: 'none'
              }}
              placeholder="Tap to type..."
              onChange={(e) => setFormData({...formData, otherInfo: e.target.value})}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '15px', marginTop: 'auto', paddingTop: '20px' }}>
            <button type="button" style={{ flex: 1, padding: '16px', fontSize: '16px', borderRadius: '30px', border: 'none', backgroundColor: '#fff', color: '#333', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>Cancel</button>
            <button type="submit" style={{ flex: 1, padding: '16px', fontSize: '16px', borderRadius: '30px', border: 'none', backgroundColor: '#f5a623', color: '#fff', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 6px rgba(245,166,35,0.3)' }}>SUBMIT</button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default ReportDisasterScreen;