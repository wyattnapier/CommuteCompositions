import spotipy                                         
from spotipy.oauth2 import SpotifyOAuth
import time
from flask import Flask, request, url_for, session, redirect, jsonify
import os
import sys
from dotenv import load_dotenv
from flask_cors import CORS, cross_origin
from flask_session import Session

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

server_session = Session(app)

#global variable for the logged in status
#TODO: this is not reliable at all, so try to use session info
logged_in = False

@app.route('/')
def base():
  global logged_in
  logged_in = False 
  # session['logged_in'] = False
  # session['id'] = randint(0, 10)
  print("hello! IS THIS WORKING???")
  return 

# base route
@app.route('/login')
def login():
  # print("sessionID", session.get('id'))
  # print("session_data", session)
  print("went to the login")
  sp_oauth = create_spotify_oauth()
  auth_url = sp_oauth.get_authorize_url()
  return jsonify({'url': auth_url})
  

# used to handle oauth I think?
@app.route('/redirect')
def redirect_page():
  # print("session_data", session)
  print("made it back from redirect?")
  session.clear()                                       # clear any stored user data
  # print("session_data", session)
  code = request.args.get('code')
  #token_info = create_spotify_oauth().get_access_token(code) # exchanges auth code for access token that we store
  sp_oauth = create_spotify_oauth()
  token_info = sp_oauth.get_access_token(code)
  # session[TOKEN_INFO] = token_info 
  global TOKEN_INFO
  TOKEN_INFO = token_info

  print("redirect token_info:", token_info)
  # print("big token:", session[TOKEN_INFO])
  global logged_in 
  logged_in = True

  global COMMUTE_TIME
  COMMUTE_TIME = 300000
  # # session['logged_in'] = True
  # print("sessionLog", session.get('logged_in'))
  # print("sessionID", session.get('id'))
  # session[LOGGED_IN] = True
  # print("redirect log:", LOGGED_IN)
  #return redirect(url_for('get_user_playlists', external=True)) # TODO: update this route to something actually useful for us
  # return_oauth()
  # print("session_data", session)
  return redirect("http://localhost:3000/")


@app.route('/playlists', methods=['GET'])
def get_user_playlists():
    try:
        print("get_user_playlists")
        # Retrieve the token information
        # see if the login variable such as token currently has a value or not
        # print("playlist token:", session[TOKEN_INFO])
        token_info = getToken()
        print("playlist token_info:", token_info)
        if not token_info:
            return jsonify({"error": "No token info found"}), 401
        
        # Create a Spotipy client instance using the access token
        print("1")
        access_token = token_info['access_token']
        sp = spotipy.Spotify(auth=access_token)
        
        # Fetch user playlists using the Spotipy client
        playlists = sp.current_user_playlists()
        print("2")
        # Convert playlists to a list of dictionaries (id and name)
        playlists_data = [{"id": playlist['id'], "name": playlist['name']} for playlist in playlists['items']]
        print("3")
        # Return playlists data as a JSON response
        response = jsonify(playlists_data)
        print(response)
        if not response:
           return jsonify({"error": "No playlist data found"}), 401
        
        ### sample data to test
        sample_playlists_data = [
            {"id": "1", "name": "Mooooo"},
            {"id": "2", "name": "Cow noises"}
        ]

        # Return the playlists data as JSON
        # response = jsonify(sample_playlists_data)
        print("response")
        print(response)
        response.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        return response
    
    except Exception as e:
        # Handle exceptions and log errors
        print(f"Error fetching playlists: {e}", file=sys.stderr)
        return jsonify({"error": f"Error fetching playlists: {e}"}), 500


# retrieves or refreshes our token
def getToken():
  print("getToken")
  # token_info = session.get(TOKEN_INFO, None)
  global TOKEN_INFO 
  token_info = TOKEN_INFO
  print("getToken 1", token_info)
  if not token_info:                                    # send them back to login if they don't have token
    # redirect(url_for('/login', external=False))       # trying to fix the invalid refresh_token
    login()
  print("getToken 2")
  print("token:", token_info)
  now = int(time.time())
  is_expired = token_info['expires_at'] - now < 60      # checks if token is, or is about to, expire
  if(is_expired):                                       # if true then update token info
    spotify_oauth = create_spotify_oauth()
    token_info = spotify_oauth.refresh_access_token(['refresh_token'])
  print("token:", token_info)
  return token_info

