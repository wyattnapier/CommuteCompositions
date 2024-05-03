import React, { useState, useEffect } from "react";
import logo from "./logo.svg";
import spotify from "./spotify.png";
import "./App.css";
import "./spinner.css";
import GooglePlacesAutocomplete from "react-google-places-autocomplete";
import { Spotify } from "react-spotify-embed";

function App() {
  const [playlists, setPlaylists] = useState([]);
  const [isLoggedIn, setLoggedIn] = useState(false);
  const [madePlaylist, setMade] = useState(false);
  const [destination, setDestination] = useState(null);
  const [destState, setDestState] = useState(null);
  const [origin, setOrigin] = useState(null);
  const [gMapsApiKey, setGMapsApiKey] = useState("");
  const [duration, setDuration] = useState(null);
  const [transportation, setTransportation] = useState("driving");
  const [embeddingLink, setEmbeddingLink] = useState(null);
  const [makingPlaylist, setMakingPlaylist] = useState(false);

  function Spinner() {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
      </div>
    );
  }

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
      const response = await fetch(
        `/createPlaylist?length=${duration}&selectedState=${destState}`
      );
      if (response.ok) {
        const playlistData = await response.json();
        let playlist_external_url = playlistData["external_urls"]["spotify"];
        fetchPlaylists();
        setEmbeddingLink(playlist_external_url);
        setMade(true);
        setMakingPlaylist(false);
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
      const response = await fetch(
        `/getDistInfo?origin=${origin}&destination=${destination}&transportation=${transportation}`
      );
      if (response.ok) {
        const routeData = await response.json();
        setDuration(routeData.duration);
        // makePlaylist();
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
          // if the user has logged into spotify, we can render the distance functionalities

          <div>
            {/* we also have to make sure it is not currently working on creating a playlist */}
            <div>
              {!makingPlaylist && !madePlaylist && (
                <div>
                  <h2>Tell us about your commute!</h2>
                  {/* the place autocomplete functionality for origin */}
                  <h3>Origin:</h3>
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
                        onChange: (selected) =>
                          setOrigin(selected.value.place_id),
                        styles: {
                          input: (provided) => ({
                            ...provided,
                            color: "black",
                          }),
                          option: (provided) => ({
                            ...provided,
                            color: "black",
                          }),
                          singleValue: (provided) => ({
                            ...provided,
                            color: "blue",
                          }),
                        },
                      }}
                    />
                  )}

                  {/* the place autocomplete functionality for the destination */}
                  <h3>Destination:</h3>
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
                        onChange: (selected) => {
                          setDestination(selected.value.place_id);
                          let s = selected.value.description;
                          let i = s.search("USA");
                          let stateStart = i - 4;
                          setDestState(s.substring(stateStart, stateStart + 2));
                        },
                        styles: {
                          input: (provided) => ({
                            ...provided,
                            color: "black",
                          }),
                          option: (provided) => ({
                            ...provided,
                            color: "black",
                          }),
                          singleValue: (provided) => ({
                            ...provided,
                            color: "blue",
                          }),
                        },
                      }}
                    />
                  )}
                  {/* Transportation form */}
                  <form>
                    {/* <p>Select your preferred transportations:</p> */}
                    <label>
                      Select your preferred transportation: <br />
                      <select
                        className="select-container"
                        value={transportation}
                        onChange={(e) => setTransportation(e.target.value)}
                      >
                        <option value="driving">Driving</option>
                        <option value="walking">Walking</option>
                        <option value="bicycling">Bicycling</option>
                        <option value="transit">Transit</option>
                      </select>
                    </label>
                  </form>
                </div>
              )}

              {origin &&
                destination &&
                transportation &&
                !makingPlaylist &&
                !madePlaylist && (
                  <div>
                    <button className="med-button" onClick={getRoute}>
                      Submit
                    </button>
                    <br />
                  </div>
                )}
              {duration && !makingPlaylist && !madePlaylist && (
                <p>Your commute will be: {duration} seconds</p>
              )}

              {/* TODO: again, should be able to make this and getRoute together*/}
              {duration && !makingPlaylist && !madePlaylist && (
                <div>
                  <button
                    className="large-button"
                    onClick={() => {
                      // getRoute();
                      makePlaylist();
                      setMakingPlaylist(true);
                      // fixed the fetchPlaylist issue
                    }}
                  >
                    Make Playlists
                  </button>
                </div>
              )}

              {makingPlaylist && (
                // <p>making playlist...</p>
                <Spinner /> // Render spinner while loading
              )}

              <div>
                {embeddingLink && (
                  <Spotify
                    link={embeddingLink}
                    view="coverart" // Set the view to "coverart" to display only the cover art
                    width={700}
                    height={380}
                    theme="black" // Set the theme to "black" for a dark theme
                  />
                )}
              </div>

              {madePlaylist && (
                <button
                  className="large-button"
                  onClick={() => {
                    setMade(false);
                    setDestination(null);
                    setDestState(null);
                    setOrigin(null);
                    setDuration(null);
                    setEmbeddingLink(false);
                    setMakingPlaylist(false);
                  }}
                >
                  Make Another Playlist!
                </button>
              )}
            </div>
          </div>
        ) : (
          // log in page for spotify
          <div>
            <h1>Commute Compositions</h1>
            <p>Create a playlist for your journey!</p>
            <button className="large-button" onClick={fetchAuthUrl}>
              <img src={spotify} alt="Spotify Logo" className="spotify-logo" />
              Log In
            </button>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
