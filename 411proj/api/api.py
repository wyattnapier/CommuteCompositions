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
# Define the data to insert into the collection
state_tracks_data = [
    {"state": "NY", "tracks": ["Empire State of Mind - Jay-Z", "Welcome to New York - Taylor Swift", "Cornelia Street - Taylor Swift", "Coney Island - Taylor Swift", "Come back be here - Taylor Swift", "Uptown girl - Billy Joel", "All too Well - Taylor Swift", "Delicate - Taylor Swift"]},
    {"state": "CA", "tracks": ["California Love - 2pac", "Hotel California - eagles", "California Gurls - Katy Perry", "Party in the USA - Miley Cyrus", "California Dreamin’ - Sia", "Malibu - Miley Cyrus", "The Very First Night - Taylor Swift", "I bet you think about me - Taylor Swift"]},
    {"state": "FL", "tracks": ["Florida - Junior Varsity", "Florida!!! - Taylor Swift", "3 Nights - Dominic Fike", "Summer Feelings - Lennon Stella", "Escape - Rupert Holmes"]},
    {"state": "PA", "tracks": ["seven - Taylor Swift", "gold rush - Taylor Swift"]},
    {"state": "VT", "tracks": ["Stick Season - Noah kahan", "Moonlight in Vermont - Frank Sinatra", "Green Mountain State - Trevor Hall"]},
    {"state": "MA", "tracks": ["I’m Shipping Up to Boston - Dropkick Murphys", "Homesick - Noah Kahan", "I Hate Boston - Renee Rapp", "Alewife - Clairo"]},
    {"state": "GA", "tracks": ["Georgia - Vance Joy", "Georgia Walks - Hans Williams", "Georgia - Phoebe Bridgers", "Tim Mcgraw - Taylor Swift"]},
    {"state": "HI", "tracks": ["Hawaiian Roller Coaster Ride - Lilo+Stitch", "Royal Hawaiian Hotel - The Brothers Cazimero", "Hawaiian Party - Cub Sport", "Mele Kalikimaka - Bing Crosby"]},
    {"state": "IL", "tracks": ["End of Beginning - Djo", "Illinois - Sufjan Steven", "Chicago - Sufjan Stevens", "Chicago - flipturn", "Chicago - michael jackson",]},
    # Add more states and tracks as needed
]

# Insert the data into the collection
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

# Route to read all documents
@app.route('/read', methods=['GET'])
def read_documents():
    documents = list(collection.find({}))  # Retrieve all documents
    # Convert ObjectId to string for each document
    for doc in documents:
        doc['_id'] = str(doc['_id'])
    # Serialize documents to JSON
    serialized_documents = json_util.dumps(documents)
    print("we got here?")
    return serialized_documents

@app.route('/readstate', methods=['GET'])
def read_state_document():
    selectedState = request.args.get('selectedState')
    
    document = collection.find_one({'_id': selectedState})
    
    if document:
        tracks = document.get('tracks', [])
        return jsonify({'tracks': tracks})
    else:
        return jsonify({'message': 'Document not found'}), 404


# Route to read a specific document based on selectedState and trackID
@app.route('/read', methods=['GET'])
def read_document():
    selectedState = request.args.get('selectedState')
    trackName = request.args.get('trackName')
    
    document = collection.find_one({'selectedState': selectedState, 'trackName': trackName})
    
    if document:
        # Convert ObjectId to string
        document['_id'] = str(document['_id'])
        return jsonify(document)
    else:
        return jsonify({'message': 'Document not found'}), 404

# Route to delete a document
@app.route('/delete', methods=['DELETE'])
def delete_document():
    trackName = request.args.get('trackName')
    stateID = request.args.get('stateID')

    # Construct a query to find the document based on both trackName and stateID
    query = {'trackName': trackName, 'stateID': stateID}

    result = collection.delete_one(query)
    if result.deleted_count > 0:
        return jsonify({'message': 'Document deleted successfully'})
    else:
        return jsonify({'message': 'Document not found'}), 404

# Route to delete all documents from the collection
@app.route('/delete/all', methods=['DELETE'])
def delete_all_documents():
    result = collection.delete_many({})
    deleted_count = result.deleted_count
    return jsonify({'message': f'{deleted_count} documents deleted successfully'})



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
       name="Commute Playlist!",
       public=True,
       collaborative=False,
       description="Made with LOVE (and like our 411 project)"
    )

    playlist_id = new_playlist['id']
    # playlist_external_url = new_playlist['external_urls']['spotify']
    # print("external url:", playlist_external_url)
    # playlist_uri = new_playlist['uri']
    # print("playlist_uri:", playlist_uri)

    #get the length that was passed in through the request
    length = int(request.args.get('length'))
    selectedState = request.args.get('selectedState')
    random_tracks = get_random_tracks(sp, length, selectedState)
    print("random tracks:", random_tracks)

    sp.user_playlist_add_tracks(user_id, playlist_id, random_tracks)

    #right now just returns the whole playlist? 
    #TODO: figure out what we acc need from this playlist and change return value
    return jsonify(new_playlist)
  except Exception as e:
    # Handle exceptions and log errors
    return jsonify({"error": f"Error fetching playlists: {e}"}), 500
  
#randomly chooses the tracks for the playlist
#TODO: need to make this more randomized (how???) and implement the database into it
def get_random_tracks(sp, length, selectedState):
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
      
      # random_db_index = (i+random_offset+1)%len(options['tracks']) # the +1 is just for fun
      # print("random db index:", random_db_index, " i:", i, " random_offset:", random_offset, " len(options):", len(options['tracks']))
      random_db_index = stariter
      
      ### trying to fancily parse the artists and tracks
      # dbquery = options['tracks'][random_db_index] # we need them in an array to do this
      # print("dbquery:", dbquery)
      # dbarti = dbquery.find('-')
      # # print("dbarti:", dbarti)
      # dbtrack = dbquery[:dbarti-1]
      # dbart = dbquery[dbarti+2:]
      # print("after splitting track:", dbtrack, " and artist:", dbart)
      # query = "track:" + str(dbtrack) + "artist:" + str(dbart)
      # print("query from db: ", query)

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

