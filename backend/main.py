from fastapi import FastAPI, HTTPException, Header, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import uuid
import math
import json

app = FastAPI(title="Disaster Response Coordination System API")

# Allow CORS for local React development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- IN-MEMORY DATABASES ---
incidents_db  = []
broadcasts_db = []
responders_db = []

# ─── S4G3A-37: Role-Based Access Control ────────────────────────────────────────
VALID_ROLES = {"citizen", "government", "first_responder", "system_admin"}

# Seeded demo user accounts
users_db = [
    {"id": "user-001", "email": "alice@calgary.ca",        "name": "Alice Chen",    "role": "citizen",        "createdAt": "2026-01-10T09:00:00"},
    {"id": "user-002", "email": "bob@calgary.gov.ca",      "name": "Bob Okafor",    "role": "government",     "createdAt": "2026-01-10T09:05:00"},
    {"id": "user-003", "email": "charlie@fire.calgary.ca", "name": "Charlie Ross",  "role": "first_responder","createdAt": "2026-01-10T09:10:00"},
    {"id": "user-004", "email": "diana@ems.calgary.ca",    "name": "Diana Patel",   "role": "first_responder","createdAt": "2026-01-11T08:30:00"},
    {"id": "user-005", "email": "eve@calgary.gov.ca",      "name": "Eve Nguyen",    "role": "government",     "createdAt": "2026-01-12T10:00:00"},
    {"id": "user-006", "email": "admin@drcs.ca",           "name": "System Admin",  "role": "system_admin",   "createdAt": "2026-01-01T00:00:00"},
]

def get_user_or_raise(x_user_id: str = Header(default=None, alias="X-User-Id")):
    """Resolve the caller's identity from the X-User-Id request header."""
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Missing X-User-Id header")
    user = next((u for u in users_db if u["id"] == x_user_id), None)
    if not user:
        raise HTTPException(status_code=403, detail="Unknown user ID")
    return user

def require_role(*allowed_roles: str):
    """Factory: returns a FastAPI dependency that enforces one of the given roles."""
    def checker(caller: dict = Depends(get_user_or_raise)):
        if caller["role"] not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Role '{caller['role']}' is not authorised for this action. Required: {list(allowed_roles)}"
            )
        return caller
    return checker

# --- SCHEMAS ---

class UserRoleUpdate(BaseModel):
    role: str = Field(..., description="New role: citizen | government | first_responder | system_admin")

class IncidentReport(BaseModel):
    disasterType: str = Field(..., description="Type of disaster")
    coordinates: List[float] = Field(..., description="[longitude, latitude]")
    photos: Optional[List[str]] = []
    hasCasualties: bool = False
    otherInfo: Optional[str] = ""

class IncidentResponse(IncidentReport):
    id: str
    is_verified: bool = False
    reportedAt: datetime
    severity: Optional[str] = None
    verifiedAt: Optional[datetime] = None

class VerifyIncidentRequest(BaseModel):
    severity: str = Field(..., description="Severity level: low, medium, high, critical")

class ResponderStatusRequest(BaseModel):
    responder_id: str = Field(..., description="ID of the first responder")
    incident_id: str  = Field(..., description="ID of the incident being responded to")
    status: str       = Field(..., description="Current status: En Route, On Scene, Need Assistance, Complete")
    notes: Optional[str] = ""

class BroadcastRequest(BaseModel):
    message: str = Field(..., description="The urgent update message")
    center_coordinates: List[float] = Field(..., description="[longitude, latitude] of the epicenter")
    radius_km: float = Field(..., description="Target alert radius in kilometers")

