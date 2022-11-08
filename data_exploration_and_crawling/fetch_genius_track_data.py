# %%
import pandas as pd
from lyricsgenius import Genius
from dotenv import load_dotenv
import os
import sys
import time
from pandarallel import pandarallel
from helpers import get_data_path, create_data_out_path, split_dataframe

load_dotenv()  # loads GENIUS_ACCESS_TOKEN environment variable from .env, if it is present
token = os.getenv("GENIUS_ACCESS_TOKEN")

if token is None:
    print(
        "no Genius API token found! Generate it from https://genius.com/api-clients and place it .env file of current directory under GENIUS_ACCESS_TOKEN key"
    )
    sys.exit()

pandarallel.initialize(
    progress_bar=True
)  # pandarallel should speed up processing a bit, hopefully
# %%
tracks_and_primary_artist = pd.read_csv(
    get_data_path("track_and_primary_artist_names.csv")
)

# %%
chunks = split_dataframe(tracks_and_primary_artist, chunk_size=100)

genius = Genius(token)
genius.verbose = False  # Turn off status messages
genius.remove_section_headers = True  # Remove section headers (e.g. [Chorus])


def get_lyrics(row):
    while True:
        try:
            # this try...except is a workaround for request timeout issues; we just retry the song search until it works
            result = genius.search_song(row.title, row.artist, get_full_info=True)
            if result is not None:
                data = result.to_dict()
                data["spotify_tid"] = row.track_id
                return pd.Series(
                    data
                ).sort_index()  # not sure if sorting is really necessary, but at least JSON props always have same order than probably?
            break
        except:
            pass  # not interested in error, just try again lol


lyric_chunks_folder_path = create_data_out_path("genius_data_chunks")
if not os.path.exists(lyric_chunks_folder_path):
    os.mkdir(lyric_chunks_folder_path)

processed_chunks = [None] * len(chunks)

for i, chunk in enumerate(chunks):
    chunk_path = os.path.join(
        lyric_chunks_folder_path,
        f"{chunk.index[0]}-{chunk.index[-1]}.json",
    )
    print(
        f"processing chunk {i+1} of {len(chunks)} (rows {chunk.index[0]}-{chunk.index[-1]})"
    )
    start_time = time.time()

    if os.path.exists(chunk_path):
        print("chunk already exists, loading into memory")
        chunk_data = pd.read_json(chunk_path, orient="index")
    else:
        chunk_data = chunk.parallel_apply(
            get_lyrics, axis=1, result_type="expand"
        )  # using pandarallel speeds things up significantly :)
        chunk_data.set_index("spotify_tid")
        chunk_data.to_json(
            chunk_path,
            orient="index",
        )
    processed_chunks[i] = chunk_data
    print("processed chunk in " + f"{(time.time() - start_time):.2f}" + " seconds")

print("combining chunk data")
genius_data = pd.concat([processed_chunks])
genius_data = genius_data.loc[genius_data.lyrics.notna()]
print("obtained Genius data for", len(genius_data), "songs")
genius_data.to_json(create_data_out_path("genius_track_data.json"), orient="index")
