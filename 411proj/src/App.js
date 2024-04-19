import React, { useState, useEffect } from "react";
import logo from "./logo.svg";
import "./App.css";

function App() {
  const [currentTime, setCurrentTime] = useState(0);
  const [playlists, setPlaylists] = useState([]);
  const [authUrl, setAuthUrl] = useState('');
  const [isLoggedIn, setLoggedIn] = useState(false);
  const [madePlaylist, setMade] = useState(false);

  useEffect(() => {
    fetch("/time")
      .then((res) => res.json())
      .then((data) => {
        setCurrentTime(data.time);
      });
  }, []);

  useEffect(() => {
    fetchLoggedIn();
  }, []);

  fetch('/').then(response => {
    if (response.ok) {
      console.log('Session variable initialized.');
      // Handle further actions after session initialization if needed
    } else {
      console.error('Failed to initialize session variable.');
    }
  }).catch(error => {
    console.error('Error fetching data:', error);
  });

  // useEffect(() => {
  //   // Fetch the authentication URL when the component mounts
  //   fetchAuthUrl();
  // }, []); // Empty dependency array ensures that this effect runs only once when the component mounts

  // useEffect(() => {
  //   fetch("/ret")
  //     .then((res) => res.json())
  //     .then((data) => {
  //       setLoggedIn(data.loggedIn);
  //     })
  // })

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

      //temporarily just have isLoggedIn set to true always here
      //TODO: fix this so that it will actually change depending on user input
      // setLoggedIn(true);
      // console.log(isLoggedIn);

      // Update the state with the auth URL
      //setAuthUrl(newUrl);
    } catch (error) {
      console.error('Redirecting Error', error);
    }
  }

  const fetchLoggedIn = async () => {
    try {
      const response = await fetch('/ret');

      if (!response.ok) {
        throw new Error(`Failed to get login info: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("logged in", data.loggedIn);
      setLoggedIn(data.loggedIn);

    } catch (error) {
      console.error('login info error', error);
    }
  };

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

  const makePlaylist = async () => {
    try {
      const response = await fetch("/createPlaylist")
      if (response.ok) {
        const playlistData = await response.json();
        // setMade(playlistData);
        setMade(true)
      } else {
        console.error("Failed to fetch playlists:", response.statusText);
      }
    } catch (error) {
      console.error("error fetching playlists:", error);
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        {/* <img src={logo} className="App-logo" alt="logo" /> */}
        {/* <p>
          Edit <code>src/App.js</code> and save to reload.
        </p> */}
        {/* <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
        <p>The current time is {currentTime}.</p> */}
        {/* <button onClick={handleSaveDiscoverWeekly}>Save Discover Weekly</button> */}
        <h1>Commute Compositions</h1>

        {/* Conditional rendering of the button */}
        {/* {!authUrl && (
          <button className="large-button" onClick={fetchAuthUrl}>Log In</button>
        )} */}

        {/* {authUrl && <button size="lg" onClick={fetchPlaylists}>Fetch Playlists</button>} */}
        {isLoggedIn ? (
          <div>
            <p>Logged In!</p>
            {/* <button className="large-button" onClick={fetchPlaylists}>Fetch Playlists</button> */}
            {/* <button className="large-button" onClick={makePlaylist && fetchPlaylists}>Make Playlists</button> */}
            <button className="large-button" onClick={() => {
              makePlaylist();
              fetchPlaylists();
            }}>Make Playlists</button>
            {madePlaylist ? (
              <ul>
                {playlists.map((playlist) => (
                  <li key={playlist.id}>{playlist.name}</li>
                ))}
              </ul>
            ) : (
              <></>
            )}
          </div>
        ) : (
          <button className="large-button" onClick={fetchAuthUrl}>Log In</button>
        )}

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
