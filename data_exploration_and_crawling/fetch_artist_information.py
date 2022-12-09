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
track_artists = pd.read_csv(get_data_path("track_artists.csv"))
artist_ids = track_artists.artist_id.drop_duplicates().reset_index()
artist_ids.to_csv(create_data_out_path("artists.csv"), index=False)
# %%
chunks = split_dataframe(pd.DataFrame(artist_ids), chunk_size=50)
chunk_folder_path = create_data_out_path("artist_info_chunks")
# %%
def fetch_artist_infos(chunk):
    chunk_name = f"{chunk.index.min()}-{chunk.index.max()}.csv"
    print("current chunk:", chunk_name)
    out_path = os.path.join(chunk_folder_path, chunk_name)

    if not os.path.exists(out_path):
        api_resp = sp.artists(chunk.artist_id)["artists"]
        chunk_data = pd.DataFrame(api_resp)
        chunk_data.index = chunk.index
        chunk_data.to_csv(out_path, index=False)
        return chunk_data
    else:
        print("Chunk already exists, loading")
        chunk_data = pd.read_csv(out_path)
        return chunk_data


artist_infos = [fetch_artist_infos(chunk) for chunk in chunks]
print("done fetching data")

# %%
artist_data = pd.concat(artist_infos)
# %%
artist_data.to_csv(create_data_out_path("artist_data.csv"), index=False)
