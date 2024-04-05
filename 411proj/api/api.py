import spotipy                                         
from spotipy.oauth2 import SpotifyOAuth
import time
from flask import Flask, request, url_for, session, redirect
import os
from dotenv import load_dotenv

load_dotenv('.flaskenv')                                # Load environment variables from .flaskenv file

app = Flask(__name__)

# for some basic security
app.config['SESSION_COOKIE_NAME'] = 'Spotify Cookie'    # stored cookie used to check authorization on app
app.secret_key = 'ajk132dvaj21#783@#$kl'                # arbitrary string used in tandem with cookie
TOKEN_INFO = 'token_info'                               # just a placeholder value

# access environment values from the .flaskenv file
CLIENT_ID = os.environ.get("SPOTIPY_CLIENT_ID")
CLIENT_SECRET = os.environ.get("SPOTIPY_CLIENT_SECRET")


# base route
@app.route('/')
def login():
  auth_url = create_spotify_oauth().get_authorize_url()
  return redirect(auth_url)                             # send the user to the url specificed for OAuth

# used to handle oauth I think?
@app.route('/redirect')
def redirect_page():
  session.clear()                                       # clear any stored user data
  code = request.args.get('code')
  token_info = create_spotify_oauth().get_access_token(code) # exchanges auth code for access token that we store
  session[TOKEN_INFO] = token_info
  return redirect(url_for('save_discover_weekly', external=True)) # TODO: update this route to something actually useful for us

# from the video we're following
@app.route('/saveDiscoverWeekly')                       # TODO: update this route to our core funcitonality
def save_discover_weekly():

  try:
    token_info = getToken()
  except:
    print("User not logged in")                         # TODO: want this to be throwing an error that is passed to frontend using jsonify
    return redirect('/')

  sp = spotipy.Spotify(auth=token_info['access_token'])
  user_id = sp.current_user()['id']
  saved_weekly_playlist_id = None
  discover_weekly_playlist_id = None

  current_playlists = sp.current_user_playlists()['items']
  for playlist in current_playlists:
    if (playlist['name'] == "Discover Weekly"):
      discover_weekly_playlist_id = playlist["id"]
    if (playlist['name'] == "Saved Weekly"):
      saved_weekly_playlist_id = playlist["id"]

  if not discover_weekly_playlist_id:
    return "Discover Weekly not found"
  if not saved_weekly_playlist_id:
    new_playlist = sp.user_playlist_create(user_id, 'Saved Weekly', True)
    saved_weekly_playlist_id = new_playlist['id']

  discover_weekly_playlist = sp.playlist_items(discover_weekly_playlist_id)
  song_uris = []
  for song in discover_weekly_playlist['items']:
    song_uri = song['track']['uri']
    song_uris.append(song_uri)
  sp.user_playlist_add_tracks(user_id, saved_weekly_playlist_id, song_uris, None)

  return "SAVED WEEKLY SUCCESS"
  # return "OAUTH SUCCESS"                                # TODO: make this actually useful for us


# retrieves or refreshes our token
def getToken():
  token_info = session.get(TOKEN_INFO, None)
  if not token_info:                                    # send them back to login if they don't have token
    redirect(url_for('/login', external=False)) 
  
  now = int(time.time())
  is_expired = token_info['expires_at'] - now < 60      # checks if token is, or is about to, expire
  if(is_expired):                                       # if true then update token info
    spotify_oauth = create_spotify_oauth()
    token_info = spotify_oauth.refresh_access_token(['refresh_token'])
  return token_info

# begin OAuth
def create_spotify_oauth():
  return SpotifyOAuth(                                  # TODO: update the scope parameter for our project
    client_id = CLIENT_ID, 
    client_secret = CLIENT_SECRET,
    redirect_uri = "http://127.0.0.1:5000/redirect", # TODO: change this back to the absolute uri (but it was breaking stuff): url_for('redirect_page', external = True)
    scope = 'user-library-read playlist-modify-public playlist-modify-private'
    )

### sample example from the original setup video
# @app.route('/time')
# def get_current_time():
#   return {'time': time.time()}


