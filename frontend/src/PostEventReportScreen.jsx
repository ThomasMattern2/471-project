import React, { useState, useEffect } from 'react';

const SEVERITY_COLORS = { low: '#22c55e', medium: '#f59e0b', high: '#f97316', critical: '#ef4444' };
const STATUS_COLORS   = { 'En Route': '#3b82f6', 'On Scene': '#22c55e', 'Need Assistance': '#ef4444', 'Complete': '#6b7280' };

const PostEventReportScreen = ({ onNavigate }) => {
  const [tab, setTab]                       = useState('internal');
  const [incidents, setIncidents]           = useState([]);
  const [responderUpdates, setResponderUpdates] = useState([]);
  const [loading, setLoading]               = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [incRes, respRes] = await Promise.all([
          fetch('http://127.0.0.1:8000/api/incidents'),
          fetch('http://127.0.0.1:8000/api/responders/status'),
        ]);
        if (incRes.ok)  setIncidents(await incRes.json());
        if (respRes.ok) setResponderUpdates(await respRes.json());
      } catch (err) {
        console.error('Error fetching report data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Group responder updates by incident_id
  const updatesByIncident = responderUpdates.reduce((acc, u) => {
    if (!acc[u.incident_id]) acc[u.incident_id] = [];
    acc[u.incident_id].push(u);
    return acc;
  }, {});

  // Resolution: at least one responder on this incident reached "Complete"
  const isResolved = (incidentId) =>
    (updatesByIncident[incidentId] || []).some(u => u.status === 'Complete');

  const TabButton = ({ id, label }) => (
    <button
      onClick={() => setTab(id)}
      style={{
        flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
        backgroundColor: tab === id ? '#2c4a7a' : 'transparent',
        color: tab === id ? '#fff' : '#2c4a7a',
        fontWeight: '800', fontSize: '13px', cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ backgroundColor: '#1a1a1a', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '20px' }}>
      <div style={{
        backgroundColor: '#c5cce8',
        width: '100%', maxWidth: '400px', minHeight: '800px',
        borderRadius: '35px', padding: '30px 25px',
        color: '#1a1a1a', fontFamily: 'system-ui, -apple-system, sans-serif',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        boxSizing: 'border-box', display: 'flex', flexDirection: 'column',
      }}>

        {/* Banner */}
        <div style={{ backgroundColor: '#2c4a7a', padding: '12px', borderRadius: '10px', marginBottom: '20px', textAlign: 'center' }}>
          <span style={{ fontWeight: '800', fontSize: '14px', letterSpacing: '1px', color: '#fff' }}>📋 POST-EVENT REPORT</span>
        </div>

        <h1 style={{ fontSize: '20px', fontWeight: '900', margin: '0 0 16px 0', textAlign: 'center' }}>
          Incident Timeline
        </h1>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', backgroundColor: '#b0bade', borderRadius: '12px', padding: '4px', marginBottom: '20px', gap: '4px' }}>
          <TabButton id="internal" label="Internal Report" />
          <TabButton id="public"   label="Public Summary"  />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#555', fontWeight: '600' }}>Loading...</div>
        ) : incidents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#dde3f5', borderRadius: '16px' }}>
            <div style={{ fontSize: '36px', marginBottom: '10px' }}>📭</div>
            <p style={{ fontWeight: '700', color: '#2c4a7a', margin: 0 }}>No incidents on record</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>

            {/* ── INTERNAL REPORT TAB ── */}
            {tab === 'internal' && incidents.map(inc => {
              const updates = (updatesByIncident[inc.id] || [])
                .slice()
                .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
              return (
                <div key={inc.id} style={{ backgroundColor: '#dde3f5', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>

                  {/* Incident header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '800', fontSize: '16px', textTransform: 'capitalize' }}>{inc.disasterType}</span>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {inc.is_verified && inc.severity && (
                        <span style={{ backgroundColor: SEVERITY_COLORS[inc.severity] || '#888', color: '#fff', fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '20px', textTransform: 'capitalize' }}>
                          {inc.severity}
                        </span>
                      )}
                      {!inc.is_verified && (
                        <span style={{ backgroundColor: '#f59e0b', color: '#fff', fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '20px' }}>Unverified</span>
                      )}
                      {inc.hasCasualties && (
                        <span style={{ backgroundColor: '#ef4444', color: '#fff', fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '20px' }}>Casualties</span>
                      )}
                    </div>
                  </div>

                  <p style={{ fontSize: '12px', color: '#555', margin: '0 0 3px 0' }}>
                    Reported: {new Date(inc.reportedAt).toLocaleString()}
                  </p>
                  {inc.verifiedAt && (
                    <p style={{ fontSize: '12px', color: '#555', margin: '0 0 3px 0' }}>
                      Verified: {new Date(inc.verifiedAt).toLocaleString()}
                    </p>
                  )}
                  <p style={{ fontSize: '12px', color: '#555', margin: '0 0 8px 0' }}>
                    Coords: [{inc.coordinates[0].toFixed(4)}, {inc.coordinates[1].toFixed(4)}]
                  </p>
                  {inc.otherInfo && (
                    <p style={{ fontSize: '12px', color: '#333', fontStyle: 'italic', margin: '0 0 10px 0' }}>"{inc.otherInfo}"</p>
                  )}

                  {/* Responder timeline */}
                  {updates.length > 0 && (
                    <div>
                      <p style={{ fontSize: '12px', fontWeight: '700', color: '#2c4a7a', margin: '0 0 6px 0' }}>Responder Updates:</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {updates.map(u => (
                          <div key={u.id} style={{ backgroundColor: '#eef0fa', borderRadius: '8px', padding: '8px 10px', borderLeft: `3px solid ${STATUS_COLORS[u.status] || '#888'}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: '700', fontSize: '12px', color: STATUS_COLORS[u.status] || '#333' }}>{u.status}</span>
                              <span style={{ fontSize: '11px', color: '#777' }}>{u.responder_id}</span>
                            </div>
                            <p style={{ fontSize: '11px', color: '#666', margin: '2px 0 0 0' }}>{new Date(u.submittedAt).toLocaleString()}</p>
                            {u.notes && <p style={{ fontSize: '11px', color: '#444', margin: '3px 0 0 0', fontStyle: 'italic' }}>"{u.notes}"</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {updates.length === 0 && (
                    <p style={{ fontSize: '12px', color: '#999', fontStyle: 'italic', margin: 0 }}>No responder updates recorded.</p>
                  )}
                </div>
              );
            })}

            {/* ── PUBLIC SUMMARY TAB ── */}
            {tab === 'public' && incidents.map(inc => {
              const resolved = isResolved(inc.id);
              return (
                <div key={inc.id} style={{ backgroundColor: '#dde3f5', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '800', fontSize: '16px', textTransform: 'capitalize' }}>{inc.disasterType}</span>
                    <span style={{
                      backgroundColor: resolved ? '#22c55e' : '#f59e0b',
                      color: '#fff', fontSize: '11px', fontWeight: '700',
                      padding: '3px 10px', borderRadius: '20px',
                    }}>
                      {resolved ? 'Resolved' : 'Active'}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#444', margin: '0 0 4px 0' }}>
                    Location: {inc.coordinates[1].toFixed(3)}°N, {Math.abs(inc.coordinates[0]).toFixed(3)}°W
                  </p>
                  <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>
                    Reported: {new Date(inc.reportedAt).toLocaleDateString()}
                  </p>
                </div>
              );
            })}

          </div>
        )}

        {/* Back button */}
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

export default PostEventReportScreen;
