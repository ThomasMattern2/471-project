from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import uuid
import math

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
incidents_db = []
broadcasts_db = []
responders_db = []

# --- SCHEMAS ---
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
    """S4G3A-18: Submit a new disaster report (defaults to unverified)"""
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
async def create_broadcast(broadcast: BroadcastRequest):
    """S4G3A-33: Dispatch a targeted broadcast to a specific radius"""
    new_broadcast = {
        "id": str(uuid.uuid4()),
        "message": broadcast.message,
        "target_zone": {
            "center": broadcast.center_coordinates,
            "radius_km": broadcast.radius_km
        },
        "sentAt": datetime.now()
    }
    broadcasts_db.append(new_broadcast)
    
    # In production, this would filter active users via calculate_distance() 
    # and push the notification payload to their devices.
    
    return {"status": "success", "data": new_broadcast}

@app.get("/api/broadcasts")
async def get_broadcasts():
    """Helper endpoint to view all dispatched broadcasts"""
    return broadcasts_db

@app.patch("/api/incidents/{incident_id}/verify", response_model=IncidentResponse)
async def verify_incident(incident_id: str, verify_data: VerifyIncidentRequest):
    """Verify an incident report and set its severity level (government officials only)"""
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
