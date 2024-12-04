// src/components/LandingPage/LandingPage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';


const LandingPage = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/monitoring'); // Navigate to the Monitoring Page
  };  

  return (
    <div className="landing-page">
      <header className="header">
        <nav>

        </nav>
      </header>
      
      <div className="content">
        <div className="logo-container">
          <img src="/LOGO.png" alt="Fish Silage Tracker Logo" className="app-logo" />
        </div>
        <h1 className="app-title">Fish Silage Tracker</h1>
        <p className="app-description">
          Track and monitor the ambient temperature, pH level, and ammonia concentrations of your fish silage in real-time with our web application.
          Stay informed about the fermentation process to ensure optimal conditions for your fish silage production.
        </p>
        <button className="get-started-button" onClick={handleGetStarted}>
          GET STARTED
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
