import React, { useState } from 'react';

const STATUSES = [
  { value: 'En Route',        emoji: '🚒', color: '#3b82f6', desc: 'Dispatched and heading to scene',    isPublic: false },
  { value: 'On Scene',        emoji: '🟢', color: '#22c55e', desc: 'Arrived and actively responding',    isPublic: false },
  { value: 'Need Assistance', emoji: '🆘', color: '#ef4444', desc: 'Requires additional support',        isPublic: true  },
  { value: 'Complete',        emoji: '✅', color: '#6b7280', desc: 'Incident response complete',          isPublic: false },
];

const FirstResponderScreen = ({ onNavigate }) => {
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [incidentId, setIncidentId]         = useState('');
  const [responderId, setResponderId]       = useState('R-' + Math.floor(Math.random() * 9000 + 1000));
  const [notes, setNotes]                   = useState('');
  const [isSubmitting, setIsSubmitting]     = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStatus || !incidentId.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/responders/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responder_id: responderId,
          incident_id:  incidentId.trim(),
          status:       selectedStatus,
          notes,
        }),
      });
      if (response.ok) {
        const isPublic = STATUSES.find(s => s.value === selectedStatus)?.isPublic;
        const visibility = isPublic
          ? 'This status is publicly visible.'
          : 'Status reported to government dashboard only.';
        alert(`Status updated: ${selectedStatus}\n${visibility}`);
        onNavigate('dashboard');
      }
    } catch (error) {
      console.error('Error submitting status:', error);
      alert('Error submitting status. Ensure the backend is running.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#1a1a1a', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
      <div style={{
        backgroundColor: '#deb887',
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
        <div style={{ backgroundColor: '#c8851a', padding: '12px', borderRadius: '10px', marginBottom: '25px', textAlign: 'center' }}>
          <span style={{ fontWeight: '800', fontSize: '14px', letterSpacing: '1px', color: '#fff' }}>🚒 FIRST RESPONDER STATUS</span>
        </div>

        <h1 style={{ fontSize: '22px', fontWeight: '900', marginBottom: '20px', color: '#1a1a1a', textAlign: 'center' }}>
          Update Your Status
        </h1>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>

          {/* Responder ID */}
          <div>
            <p style={{ fontSize: '13px', fontWeight: '700', margin: '0 0 6px 0', color: '#5a3a00' }}>Responder ID</p>
            <input
              type="text"
              value={responderId}
              onChange={(e) => setResponderId(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#f5e6c8', fontSize: '15px', boxSizing: 'border-box' }}
            />
          </div>

          {/* Incident ID */}
          <div>
            <p style={{ fontSize: '13px', fontWeight: '700', margin: '0 0 6px 0', color: '#5a3a00' }}>
              Incident ID <span style={{ color: '#c0392b' }}>*</span>
            </p>
            <input
              type="text"
              required
              value={incidentId}
              onChange={(e) => setIncidentId(e.target.value)}
              placeholder="e.g. abc123-..."
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#f5e6c8', fontSize: '15px', boxSizing: 'border-box' }}
            />
          </div>

          {/* Status Selection */}
          <div>
            <p style={{ fontSize: '13px', fontWeight: '700', margin: '0 0 10px 0', color: '#5a3a00' }}>
              Select Status <span style={{ color: '#c0392b' }}>*</span>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {STATUSES.map(s => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSelectedStatus(s.value)}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '12px',
                    border: selectedStatus === s.value ? `3px solid ${s.color}` : '3px solid transparent',
                    backgroundColor: selectedStatus === s.value ? `${s.color}22` : '#f5e6c8',
                    color: '#1a1a1a',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <span style={{ marginRight: '8px' }}>{s.emoji}</span>
                    <span style={{ color: s.color }}>{s.value}</span>
                    <div style={{ fontSize: '11px', fontWeight: '400', color: '#555', marginTop: '2px', paddingLeft: '24px' }}>
                      {s.desc}
                    </div>
                  </div>
                  {s.isPublic && (
                    <span style={{ fontSize: '11px', backgroundColor: '#ef4444', color: '#fff', padding: '3px 8px', borderRadius: '20px', whiteSpace: 'nowrap', marginLeft: '8px', flexShrink: 0 }}>
                      Public
                    </span>
                  )}
                </button>
              ))}
            </div>
            <p style={{ fontSize: '11px', color: '#7a5a30', marginTop: '8px', textAlign: 'center' }}>
              Only "Need Assistance" is publicly visible. All other statuses route to the government dashboard.
            </p>
          </div>

          {/* Notes */}
          <div>
            <p style={{ fontSize: '13px', fontWeight: '700', margin: '0 0 6px 0', color: '#5a3a00' }}>Notes (Optional)</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details..."
              style={{ width: '100%', height: '80px', padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#f5e6c8', fontSize: '14px', resize: 'none', boxSizing: 'border-box' }}
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
              disabled={isSubmitting || !selectedStatus}
              style={{ flex: 1, padding: '16px', fontSize: '16px', borderRadius: '30px', border: 'none', backgroundColor: selectedStatus ? '#c8851a' : '#ccc', color: '#fff', fontWeight: '800', cursor: isSubmitting || !selectedStatus ? 'default' : 'pointer', boxShadow: selectedStatus ? '0 4px 6px rgba(200,133,26,0.3)' : 'none' }}
            >
              {isSubmitting ? 'SENDING...' : 'SUBMIT'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default FirstResponderScreen;
