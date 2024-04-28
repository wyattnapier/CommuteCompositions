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
  const [destState, setDestState] = useState(null);
  const [origin, setOrigin] = useState(null);
  const [gMapsApiKey, setGMapsApiKey] = useState("");
  const [duration, setDuration] = useState(null);
  const [transportation, setTransportation] = useState("driving");
  const [CRUDoperation, setCRUDoperation] = useState("POST");
  const [CRUDtrackID, setCRUDtrackID] = useState(null);
  const [CRUDstate, setCRUDstate] = useState("MA");

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
      const response = await fetch(
        // `/getDistInfo?origin=${origin}&destination=${destination}`
        `/getDistInfo?origin=${origin}&destination=${destination}&transportation=${transportation}`
      );
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

  // database routes
  // const addTrackDB = async () => {
  //   try {
  //     const response = await fetch("/create", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({ trackID, state }), // need to get inputTrackID here
  //     });

  //     if (!response.ok) {
  //       throw new Error(`Failed to add track: ${response.statusText}`);
  //     }
  //   } catch (error) {
  //     console.error("Why did it his this one and not the earlier one?:", error);
  //   }
  // };

  const handleCRUDformsubmit = (e) => {
    console.log("call the appropriate route")
  }

  return (
    <div className="App">
      <header className="App-header">
        <div className="DB-form">
          <form onSubmit={handleCRUDformsubmit}>
            <label>
              Track ID:
              <input
                type="text"
                value={CRUDtrackID}
                onChange={(e) => setCRUDtrackID(e.target.value)}
              />
            </label>
            <br />
            <label>
              Select the state by abbreviation:
              <select
                value={CRUDstate}
                onChange={(e) => setCRUDstate(e.target.value)}
              >
                {/* <option value="">Select State</option> */}
                <option value="AL">Alabama</option>
                <option value="AK">Alaska</option>
                <option value="AZ">Arizona</option>
                <option value="AR">Arkansas</option>
                <option value="CA">California</option>
                <option value="CO">Colorado</option>
                <option value="CT">Connecticut</option>
                <option value="DE">Delaware</option>
                <option value="DC">District Of Columbia</option>
                <option value="FL">Florida</option>
                <option value="GA">Georgia</option>
                <option value="HI">Hawaii</option>
                <option value="ID">Idaho</option>
                <option value="IL">Illinois</option>
                <option value="IN">Indiana</option>
                <option value="IA">Iowa</option>
                <option value="KS">Kansas</option>
                <option value="KY">Kentucky</option>
                <option value="LA">Louisiana</option>
                <option value="ME">Maine</option>
                <option value="MD">Maryland</option>
                <option value="MA">Massachusetts</option>
                <option value="MI">Michigan</option>
                <option value="MN">Minnesota</option>
                <option value="MS">Mississippi</option>
                <option value="MO">Missouri</option>
                <option value="MT">Montana</option>
                <option value="NE">Nebraska</option>
                <option value="NV">Nevada</option>
                <option value="NH">New Hampshire</option>
                <option value="NJ">New Jersey</option>
                <option value="NM">New Mexico</option>
                <option value="NY">New York</option>
                <option value="NC">North Carolina</option>
                <option value="ND">North Dakota</option>
                <option value="OH">Ohio</option>
                <option value="OK">Oklahoma</option>
                <option value="OR">Oregon</option>
                <option value="PA">Pennsylvania</option>
                <option value="RI">Rhode Island</option>
                <option value="SC">South Carolina</option>
                <option value="SD">South Dakota</option>
                <option value="TN">Tennessee</option>
                <option value="TX">Texas</option>
                <option value="UT">Utah</option>
                <option value="VT">Vermont</option>
                <option value="VA">Virginia</option>
                <option value="WA">Washington</option>
                <option value="WV">West Virginia</option>
                <option value="WI">Wisconsin</option>
                <option value="WY">Wyoming</option>
              </select>
            </label>
            <br />
            <label>
              Select the CRUD operation you want to do: <br />
              <select
                value={CRUDoperation}
                onChange={(e) => setCRUDoperation(e.target.value)}
              >
                <option value="CREATE">CREATE</option>
                <option value="READ">READ</option>
                <option value="DELETE">DELETE</option>
                {/* <option value="UPDATE">UPDATE</option> */}
              </select>
            </label>
          </form>
        </div>
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
              {origin && <p>Origin: {origin}</p>}

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
                <label>
                  Select your preferred transportation: <br />
                  <select
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
              {destination && (
                <p>
                  Destination: {destination} AND in state: {destState}
                </p>
              )}
            </div>

            {/* TODO: currently needs to be called to get the distance, how should we 
                  make this into one single button */}
            {/* calls the getRoute funcion which gets the distance of the objects */}
            <button onClick={getRoute}>Get Distance</button>
            <br />
            {duration && <p>Duration: {duration}</p>}

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

            {/* 
              TODO: we can display something after the playlist has been made, but idk what 
              currently shows state of playlists right before adding the new playlist we just made :0
            */}
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
