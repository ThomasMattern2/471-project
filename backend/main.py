from fastapi import FastAPI
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