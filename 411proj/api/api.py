import spotipy                                         
from spotipy.oauth2 import SpotifyOAuth
import time
from flask import Flask, request, url_for, session, redirect, jsonify
import os
import sys
from dotenv import load_dotenv
from flask_cors import CORS, cross_origin
from flask_session import Session
from pymongo import MongoClient
import requests
from bson import json_util
import json

# from random import randint, random
import math
import random

load_dotenv('.flaskenv')                                # Load environment variables from .flaskenv file

app = Flask(__name__)

# Enable CORS for passing API responses from backend to frontend
# CORS(app, supports_credentials=True)
CORS(app, resources={r"http://localhost:3000": {"origins": "/redirect"}})
#cors = CORS(app, supports_credentials=True)
app.config['CORS_HEADERS'] = 'Content-Type'

app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_FILE_DIR'] = "./flask_session"

# for some basic security
app.config['SESSION_COOKIE_NAME'] = 'Spotify Cookie'    # stored cookie used to check authorization on app
app.secret_key = 'ajk132dvaj21#783@#$kl'                # arbitrary string used in tandem with cookie
TOKEN_INFO = 'token_info'                               # just a placeholder value

# access environment values from the .flaskenv file
CLIENT_ID = os.environ.get("SPOTIPY_CLIENT_ID")
CLIENT_SECRET = os.environ.get("SPOTIPY_CLIENT_SECRET")

GOOGLE_MAPS_KEY = os.environ.get("GOOGLE_MAPS_API_KEY")

#TODO: we tried to use sessions to better store data, but it was not working 
#so we just resorted to global variables, but we should try to change if possible
# server_session = Session(app)

#global variable for the logged in status
logged_in = False

### setting up the database
# Set up MongoDB connection
client = MongoClient('localhost', 27017)
db = client['commuting'] 
collection = db['tracks'] 

### filling in the database
# Define the data to insert into the collection from the json file
f = open('db.json')
state_tracks_data = json.load(f)

# Insert the data into the collection that was loaded from the database
for state_track in state_tracks_data:
    state = state_track["state"]
    tracks = state_track["tracks"]
    collection.update_one({"_id": state}, {"$set": {"tracks": tracks}}, upsert=True)

print("Database setup completed.")


# Route to create a new document
@app.route('/create', methods=['POST'])
def create_document():
    print("made it to create")
    data = request.json  # Assuming data is sent in JSON format
    trackName = data.get('trackName')
    selectedState = data.get('selectedState')
    print(trackName, selectedState)

    # Check if both trackID and selectedState are present
    if trackName is None or selectedState is None:
        return jsonify({'error': 'Missing trackName or selectedState in request data'}), 400

    # Find the existing document for the state
    existing_document = collection.find_one({'selectedState': selectedState})

    if existing_document:
        # Update the existing document
        print("updating current document!")
        collection.update_one({'selectedState': selectedState}, {'$set': data})
        return jsonify({'message': 'Document updated successfully'})
    else:
        # Create a new document for the state
        print("making a new document oof")
        result = collection.insert_one(data)
        return jsonify({'message': 'Document created successfully', 'id': str(result.inserted_id)})


#i dont think we are ever able to actually access this 
@app.route('/')
def base():
  global logged_in
  logged_in = False 
  print("hello! IS THIS WORKING???")
  return 

# calls the spotify oAuth so user can log into their spotify account 
@app.route('/login')
def login():
  sp_oauth = create_spotify_oauth()
  auth_url = sp_oauth.get_authorize_url()
  return jsonify({'url': auth_url})
  
#after oAuth, redirects us to the main page of the web app
#TODO: I believe this is where it is causing issues for the session data
@app.route('/redirect')
def redirect_page():
  session.clear()                                       # clear any stored user data
  code = request.args.get('code')
  sp_oauth = create_spotify_oauth()
  token_info = sp_oauth.get_access_token(code)

  global TOKEN_INFO
  TOKEN_INFO = token_info

  global logged_in 
  logged_in = True

  global COMMUTE_TIME
  COMMUTE_TIME = 300000

  return redirect("http://localhost:3000/")

#returns the names of the user's playlists
@app.route('/playlists', methods=['GET'])
def get_user_playlists():
    try:
        # Retrieve the token information
        token_info = getToken()
        if not token_info:
            return jsonify({"error": "No token info found"}), 401
        
        # Create a Spotipy client instance using the access token
        access_token = token_info['access_token']
        sp = spotipy.Spotify(auth=access_token)
        
        # Fetch user playlists using the Spotipy client
        playlists = sp.current_user_playlists()
        # Extract the list of playlists from the paging object
        playlists_data = [{"id": playlist['id'], "name": playlist['name']} for playlist in playlists['items']]

        # Return playlists data as a JSON response
        return jsonify(playlists_data)
    except Exception as e:
        # Handle exceptions and log errors
        print(f"Error fetching playlists in /playlists route: {e}", file=sys.stderr)
        return jsonify({"error": f"Error fetching playlists: {e}"}), 500


# retrieves or refreshes our spotify token
def getToken():
  global TOKEN_INFO 
  token_info = TOKEN_INFO
  if not token_info:                                    # send them back to login if they don't have token
    login()

  now = int(time.time())
  is_expired = token_info['expires_at'] - now < 60      # checks if token is, or is about to, expire
  if(is_expired):                                       # if true then update token info
    spotify_oauth = create_spotify_oauth()
    token_info = spotify_oauth.refresh_access_token(['refresh_token'])
  
  return token_info

