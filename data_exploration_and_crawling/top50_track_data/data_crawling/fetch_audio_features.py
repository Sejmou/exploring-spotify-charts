# %%
import pandas as pd
import spotipy
from spotipy.oauth2 import SpotifyOAuth
from dotenv import load_dotenv
from helpers import get_data_path, create_data_out_path, split_dataframe, flatten
import os
from pandarallel import pandarallel

load_dotenv()
scope = "user-library-read"
sp = spotipy.Spotify(auth_manager=SpotifyOAuth(scope=scope))

pandarallel.initialize(progress_bar=True)

#%%
charts = pd.read_csv(
    get_data_path("top50.csv"),
    parse_dates=["date"],
    dtype={"region": "category"},
)
# %%
track_uris = charts.uri.drop_duplicates().reset_index()

# %%
chunks = split_dataframe(track_uris, chunk_size=50)
chunk_folder_path = create_data_out_path("audio_feature_chunks")


def get_audio_features(chunk):
    chunk_name = f"{chunk.index.min()}-{chunk.index.max()}.csv"
    print("current chunk:", chunk_name)
    out_path = os.path.join(chunk_folder_path, chunk_name)

    if not os.path.exists(out_path):
        # api_resp = flatten([sp.audio_features(uri) for uri in chunk.uri])
        # chunk_data = pd.DataFrame(api_resp)
        chunk_data = chunk.uri.parallel_apply(
            lambda uri: pd.Series(sp.audio_features(uri)[0])
        )
        chunk_data["uri"] = chunk.uri
        chunk_data.index = chunk.index
        chunk_data.to_csv(out_path, index=False)
        return chunk_data
    else:
        print("Chunk already exists, loading")
        chunk_data = pd.read_csv(out_path)
        return chunk_data


feature_chunks = [get_audio_features(chunk) for chunk in chunks]
print("done fetching data")

# %%
audio_features = pd.concat(feature_chunks)
# %%
audio_features.to_csv(create_data_out_path("audio_features.csv"), index=False)