# begin OAuth
def create_spotify_oauth():
  print("create oauth")
  return SpotifyOAuth(                                  # TODO: update the scope parameter for our project
    client_id=CLIENT_ID, 
    client_secret=CLIENT_SECRET,
    redirect_uri="http://127.0.0.1:5000/redirect", # TODO: change this back to the absolute uri (but it was breaking stuff): url_for('redirect_page', external = True)
    scope='user-library-read playlist-modify-public playlist-modify-private'
    )

def delete_cache_file(cache_file_path):
    try:
        # Check if the file exists
        if os.path.exists(cache_file_path):
            # Delete the cache file
            os.remove(cache_file_path)
            print(f"Cache file '{cache_file_path}' deleted successfully.")
        else:
            print(f"Cache file '{cache_file_path}' does not exist.")
    except Exception as e:
        print(f"Error deleting cache file '{cache_file_path}': {e}")

@app.route('/logout')
def logout_func():
  session.clear()
  cache_file_path = "/venv/.cache"
  delete_cache_file(cache_file_path)
  auth_url = create_spotify_oauth().get_authorize_url()
    
  # Redirect the user to the Spotify OAuth authorization URL
  return redirect(auth_url)
  # return "LOGGED OUT"

### sample example from the original setup video
@app.route('/time')
def get_current_time():
  return {'time': time.time()}


#function to return that we have signed into the spotify 
@app.route('/ret')
def return_oauth():
  print("at return function")
  # token_info = session.get(TOKEN_INFO, None)
  global logged_in
  # print("session_data", session)
  # print("sessionID", session.get('id'))
  # print("sessionLog", session.get('logged_in'))
  if not logged_in:
     print("returns false")
     return {'loggedIn': False}
  print("should be true")
  return {'loggedIn': True}


#function to create and fill playlist with tracks
@app.route('/createPlaylist')
def create_playlist():
  try: 
    print("creating playlist now")
    token_info = getToken() 
    if not token_info:
      return jsonify({"error": "No token info found"}), 401
    
    access_token = token_info['access_token']
    sp = spotipy.Spotify(auth=access_token)

    user_id = sp.current_user()['id']

    new_playlist = sp.user_playlist_create(
       user=user_id,
       name="Playlist!",
       public=True,
       collaborative=False,
       description="Made with LOVE (and like our 411 project)"
    )

    playlist_id = new_playlist['id']

    random_tracks = get_random_tracks(sp)

    sp.user_playlist_add_tracks(user_id, playlist_id, random_tracks)

    return jsonify(new_playlist)

  except Exception as e:
    # Handle exceptions and log errors
    print(f"Error fetching playlists: {e}", file=sys.stderr)
    return jsonify({"error": f"Error fetching playlists: {e}"}), 500
  
def get_random_tracks(sp, num_tracks=3):
  search_terms = ["pop", "rock", "indie"]
  #  random_term = random.choice(search_terms)
  cumulative_time=0
  random_term = "pop"
  print(1)
  search_result = sp.search(q="pop", type="track")
  print(2)
  # track_uris = [track['uri'] for track in search_result['track']['items']]
  track_uris = []
  for track in search_result['tracks']['items']:
    cumulative_time += track['duration_ms'] #cumulative time is recorded in milliseconds
    global COMMUTE_TIME
    if cumulative_time > COMMUTE_TIME:
       break
    track_uris.append(track['uri'])
  print(3)
  print("tracks", track_uris)
  return track_uris
    









############################################################################################
# TRASH HEAP
############################################################################################

# def get_user_playlists():
#     # login()
#     # # Get the user's access token from the session (or from another source)
#     # token_info = getToken()
#     # access_token = token_info['access_token']
#     # sp = spotipy.Spotify(auth=access_token)

