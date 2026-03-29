import React, { useState } from 'react';
import DashboardMapScreen from './DashboardMapScreen';
import ReportDisasterScreen from './ReportDisasterScreen';
import OfficialBroadcastScreen from './OfficialBroadcastScreen';
import FirstResponderScreen from './FirstResponderScreen';
import IncidentVerificationScreen from './IncidentVerificationScreen';
import PostEventReportScreen from './PostEventReportScreen';
import SafetyPlaybookScreen from './SafetyPlaybookScreen';

const App = () => {
  // State to manage which screen is currently visible
  const [currentView, setCurrentView] = useState('dashboard'); 
  
  // State to manage the mock user role for the demo
  const [userRole, setUserRole] = useState('citizen'); // 'citizen' | 'government'

  return (
    <div style={{ backgroundColor: '#1a1a1a', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* --- DEMO ROLE SWITCHER (For Graders/Presentations) --- */}
      <div style={{ 
        backgroundColor: '#333', 
        padding: '10px 20px', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        gap: '15px',
        color: '#fff',
        fontFamily: 'sans-serif',
        borderBottom: '2px solid #555'
      }}>
        <span style={{ fontWeight: 'bold' }}>Demo Persona:</span>
        <select 
          value={userRole} 
          onChange={(e) => {
            setUserRole(e.target.value);
            setCurrentView('dashboard'); // Reset to dashboard on role change
          }}
          style={{ padding: '8px', borderRadius: '5px', cursor: 'pointer', backgroundColor: '#fff', color: '#000', fontWeight: 'bold' }}
        >
          <option value="citizen">👤 Civilian (Can Report)</option>
          <option value="government">🛡️ Government (Can Dispatch &amp; Verify)</option>
          <option value="first_responder">🚒 First Responder (Can Update Status)</option>
        </select>
      </div>

      {/* Dynamic View Rendering */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', paddingTop: '20px' }}>
        {currentView === 'dashboard'      && <DashboardMapScreen          onNavigate={setCurrentView} role={userRole} />}
        {currentView === 'report'         && <ReportDisasterScreen         onNavigate={setCurrentView} />}
        {currentView === 'official'       && <OfficialBroadcastScreen      onNavigate={setCurrentView} />}
        {currentView === 'firstresponder' && <FirstResponderScreen         onNavigate={setCurrentView} />}
        {currentView === 'verify'         && <IncidentVerificationScreen   onNavigate={setCurrentView} />}
        {currentView === 'postreport'     && <PostEventReportScreen        onNavigate={setCurrentView} />}
        {currentView === 'playbook'        && <SafetyPlaybookScreen         onNavigate={setCurrentView} />}
      </div>

    </div>
  );
};

export default App;