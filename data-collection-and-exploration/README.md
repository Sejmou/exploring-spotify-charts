# Python Data exploration
Some of the stuff here might be updated, I lost track of stuff a bit and had to delete some of the Google Drive data mentioned below due to running out of space. Sorry!

## Data
Run `data_exploration_and_crawling/download_data_from_google_drive.py` to get the latest version of the data assembled for this project. If you don't want to install any Python stuff, you can also download the data yourself from [Google Drive](https://drive.google.com/drive/folders/1bW2Gh3Xrcj6Dnaooe12JyCgYtmLh7Zt5?usp=sharing) and put it into the `data` folder (this is the place where any code in this project will look for the data). The "final output" datasets are `top50.csv` and `top50_track_data.csv`, the rest are helper datasets created and used for constructing them. You should be able to find "explanations for their origin" by just searching for the names of the files in all the scripts/notebooks of `data_exploration`.

## Conda Environment Setup
I have collected all the project dependencies in a `environment.yml` file for creating a conda environment.

If you have conda installed, run

```bash
conda env create -f environment.yml
conda activate sejmouvisds
pip install -e .
```

The first two commands create and activate a conda environment with Python 3.10 and install the required Python package dependencies. The final command installs my custom helper Python package.

### Spotify API usage in Python scripts (spotipy)
The scripts related to fetching data from Spotify (e.g. `data_exploration_and_crawling/top50_track_data/data_crawling/fetch_audio_features.py`) use `spotipy`,a lightweight python library for getting data from the Spotify API, and require some additional configuration. Create an `.env` file with the following content (you will need to create a Spotify Developer account and create a new application there to get the client ID and secret):
```
SPOTIPY_CLIENT_ID='our-client-id-would-be-here'
SPOTIPY_CLIENT_SECRET='our-client-secret-would-be-here'
SPOTIPY_REDIRECT_URI='http://127.0.0.1:9090'
```
These environment variables will be used by `spotipy` in the scripts.

The redirect URL `http://127.0.0.1:9090` mentioned in the `SPOTIPY_REDIRECT_URI` variable to the application in the Developer Console on the Spotify website. spotipy will "instantiate a server on the indicated response to receive the access token from the response at the end of the oauth flow" (as mentioned in the [docs](https://spotipy.readthedocs.io/en/2.21.0/#redirect-uri))

If you've done all the steps above, it should be possible to run all the data exploration scripts and notebooks in `data_exploration_and_crawling`.
