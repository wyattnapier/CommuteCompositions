import React, { useState, useEffect } from "react";
import logo from "./logo.svg";
import "./App.css";
import GooglePlacesAutocomplete from "react-google-places-autocomplete";
import { Spotify } from "react-spotify-embed";

function App() {
  const [playlists, setPlaylists] = useState([]);
  const [authUrl, setAuthUrl] = useState("");
  const [isLoggedIn, setLoggedIn] = useState(false);
  const [madePlaylist, setMade] = useState(false);
  const [destination, setDestination] = useState(null);
  const [destState, setDestState] = useState("CA");
  const [origin, setOrigin] = useState(null);
  const [gMapsApiKey, setGMapsApiKey] = useState("");
  const [duration, setDuration] = useState(null);
  const [transportation, setTransportation] = useState("driving");
  const [CRUDoperation, setCRUDoperation] = useState("CREATE");
  const [CRUDtrackName, setCRUDtrackName] = useState("");
  const [CRUDstate, setCRUDstate] = useState("MA");
  const [embeddingLink, setEmbeddingLink] = useState(null);
  const [viewState, setViewState] = useState(0);

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
      if (data.loggedIn && viewState < 1) {
        setViewState(1); // change to next viewstate
      }
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
      const response = await fetch(
        `/createPlaylist?length=${duration}&selectedState=${destState}`
      );
      if (response.ok) {
        const playlistData = await response.json();
        //TODO: currently just setting to true, but if there is useful info
        //from the playlist then we should somehow incorporate that here
        let playlist_external_url = playlistData["external_urls"]["spotify"];
        // let playlist_uri = playlistData["uri"];
        setEmbeddingLink(playlist_external_url);
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
        `/getDistInfo?origin=${origin}&destination=${destination}&transportation=${transportation}`
      );
      if (response.ok) {
        const routeData = await response.json();
        setDuration(routeData.duration);
        setViewState(2);
      } else {
        console.error("Failed to get route:", response.statusText);
      }
    } catch (error) {
      console.error("error fetching playlists:", error);
    }
  };

  // making this async may have borken it --> may just need to call this function from the lambda function in the form onSubmit
  const handleCRUDformsubmit = async (e) => {
    e.preventDefault();
    console.log("call the appropriate route");
    try {
      if (CRUDoperation === "CREATE") {
        console.log("Adding to the playlist by calling the create route");
        const response = await fetch("/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            trackName: CRUDtrackName,
            selectedState: CRUDstate,
            // Add other fields as needed
          }),
        });
        if (response.ok) {
          const data = await response.json();
          console.log("Document created successfully:", data);
        } else {
          console.error("Failed to create document:", response.statusText);
        }
      } else if (CRUDoperation === "READ") {
        console.log("Reading from the playlist by calling the read route");
        const response = await fetch(
          `/read?selectedState=${CRUDstate}&trackName=${CRUDtrackName}`,
          { method: "GET" }
        );
        if (response.ok) {
          const document = await response.json();
          console.log("Document retrieved successfully:", document);
        } else {
          console.error("Failed to retrieve document:", response.statusText);
        }
      } else if (CRUDoperation === "READALL") {
        console.log("Reading from the playlist by calling the read route");
        const response = await fetch(`/read`, { method: "GET" });
        if (response.ok) {
          const documents = await response.text(); // Read the response as text
          console.log("Documents retrieved successfully:", documents);
        } else {
          console.error("Failed to retrieve documents:", response.statusText);
        }
      } else if (CRUDoperation === "DELETE") {
        console.log("Deleting from the playlist by calling the delete route");
        const response = await fetch(
          `/delete?trackName=${CRUDtrackName}&stateID=${CRUDstate}`,
          {
            method: "DELETE",
          }
        );
        if (response.ok) {
          const data = await response.json();
          console.log("Document deleted successfully:", data);
        } else {
          console.error("Failed to delete document:", response.statusText);
        }
      } else if (CRUDoperation === "DELETEALL") {
        console.log(
          "Deleting everything from the database by calling the deleteall route"
        );
        const response = await fetch(`/delete/all`, {
          method: "DELETE",
        });
        if (response.ok) {
          const data = await response.json();
          console.log("Document deleted successfully:", data);
        } else {
          console.error("Failed to delete all documents:", response.statusText);
        }
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  /*
   * stage 0: login
   * stage 1: enter playlist info
   * stage 1.5: calculate distance (in stage 1)
   * stage 2: makeplaylist button appears
   * stage 3: loading screen while playlist generates
   * stage 4: embed the playlist (maybe button to generate another)
   */
  if (viewState == 0) {
    console.log("viewState 0");
    return (
      <div className="App">
        <div>
          <h1>Commute Compositions</h1>
          <button className="large-button" onClick={fetchAuthUrl}>
            Log In
          </button>
        </div>
      </div>
    );
  } else if (viewState == 1) {
    console.log("viewState 1");
    return (
      <div className="App">
        <p>Logged In!</p>
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
        {origin && destination && (
          <div className="distanceCalc">
            <button onClick={getRoute}>Get Distance</button>
            <br />
            {duration && <p>Duration: {duration}</p>}
          </div>
        )}
      </div>
    );
  } else if (viewState == 2) {
    console.log("viewState 2");
    return (
      <div className="App">
        {duration && <p>Duration: {duration}</p>}

        {/* TODO: again, should be able to make this and getRoute together*/}
        <button
          className="large-button"
          onClick={() => {
            setViewState(3);
            makePlaylist();
            fetchPlaylists();
          }}
        >
          Make Playlists
        </button>
      </div>
    );
  } else if (viewState == 3) {
    console.log("viewState 3");
    return (
      <div className="App">
        {duration && <p>Duration: {duration}</p>}

        {/* TODO: again, should be able to make this and getRoute together*/}
        <button
          className="large-button"
          onClick={() => {
            setViewState(4);
            makePlaylist();
            fetchPlaylists();
          }}
        >
          Make Playlists
        </button>
      </div>
    );
  } else if (viewState == 4) {
    console.log("viewState 4");
    return (
      <div className="App">
        {madePlaylist ? (
          // used to condition on embeddingLink here, but should be covered by madePlaylist?
          <div>
            <Spotify
              link={embeddingLink}
              view="coverart" // Set the view to "coverart" to display only the cover art
              width={700}
              height={380}
              theme="black" // Set the theme to "black" for a dark theme
            />
            <button
              onClick={() => {
                setViewState(1);
                setDestination(null);
                setOrigin(null);
                setDuration(null);
              }}
            >
              Generate another playlist!
            </button>
          </div>
        ) : (
          <h1>Loading...</h1>
        )}
      </div>
    );
  } else {
    return (
      <div className="App">
        <p>Oof</p>
      </div>
    );
  }
}

