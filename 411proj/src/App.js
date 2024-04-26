import React, { useState, useEffect } from "react";
import logo from "./logo.svg";
import "./App.css";
import GooglePlacesAutocomplete from "react-google-places-autocomplete";

function App() {
  const [playlists, setPlaylists] = useState([]);
  const [authUrl, setAuthUrl] = useState("");
  const [isLoggedIn, setLoggedIn] = useState(false);
  const [madePlaylist, setMade] = useState(false);
  const [destination, setDestination] = useState(null);
  const [origin, setOrigin] = useState(null);
  const [gMapsApiKey, setGMapsApiKey] = useState("");
  const [duration, setDuration] = useState(null);

  useEffect(() => {
    fetchLoggedIn();
    fetchAPIKey();
  }, []);

  //Function to redirect to the spotify auth page
  const fetchAuthUrl = async () => {
    try {
      const response = await fetch("/login");

      // Check if the response is successful
      if (!response.ok) {
        throw new Error(`Failed to fetch auth URL: ${response.statusText}`);
      }

      // Extract the auth URL from the JSON response
      const data = await response.json();
      const newUrl = data.url;
      window.location = newUrl;

    } catch (error) {
      console.error("Redirecting Error", error);
    }
  };

  //gets the input from backend about whether the user has logged in
  //TODO: this is currently just calling repeatedly, could we change this to only periodic calls
  const fetchLoggedIn = async () => {
    try {
      const response = await fetch("/ret");

      if (!response.ok) {
        throw new Error(`Failed to get login info: ${response.statusText}`);
      }

      const data = await response.json();
      setLoggedIn(data.loggedIn);
    } catch (error) {
      console.error("login info error", error);
    }
  };

  //gets the input from backend for API key for google maps
  //TODO: this is currently just calling repeatedly, could we change this to only periodic calls
  const fetchAPIKey = async () => {
    try {
      const response = await fetch("/api/google-maps-api-key");

      if (!response.ok) {
        throw new Error(`Failed to get api key: ${response.statusText}`);
      }

      const data = await response.json();
      setGMapsApiKey(data.api_key);
    } catch (error) {
      console.error("api key retrieval error", error);
    }
  };

  // Function to fetch playlists from the backend
  const fetchPlaylists = async () => {
    try {
      const response = await fetch("/playlists");

      // Check if the request was successful
      if (response.ok) {
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

  // Function to call the backend to make the playlists 
  const makePlaylist = async () => {
    try {
      const response = await fetch(`/createPlaylist?length=${duration}`);
      if (response.ok) {
        const playlistData = await response.json();
        //TODO: currently just setting to true, but if there is useful info
        //from the playlist then we should somehow incorporate that here 
        setMade(true);
      } else {
        console.error("Failed to fetch playlists:", response.statusText);
      }
    } catch (error) {
      console.error("error fetching playlists:", error);
    }
  };

  //gets the route duration from the backend calculation
  const getRoute = async () => {
    try {
      const response = await fetch(`/getDistInfo?origin=${origin}&destination=${destination}`);
      if (response.ok) {
        const routeData = await response.json();
        setDuration(routeData.duration);
      } else {
        console.error("Failed to get route:", response.statusText);
      }
    } catch (error) {
      console.error("error fetching playlists:", error);
    }
  };


  return (
    <div className="App">
      <header className="App-header">
        {isLoggedIn ? (
          <div>
            <p>Logged In!</p>
            <div>
              {/* the place autocomplete functionality for origin */}
              <p>Origin:</p>
              {gMapsApiKey && (
                <GooglePlacesAutocomplete
                  apiKey={gMapsApiKey}
                  autocompletionRequest={{
                    types: ["geocode"],
                  }}
                  placeholder="Search for an address"
                  className="google-places-autocomplete"
                  selectProps={{
                    origin,
                    onChange: (selected) => setOrigin(selected.value.place_id),
                    styles: {
                      input: (provided) => ({
                        ...provided,
                        color: 'black',
                      }),
                      option: (provided) => ({
                        ...provided,
                        color: 'black',
                      }),
                      singleValue: (provided) => ({
                        ...provided,
                        color: 'blue',
                      }),
                    },
                  }}
                />
              )}
              {origin && (
                <p>Origin: {origin}</p>
              )}


              {/* the place autocomplete functionality for the destination */}
              <p>Destination:</p>
              {gMapsApiKey && (
                <GooglePlacesAutocomplete
                  apiKey={gMapsApiKey}
                  autocompletionRequest={{
                    types: ["geocode"],
                  }}
                  placeholder="Search for an address"
                  className="google-places-autocomplete"
                  selectProps={{
                    destination,
                    onChange: (selected) => setDestination(selected.value.place_id),
                    styles: {
                      input: (provided) => ({
                        ...provided,
                        color: 'black',
                      }),
                      option: (provided) => ({
                        ...provided,
                        color: 'black',
                      }),
                      singleValue: (provided) => ({
                        ...provided,
                        color: 'blue',
                      }),
                    },
                  }}
                />
              )}
              {destination && (
                <p>Destination: {destination}</p>
              )}
            </div>

            {/* TODO: currently needs to be called to get the distance, how should we 
                  make this into one single button */}
            {/* cals the getRoute funcion which gets the distance of the objects */}
            <button onClick={getRoute}>Get Distance</button>
            {duration && (
              <p>Duration: {duration}</p>
            )}

            {/* TODO: again, should be able to make this and getRoute together*/}
            <button
              className="large-button"
              onClick={() => {
                makePlaylist();
                fetchPlaylists();
              }}
            >
              Make Playlists
            </button>

            {/* TODO: we can display something after the playlist has been made, but idk what */}
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
          // log in page for spotify
          <div>
            <h1>Commute Compositions</h1>
            <button className="large-button" onClick={fetchAuthUrl}>
              Log In
            </button>
          </div>
        )}

      </header>
    </div>
  );
}

export default App;
