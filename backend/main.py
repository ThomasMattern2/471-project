from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import uuid

app = FastAPI(title="Disaster Response API")

# Allow CORS so the React frontend can make requests to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for demonstration (replacing MongoDB)
incidents_db = []

# Schema for incoming disaster reports (Strictly no PII)
class IncidentReport(BaseModel):
    disasterType: str = Field(..., description="Type of disaster (e.g., Fire, Flood, Earthquake, Other)")
    coordinates: List[float] = Field(..., description="[longitude, latitude]")
    photos: Optional[List[str]] = []
    hasCasualties: bool = False
    otherInfo: Optional[str] = ""

# Schema for the saved incident, including system-generated fields
class IncidentResponse(IncidentReport):
    id: str
    is_verified: bool = False
    reportedAt: datetime

@app.post("/api/incidents", response_model=IncidentResponse, status_code=201)
async def create_incident(incident: IncidentReport):
    # Create the incident, defaulting to unverified
    new_incident = IncidentResponse(
        id=str(uuid.uuid4()),
        **incident.model_dump(),
        is_verified=False, 
        reportedAt=datetime.now()
    )
    
    # Save to our in-memory list
    incidents_db.append(new_incident)
    
    return new_incident

@app.get("/api/incidents", response_model=List[IncidentResponse])
async def get_incidents():
    # Helper endpoint to let you verify the data is saving
    return incidents_db