# %%
import pandas as pd
import spotipy
from spotipy.oauth2 import SpotifyOAuth
from dotenv import load_dotenv
from helpers import get_data_path, create_data_out_path, split_dataframe
import os

load_dotenv()
scope = "user-library-read"
sp = spotipy.Spotify(auth_manager=SpotifyOAuth(scope=scope))

#%%
charts = pd.read_csv(
    get_data_path("spotify_charts_cleaned.csv"),
    parse_dates=["date"],
    dtype={"region": "category"},
)
# %%
track_uris = charts.uri.drop_duplicates().reset_index()

# %%
chunks = split_dataframe(track_uris, chunk_size=50)
chunk_folder_path = create_data_out_path("track_chunks")


def fetch_track_infos(chunk):
    chunk_name = f"{chunk.index.min()}-{chunk.index.max()}.csv"
    print("current chunk:", chunk_name)
    out_path = os.path.join(chunk_folder_path, chunk_name)

    if not os.path.exists(out_path):
        api_resp = sp.tracks(chunk.uri)["tracks"]
        chunk_data = pd.DataFrame(api_resp)
        chunk_data.index = chunk.index
        chunk_data.to_csv(out_path, index=False)
        return chunk_data
    else:
        print("Chunk already exists, loading")
        chunk_data = pd.read_csv(out_path)
        return chunk_data


track_infos = [fetch_track_infos(chunk) for chunk in chunks]
print("done fetching data")

# %%
track_data = pd.concat(track_infos)
# %%
track_data.to_csv(create_data_out_path("tracks.csv"), index=False)

# %%
