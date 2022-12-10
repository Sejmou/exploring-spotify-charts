# %%
import pandas as pd
from helpers import get_data_path, create_data_out_path, split_dataframe, flatten
import os
from pandarallel import pandarallel
from ast import literal_eval

pandarallel.initialize(progress_bar=True)

#%%
tracks = pd.read_csv(
    get_data_path("tracks.csv"),
    # need to "parse" artists arrays https://stackoverflow.com/a/67079641
    converters={"artists": literal_eval},
)
# %%
def get_artist_ids_and_rank(track_artists_dicts):
    track_artists = pd.DataFrame(
        [[obj["id"], i + 1] for (i, obj) in enumerate(track_artists_dicts)],
        columns=["artist_id", "rank"],
    )
    return track_artists


def get_track_artist_ranks(track):
    artist_ranks = get_artist_ids_and_rank(track.artists)
    artist_ranks["track_id"] = track.id
    artist_ranks.set_index("track_id", inplace=True)
    return artist_ranks


# %%
chunks = split_dataframe(tracks, chunk_size=50)
chunk_folder_path = create_data_out_path("artist_chunks")
# %%


def get_artist_data(chunk):
    chunk_name = f"{chunk.index.min()}-{chunk.index.max()}.csv"
    print("current chunk:", chunk_name)
    out_path = os.path.join(chunk_folder_path, chunk_name)

    if not os.path.exists(out_path):
        chunk_data = pd.concat(chunk.apply(get_track_artist_ranks, axis=1).tolist())
        chunk_data.to_csv(out_path)
        return chunk_data
    else:
        print("Chunk already exists, loading")
        chunk_data = pd.read_csv(out_path, index_col="track_id")
        return chunk_data


artist_chunks = [get_artist_data(chunk) for chunk in chunks]
print("done")

# %%
artists = pd.concat(artist_chunks)
# %%
artists.to_csv(create_data_out_path("track_artists.csv"))