#     # # Get the user's playlists
#     # playlists = sp.current_user_playlists()
#     # response = jsonify(playlists['items'])
#     # response.headers.add('Access-Control-Allow-Origin', '*')
#     # return response
#     playlists_data = [
#         {"id": "1", "name": "Mooooo"},
#         {"id": "2", "name": "Cow noises"}
#     ]
    
#     # Return the playlists data as JSON
#     response = jsonify(playlists_data)
#     # add cors
#     response.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
#     response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
#     return response




## my attempt at using json stuff
# @app.route('/saveDiscoverWeekly', methods=['POST'])
# def save_discover_weekly():
#     try:
#         # Get token and verify it
#         token_info = getToken()
#         if not token_info:
#             raise Exception("User not logged in")

#         # Initialize Spotipy with the access token
#         sp = spotipy.Spotify(auth=token_info['access_token'])
#         user_id = sp.current_user()['id']

#         # Retrieve current playlists
#         current_playlists = sp.current_user_playlists()['items']

#         # Find Discover Weekly and Saved Weekly playlists
#         discover_weekly_playlist_id = None
#         saved_weekly_playlist_id = None
#         for playlist in current_playlists:
#             if playlist['name'] == 'Discover Weekly':
#                 discover_weekly_playlist_id = playlist['id']
#             if playlist['name'] == 'Saved Weekly':
#                 saved_weekly_playlist_id = playlist['id']

#         if not discover_weekly_playlist_id:
#             return jsonify({"error": "Discover Weekly not found"}), 404
        
#         # Create "Saved Weekly" playlist if it does not exist
#         if not saved_weekly_playlist_id:
#             new_playlist = sp.user_playlist_create(user_id, 'Saved Weekly', public=True)
#             saved_weekly_playlist_id = new_playlist['id']

#         # Add tracks from Discover Weekly to Saved Weekly playlist
#         discover_weekly_playlist = sp.playlist_items(discover_weekly_playlist_id)
#         song_uris = [song['track']['uri'] for song in discover_weekly_playlist['items']]
#         sp.user_playlist_add_tracks(user_id, saved_weekly_playlist_id, song_uris)

#         # Return success response
#         return jsonify({"message": "SAVED WEEKLY SUCCESS"}), 200

#     except Exception as e:
#         print("Error:", str(e), file=sys.stderr)
#         return jsonify({"error": str(e)}), 500  # Return error response with status code 500


# # from the video we're following
# @app.route('/saveDiscoverWeekly')                       # TODO: update this route to our core funcitonality
# def save_discover_weekly():

#   try:
#     token_info = getToken()
#   except:
#     print("User not logged in")                         # TODO: want this to be throwing an error that is passed to frontend using jsonify
#     return redirect('/')

#   sp = spotipy.Spotify(auth=token_info['access_token'])
#   user_id = sp.current_user()['id']
#   saved_weekly_playlist_id = None
#   discover_weekly_playlist_id = None

#   current_playlists = sp.current_user_playlists()['items']
#   for playlist in current_playlists:
#     print(playlist['name'], file=sys.stderr)
#     if (playlist['name'] == 'Discover Weekly'):
#       discover_weekly_playlist_id = playlist['id']
#     if (playlist['name'] == 'Saved Weekly'):
#       saved_weekly_playlist_id = playlist['id']

#   if not discover_weekly_playlist_id:
#     return "Discover Weekly not found"
#   if not saved_weekly_playlist_id:
#     new_playlist = sp.user_playlist_create(user_id, 'Saved Weekly', True)
#     saved_weekly_playlist_id = new_playlist['id']

#   discover_weekly_playlist = sp.playlist_items(discover_weekly_playlist_id)
#   song_uris = []
#   for song in discover_weekly_playlist['items']:
#     song_uri = song['track']['uri']
#     song_uris.append(song_uri)
#   sp.user_playlist_add_tracks(user_id, saved_weekly_playlist_id, song_uris, None)

#   return "SAVED WEEKLY SUCCESS"
#   # return "OAUTH SUCCESS"                                # TODO: make this actually useful for us
