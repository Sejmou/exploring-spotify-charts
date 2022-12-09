# %%
import pandas as pd
from helpers import get_data_path, create_data_out_path
from ast import literal_eval

# %%
tracks = pd.read_csv(
    get_data_path("tracks.csv"),
    # need to "parse" artists arrays https://stackoverflow.com/a/67079641
    converters={"artists": literal_eval},
)
track_artists = pd.read_csv(get_data_path("track_artists.csv"), index_col="artist_id")
artist_data = pd.read_csv(
    get_data_path("artist_data.csv"),
    index_col="id",
    converters={"genres": literal_eval},
)
# %%
def get_artist_data(artist_ids):
    return artist_data.loc[artist_ids]


def get_artist_genres(artist_ids):
    data = get_artist_data(artist_ids)
    return data.genres


def get_artist_names_and_ids(artist_objs):
    relevant_artist_fields = ["id", "name"]
    artists = pd.DataFrame(
        [
            {k: v for k, v in artist.items() if k in relevant_artist_fields}
            for artist in artist_objs
        ]
    )
    artists["rank"] = artists.index + 1
    artists.set_index("id", inplace=True)
    return artists


def get_genres(artists):
    # therefore our goal is to create a genre list
    # where genres of primary artist take highest precendence, followed by those of second, ...
    genres = get_artist_genres(artists.index)
    artist_genres = []  # may include duplicates if several artists with same genre
    for cur_genres in genres:
        artist_genres.extend(cur_genres)
    # keep only first occurence of each genre
    #  - for details on how that works see https://stackoverflow.com/a/53657523/13727176
    return list(dict.fromkeys(artist_genres))


def extract_artists_and_genres(track, max_artists=5):
    artists = get_artist_names_and_ids(track.artists[:max_artists])
    # unfortunately, Spotify tracks don't have song-level genre labels
    # the next best thing is using the genres of the artists that feature in the song
    track_genres = get_genres(artists)
    artists = artists.reset_index().set_index("rank")
    res = {"track_id": track["id"]}
    for rank, artist in artists.iterrows():
        rank = str(rank)
        res["artist_id_" + rank] = artist.id
        res["artist_name_" + rank] = artist["name"]
    res["genres"] = track_genres
    return res


track_artists_and_genres = tracks.apply(
    extract_artists_and_genres, axis=1, result_type="expand"
)


# %%
track_artists_and_genres.to_csv(
    create_data_out_path("track_artists_and_genres.csv"), index=False
)