# --- UTILITY FUNCTIONS ---
def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates distance in km using the Haversine formula."""
    R = 6371.0 # Radius of the Earth in km
    dlon = math.radians(lon2) - math.radians(lon1)
    dlat = math.radians(lat2) - math.radians(lat1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

# --- API ENDPOINTS ---

@app.post("/api/incidents", response_model=IncidentResponse, status_code=201)
async def create_incident(incident: IncidentReport):
    """S4G3A-18: Submit a new disaster report (defaults to unverified). Open to all authenticated users."""
    new_incident = IncidentResponse(
        id=str(uuid.uuid4()),
        **incident.model_dump(),
        is_verified=False, 
        reportedAt=datetime.now()
    )
    incidents_db.append(new_incident)
    return new_incident

@app.get("/api/incidents", response_model=List[IncidentResponse])
async def get_incidents():
    """Helper endpoint to view all reported incidents"""
    return incidents_db

@app.post("/api/broadcasts", status_code=201)
async def create_broadcast(
    broadcast: BroadcastRequest,
    caller: dict = Depends(require_role("government", "system_admin"))
):
    """S4G3A-33: Dispatch a targeted broadcast. Restricted to government officials and admins."""
    new_broadcast = {
        "id": str(uuid.uuid4()),
        "message": broadcast.message,
        "target_zone": {
            "center": broadcast.center_coordinates,
            "radius_km": broadcast.radius_km
        },
        "sentAt":    datetime.now(),
        "sentBy":    caller["id"],
    }
    broadcasts_db.append(new_broadcast)
    return {"status": "success", "data": new_broadcast}

@app.get("/api/broadcasts")
async def get_broadcasts():
    """Helper endpoint to view all dispatched broadcasts"""
    return broadcasts_db

@app.patch("/api/incidents/{incident_id}/verify", response_model=IncidentResponse)
async def verify_incident(
    incident_id: str,
    verify_data: VerifyIncidentRequest,
    caller: dict = Depends(require_role("government", "system_admin"))
):
    """Verify an incident and set severity. Restricted to government officials and admins."""
    valid_severities = {"low", "medium", "high", "critical"}
    if verify_data.severity not in valid_severities:
        raise HTTPException(status_code=400, detail=f"Invalid severity. Must be one of: {', '.join(valid_severities)}")
    for i, incident in enumerate(incidents_db):
        if incident.id == incident_id:
            updated = incident.model_copy(update={
                "is_verified": True,
                "severity":    verify_data.severity,
                "verifiedAt":  datetime.now(),
            })
            incidents_db[i] = updated
            return updated
    raise HTTPException(status_code=404, detail="Incident not found")

@app.post("/api/responders/status", status_code=201)
async def update_responder_status(status_update: ResponderStatusRequest):
    """Submit a first responder status update.
    'Need Assistance' is publicly visible; all other statuses route to the government dashboard only."""
    valid_statuses = {"En Route", "On Scene", "Need Assistance", "Complete"}
    if status_update.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}")
    entry = {
        "id":           str(uuid.uuid4()),
        "responder_id": status_update.responder_id,
        "incident_id":  status_update.incident_id,
        "status":       status_update.status,
        "notes":        status_update.notes,
        "is_public":    status_update.status == "Need Assistance",
        "submittedAt":  datetime.now().isoformat(),
    }
    responders_db.append(entry)
    return {"status": "success", "data": entry}

@app.get("/api/responders/status")
async def get_responder_statuses():
    """Helper endpoint to view all responder status updates"""
    return responders_db

@app.get("/api/incidents/{incident_id}/report")
async def get_incident_report(incident_id: str):
    """Compiled timeline for a single incident: full incident details + all linked responder updates"""
    incident = next((inc for inc in incidents_db if inc.id == incident_id), None)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    linked_updates = sorted(
        [r for r in responders_db if r["incident_id"] == incident_id],
        key=lambda x: x["submittedAt"]
    )
    return {
        "incident":           incident,
        "responder_timeline": linked_updates,
        "generated_at":       datetime.now().isoformat(),
    }

# ─── S4G3A-37 / S4G3A-38: Admin User Management Endpoints ──────────────────────

@app.get("/api/admin/users")
async def list_users(caller: dict = Depends(require_role("system_admin"))):
    """S4G3A-38: Return all user accounts. System admin only."""
    return users_db

@app.patch("/api/admin/users/{user_id}/role")
async def assign_user_role(
    user_id: str,
    body: UserRoleUpdate,
    caller: dict = Depends(require_role("system_admin"))
):
    """S4G3A-37: Assign a role to a specific account. System admin only."""
    if body.role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {', '.join(VALID_ROLES)}")
    if caller["id"] == user_id and body.role != "system_admin":
        raise HTTPException(status_code=400, detail="Admins cannot demote their own account")
    for i, user in enumerate(users_db):
        if user["id"] == user_id:
            users_db[i] = {**user, "role": body.role}
            return {"status": "success", "user": users_db[i]}
    raise HTTPException(status_code=404, detail="User not found")

@app.post("/api/admin/users", status_code=201)
async def create_user(
    name: str,
    email: str,
    role: str = "citizen",
    caller: dict = Depends(require_role("system_admin"))
):
    """S4G3A-38: Register a new user account with an initial role. System admin only."""
    if role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail=f"Invalid role.")
    if any(u["email"] == email for u in users_db):
        raise HTTPException(status_code=409, detail="Email already registered")
    new_user = {
        "id":        f"user-{str(uuid.uuid4())[:8]}",
        "email":     email,
        "name":      name,
        "role":      role,
        "createdAt": datetime.now().isoformat(),
    }
    users_db.append(new_user)
    return {"status": "success", "user": new_user}


# ─── S4G3A-27 / S4G3A-28: Bluetooth Mesh Simulation via WebSocket ──────────────
#
# DESIGN NOTE (S4G3A-27 — Research & Documentation)
# ──────────────────────────────────────────────────
# Real-world BLE mesh (Bluetooth 4.0+ with GATT) requires native platform APIs
# (Android BLE, iOS CoreBluetooth) not available in a web browser. The Web
# Bluetooth API covers single-device pairing only, not ad-hoc mesh.
#
# SIMULATION APPROACH: WebSocket broadcast on LAN
#   - All clients on the same local network connect to ws://[server]:8000/ws/mesh
#   - The server acts as a relay node, broadcasting every message to all peers
#   - Each message carries a sender_id and display_name — no server-side auth
#     required because the channel is implicitly local/physical-proximity scoped
#   - In production, replace this relay with a BLE GATT characteristic write +
#     notify loop, or a Wi-Fi Aware (NAN) UDP multicast on the same SSID
#
# MESSAGE ROUTING LOGIC (S4G3A-28)
# ─────────────────────────────────
# Packet schema:  { type, sender_id, display_name, text, timestamp }
# Types:
#   "join"    — peer announces presence; server broadcasts to all
#   "message" — user-typed chat message; server broadcasts to all
#   "leave"   — peer disconnects (generated server-side on WebSocketDisconnect)
#
# The server keeps an in-memory log of the last 100 messages for late-joiners.

MESH_LOG_MAX = 100
mesh_log: list = []          # rolling message history
mesh_peers: dict = {}        # { ws: { sender_id, display_name } }

class MeshConnectionManager:
    """Simple broadcast relay — simulates BLE mesh on a local network."""

    async def connect(self, ws: WebSocket, sender_id: str, display_name: str):
        await ws.accept()
        mesh_peers[ws] = {"sender_id": sender_id, "display_name": display_name}
        join_pkt = {
            "type": "join",
            "sender_id": sender_id,
            "display_name": display_name,
            "text": f"{display_name} joined the mesh",
            "timestamp": datetime.now().isoformat(),
        }
        mesh_log.append(join_pkt)
        if len(mesh_log) > MESH_LOG_MAX:
            mesh_log.pop(0)
        await self._broadcast(join_pkt, exclude=None)

    def disconnect(self, ws: WebSocket):
        peer = mesh_peers.pop(ws, None)
        if peer:
            leave_pkt = {
                "type": "leave",
                "sender_id": peer["sender_id"],
                "display_name": peer["display_name"],
                "text": f"{peer['display_name']} left the mesh",
                "timestamp": datetime.now().isoformat(),
            }
            mesh_log.append(leave_pkt)
            if len(mesh_log) > MESH_LOG_MAX:
                mesh_log.pop(0)
            return leave_pkt
        return None

    async def relay(self, ws: WebSocket, raw: str):
        try:
            pkt = json.loads(raw)
        except json.JSONDecodeError:
            return
        pkt["type"]      = "message"
        pkt["timestamp"] = datetime.now().isoformat()
        mesh_log.append(pkt)
        if len(mesh_log) > MESH_LOG_MAX:
            mesh_log.pop(0)
        await self._broadcast(pkt, exclude=None)

    async def _broadcast(self, pkt: dict, exclude):
        dead = []
        for peer_ws in list(mesh_peers):
            if peer_ws is exclude:
                continue
            try:
                await peer_ws.send_text(json.dumps(pkt))
            except Exception:
                dead.append(peer_ws)
        for d in dead:
            mesh_peers.pop(d, None)

    async def broadcast_leave(self, pkt: dict):
        await self._broadcast(pkt, exclude=None)

mesh_manager = MeshConnectionManager()


@app.websocket("/ws/mesh")
async def mesh_websocket(
    ws: WebSocket,
    sender_id: str = "anon",
    display_name: str = "Unknown",
):
    """S4G3A-28: WebSocket relay — simulates BLE mesh broadcast on LAN."""
    await mesh_manager.connect(ws, sender_id, display_name)
    # Send message history to the new peer
    for pkt in mesh_log[:-1]:   # all but the join we just appended
        try:
            await ws.send_text(json.dumps({**pkt, "type": "history"}))
        except Exception:
            break
    try:
        while True:
            data = await ws.receive_text()
            await mesh_manager.relay(ws, data)
    except WebSocketDisconnect:
        leave_pkt = mesh_manager.disconnect(ws)
        if leave_pkt:
            await mesh_manager.broadcast_leave(leave_pkt)


@app.get("/api/mesh/log")
async def get_mesh_log():
    """HTTP fallback: return last 100 mesh messages for polling-based clients."""
    return mesh_log