import React, { useState } from 'react';
import DashboardMapScreen from './DashboardMapScreen';
import ReportDisasterScreen from './ReportDisasterScreen';
import OfficialBroadcastScreen from './OfficialBroadcastScreen';

const App = () => {
  // State to manage which screen is currently visible. Defaulting to the new Dashboard.
  const [currentView, setCurrentView] = useState('dashboard'); 

  return (
    <div style={{ backgroundColor: '#1a1a1a', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Global Navigation Bar for Demo Purposes */}
      <nav style={{ 
        backgroundColor: '#222', 
        padding: '20px', 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '15px',
        boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
        zIndex: 10,
        flexWrap: 'wrap'
      }}>
        <button 
          onClick={() => setCurrentView('dashboard')}
          style={{ 
            padding: '12px 20px', borderRadius: '12px', border: 'none', 
            backgroundColor: currentView === 'dashboard' ? '#4a5d4e' : '#444', 
            color: currentView === 'dashboard' ? '#fff' : '#ccc', 
            cursor: 'pointer', fontWeight: 'bold', fontSize: '15px',
            transition: 'all 0.2s'
          }}
        >
          🗺️ Dashboard
        </button>
        <button 
          onClick={() => setCurrentView('report')}
          style={{ 
            padding: '12px 20px', borderRadius: '12px', border: 'none', 
            backgroundColor: currentView === 'report' ? '#cbdab7' : '#444', 
            color: currentView === 'report' ? '#1a1a1a' : '#ccc', 
            cursor: 'pointer', fontWeight: 'bold', fontSize: '15px',
            transition: 'all 0.2s'
          }}
        >
          🚨 Report Incident
        </button>
        <button 
          onClick={() => setCurrentView('official')}
          style={{ 
            padding: '12px 20px', borderRadius: '12px', border: 'none', 
            backgroundColor: currentView === 'official' ? '#b7c8da' : '#444', 
            color: currentView === 'official' ? '#1a1a1a' : '#ccc', 
            cursor: 'pointer', fontWeight: 'bold', fontSize: '15px',
            transition: 'all 0.2s'
          }}
        >
          🛡️ Official Dispatch
        </button>
      </nav>

      {/* Dynamic View Rendering */}
      <div style={{ flex: 1 }}>
        {currentView === 'dashboard' && <DashboardMapScreen />}
        {currentView === 'report' && <ReportDisasterScreen />}
        {currentView === 'official' && <OfficialBroadcastScreen />}
      </div>

    </div>
  );
};

export default App;