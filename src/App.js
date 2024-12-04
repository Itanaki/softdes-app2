  // src/App.js
  import React from 'react';
  import { BrowserRouter as Router, Routes, Route} from 'react-router-dom';
  import LandingPage from './components/LandingPage/LandingPage.js';
  import MonitoringPage from './components/MonitoringPage/MonitoringPage.js';

  const App = () => {
    return (
      <Router>
        <Routes>
          <Route path="/HOME" element={<LandingPage />} />         {/* Landing Page Route */}
          <Route path="/monitoring" element={<MonitoringPage />} /> {/* Monitoring Page Route */}
        </Routes>
      </Router>
    );
  };

  export default App;