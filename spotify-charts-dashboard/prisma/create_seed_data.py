# this script is used to create the JSON files that are rquired for creating the data for the SQLite database
# if you already have the db.sqlite file from Google Drive, you don't need to run this script
# %%
from ast import literal_eval
from helpers import get_data_path, split_dataframe
import pandas as pd
import os
import spotipy
from spotipy.oauth2 import SpotifyOAuth
from multiprocessing import Pool
import tqdm

script_dir = os.path.dirname(os.path.abspath(__file__))


def to_camel_case(snake_str):
    components = snake_str.split("_")
    # We capitalize the first letter of each component except the first one
    # with the 'title' method and join them together.
    return components[0] + "".join(x.title() for x in components[1:])


def store_and_print_info(df: pd.DataFrame, filename: str):
    df = df.copy()
    df.columns = [to_camel_case(col) for col in df.columns]
    df.to_json(
        os.path.join(script_dir, "seed-data", filename + ".json"), orient="records"
    )
    print("Stored", filename + ".json")
    print("Column dtypes:")
    print(df.dtypes)
    print("Shape:", df.shape)
    print()


def extract_image_urls(images):
    cover_thumbnail_url = None
    cover_img_url = None
    for image in images:
        if image["height"] <= 160:
            cover_thumbnail_url = image["url"]
        if image["height"] > 320:
            cover_img_url = image["url"]
    return cover_thumbnail_url, cover_img_url


# %%
artists = pd.read_csv(
    get_data_path("artist_data.csv"),
    converters={"genres": literal_eval, "images": literal_eval},
)
noname_artist_ids = artists.loc[artists.name.isna(), "id"]
artists_filtered = artists[artists.name.notna()]

track_artists = pd.read_csv(get_data_path("track_artists.csv"))

tracks = pd.read_csv(get_data_path("top50_track_data.csv"))
tracks_filtered = tracks.drop(
    columns=[col for col in tracks.columns if col.startswith("artist_")] + ["genres"]
)
tracks_filtered = tracks_filtered[
    tracks_filtered["name"].notna()
    & tracks_filtered["loudness"].notna()
    & tracks_filtered["isrc"].notna()
]
tracks_featuring_noname_artists = track_artists[
    track_artists.artist_id.isin(noname_artist_ids)
].track_id.unique()
tracks_filtered = tracks_filtered[
    ~tracks_filtered.id.isin(tracks_featuring_noname_artists)
]
tracks_filtered = tracks_filtered.loc[
    :,
    ~tracks_filtered.columns.str.startswith("album")
    | tracks_filtered.columns.str.contains("albumId"),
]  # remove album columns that are not albumId -> stored in albums table
store_and_print_info(tracks_filtered, "tracks")

# filter out non-existing tracks and artists as we would otherwise get foreign key constraint errors when adding track artists information to the database
track_artists = track_artists[
    (track_artists.artist_id.isin(artists_filtered.id))
    & (track_artists.track_id.isin(tracks_filtered.id))
]
store_and_print_info(track_artists, "track_artists")

top50 = (
    pd.read_csv(get_data_path("top50.csv"))
    .sort_values(["date", "region"])
    .rename(columns={"id": "trackId", "region": "regionName"})
)
top50_filtered = top50[top50.trackId.isin(tracks_filtered.id)]
store_and_print_info(top50_filtered, "top50")

regions = pd.read_csv(get_data_path("spotify_region_metadata.csv")).rename(
    columns={"spotify_region": "name"}
)
store_and_print_info(regions, "regions")

# %%
# get album data
def get_artist_ids(artists_list):
    return [artist["id"] for artist in artists_list]


# fetch album data from Spotify API
# NOTE: this step requires a Spotify API client ID and client secret (see https://developer.spotify.com/documentation/general/guides/app-settings/)
# place them in a .env file in the root directory of this project (or wherever you run this script from)
# the .env file should look like this:
# SPOTIPY_CLIENT_ID=<your client ID>
# SPOTIPY_CLIENT_SECRET=<your client secret>
# SPOTIPY_REDIRECT_URI='http://127.0.0.1:9090'
print("fetching album data from Spotify API...")
sp = spotipy.Spotify(auth_manager=SpotifyOAuth())
track_album_ids = tracks_filtered.album_id.drop_duplicates().reset_index(drop=True)
album_id_chunks = split_dataframe(pd.DataFrame(track_album_ids), chunk_size=20)


def fetch_album_info(album_ids):
    api_resp = sp.albums(album_ids)["albums"]
    keys_to_extract = [
        "id",
        "name",
        "artists",
        "release_date",
        "release_date_precision",
        "label",
        "images",
        "album_type",
    ]
    api_resp = [{key: album[key] for key in keys_to_extract} for album in api_resp]
    chunk_data = pd.DataFrame(api_resp)
    return chunk_data


pool = Pool(processes=8)
results = list(
    tqdm.tqdm(
        pool.imap_unordered(
            fetch_album_info,
            [chunk.album_id.to_list() for chunk in album_id_chunks],
        ),
        total=len(album_id_chunks),
    )
)
# try the code below if you run into issues with the code above - didn't work for me when experimenting with it (probably I was blocked bc of too many API requests)
# pool = Pool(processes=20)
# tasks = [pool.apply_async(fetch_album_info, args=(chunk.album_id.to_list(),)) for chunk in chunks]
# pool.close()
# pool.join()
# results = [task.get() for task in tasks]
album_data = pd.concat(results).reset_index(drop=True)
album_data.rename(columns={"album_type": "type"}, inplace=True)
album_data["artistIds"] = album_data.artists.apply(get_artist_ids)
album_data[["thumbnail_url", "img_url"]] = album_data.images.apply(
    extract_image_urls
).apply(pd.Series)
album_data.drop(columns=["artists", "images"], inplace=True)

album_artist_mapping = pd.DataFrame(
    album_data.set_index("id").artistIds.explode()
).rename(columns={"artistIds": "artistId"})
album_artist_mapping["rank"] = album_artist_mapping.groupby("id").cumcount() + 1
album_artist_mapping = album_artist_mapping.reset_index().rename(
    columns={"id": "albumId"}
)
store_and_print_info(album_artist_mapping, "album_artists")

album_data.drop(columns=["artistIds"], inplace=True)
store_and_print_info(album_data, "albums")


# %%
album_artist_ids = (
    album_data.artistIds.explode().drop_duplicates().reset_index(drop=True)
)
# we don't have the artist data for all albums, so we need to fetch the missing data from the Spotify API as well
missing_album_artist_ids = album_artist_ids[~album_artist_ids.isin(artists.id)].rename(
    "artist_id"
)
album_artist_chunks = split_dataframe(
    pd.DataFrame(missing_album_artist_ids), chunk_size=50
)

# %%
print("fetching missing album artist data from Spotify API...")


def fetch_artist_data(chunk):
    api_resp = sp.artists(chunk.artist_id)["artists"]
    chunk_data = pd.DataFrame(api_resp)
    return chunk_data


album_artist_data = pd.concat(
    [fetch_artist_data(chunk) for chunk in album_artist_chunks]
).reset_index(drop=True)
artist_final_data = pd.concat([artists_filtered, album_artist_data]).reset_index(
    drop=True
)
artist_final_data[["thumbnail_url", "img_url"]] = artist_final_data.images.apply(
    extract_image_urls
).apply(pd.Series)
artist_final_data.drop(
    columns=[
        "images",
        "external_urls",
        "followers",
        "href",
        "popularity",
        "type",
        "uri",
    ],
    inplace=True,
)
store_and_print_info(artist_final_data, "artists")

# %%
