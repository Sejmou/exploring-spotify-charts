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
import json

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
    | tracks_filtered.columns.str.contains("album_id"),
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
    .rename(columns={"id": "trackId", "region": "countryName"})
)
top50_filtered = top50[top50.trackId.isin(tracks_filtered.id)]
top50_global = top50_filtered[top50_filtered.countryName == "Global"].drop(
    columns=["countryName"]
)
store_and_print_info(top50_global, "top50_global")
top50_countries = top50_filtered[top50_filtered.countryName != "Global"]
store_and_print_info(top50_countries, "top50_countries")

countries = pd.read_csv(get_data_path("spotify_region_metadata.csv")).rename(
    columns={"spotify_region": "name"}
)
store_and_print_info(countries, "countries")

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


pool = Pool(processes=4)  # might have to lower that number depending on your machine
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
album_data["artist_ids"] = album_data.artists.apply(get_artist_ids)
album_data[["thumbnail_url", "img_url"]] = album_data.images.apply(
    extract_image_urls
).apply(pd.Series)
album_data.drop(columns=["artists", "images"], inplace=True)

album_artist_mapping = pd.DataFrame(
    album_data.set_index("id").artistIds.explode()
).rename(columns={"artist_ids": "artist_id"})
album_artist_mapping["rank"] = album_artist_mapping.groupby("id").cumcount() + 1
album_artist_mapping = album_artist_mapping.reset_index().rename(
    columns={"id": "album_id"}
)
store_and_print_info(album_artist_mapping, "album_artists")

album_data.drop(columns=["artist_ids"], inplace=True)
store_and_print_info(album_data, "albums")


# %%
album_artist_ids = album_artist_mapping.artist_id.drop_duplicates().reset_index(
    drop=True
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
# %%
artist_final_data["genres"] = artist_final_data.genres.apply(
    json.dumps
)  # important, otherwise this is NOT a valid JSON array in the output and parsing will fail (took me a few hours to figure that out lol)
store_and_print_info(artist_final_data, "artists")

# %%
# add regions mentioned in ISRC territory column of tracks
full_country_info = pd.read_csv(
    "https://raw.githubusercontent.com/lukes/ISO-3166-Countries-with-Regional-Codes/master/all/all.csv"
)
tracks = pd.read_json(os.path.join(script_dir, "seed-data", "tracks.json"))
territories = tracks.isrcTerritory.drop_duplicates()

country_info_for_territories = pd.merge(
    full_country_info,
    territories,
    left_on="name",
    right_on="isrcTerritory",
    how="right",
)
country_info_for_territories[country_info_for_territories.name.isna()]

renames_country_info = {
    "United States of America": "United States",
    "United Kingdom of Great Britain and Northern Ireland": "United Kingdom",
    "Czechia": "Czech Republic",
    "Taiwan, Province of China": "Taiwan",
    "Korea, Republic of": "South Korea",
}
full_country_info_fixed = full_country_info.replace({"name": renames_country_info})

renames_isrc_territory = {
    "Chinese Taipei": "Taiwan",
    "Hong Kong SAR, China": "Hong Kong",
}
territories = territories.replace(renames_isrc_territory)

country_info_for_territories_fixed = pd.merge(
    full_country_info_fixed,
    territories,
    left_on="name",
    right_on="isrcTerritory",
    how="right",
)
country_info_for_territories_fixed.loc[
    country_info_for_territories_fixed.name == "Kosovo",
    ["name", "alpha-2", "alpha-3", "region", "sub-region"],
] = ["Kosovo", "XK", "XKX", "Europe", "Eastern Europe"]
country_info_for_territories_fixed.rename(
    columns={
        "alpha-2": "isoAlpha2",
        "alpha-3": "isoAlpha3",
        "region": "geoRegion",
        "sub-region": "geoSubregion",
    },
    inplace=True,
)
countries = pd.read_json(os.path.join(script_dir, "seed-data", "countries.json"))

countries_complete = pd.concat(
    [countries, country_info_for_territories_fixed[countries.columns]]
).drop_duplicates()
countries_complete = countries_complete[~countries_complete.name.isna()]
store_and_print_info(countries_complete, "countries")

# %%
# map categorical track features encoded with boolean/numbers to human-readable strings
tracks = pd.read_json(os.path.join(script_dir, "seed-data", "tracks.json"))

tracks["mode"] = tracks["mode"].astype("category")
tracks["mode"] = tracks["mode"].cat.rename_categories({0: "Minor", 1: "Major"})


def rename_least_frequent_to_other(series, share_of_total=0.01):
    """Rename least frequent values to 'Other'."""
    counts = series.value_counts()
    least_frequent = counts[counts < share_of_total * counts.sum()]
    return series.replace(least_frequent.index, "Other")


tracks["timeSignature"] = rename_least_frequent_to_other(tracks.timeSignature)
tracks["timeSignature"] = tracks["timeSignature"].astype("category")
tracks["timeSignature"] = tracks["timeSignature"].cat.rename_categories(
    {3: "3/4", 4: "4/4", 5: "5/4"}
)
tracks["explicit"] = tracks["explicit"].astype("category")
tracks["explicit"] = tracks["explicit"].cat.rename_categories({0: "No", 1: "Yes"})
tracks["key"] = tracks["key"].astype("category")
tracks["key"] = tracks["key"].cat.rename_categories(
    {
        0: "C",
        1: "C#/Db",
        2: "D",
        3: "D#/Eb",
        4: "E",
        5: "F",
        6: "F#/Gb",
        7: "G",
        8: "G#/Ab",
        9: "A",
        10: "A#/Bb",
        11: "B",
    }
)
store_and_print_info(tracks, "tracks")
# %%
isrc_agency_data = tracks[["isrcAgency", "isrcTerritory"]].drop_duplicates()
store_and_print_info(isrc_agency_data, "isrc_agencies")

# %%
