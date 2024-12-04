import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage/LandingPage.js';
import MonitoringPage from './components/MonitoringPage/MonitoringPage.js';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />         {/* Default Landing Page Route */}
        <Route path="/monitoring" element={<MonitoringPage />} /> {/* Monitoring Page Route */}
      </Routes>
    </Router>
  );
};

export default App;
