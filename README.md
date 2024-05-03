# Commute Compositions #
### Setup ###
#### To setup the code first open a new terminal and git clone the repositiory 
#### Then cd into the main folder:
``` 
cd 411proj
npm i react-spotify-embed
```
#### Once you're in that file, you need to start up your virtual environment with the following sequence of commands:
```
python3 -m venv venv
source venv/bin/activate
```
#### The command line prompt should now look like this:
```
(venv) $ _
```
#### You will need to run the following commands to import packages:
```
pip install flask
pip install spotipy
pip install flask-dotenv
yarn add react-google-places-autocomplete
pip install Flask pymongo
```
#### Finally, to run the code open another terminal, let's call in Terminal B, and there, from the 411proj directory, run
```
yarn start-api
```
#### In the original terminal, Terminal A, run 
```
yarn start
```
### In a third terminal, Terminal C, you should navigate to the api directory and then once again start the virtual environment. Then, you want to start the database.
```
source venv/bin/activate
(venv) $ mongosh
```
#### Now the app should be running and you can open it up by clicking on the links in the terminals.
