import React, { useState, useEffect } from "react";
import logo from "./logo.svg";
import "./App.css";

function App() {
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    fetch("/time")
      .then((res) => res.json())
      .then((data) => {
        setCurrentTime(data.time);
      });
  }, []);

  const handleSaveDiscoverWeekly = () => {
    fetch("/saveDiscoverWeekly", {
      method: "POST",
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to save Discover Weekly");
        }
        return res.json();
      })
      .then((data) => {
        console.log(data);
        // Handle successful response
      })
      .catch((error) => {
        console.error("Error on line 31:", error.message);
        // Handle error (e.g., display error message to the user)
      });
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
        <p>The current time is {currentTime}.</p>
        <button onClick={handleSaveDiscoverWeekly}>Save Discover Weekly</button>
      </header>
    </div>
  );
}

export default App;
