import React, { useState, useEffect, useCallback } from 'react';

// ─── S4G3A-37: Role definitions (must mirror backend VALID_ROLES) ─────────────
const ROLES = ['citizen', 'government', 'first_responder', 'system_admin'];

const ROLE_META = {
  citizen:        { label: 'Citizen',        emoji: '👤', color: '#6b7280', bg: 'rgba(107,114,128,0.15)' },
  government:     { label: 'Government',      emoji: '🛡️', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  first_responder:{ label: 'First Responder', emoji: '🚒', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  system_admin:   { label: 'System Admin',    emoji: '⚙️', color: '#a855f7', bg: 'rgba(168,85,247,0.15)' },
};

// Demo admin ID — in production this comes from the auth session
const ADMIN_USER_ID = 'user-006';

// ─── S4G3A-38: Admin Panel UI ─────────────────────────────────────────────────
const AdminPanelScreen = ({ onNavigate }) => {
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [toast, setToast]         = useState(null);   // { msg, type: 'success'|'error' }
  const [pendingId, setPendingId] = useState(null);   // user ID being updated

  // New-user form state
  const [showForm, setShowForm]   = useState(false);
  const [formName, setFormName]   = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole]   = useState('citizen');
  const [formErr, setFormErr]     = useState('');

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Fetch all users (requires system_admin header)
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/admin/users', {
        headers: { 'X-User-Id': ADMIN_USER_ID },
      });
      if (!res.ok) throw new Error(`${res.status}`);
      setUsers(await res.json());
    } catch (err) {
      showToast(`Failed to load users: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Assign a new role to a user
  const handleRoleChange = useCallback(async (userId, newRole) => {
    setPendingId(userId);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': ADMIN_USER_ID },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Update failed');
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      showToast(`${data.user.name} → ${ROLE_META[newRole].label}`);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setPendingId(null);
    }
  }, [showToast]);

  // Create a new user account
  const handleCreateUser = useCallback(async () => {
    setFormErr('');
    if (!formName.trim() || !formEmail.trim()) { setFormErr('Name and email are required.'); return; }
    try {
      const params = new URLSearchParams({ name: formName, email: formEmail, role: formRole });
      const res = await fetch(`http://127.0.0.1:8000/api/admin/users?${params}`, {
        method: 'POST',
        headers: { 'X-User-Id': ADMIN_USER_ID },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Create failed');
      setUsers(prev => [...prev, data.user]);
      setFormName(''); setFormEmail(''); setFormRole('citizen');
      setShowForm(false);
      showToast(`Account created for ${data.user.name}`);
    } catch (err) {
      setFormErr(err.message);
    }
  }, [formName, formEmail, formRole, showToast]);

  // ── Counts ───────────────────────────────────────────────────────────────────
  const counts = ROLES.reduce((acc, r) => {
    acc[r] = users.filter(u => u.role === r).length;
    return acc;
  }, {});

  // ── Styles ───────────────────────────────────────────────────────────────────
  const NAV_GREEN = '#cde0c5';

  return (
    <div style={{
      width: '390px', minHeight: '844px',
      backgroundColor: '#0f172a',
      borderRadius: '40px',
      boxShadow: '0 30px 80px rgba(0,0,0,0.7)',
      overflow: 'hidden',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      position: 'relative',
      display: 'flex', flexDirection: 'column',
    }}>

      {/* ── Status Bar ── */}
      <div style={{ padding: '14px 24px 0', display: 'flex', justifyContent: 'space-between', color: '#475569', fontSize: '13px', fontWeight: '600' }}>
        <span>9:41</span>
        <div style={{ display: 'flex', gap: '6px' }}><span>📶</span><span>🔋</span></div>
      </div>

      {/* ── Header ── */}
      <div style={{ padding: '14px 20px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button onClick={() => onNavigate('dashboard')} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '20px', cursor: 'pointer', padding: 0, lineHeight: 1 }}>←</button>
        <div>
          <h1 style={{ margin: 0, color: '#f1f5f9', fontSize: '19px', fontWeight: '800' }}>Admin Panel</h1>
          <p style={{ margin: 0, color: '#475569', fontSize: '12px' }}>User Role Management</p>
        </div>
      </div>

      {/* ── Role Summary Cards ── */}
      <div style={{ padding: '0 16px 14px', display: 'flex', gap: '8px' }}>
        {ROLES.map(r => {
          const meta = ROLE_META[r];
          return (
            <div key={r} style={{ flex: 1, backgroundColor: '#1e293b', borderRadius: '10px', padding: '8px 6px', textAlign: 'center', border: `1px solid ${meta.color}33` }}>
              <div style={{ fontSize: '16px', marginBottom: '2px' }}>{meta.emoji}</div>
              <div style={{ color: meta.color, fontSize: '18px', fontWeight: '900', lineHeight: 1 }}>{counts[r]}</div>
              <div style={{ color: '#475569', fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.3px', marginTop: '2px', lineHeight: '1.2' }}>
                {meta.label.replace(' ', '\n')}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Section Header ── */}
      <div style={{ padding: '0 20px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#64748b', fontSize: '11px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>
          All Accounts ({users.length})
        </span>
        <button
          onClick={() => setShowForm(v => !v)}
          style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#a855f7', fontSize: '12px', fontWeight: '700', padding: '5px 10px', cursor: 'pointer' }}
        >
          {showForm ? '✕ Cancel' : '+ New User'}
        </button>
      </div>

      {/* ── New User Form ── */}
      {showForm && (
        <div style={{ margin: '0 16px 12px', backgroundColor: '#1e293b', borderRadius: '14px', padding: '14px', border: '1px solid rgba(168,85,247,0.3)' }}>
          <p style={{ margin: '0 0 10px', color: '#a855f7', fontWeight: '800', fontSize: '13px' }}>⚙️ Register New Account</p>
          {formErr && <p style={{ margin: '0 0 8px', color: '#ef4444', fontSize: '12px' }}>{formErr}</p>}
          <input
            value={formName} onChange={e => setFormName(e.target.value)}
            placeholder="Full name"
            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: '#0f172a', color: '#f1f5f9', fontSize: '13px', marginBottom: '8px', boxSizing: 'border-box' }}
          />
          <input
            value={formEmail} onChange={e => setFormEmail(e.target.value)}
            placeholder="Email address"
            type="email"
            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: '#0f172a', color: '#f1f5f9', fontSize: '13px', marginBottom: '8px', boxSizing: 'border-box' }}
          />
          <select
            value={formRole} onChange={e => setFormRole(e.target.value)}
            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: '#0f172a', color: '#f1f5f9', fontSize: '13px', marginBottom: '12px', boxSizing: 'border-box' }}
          >
            {ROLES.map(r => <option key={r} value={r}>{ROLE_META[r].emoji} {ROLE_META[r].label}</option>)}
          </select>
          <button
            onClick={handleCreateUser}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#a855f7', color: '#fff', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}
          >
            Create Account
          </button>
        </div>
      )}

      {/* ── User List ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 100px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#475569' }}>Loading...</div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#475569' }}>No users found.</div>
        ) : (
          users.map(user => {
            const meta    = ROLE_META[user.role] || ROLE_META.citizen;
            const isPending = pendingId === user.id;
            const isSelf  = user.id === ADMIN_USER_ID;

            return (
              <div key={user.id} style={{
                backgroundColor: '#1e293b',
                borderRadius: '14px',
                padding: '13px 14px',
                marginBottom: '8px',
                border: `1px solid ${isSelf ? 'rgba(168,85,247,0.4)' : 'rgba(255,255,255,0.05)'}`,
                opacity: isPending ? 0.6 : 1,
                transition: 'opacity 0.2s',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  {/* User Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <span style={{ color: '#f1f5f9', fontWeight: '700', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user.name}
                      </span>
                      {isSelf && <span style={{ backgroundColor: 'rgba(168,85,247,0.2)', color: '#a855f7', fontSize: '10px', fontWeight: '700', padding: '1px 6px', borderRadius: '999px', flexShrink: 0 }}>YOU</span>}
                    </div>
                    <p style={{ margin: '0 0 6px', color: '#475569', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      backgroundColor: meta.bg, color: meta.color,
                      padding: '3px 9px', borderRadius: '999px', fontSize: '11px', fontWeight: '700',
                    }}>
                      {meta.emoji} {meta.label}
                    </span>
                  </div>

                  {/* Role Dropdown */}
                  <div style={{ flexShrink: 0 }}>
                    <select
                      value={user.role}
                      disabled={isPending || isSelf}
                      onChange={e => handleRoleChange(user.id, e.target.value)}
                      style={{
                        padding: '7px 10px',
                        borderRadius: '8px',
                        border: `1px solid ${meta.color}55`,
                        backgroundColor: '#0f172a',
                        color: meta.color,
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: isSelf ? 'not-allowed' : 'pointer',
                        opacity: isSelf ? 0.5 : 1,
                      }}
                      title={isSelf ? 'Cannot change your own role' : `Change role for ${user.name}`}
                    >
                      {ROLES.map(r => (
                        <option key={r} value={r}>{ROLE_META[r].emoji} {ROLE_META[r].label}</option>
                      ))}
                    </select>
                    {isPending && <div style={{ textAlign: 'center', color: '#475569', fontSize: '10px', marginTop: '3px' }}>saving…</div>}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Toast Notification ── */}
      {toast && (
        <div style={{
          position: 'absolute', bottom: '90px', left: '16px', right: '16px', zIndex: 20,
          backgroundColor: toast.type === 'error' ? '#ef4444' : '#22c55e',
          color: '#fff', padding: '12px 16px', borderRadius: '12px',
          fontWeight: '700', fontSize: '13px', textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          animation: 'fadein 0.2s ease',
        }}>
          {toast.type === 'error' ? '⚠️' : '✓'} {toast.msg}
        </div>
      )}

      {/* ── Bottom Navigation Bar ── */}
      <div style={{
        position: 'absolute', bottom: 0, width: '100%', zIndex: 10,
        backgroundColor: NAV_GREEN,
        height: '80px',
        borderTopLeftRadius: '40px', borderTopRightRadius: '40px',
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        padding: '0 20px', boxSizing: 'border-box',
      }}>
        <button onClick={() => onNavigate('dashboard')} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', opacity: 0.6 }}>◎</button>
        <div style={{ position: 'relative', width: '70px', height: '70px' }}>
          <div style={{
            position: 'absolute', top: '-35px', left: '0',
            width: '70px', height: '70px', borderRadius: '50%',
            backgroundColor: '#a855f7', border: `6px solid ${NAV_GREEN}`,
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            fontSize: '28px', boxSizing: 'border-box',
          }}>⚙️</div>
        </div>
        <button onClick={() => onNavigate('dashboard')} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', opacity: 0.6 }}>◎</button>
      </div>

    </div>
  );
};

export default AdminPanelScreen;