export default App;

//////////////////////////////////////////////////////////////////////////////// ORIGINAL FRONTEND STRUCTURE /////////////////////////////////////////////////////////////////
{
  /*
<div className="App">
<header className="App-header">
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
  <div className="DB-form">
    <form onSubmit={handleCRUDformsubmit}>
      <label>
        Track name:
        <input
          type="text"
          value={CRUDtrackName}
          onChange={(e) => setCRUDtrackName(e.target.value)}
        />
      </label>
      <br />
      <label>
        Select the state by abbreviation:
        <select
          value={CRUDstate}
          onChange={(e) => setCRUDstate(e.target.value)}
        >
          <option value="AL">AL</option>
          <option value="AK">AK</option>
          <option value="AZ">AZ</option>
          <option value="AR">AR</option>
          <option value="CA">CA</option>
          <option value="CO">CO</option>
          <option value="CT">CT</option>
          <option value="DE">DE</option>
          <option value="DC">DC</option>
          <option value="FL">FL</option>
          <option value="GA">GA</option>
          <option value="HI">HI</option>
          <option value="ID">ID</option>
          <option value="IL">IL</option>
          <option value="IN">IN</option>
          <option value="IA">IA</option>
          <option value="KS">KS</option>
          <option value="KY">KY</option>
          <option value="LA">LA</option>
          <option value="ME">ME</option>
          <option value="MD">MD</option>
          <option value="MA">MA</option>
          <option value="MI">MI</option>
          <option value="MN">MN</option>
          <option value="MS">MS</option>
          <option value="MO">MO</option>
          <option value="MT">MT</option>
          <option value="NE">NE</option>
          <option value="NV">NV</option>
          <option value="NH">NH</option>
          <option value="NJ">NJ</option>
          <option value="NM">NM</option>
          <option value="NY">NY</option>
          <option value="NC">NC</option>
          <option value="ND">ND</option>
          <option value="OH">OH</option>
          <option value="OK">OK</option>
          <option value="OR">OR</option>
          <option value="PA">PA</option>
          <option value="RI">RI</option>
          <option value="SC">SC</option>
          <option value="SD">SD</option>
          <option value="TN">TN</option>
          <option value="TX">TX</option>
          <option value="UT">UT</option>
          <option value="VT">VT</option>
          <option value="VA">VA</option>
          <option value="WA">WA</option>
          <option value="WV">WV</option>
          <option value="WI">WI</option>
          <option value="WY">WY</option>
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
          <option value="READALL">READALL</option>
          <option value="DELETE">DELETE</option>
          <option value="DELETEALL">DELETEALL</option>
        </select>
      </label>
      <button type="submit">Submit</button>
    </form>
  </div>
  {isLoggedIn ? (
    <div>
      <p>Logged In!</p>
      <div>
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

      <button onClick={getRoute}>Get Distance</button>
      <br />
      {duration && <p>Duration: {duration}</p>}

      <button
        className="large-button"
        onClick={() => {
          makePlaylist();
          fetchPlaylists();
        }}
      >
        Make Playlists
      </button>

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

*/
}
