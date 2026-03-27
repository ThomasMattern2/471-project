import React, { useState, useRef } from 'react';
import { getMapCoordinates } from './geolocation';

const ReportDisasterScreen = ({ onNavigate }) => {
  const [formData, setFormData] = useState({
    type: 'Flood', // Default selection
    coordinates: null,
    hasCasualties: false,
    otherInfo: ''
  });

  const [locationText, setLocationText] = useState('📍 Auto select from map');
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Refs for the hidden file inputs
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleAutoSelect = async () => {
    setIsLocating(true);
    setLocationText('Locating...');
    try {
      const coords = await getMapCoordinates();
      // Backend expects [longitude, latitude]
      setFormData({ ...formData, coordinates: [coords.lng, coords.lat] });
      setLocationText(`📍 ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
    } catch (error) {
      console.error(error);
      setLocationText('❌ Location failed. Try again.');
    } finally {
      setIsLocating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.coordinates) {
      alert("Please select a location first.");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      disasterType: formData.type,
      coordinates: formData.coordinates, // [lng, lat]
      photos: [], // Optional field in backend
      hasCasualties: formData.hasCasualties,
      otherInfo: formData.otherInfo
    };

    try {
      const response = await fetch('http://127.0.0.1:8000/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert("Disaster report submitted successfully.");
        onNavigate('dashboard');
      } else {
        alert("Failed to submit report. Check backend logs.");
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      alert("Error connecting to the server. Make sure the backend is running.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#1a1a1a', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
      
      {/* Mobile App Container */}
      <div style={{ 
        backgroundColor: '#cde0c5', // Matched to mockup
        width: '100%', 
        maxWidth: '400px', 
        minHeight: '800px',
        borderRadius: '35px', 
        padding: '40px 30px', 
        color: '#1a1a1a', 
        fontFamily: 'system-ui, -apple-system, sans-serif',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column'
      }}>
        
        <h1 style={{ fontSize: '26px', fontWeight: '900', marginBottom: '30px', color: '#1a1a1a', textAlign: 'center' }}>
          Report a disaster
        </h1>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '25px', flex: 1 }}>
          
          {/* Disaster Type */}
          <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {['Fire', 'Flood', 'Earthquake', 'Other'].map(type => (
                <label key={type} style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#1a1a1a', fontWeight: '500' }}>
                  <input 
                    type="radio" 
                    name="disasterType" 
                    value={type}
                    checked={formData.type === type}
                    style={{ width: '16px', height: '16px', accentColor: '#333' }}
                    onChange={(e) => setFormData({...formData, type: e.target.value})} 
                  />
                  {type}
                </label>
              ))}
            </div>
          </fieldset>

          {/* Location */}
          <div style={{ backgroundColor: '#a3b899', padding: '20px', borderRadius: '16px', marginTop: '10px' }}>
            <h2 style={{ fontSize: '18px', margin: '0 0 12px 0', fontWeight: '800', color: '#1a1a1a', textAlign: 'center' }}>Location:</h2>
            <button 
              type="button" 
              onClick={handleAutoSelect}
              disabled={isLocating}
              style={{ 
                width: '100%', padding: '14px', fontSize: '14px', borderRadius: '12px', 
                border: 'none', cursor: isLocating ? 'wait' : 'pointer', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', 
                backgroundColor: '#fff', color: '#555', fontWeight: '600',
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
              }}
            >
              {locationText}
            </button>
          </div>

          {/* Photos */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <h2 style={{ fontSize: '18px', margin: 0, fontWeight: '800', color: '#1a1a1a' }}>Photos:</h2>
            
            {/* Hidden file inputs */}
            <input type="file" accept="image/*" ref={galleryInputRef} style={{ display: 'none' }} />
            <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} style={{ display: 'none' }} />

            <button 
              type="button" 
              onClick={() => galleryInputRef.current.click()}
              style={{ width: '45px', height: '45px', fontSize: '18px', borderRadius: '10px', border: '2px dashed #666', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Upload from Gallery"
            >
              🖼️
            </button>
            <button 
              type="button" 
              onClick={() => cameraInputRef.current.click()}
              style={{ width: '45px', height: '45px', fontSize: '18px', borderRadius: '10px', border: '2px dashed #666', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Take a Photo"
            >
              📸
            </button>
          </div>

          {/* Casualties */}
          <label style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer', fontWeight: '800', color: '#1a1a1a' }}>
            Casualties?
            <input 
              type="checkbox" 
              style={{ width: '20px', height: '20px', accentColor: '#333' }}
              checked={formData.hasCasualties}
              onChange={(e) => setFormData({...formData, hasCasualties: e.target.checked})}
            />
          </label>

          {/* Other Info */}
          <div style={{ marginTop: '10px' }}>
            <h2 style={{ fontSize: '18px', margin: '0 0 10px 0', fontWeight: '800', color: '#1a1a1a', textAlign: 'center' }}>Other info?</h2>
            <textarea 
              style={{ 
                width: '100%', height: '120px', borderRadius: '12px', padding: '15px', 
                fontSize: '14px', border: 'none', backgroundColor: '#e8eedf', 
                color: '#1a1a1a', boxSizing: 'border-box', resize: 'none'
              }}
              placeholder="Tap to type..."
              value={formData.otherInfo}
              onChange={(e) => setFormData({...formData, otherInfo: e.target.value})}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '15px', marginTop: 'auto', paddingTop: '10px' }}>
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
              style={{ flex: 1, padding: '16px', fontSize: '16px', borderRadius: '30px', border: 'none', backgroundColor: '#f5a623', color: '#fff', fontWeight: '800', cursor: isSubmitting ? 'wait' : 'pointer', boxShadow: '0 4px 6px rgba(245,166,35,0.3)' }}
            >
              {isSubmitting ? 'SENDING...' : 'SUBMIT'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default ReportDisasterScreen;