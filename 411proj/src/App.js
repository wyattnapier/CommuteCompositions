import React, { useState, useEffect } from "react";
import logo from "./logo.svg";
import "./App.css";

function App() {
  const [currentTime, setCurrentTime] = useState(0);
  const [playlists, setPlaylists] = useState([]);

  useEffect(() => {
    fetch("/time")
      .then((res) => res.json())
      .then((data) => {
        setCurrentTime(data.time);
      });
  }, []);

  // const handleSaveDiscoverWeekly = () => {
  //   fetch("/saveDiscoverWeekly", {
  //     method: "POST",
  //   })
  //     .then((res) => {
  //       if (!res.ok) {
  //         throw new Error(`Error: ${res.status}`);
  //       }
  //       return res.json();
  //     })
  //     .then((data) => {
  //       console.log(data);
  //       // Handle successful response here, e.g., displaying a success message to the user
  //     })
  //     .catch((error) => {
  //       console.error("Error:", error);
  //       // Handle error here, e.g., displaying an error message to the user
  //     });
  // };

  // Function to fetch playlists from the backend
  const fetchPlaylists = async () => {
    try {
      // Make a GET request to the /playlists route
      const response = await fetch("/playlists");

      // Check if the request was successful
      if (response.ok) {
        // Parse the JSON response
        const playlistsData = await response.json();

        // Update the state with the playlists data
        setPlaylists(playlistsData);
      } else {
        console.error("Failed to fetch playlists:", response.statusText);
      }
    } catch (error) {
      console.error("Error fetching playlists:", error);
    }
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
        {/* <button onClick={handleSaveDiscoverWeekly}>Save Discover Weekly</button> */}
        <h1>User Playlists</h1>
        <button onClick={fetchPlaylists}>Fetch Playlists</button>

        {/* Display the playlists */}
        <ul>
          {playlists.map((playlist) => (
            <li key={playlist.id}>{playlist.name}</li>
          ))}
        </ul>
      </header>
    </div>
  );
}

export default App;
