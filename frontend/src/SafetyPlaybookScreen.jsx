import React, { useState, useEffect, useCallback } from 'react';

// ─── S4G3A-30: Local Storage Schema & Logic ───────────────────────────────────
// Key: 'drcs_playbook_checklists'
// Schema: { [disasterType]: { [stepIndex]: boolean } }
// e.g. { "fire": { "0": true, "2": true }, "flood": {} }

const PLAYBOOK_STORAGE_KEY = 'drcs_playbook_checklists';

function loadCheckedItems() {
  try {
    const raw = localStorage.getItem(PLAYBOOK_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('[DRCS] Playbook load error:', e);
    return {};
  }
}

function saveCheckedItems(data) {
  try {
    localStorage.setItem(PLAYBOOK_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('[DRCS] Playbook save error:', e);
  }
}

// ─── Playbook Data (Pre-downloaded, available offline) ────────────────────────
const PLAYBOOKS = {
  fire: {
    label: '🔥 Fire',
    color: '#ef4444',
    severity: 'LVL 4 — Critical',
    steps: [
      'Locate all family members and pets immediately.',
      'Leave through the nearest marked exit route.',
      'Keep your mobile device charged and turn on Bluetooth for community coordination.',
      'Dress in long pants, a long-sleeved shirt, and sturdy shoes to protect against embers.',
      'Open the app\'s offline map to verify the safest official evacuation route.',
      'Once safe, use the app to mark your status so officials know you have evacuated successfully.',
    ],
    resources: [
      'Advanced life support ambulances',
      'Trained paramedics',
      'Medical equipment',
      'Communication systems',
    ],
  },
  flood: {
    label: '🌊 Flood',
    color: '#3b82f6',
    severity: 'LVL 3 — High',
    steps: [
      'Move immediately to higher ground — do not wait for instructions.',
      'Avoid walking or driving through floodwater. 6 inches can knock you down.',
      'Disconnect electrical appliances if safe to do so.',
      'Take emergency kit: water, food, medications, documents.',
      'Follow official evacuation routes only — shortcuts may be flooded.',
      'Report your location and safety status using the app.',
    ],
    resources: [
      'Rescue boats and water equipment',
      'Emergency shelters at designated centres',
      'Red Cross relief supplies',
      'Backup power generators',
    ],
  },
  earthquake: {
    label: '🌍 Earthquake',
    color: '#f59e0b',
    severity: 'LVL 2 — Medium',
    steps: [
      'DROP to hands and knees immediately to prevent being knocked down.',
      'Take COVER under a sturdy desk/table, or against an interior wall away from windows.',
      'HOLD ON until shaking stops. Do not run outside during shaking.',
      'Once shaking stops, check for injuries and hazards (gas leaks, structural damage).',
      'Evacuate if building is unsafe. Use stairs only — never elevators.',
      'Expect aftershocks and move to open areas away from buildings.',
    ],
    resources: [
      'Urban search and rescue teams',
      'Structural engineers on standby',
      'Field hospitals and triage units',
      'Heavy equipment for debris removal',
    ],
  },
  other: {
    label: '⚠️ Other',
    color: '#8b5cf6',
    severity: 'LVL 1 — Advisory',
    steps: [
      'Stay informed via official government broadcasts and this app.',
      'Prepare your emergency kit: 72-hour supply of water, food, and essentials.',
      'Keep all devices charged. Enable Bluetooth for local coordination.',
      'Follow instructions from emergency officials and first responders.',
      'Avoid spreading unverified information — only share official updates.',
      'Check on vulnerable neighbours (elderly, disabled) if it is safe to do so.',
    ],
    resources: [
      'Emergency coordination centre',
      'Community support networks',
      'Government helpline services',
      'Volunteer response teams',
    ],
  },
};

// ─── S4G3A-31: Safety Playbook UI ─────────────────────────────────────────────
const SafetyPlaybookScreen = ({ onNavigate }) => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [activeType, setActiveType] = useState('fire');
  const [checkedItems, setCheckedItems] = useState(loadCheckedItems);
  const [justReset, setJustReset] = useState(false);

  // Sync online/offline status
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

  const playbook = PLAYBOOKS[activeType];

  const typeChecks = checkedItems[activeType] || {};
  const checkedCount = Object.values(typeChecks).filter(Boolean).length;
  const totalSteps   = playbook.steps.length;
  const progress     = Math.round((checkedCount / totalSteps) * 100);

  const toggleStep = useCallback((index) => {
    setCheckedItems(prev => {
      const updated = {
        ...prev,
        [activeType]: {
          ...(prev[activeType] || {}),
          [index]: !((prev[activeType] || {})[index]),
        },
      };
      saveCheckedItems(updated);
      return updated;
    });
  }, [activeType]);

  const resetChecklist = useCallback(() => {
    setCheckedItems(prev => {
      const updated = { ...prev, [activeType]: {} };
      saveCheckedItems(updated);
      return updated;
    });
    setJustReset(true);
    setTimeout(() => setJustReset(false), 1500);
  }, [activeType]);

  // ── Styles ──────────────────────────────────────────────────────────────────
  const phoneStyle = {
    width: '390px',
    minHeight: '844px',
    backgroundColor: '#111827',
    borderRadius: '40px',
    boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
    overflow: 'hidden',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
  };

  const NAV_GREEN = '#cde0c5';

  return (
    <div style={phoneStyle}>

      {/* ── Offline / Signal Banner ── */}
      {isOffline && (
        <div style={{
          backgroundColor: '#1e3a5f',
          color: '#93c5fd',
          padding: '8px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          fontWeight: '700',
          letterSpacing: '0.5px',
        }}>
          <span>📵 NO SIGNAL</span>
          <span style={{ backgroundColor: '#166534', color: '#86efac', padding: '2px 8px', borderRadius: '999px', fontSize: '11px' }}>
            ✓ Downloaded Playbook
          </span>
        </div>
      )}

      {/* ── Status Bar ── */}
      <div style={{ padding: '14px 24px 0', display: 'flex', justifyContent: 'space-between', color: '#9ca3af', fontSize: '13px', fontWeight: '600' }}>
        <span>9:41</span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <span>{isOffline ? '📵' : '📶'}</span>
          <span>🔋</span>
        </div>
      </div>

      {/* ── Header ── */}
      <div style={{ padding: '16px 20px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <button
            onClick={() => onNavigate('dashboard')}
            style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '20px', cursor: 'pointer', padding: '0', lineHeight: 1 }}
          >
            ←
          </button>
          <h1 style={{ margin: 0, color: '#f9fafb', fontSize: '20px', fontWeight: '800', letterSpacing: '-0.3px' }}>
            Safety Playbooks
          </h1>
        </div>
        <p style={{ margin: '0 0 0 30px', color: '#6b7280', fontSize: '12px' }}>
          Pre-downloaded · Available offline
        </p>
      </div>

      {/* ── Disaster Type Tabs ── */}
      <div style={{ padding: '0 20px 14px', display: 'flex', gap: '8px', overflowX: 'auto' }}>
        {Object.entries(PLAYBOOKS).map(([key, pb]) => {
          const isActive = activeType === key;
          const typeChecks = checkedItems[key] || {};
          const done = Object.values(typeChecks).filter(Boolean).length;
          return (
            <button
              key={key}
              onClick={() => setActiveType(key)}
              style={{
                flexShrink: 0,
                padding: '8px 14px',
                borderRadius: '20px',
                border: isActive ? `2px solid ${pb.color}` : '2px solid rgba(255,255,255,0.08)',
                backgroundColor: isActive ? `${pb.color}22` : 'rgba(255,255,255,0.04)',
                color: isActive ? '#f9fafb' : '#6b7280',
                fontSize: '12px',
                fontWeight: isActive ? '700' : '500',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                position: 'relative',
              }}
            >
              {pb.label}
              {done > 0 && (
                <span style={{
                  position: 'absolute', top: '-5px', right: '-5px',
                  backgroundColor: '#22c55e', color: '#fff',
                  width: '16px', height: '16px', borderRadius: '50%',
                  fontSize: '9px', fontWeight: '800',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {done}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Playbook Content ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 100px' }}>

        {/* Severity Badge + Progress */}
        <div style={{
          backgroundColor: '#1f2937',
          borderRadius: '14px',
          padding: '14px 16px',
          marginBottom: '14px',
          border: `1px solid ${playbook.color}44`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div>
              <span style={{
                backgroundColor: `${playbook.color}33`,
                color: playbook.color,
                padding: '3px 10px',
                borderRadius: '999px',
                fontSize: '11px',
                fontWeight: '800',
                letterSpacing: '0.5px',
              }}>
                {playbook.severity}
              </span>
            </div>
            <span style={{ color: '#6b7280', fontSize: '12px' }}>
              {checkedCount}/{totalSteps} steps done
            </span>
          </div>

          {/* Progress Bar */}
          <div style={{ backgroundColor: '#374151', borderRadius: '999px', height: '6px', overflow: 'hidden' }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              backgroundColor: progress === 100 ? '#22c55e' : playbook.color,
              borderRadius: '999px',
              transition: 'width 0.3s ease',
            }} />
          </div>
          {progress === 100 && (
            <p style={{ margin: '8px 0 0', color: '#22c55e', fontSize: '12px', fontWeight: '700', textAlign: 'center' }}>
              ✓ All steps completed
            </p>
          )}
        </div>

        {/* Section: Evacuation Steps */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <p style={{ margin: 0, color: '#9ca3af', fontSize: '11px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Evacuation Procedure
            </p>
            <button
              onClick={resetChecklist}
              style={{ background: 'none', border: 'none', color: justReset ? '#22c55e' : '#6b7280', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}
            >
              {justReset ? '✓ Reset' : 'Reset'}
            </button>
          </div>

          {playbook.steps.map((step, i) => {
            const checked = !!(typeChecks[i]);
            return (
              <button
                key={i}
                onClick={() => toggleStep(i)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '13px 14px',
                  marginBottom: '8px',
                  backgroundColor: checked ? 'rgba(34,197,94,0.08)' : '#1f2937',
                  border: checked ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                {/* Checkbox */}
                <div style={{
                  flexShrink: 0,
                  width: '22px', height: '22px',
                  borderRadius: '6px',
                  border: checked ? 'none' : `2px solid ${playbook.color}88`,
                  backgroundColor: checked ? '#22c55e' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginTop: '1px',
                }}>
                  {checked && <span style={{ color: '#fff', fontSize: '13px', fontWeight: '900' }}>✓</span>}
                </div>

                <div style={{ flex: 1 }}>
                  <span style={{
                    color: '#374151',
                    fontSize: '10px',
                    fontWeight: '700',
                    letterSpacing: '0.5px',
                    display: 'block',
                    marginBottom: '2px',
                  }}>
                    STEP {i + 1}
                  </span>
                  <span style={{
                    color: checked ? '#6b7280' : '#e5e7eb',
                    fontSize: '13px',
                    lineHeight: '1.5',
                    textDecoration: checked ? 'line-through' : 'none',
                    transition: 'color 0.15s',
                  }}>
                    {step}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Section: Resources Available */}
        <div style={{
          backgroundColor: '#1f2937',
          borderRadius: '14px',
          padding: '14px 16px',
          border: '1px solid rgba(255,255,255,0.06)',
          marginBottom: '16px',
        }}>
          <p style={{ margin: '0 0 10px', color: '#9ca3af', fontSize: '11px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Resources Available
          </p>
          {playbook.resources.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0', borderBottom: i < playbook.resources.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: playbook.color, flexShrink: 0 }} />
              <span style={{ color: '#d1d5db', fontSize: '13px' }}>{r}</span>
            </div>
          ))}
        </div>

      </div>

      {/* ── FOR HELP Button ── */}
      <div style={{ position: 'absolute', bottom: '90px', left: '20px', right: '20px', zIndex: 5 }}>
        <button style={{
          width: '100%',
          padding: '16px',
          borderRadius: '14px',
          border: 'none',
          backgroundColor: '#1e3a5f',
          color: '#93c5fd',
          fontWeight: '800',
          fontSize: '15px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          letterSpacing: '0.5px',
        }}>
          📞 FOR HELP
        </button>
      </div>

      {/* ── Bottom Navigation Bar ── */}
      <div style={{
        position: 'absolute', bottom: 0, width: '100%', zIndex: 10,
        backgroundColor: NAV_GREEN,
        height: '80px',
        borderTopLeftRadius: '40px', borderTopRightRadius: '40px',
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        padding: '0 20px', boxSizing: 'border-box',
      }}>
        <button
          onClick={() => onNavigate('dashboard')}
          style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', opacity: 0.6 }}
          title="Dashboard"
        >
          ◎
        </button>
        <div style={{ position: 'relative', width: '70px', height: '70px' }}>
          <div style={{
            position: 'absolute', top: '-35px', left: '0',
            width: '70px', height: '70px', borderRadius: '50%',
            backgroundColor: playbook.color,
            border: `6px solid ${NAV_GREEN}`,
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            fontSize: '28px',
            boxSizing: 'border-box',
          }}>
            📖
          </div>
        </div>
        <button
          onClick={() => onNavigate('dashboard')}
          style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', opacity: 0.6 }}
          title="Profile"
        >
          👤
        </button>
      </div>

    </div>
  );
};

export default SafetyPlaybookScreen;
