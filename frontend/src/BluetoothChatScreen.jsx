import React, { useState, useEffect, useRef, useCallback } from 'react';

// ─── S4G3A-29: Offline Mesh Chat UI ──────────────────────────────────────────
// Connects to the WebSocket relay at /ws/mesh, which simulates a BLE mesh.
// Falls back to HTTP polling (/api/mesh/log) if WebSocket is unavailable.

const WS_URL  = 'ws://127.0.0.1:8000/ws/mesh';
const POLL_URL = 'http://127.0.0.1:8000/api/mesh/log';

const QUICK_REPLIES = ['Are you safe?', 'I need help', 'I do! ✋', 'On my way', 'Stay put'];

const PEER_COLORS = [
  '#3b82f6', '#f59e0b', '#22c55e', '#a855f7',
  '#ec4899', '#14b8a6', '#f97316',
];

function colorForId(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return PEER_COLORS[Math.abs(hash) % PEER_COLORS.length];
}

function initials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// ─── Main Component ───────────────────────────────────────────────────────────
const BluetoothChatScreen = ({ onNavigate }) => {
  // Generate a stable session identity
  const [myId]   = useState(() => `peer-${Math.random().toString(36).slice(2, 7)}`);
  const [myName] = useState(() => {
    const names = ['Alex', 'Jordan', 'Morgan', 'Casey', 'Taylor', 'Quinn', 'Riley'];
    return names[Math.floor(Math.random() * names.length)];
  });

  const [messages, setMessages]     = useState([]);
  const [input, setInput]           = useState('');
  const [peers, setPeers]           = useState(new Set());
  const [connState, setConnState]   = useState('connecting'); // connecting | open | polling | error
  const [pollingMode, setPollingMode] = useState(false);

  const wsRef      = useRef(null);
  const pollRef    = useRef(null);
  const bottomRef  = useRef(null);
  const seenIds    = useRef(new Set());

  // ── Scroll to bottom on new messages ──────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Ingest a packet (dedup by timestamp+sender) ──────────────────────────
  const ingestPacket = useCallback((pkt) => {
    const key = `${pkt.sender_id}-${pkt.timestamp}`;
    if (seenIds.current.has(key)) return;
    seenIds.current.add(key);

    if (pkt.type === 'join' || pkt.type === 'leave') {
      setPeers(prev => {
        const next = new Set(prev);
        pkt.type === 'join' ? next.add(pkt.sender_id) : next.delete(pkt.sender_id);
        return next;
      });
      setMessages(prev => [...prev, { ...pkt, isSystem: true }]);
    } else if (pkt.type === 'message' || pkt.type === 'history') {
      setMessages(prev => [...prev, { ...pkt, isSystem: false }]);
      if (pkt.type === 'message') {
        setPeers(prev => new Set([...prev, pkt.sender_id]));
      }
    }
  }, []);

  // ── HTTP polling fallback ──────────────────────────────────────────────────
  const startPolling = useCallback(() => {
    setPollingMode(true);
    setConnState('polling');
    const poll = async () => {
      try {
        const res = await fetch(POLL_URL);
        if (res.ok) {
          const log = await res.json();
          log.forEach(ingestPacket);
        }
      } catch (_) {}
    };
    poll();
    pollRef.current = setInterval(poll, 2000);
  }, [ingestPacket]);

  // ── WebSocket connection ───────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams({ sender_id: myId, display_name: myName });
    let ws;
    try {
      ws = new WebSocket(`${WS_URL}?${params}`);
      wsRef.current = ws;
    } catch (_) {
      startPolling();
      return;
    }

    const timeout = setTimeout(() => {
      if (ws.readyState !== WebSocket.OPEN) {
        ws.close();
        startPolling();
      }
    }, 3000);

    ws.onopen = () => {
      clearTimeout(timeout);
      setConnState('open');
    };

    ws.onmessage = (e) => {
      try { ingestPacket(JSON.parse(e.data)); } catch (_) {}
    };

    ws.onerror = () => {
      clearTimeout(timeout);
      if (!pollingMode) startPolling();
    };

    ws.onclose = () => {
      setConnState(prev => prev === 'open' ? 'error' : prev);
    };

    return () => {
      clearTimeout(timeout);
      ws.close();
      clearInterval(pollRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Send a message ─────────────────────────────────────────────────────────
  const sendMessage = useCallback((text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const pkt = {
      type:         'message',
      sender_id:    myId,
      display_name: myName,
      text:         trimmed,
      timestamp:    new Date().toISOString(),
    };

    // Optimistic local render
    ingestPacket(pkt);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(pkt));
    }
    // In polling mode the server would need a POST endpoint;
    // for the demo, messages still show locally.
    setInput('');
  }, [myId, myName, ingestPacket]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  // ── Styles ──────────────────────────────────────────────────────────────────
  const NAV_GREEN = '#cde0c5';

  const connBadge = {
    connecting: { bg: '#1e3a5f', color: '#93c5fd', icon: '🔵', label: 'Connecting…'     },
    open:       { bg: '#14532d', color: '#86efac', icon: '📡', label: 'Mesh Active'      },
    polling:    { bg: '#1e3a5f', color: '#93c5fd', icon: '🔄', label: 'Polling Mode'     },
    error:      { bg: '#7f1d1d', color: '#fca5a5', icon: '📵', label: 'Relay Offline'    },
  }[connState];

  return (
    <div style={{
      width: '390px', minHeight: '844px',
      backgroundColor: '#0d1117',
      borderRadius: '40px',
      boxShadow: '0 30px 80px rgba(0,0,0,0.7)',
      overflow: 'hidden',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      position: 'relative',
      display: 'flex', flexDirection: 'column',
    }}>

      {/* ── Connection Banner ── */}
      <div style={{ backgroundColor: connBadge.bg, color: connBadge.color, padding: '7px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: '700', letterSpacing: '0.3px' }}>
        <span>{connBadge.icon} {connBadge.label}</span>
        <span style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '999px', fontSize: '11px' }}>
          {peers.size} peer{peers.size !== 1 ? 's' : ''} nearby
        </span>
      </div>

      {/* ── Status Bar ── */}
      <div style={{ padding: '10px 24px 0', display: 'flex', justifyContent: 'space-between', color: '#30363d', fontSize: '13px', fontWeight: '600' }}>
        <span>9:41</span>
        <div style={{ display: 'flex', gap: '6px' }}><span>📵</span><span>🔋</span></div>
      </div>

      {/* ── Header ── */}
      <div style={{ padding: '10px 20px 10px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #161b22' }}>
        <button onClick={() => onNavigate('dashboard')} style={{ background: 'none', border: 'none', color: '#6e7681', fontSize: '20px', cursor: 'pointer', padding: 0, lineHeight: 1 }}>←</button>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, color: '#e6edf3', fontSize: '17px', fontWeight: '800' }}>Mesh Chat</h1>
          <p style={{ margin: 0, color: '#6e7681', fontSize: '11px' }}>You: <span style={{ color: colorForId(myId), fontWeight: '700' }}>{myName}</span></p>
        </div>
        <button
          onClick={() => onNavigate('dashboard')}
          style={{ backgroundColor: '#1e3a5f', color: '#93c5fd', border: 'none', borderRadius: '8px', padding: '6px 10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
        >
          📞 FOR HELP
        </button>
      </div>

      {/* ── Message List ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>

        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#30363d' }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>📡</div>
            <p style={{ margin: 0, fontWeight: '700', color: '#6e7681', fontSize: '13px' }}>Waiting for nearby peers…</p>
            <p style={{ margin: '6px 0 0', color: '#30363d', fontSize: '12px' }}>Anyone on the same network will appear here automatically.</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMe = msg.sender_id === myId;

          // ── System message (join/leave) ──
          if (msg.isSystem) {
            return (
              <div key={i} style={{ textAlign: 'center' }}>
                <span style={{ backgroundColor: '#161b22', color: '#6e7681', fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '999px' }}>
                  {msg.type === 'join' ? '👋' : '🚪'} {msg.text}
                </span>
              </div>
            );
          }

          // ── Chat bubble ──
          const peerColor = colorForId(msg.sender_id);
          return (
            <div key={i} style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: '8px' }}>
              {/* Avatar */}
              {!isMe && (
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: peerColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800', color: '#fff', flexShrink: 0 }}>
                  {initials(msg.display_name)}
                </div>
              )}

              <div style={{ maxWidth: '72%' }}>
                {!isMe && (
                  <div style={{ color: peerColor, fontSize: '11px', fontWeight: '700', marginBottom: '3px', paddingLeft: '2px' }}>{msg.display_name}</div>
                )}
                <div style={{
                  backgroundColor: isMe ? '#1f6feb' : '#161b22',
                  color: isMe ? '#fff' : '#e6edf3',
                  padding: '9px 13px',
                  borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  fontSize: '14px',
                  lineHeight: '1.45',
                  border: isMe ? 'none' : '1px solid #30363d',
                }}>
                  {msg.text}
                </div>
                <div style={{ color: '#30363d', fontSize: '10px', marginTop: '3px', textAlign: isMe ? 'right' : 'left', paddingLeft: isMe ? 0 : '2px' }}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* ── Quick Replies ── */}
      <div style={{ padding: '8px 12px 0', display: 'flex', gap: '6px', overflowX: 'auto' }}>
        {QUICK_REPLIES.map(qr => (
          <button
            key={qr}
            onClick={() => sendMessage(qr)}
            style={{ flexShrink: 0, padding: '6px 12px', borderRadius: '999px', border: '1px solid #30363d', backgroundColor: '#161b22', color: '#8b949e', fontSize: '12px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            {qr}
          </button>
        ))}
      </div>

      {/* ── Input Bar ── */}
      <div style={{ padding: '8px 12px 90px', display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message here…"
          rows={1}
          style={{
            flex: 1, padding: '11px 14px',
            borderRadius: '22px',
            border: '1px solid #30363d',
            backgroundColor: '#161b22',
            color: '#e6edf3', fontSize: '14px',
            resize: 'none', outline: 'none',
            lineHeight: '1.4',
            fontFamily: 'inherit',
          }}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim()}
          style={{
            width: '42px', height: '42px', borderRadius: '50%', border: 'none',
            backgroundColor: input.trim() ? '#1f6feb' : '#21262d',
            color: '#fff', fontSize: '18px', cursor: input.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'background 0.15s',
          }}
        >
          ➤
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
        <button onClick={() => onNavigate('dashboard')} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', opacity: 0.6 }}>◎</button>
        <div style={{ position: 'relative', width: '70px', height: '70px' }}>
          <div style={{
            position: 'absolute', top: '-35px', left: '0',
            width: '70px', height: '70px', borderRadius: '50%',
            backgroundColor: connState === 'open' ? '#22c55e' : '#1e3a5f',
            border: `6px solid ${NAV_GREEN}`,
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            fontSize: '28px', boxSizing: 'border-box',
          }}>
            💬
          </div>
        </div>
        <button onClick={() => onNavigate('dashboard')} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', opacity: 0.6 }}>◎</button>
      </div>

    </div>
  );
};

export default BluetoothChatScreen;
