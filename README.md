# Visual Data Science project
This repo contains source code for the project I did in the [Visual Data Science](https://tiss.tuwien.ac.at/course/courseDetails.xhtml?dswid=9736&dsrid=772&courseNr=186868&semester=2022W) course at TU Wien (2022W).

## Install

### Data exploration stuff
If you have conda installed this is easy: just run

```bash
conda create -f environment.yml
conda activate sejmouvisds
pip install -e .
```

The first two commands create and activate a conda environment with Python 3.10 and install the required Python package dependencies. The final command installs my custom helper Python package. Afterwards it should be possible to run all the data exploration scripts and notebooks in `data_exploration_and_crawling`.

#### Addtional note regarding Spotify API
The scripts related to fetching data from Spotify (e.g. `data_exploration_and_crawling/track_data_combined/data_crawling/fetch_audio_features.py`) use `spotipy`,a lightweight python library for getting data from the Spotify API, and require some additional configuration. Create an `.env` file with the following content (you will need to create a Spotify Developer account and create a new application there to get the client ID and secret):
```
SPOTIPY_CLIENT_ID='our-client-id-would-be-here'
SPOTIPY_CLIENT_SECRET='our-client-secret-would-be-here'
SPOTIPY_REDIRECT_URI='http://127.0.0.1:9090'
```
These environment variables will be used by `spotipy` in the scripts.

The redirect URL `http://127.0.0.1:9090` mentioned in the `SPOTIPY_REDIRECT_URI` variable to the application in the Developer Console on the Spotify website. spotipy will "instantiate a server on the indicated response to receive the access token from the response at the end of the oauth flow" (as mentioned in the [docs](https://spotipy.readthedocs.io/en/2.21.0/#redirect-uri))

More info might follow later...
