import React, { useState, useEffect } from "react";
import "./MonitoringPage.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { doc, getDoc, onSnapshot, updateDoc, collection, getDocs } from "firebase/firestore"; 
import { db } from "../../firebaseConfig.js"; // Corrected path
import leftImage from "../assets/left.png";
import rightImage from "../assets/right.png";



const getCurrentDate = () => {
  const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
  return new Date().toLocaleDateString("en-PH", options); // Philippines timezone
};

const MonitoringPage = () => {
  const [lastPHLevel, setLastPHLevel] = useState(null);
  const [lastAmmonia, setLastAmmonia] = useState(null);
  const [lastTemperature, setLastTemperature] = useState(null);
  const currentDate = getCurrentDate();
  const [pHLevel, setPHLevel] = useState(null);
  const [ammonia, setAmmonia] = useState(null);
  const [currentTemperature, setCurrentTemperature] = useState(null);
  const [acidDose, setAcidDose] = useState(null);
  const [baseDose, setBaseDose] = useState(null);
  const [mixingSpeed, setMixingSpeed] = useState(null);
  const [temperature, setTemperature] = useState(null);
  const [data, setData] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showGuideline, setShowGuideline] = useState(false); // State for guidelines visibility
  const controlsDocRef = doc(db, "controls", "userInputs"); // Firestore reference
// Handle online/offline status changes
useEffect(() => {
  const handleOnline = () => setIsOnline(true); // Set online when the device connects
  const handleOffline = () => setIsOnline(false); // Set offline when the device disconnects

  // Add event listeners
  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  // Cleanup listeners on component unmount
  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  };
}, []); // Empty dependency array ensures this runs once on mount

  const fetchPreviousReading = async (currentTimestamp) => {
    try {
      const historyCollectionRef = collection(db, "history");
      const querySnapshot = await getDocs(historyCollectionRef);
  
      const historyData = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        let timestamp;
  
        // Handle Firestore timestamps
        if (data.timestamp?.seconds) {
          timestamp = new Date(data.timestamp.seconds * 1000);
        } else if (typeof data.timestamp === "string") {
          timestamp = new Date(data.timestamp);
        } else {
          console.warn(`Invalid timestamp format for document ${doc.id}`);
          return;
        }
  
        historyData.push({
          pHLevel: data.pHLevel.toFixed(2),
          timestamp,
          docId: doc.id, // Save document ID if needed
        });
      });
  
      // Sort the data by timestamp (descending)
      const sortedData = historyData.sort((a, b) => b.timestamp - a.timestamp);
  
      // Find the previous reading (the one before the current reading)
      const previousReading = sortedData.find(
        (data) => data.timestamp < new Date(currentTimestamp)
      );
  
      if (previousReading) {
        console.log("Previous Reading:", previousReading);
        return previousReading;
      } else {
        console.warn("No previous reading found.");
        return null;
      }
    } catch (error) {
      console.error("Error fetching previous reading:", error);
      return null;
    }
  };


