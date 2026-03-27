# Disaster Response Coordination System

This repository contains the application codebase for Group 3's Disaster Response system, fulfilling the requirements for SENG 471. 

## Project Structure
The project is divided into two main directories:
* `/frontend`: React-based user interface.
* `/backend`: Python/FastAPI backend API.

## Getting Started

### 1. Running the Base UI
The frontend contains the disaster reporting screen, designed with large touch targets and high contrast for high-stress scenarios.

1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. Open the provided localhost link in your browser to view the UI.

### 2. Running the Backend API
The backend handles incident logging using an `is_verified` workflow. It uses an in-memory list for demonstration purposes and strictly avoids storing personal user data.

1. Navigate to the backend directory: `cd backend`
2. Install the required Python packages: `pip install fastapi uvicorn pydantic`
3. Start the server: `uvicorn main:app --reload`

### 3. Running the Tests
The project includes a Jest test suite to verify the auto-location functionality handles both successful API calls and permission denials.

1. Navigate to the frontend directory: `cd frontend`
2. Run the test suite: `npm test`