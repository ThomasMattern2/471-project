import React, { useState, useEffect } from 'react';

const SEVERITY_OPTIONS = ['low', 'medium', 'high', 'critical'];
const SEVERITY_COLORS  = { low: '#22c55e', medium: '#f59e0b', high: '#f97316', critical: '#ef4444' };

const IncidentVerificationScreen = ({ onNavigate }) => {
  const [incidents, setIncidents]             = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [severitySelections, setSeverity]     = useState({});
  const [verifying, setVerifying]             = useState({});

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/incidents');
      if (response.ok) {
        const data = await response.json();
        const unverified = data.filter(inc => !inc.is_verified);
        setIncidents(unverified);
        // Default every unverified incident to 'medium' severity
        const defaults = {};
        unverified.forEach(inc => { defaults[inc.id] = 'medium'; });
        setSeverity(prev => ({ ...defaults, ...prev }));
      }
    } catch (error) {
      console.error('Error fetching incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIncidents(); }, []);

  const handleVerify = async (incidentId) => {
    const severity = severitySelections[incidentId] || 'medium';
    setVerifying(prev => ({ ...prev, [incidentId]: true }));
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/incidents/${incidentId}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ severity }),
      });
      if (response.ok) {
        setIncidents(prev => prev.filter(inc => inc.id !== incidentId));
      }
    } catch (error) {
      console.error('Error verifying incident:', error);
      alert('Error verifying incident. Ensure the backend is running.');
    } finally {
      setVerifying(prev => ({ ...prev, [incidentId]: false }));
    }
  };

  return (
    <div style={{ backgroundColor: '#1a1a1a', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '20px' }}>
      <div style={{
        backgroundColor: '#c8d8e8',
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
        flexDirection: 'column',
      }}>

        {/* Top Banner */}
        <div style={{ backgroundColor: '#2c6e8a', padding: '12px', borderRadius: '10px', marginBottom: '25px', textAlign: 'center' }}>
          <span style={{ fontWeight: '800', fontSize: '14px', letterSpacing: '1px', color: '#fff' }}>🔍 INCIDENT VERIFICATION</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '900', margin: 0, color: '#1a1a1a' }}>
            Unverified Reports
          </h1>
          <button
            onClick={fetchIncidents}
            style={{ padding: '8px 14px', borderRadius: '20px', border: 'none', backgroundColor: '#2c6e8a', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#555', fontWeight: '600' }}>
            Loading...
          </div>
        ) : incidents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#e8f0f8', borderRadius: '16px' }}>
            <div style={{ fontSize: '36px', marginBottom: '10px' }}>✅</div>
            <p style={{ fontWeight: '700', color: '#2c6e8a', margin: '0 0 6px 0' }}>All reports verified</p>
            <p style={{ fontSize: '13px', color: '#555', margin: 0 }}>No pending incident reports.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
            {incidents.map(inc => (
              <div key={inc.id} style={{ backgroundColor: '#e8f0f8', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>

                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <span style={{ fontWeight: '800', fontSize: '16px', color: '#1a1a1a', textTransform: 'capitalize' }}>
                    {inc.disasterType}
                  </span>
                  {inc.hasCasualties && (
                    <span style={{ backgroundColor: '#ef4444', color: '#fff', fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '20px' }}>
                      Casualties
                    </span>
                  )}
                </div>

                <p style={{ fontSize: '12px', color: '#666', margin: '0 0 4px 0' }}>
                  Reported: {new Date(inc.reportedAt).toLocaleString()}
                </p>
                <p style={{ fontSize: '12px', color: '#666', margin: '0 0 4px 0' }}>
                  Coords: [{inc.coordinates[0].toFixed(4)}, {inc.coordinates[1].toFixed(4)}]
                </p>
                {inc.otherInfo && (
                  <p style={{ fontSize: '13px', color: '#333', margin: '4px 0 10px 0', fontStyle: 'italic' }}>
                    "{inc.otherInfo}"
                  </p>
                )}

                {/* Severity Selector */}
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#2c6e8a' }}>Severity:</span>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                    {SEVERITY_OPTIONS.map(sev => (
                      <button
                        key={sev}
                        type="button"
                        onClick={() => setSeverity(prev => ({ ...prev, [inc.id]: sev }))}
                        style={{
                          padding: '5px 12px',
                          borderRadius: '20px',
                          border: severitySelections[inc.id] === sev
                            ? `2px solid ${SEVERITY_COLORS[sev]}`
                            : '2px solid transparent',
                          backgroundColor: severitySelections[inc.id] === sev
                            ? `${SEVERITY_COLORS[sev]}22`
                            : '#fff',
                          color: SEVERITY_COLORS[sev],
                          fontWeight: '700',
                          fontSize: '12px',
                          cursor: 'pointer',
                          textTransform: 'capitalize',
                        }}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Approve Button */}
                <button
                  onClick={() => handleVerify(inc.id)}
                  disabled={verifying[inc.id]}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: verifying[inc.id] ? '#ccc' : '#2c6e8a',
                    color: '#fff',
                    fontWeight: '800',
                    fontSize: '14px',
                    cursor: verifying[inc.id] ? 'default' : 'pointer',
                  }}
                >
                  {verifying[inc.id] ? 'Verifying...' : '✓ Approve & Verify'}
                </button>

              </div>
            ))}
          </div>
        )}

        {/* Back button always visible at the bottom */}
        <div style={{ marginTop: '20px' }}>
          <button
            onClick={() => onNavigate('dashboard')}
            style={{ width: '100%', padding: '16px', fontSize: '16px', borderRadius: '30px', border: 'none', backgroundColor: '#fff', color: '#1a1a1a', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}
          >
            Back to Dashboard
          </button>
        </div>

      </div>
    </div>
  );
};

export default IncidentVerificationScreen;