// Fetch sensor readings and control values from Firestore
useEffect(() => {

  const sensorDocRef = doc(db, "sensors", "currentReadings");
  const unsubscribeSensor = onSnapshot(sensorDocRef, async (doc) => {
    if (doc.exists()) {
      const sensorData = doc.data();

      // Update the last reading if the current reading has changed
      if (sensorData.pHLevel !== null && sensorData.pHLevel.toFixed(2) !== pHLevel) {
        const previousReading = await fetchPreviousReading(sensorData.timestamp);
        setLastPHLevel(previousReading?.pHLevel ?? "No data");
        setPHLevel(sensorData.pHLevel.toFixed(2));
      }

      // Handle Ammonia
      if (sensorData.ammonia !== null) {
        if (sensorData.ammonia.toFixed(2) !== ammonia) {
          setLastAmmonia(ammonia); // Store current ammonia as the last reading
          setAmmonia(sensorData.ammonia.toFixed(2)); // Update current ammonia
        }
      }

      // Handle Temperature
      if (sensorData.currentTemperature !== null) {
        if (sensorData.currentTemperature.toFixed(1) !== currentTemperature) {
          setLastTemperature(currentTemperature); // Store current temperature as the last reading
          setCurrentTemperature(sensorData.currentTemperature.toFixed(1)); // Update current temperature
        }
      }

      // Update chart data
      setData((prevData) => [
        ...prevData.slice(-9),
        {
          time: new Date(sensorData.timestamp).toLocaleTimeString("en-PH", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          pH: sensorData.pHLevel.toFixed(2),
        },
      ]);
    }
  });

  

  const fetchControls = async () => {
    const controlsSnap = await getDoc(controlsDocRef);
    if (controlsSnap.exists()) {
      const controlsData = controlsSnap.data();
      setAcidDose(controlsData.acidDose);
      setBaseDose(controlsData.baseDose);
      setMixingSpeed(controlsData.mixingSpeed);
      setTemperature(controlsData.targetTemperature);
    }
  };

  fetchControls();
  
  return () => {
    if (unsubscribeSensor) {
      unsubscribeSensor(); // Cleanup subscription
    }
  };
}, []); // Empty dependency array

  const fetchHistoryData = async () => {
    try {
      const historyCollectionRef = collection(db, "history");
      const querySnapshot = await getDocs(historyCollectionRef);

      const historyData = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        let timestamp;

        // Handle Firestore timestamps
        if (data.timestamp?.seconds) {
          timestamp = new Date(data.timestamp.seconds * 1000);
        } else if (typeof data.timestamp === "string") {
          timestamp = new Date(data.timestamp);
        } else {
          console.warn(`Invalid timestamp format for document ${doc.id}`);
          return;
        }

        const formattedTime = timestamp.toLocaleTimeString("en-PH", {
          hour: "2-digit",
          minute: "2-digit",
        });

        historyData.push({
          time: formattedTime,
          pH: (data.pHLevel || 0).toFixed(2),
          rawTimestamp: timestamp,
        });
      });

      // Sort and display the latest 10 readings
      const sortedData = historyData
        .sort((a, b) => b.rawTimestamp - a.rawTimestamp) // Sort descending
        .slice(0, 10) // Get 10 most recent records
        .reverse(); // Reverse for oldest-to-newest order

      setData(sortedData); // Update chart data
    } catch (error) {
      console.error("Error fetching history data:", error);
    }
  };
  fetchHistoryData();
  


  // Updated control states
  const [updatedAcidDose, setUpdatedAcidDose] = useState(null);
  const [updatedBaseDose, setUpdatedBaseDose] = useState(null);
  const [updatedTemperature, setUpdatedTemperature] = useState(null);
  const [updatedMixingSpeed, setUpdatedMixingSpeed] = useState(null);

  useEffect(() => {
    setUpdatedAcidDose(acidDose);
    setUpdatedBaseDose(baseDose);
    setUpdatedTemperature(temperature);
  }, [acidDose, baseDose, temperature, mixingSpeed]);

  const handleSubmit = async () => {
    // Validate if both acid and base doses are set
    if (updatedAcidDose > 0 && updatedBaseDose > 0) {
      // If both are greater than 0, show an error
      alert("Error: Acid and Base cannot be dispensed at the same time. Please set one of them to 0.");
      
      // Reset both acidDose and baseDose to 0
      setUpdatedAcidDose(0);
      setUpdatedBaseDose(0);
      
      return; // Stop further execution
    }
  
    try {
      const timestamp = new Date().toLocaleString("en-PH", {
        timeZone: "Asia/Manila",
      });
  
      // Proceed with updating Firestore
      await updateDoc(controlsDocRef, {
        acidDose: updatedAcidDose,
        baseDose: updatedBaseDose,
        targetTemperature: updatedTemperature,
        mixingSpeed: updatedMixingSpeed,
        timestamp: timestamp,
        doAction: true,
      });
  
      alert(`Submitted:
        Acid Dose: ${updatedAcidDose} mL
        Base Dose: ${updatedBaseDose} mL
        Target Temperature: ${updatedTemperature}°C
        Mixing Speed: ${updatedMixingSpeed}
        Timestamp: ${timestamp}`);
    } catch (error) {
      console.error("Error submitting data:", error);
    }
  };
  

  const getSensorClass = (type) => {
    if (type === "pH") {
      return pHLevel >= 3.5 && pHLevel <= 4.0
        ? "sensor-card-ph-normal"
        : "sensor-card-ph-alert";
    }
    if (type === "ammonia") {
      return ammonia <= 10
        ? "sensor-card-ammonia-normal"
        : "sensor-card-ammonia-alert";
    }
    if (type === "temperature") {
      return currentTemperature >= 25 && currentTemperature <= 35
        ? "sensor-card-temperature-normal"
        : "sensor-card-temperature-alert";
    }
    return "";
  };

  return (
    <div className="monitoring-page">
    {/* Left and Right Decorative Images */}
    <img src={leftImage} alt="Decorative Left" className="left-image" />
    <img src={rightImage} alt="Decorative Right" className="right-image" />


    <div>
    {/* Status Header */}
    <div className={`status-header ${isOnline ? "online" : "offline"}`}>
      <h2>{currentDate}</h2>
      <p>Status: {isOnline ? "Active" : "Inactive"}</p>
      {!isOnline && (
        <div className="offline-warning">
          <p>You are currently offline. Some features may not work as expected.</p>
        </div>
      )}
    </div>
  </div>

      <div className="monitoring-container">
        {/* Sensor Readings */}
        <div className="section-container">
          <div className="sensor-readings">
            <div className={`sensor-card ${getSensorClass("pH")}`}>
              <h3>{pHLevel !== null ? pHLevel : "--"}</h3>
              <p>pH Level</p>
              <span>Last Reading: {lastPHLevel !== null ? `${lastPHLevel} pH` : "No data"}</span>
            </div>
            <div className={`sensor-card ${getSensorClass("ammonia")}`}>
              <h3>{ammonia !== null ? `${ammonia} ppm` : "--"}</h3>
              <p>Ammonia</p>
              <span>
                Last Reading: {lastAmmonia !== null ? `${lastAmmonia} ppm` : "No data"}
              </span>
            </div>
            <div className={`sensor-card ${getSensorClass("temperature")}`}>
              <h3>
                {currentTemperature !== null
                  ? `${currentTemperature}°C`
                  : "--"}
              </h3>
              <p>Current Temperature</p>
              <span>
                Last Reading:{" "}
                {lastTemperature !== null
                  ? `${lastTemperature}°C`
                  : "No data"}
              </span>
            </div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="section-container controls-panel">
          <div className="controls-header">
            <h3>
              Controls
              <button
                className="info-button"
                onClick={() => setShowGuideline((prev) => !prev)}
              >
                ℹ️
              </button>
            </h3>
            {showGuideline && (
              <div className="guideline-popup">
                <p><strong>Guidelines for Controls:</strong></p>
                <ul>
                  <li><strong>Acid Dose:</strong> Adjust the acid dose in milliliters.</li>
                  <li><strong>Base Dose:</strong> Adjust the base dose in milliliters.</li>
                  <li><strong>Target Temperature:</strong> Set the desired temperature in °C.</li>
                  <li><strong>Mixing Speed:</strong> Set the mixing speed to Slow, Medium, or Fast.</li>
                  <li></li>
                  <li><strong>Note:</strong> If you do not need to add Acid or Base Dose, set them to <strong>0</strong>.</li>
                  <li>If you want to set the same amount of Acid/Base Dosing and temperature, just click the <strong>submit button</strong> again.</li>
                </ul>
              </div>
            )}
          </div>

          {/* Control Items */}
          <div className="controls">
            <div className="control-item">
              <p>Acid Dose</p>
              <div className="control-buttons">
                <button
                  className="control-button"
                  onClick={() => setUpdatedAcidDose((prev) => (prev !== null ? prev + 1 : 1))}
                >
                  ▲
                </button>
                <span>{updatedAcidDose !== null ? `${updatedAcidDose} mL` : "--"}</span>
                <button
                  className="control-button"
                  onClick={() => setUpdatedAcidDose((prev) => (prev !== null ? Math.max(prev - 1, 0) : 0))}
                >
                  ▼
                </button>
              </div>
            </div>

            <div className="control-item">
              <p>Base Dose</p>
              <div className="control-buttons">
                <button
                  className="control-button"
                  onClick={() => setUpdatedBaseDose((prev) => (prev !== null ? prev + 1 : 1))}
                >
                  ▲
                </button>
                <span>{updatedBaseDose !== null ? `${updatedBaseDose} mL` : "--"}</span>
                <button
                  className="control-button"
                  onClick={() => setUpdatedBaseDose((prev) => (prev !== null ? Math.max(prev - 1, 0) : 0))}
                >
                  ▼
                </button>
              </div>
            </div>

            <div className="control-item">
              <p>Target Temperature</p>
              <div className="control-buttons">
                <button
                  className="control-button"
                  onClick={() =>
                    setUpdatedTemperature((prev) =>
                      prev !== null ? Math.min(prev + 1, 35) : 25
                    )
                  }
                >
                  ▲
                </button>
                <span>{updatedTemperature !== null ? `${updatedTemperature}°C` : "--"}</span>
                <button
                  className="control-button"
                  onClick={() =>
                    setUpdatedTemperature((prev) =>
                      prev !== null ? Math.max(prev - 1, 25) : 25
                    )
                  }
                >
                  ▼
                </button>
              </div>
            </div>

            <div className="control-item">
              <p>Mixing Speed</p>
              <div className="mixing-speed-buttons">
                {["Slow", "Med", "Fast"].map((speed) => {
                  const speedValue =
                    speed === "Slow" ? 100 : speed === "Med" ? 50 : 10;
                  return (
                    <button
                      key={speed}
                      className={`mixing-speed-button ${
                        updatedMixingSpeed === speedValue ? "active" : ""
                      }`}
                      onClick={() => setUpdatedMixingSpeed(speedValue)}
                    >
                      {speed}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="submit-button-container">
            <button className="submit-button" onClick={handleSubmit}>
              Submit
            </button>
          </div>
        </div>

        {/* History Chart */}
        <div className="section-container history-chart">
          <h3>pH Level History</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis domain={[0, 10]} />
              <Tooltip />
              <Line type="monotone" dataKey="pH" stroke="#82ca9d">
                <LabelList dataKey="pH" position="top" />
              </Line>
            </LineChart>
          </ResponsiveContainer>


        </div>
      </div>
    </div>
  );
};

export default MonitoringPage;