# creates the spotify oAuth object that is used to redirect to the spotify oAuth page
def create_spotify_oauth():
  print("create oauth")
  return SpotifyOAuth(                                  # TODO: update the scope parameter for our project
    client_id=CLIENT_ID, 
    client_secret=CLIENT_SECRET,
    redirect_uri="http://127.0.0.1:5000/redirect",      # TODO: change this back to the absolute uri (but it was breaking stuff): url_for('redirect_page', external = True)
    scope='user-library-read playlist-modify-public playlist-modify-private'
    )

#called from the front end to get login status  
@app.route('/ret')
def return_oauth():
  global logged_in
  if not logged_in:
     return {'loggedIn': False}
  return {'loggedIn': True}


#function to create and fill playlist with tracks
@app.route('/createPlaylist')
def create_playlist():
  try: 
    #get the spotify token info for access to spotify
    token_info = getToken() 
    if not token_info:
      return jsonify({"error": "No token info found"}), 401
    #get the access token so we are able to make the playlist
    access_token = token_info['access_token']
    sp = spotipy.Spotify(auth=access_token)
    user_id = sp.current_user()['id']
    #create new playlist 
    new_playlist = sp.user_playlist_create(
       user=user_id,
       name="Commute Playlist!",
       public=True,
       collaborative=False,
       description="Made with LOVE (and like our 411 project)"
    )
    playlist_id = new_playlist['id']
    #get the length that was passed in through the request
    length = int(request.args.get('length'))
    selectedState = request.args.get('selectedState')
    random_tracks = get_random_tracks(sp, length, selectedState)
    print("random tracks:", random_tracks)

    sp.user_playlist_add_tracks(user_id, playlist_id, random_tracks)


    return jsonify(new_playlist)
  except Exception as e:
    # Handle exceptions and log errors
    return jsonify({"error": f"Error fetching playlists: {e}"}), 500
  
#randomly chooses the tracks for the playlist
#TODO: need to make this more randomized (how???) and implement the database into it
def get_random_tracks(sp, length, selectedState):
  print("getting random tracks")
  random_string = "abcdefghijklmnopqrstuvwxyz*"
  cumulative_time=0
  track_uris = []
  i = 0
  stariter = 0
  while cumulative_time < (length*1000): #need to check the units of duration that is passed in to make sure we properly convert to ms
    # RANDOM DOES NOT WORK FOR SOME REASON
    random_char_index_array = [26, 19, 1, 21, 24, 15, 0, 4, 22, 17, 10, 14, 11, 12, 18, 2, 13, 3, 25, 8, 9, 16, 23, 7, 6, 5, 20]
    random_index = int(random_char_index_array[i%27])
    random_offset_array = [38, 40, 33, 20, 14, 25, 2, 12, 5, 44, 21, 50, 26, 36, 18, 43, 32, 23, 17, 49, 34, 22, 30, 27, 15, 47, 7, 3, 9, 48, 45, 10, 42, 31, 46, 29, 28, 24, 13, 37, 19, 41, 16, 35, 4, 39, 6, 1, 11, 8]
    random_offset = int(random_offset_array[i%50])
    query = random_string[random_index]
    if query == "*":
      # TODO: this is when we want to grab from our database
      response = requests.get(f'http://localhost:5000/readstate?selectedState={selectedState}')
      options = response.json()
      print("iteration throught he star section: ", stariter)
      # if not options:
      #   return jsonify({"error": f"Error fetching tracks from db when making playlist"}), 500
      if len(options['tracks']) <= stariter:
         i+= 1
         continue; # we will just be repeating if we try to put these in the database at this point because we'll have added all of the db tracks already
      
      random_db_index = stariter

      ### giving up on fancily parsing
      query = options['tracks'][random_db_index] 
      print("query:", query)
      random_offset = 0
      print()
      stariter += 1
      
    search_result = sp.search(q=query, type="track", offset=random_offset)
    # i = 0
    for track in search_result['tracks']['items']:
      if track['uri'] not in track_uris:
        track_uris.append(track['uri'])
        cumulative_time += track['duration_ms']
        break
    i += 1
  return track_uris

#returns the distance between two locations that are passed in from request 
@app.route('/getDistInfo') 
def get_distance_matrix():
    origin = request.args.get('origin')
    destination = request.args.get('destination')
    transportation = request.args.get('transportation')
    url = f'https://maps.googleapis.com/maps/api/distancematrix/json?destinations=place_id:{destination}&language=en-EN&mode={transportation}&origins=place_id:{origin}&key={GOOGLE_MAPS_KEY}'
    response = requests.get(url)

    rows = response.json().get('rows', [])
    if rows:
        first_row = rows[0]
        elements = first_row.get('elements', [])
        if elements:
            first_element = elements[0]
            duration = first_element.get('duration', {})
            duration_value = duration.get('value')

    return jsonify({'duration': duration_value })

# just to get the google maps api key for frontend
@app.route('/api/google-maps-api-key')
def get_google_maps_api_key():
    api_key = os.getenv('GOOGLE_MAPS_API_KEY')
    return jsonify({'api_key': api_key})

