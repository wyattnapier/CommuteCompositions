import spotipy                                         
from spotipy.oauth2 import SpotifyOAuth
import time
from flask import Flask, request, url_for, session, redirect, jsonify
import os
import sys
from dotenv import load_dotenv
from flask_cors import CORS, cross_origin
from flask_session import Session
import requests

from random import randint, random

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

        # Convert playlists to a list of dictionaries (id and name)
        playlists_data = [{"id": playlist['id'], "name": playlist['name']} for playlist in playlists['items']]

        # Return playlists data as a JSON response
        response = jsonify(playlists_data)
        if not response:
           return jsonify({"error": "No playlist data found"}), 401

        #I believe that this is from when we tried to work with sessions
        # response.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
        # response.headers['Access-Control-Allow-Headers'] = 'Content-Type'

        # Return the playlists data as JSON
        return response
    except Exception as e:
        # Handle exceptions and log errors
        print(f"Error fetching playlists: {e}", file=sys.stderr)
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


# @app.route('/logout')
# def logout_func():
#   session.clear()
#   cache_file_path = "/venv/.cache"
#   delete_cache_file(cache_file_path)
#   auth_url = create_spotify_oauth().get_authorize_url()
    
#   # Redirect the user to the Spotify OAuth authorization URL
#   return redirect(auth_url)
#   # return "LOGGED OUT"

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
       name="Playlist!",
       public=True,
       collaborative=False,
       description="Made with LOVE (and like our 411 project)"
    )

    playlist_id = new_playlist['id']

    #get the length that was passed in through the request
    length = int(request.args.get('length'))
    random_tracks = get_random_tracks(sp, length)

    sp.user_playlist_add_tracks(user_id, playlist_id, random_tracks)

    #right now just returns the whole playlist? 
    #TODO: figure out what we acc need from this playlist and change return value
    return jsonify(new_playlist)
  except Exception as e:
    # Handle exceptions and log errors
    return jsonify({"error": f"Error fetching playlists: {e}"}), 500
  
#randomly chooses the tracks for the playlist
#TODO: need to make this more randomized (how???) and implement the database into it
def get_random_tracks(sp, length):
  search_terms = ["pop", "rock", "indie"]
  #  random_term = random.choice(search_terms)
  random_term = "pop"
  search_result = sp.search(q="pop", type="track")

  cumulative_time=0
  track_uris = []
  for track in search_result['tracks']['items']:
    cumulative_time += track['duration_ms'] #cumulative time is recorded in milliseconds
    track_uris.append(track['uri'])
    if cumulative_time > length*1000:
       break

  return track_uris

#returns the distance between two locations that are passed in from request 
@app.route('/getDistInfo') 
def get_distance_matrix():
    origin = request.args.get('origin')
    destination = request.args.get('destination')
    transportation = request.args.get('transportation')
    url = f'https://maps.googleapis.com/maps/api/distancematrix/json?destinations=place_id:{destination}&language=en-EN&mode={transportation}&origins=place_id:{origin}&key={GOOGLE_MAPS_KEY}'
    # url = f'https://maps.googleapis.com/maps/api/distancematrix/json?destinations=place_id:{destination}&language=en-EN&mode=bicycling&origins=place_id:{origin}&key={GOOGLE_MAPS_KEY}'
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

