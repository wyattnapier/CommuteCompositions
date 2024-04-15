import React, { useState, useEffect } from "react";
import logo from "./logo.svg";
import "./App.css";

function App() {
  const [currentTime, setCurrentTime] = useState(0);
  const [playlists, setPlaylists] = useState([]);
  const [authUrl, setAuthUrl] = useState('');

  useEffect(() => {
    fetch("/time")
      .then((res) => res.json())
      .then((data) => {
        setCurrentTime(data.time);
      });
  }, []);

  // useEffect(() => {
  //   // Fetch the authentication URL when the component mounts
  //   fetchAuthUrl();
  // }, []); // Empty dependency array ensures that this effect runs only once when the component mounts


  //Function to redirect to the spotify auth page
  const fetchAuthUrl = async () => {
    try {
      const response = await fetch('/login');

      // Check if the response is successful
      if (!response.ok) {
        throw new Error(`Failed to fetch auth URL: ${response.statusText}`);
      }

      // Extract the auth URL from the JSON response
      const data = await response.json();
      const newUrl = data.url;
      console.log("redirecting", newUrl);
      window.location = newUrl;
      // Update the state with the auth URL
      //setAuthUrl(newUrl);
    } catch (error) {
      console.error('Redirecting Error', error);
    }
  }

  // Call the function to fetch the auth URL when the component mounts
  //fetchAuthUrl();

  // Redirect function to redirect the user to the auth URL
  const redirectToAuthUrl = () => {
    window.location.href = authUrl;
  };

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

        {/* Conditional rendering of the button */}
        {!authUrl && (
          <button onClick={fetchAuthUrl}>Log In</button>
        )}

        {authUrl && <button onClick={fetchPlaylists}>Fetch Playlists</button>}

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
