# this script is used to create the JSON files that are rquired for creating the data for the SQLite database
# if you already have the db.sqlite file from Google Drive, you don't need to run this script
import pandas as pd
from helpers import get_data_path
import os

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


artists = pd.read_csv(get_data_path("artist_data.csv"))[["id", "name", "genres"]]
noname_artist_ids = artists.loc[artists.name.isna(), "id"]
artists_filtered = artists[artists.name.notna()]
store_and_print_info(artists_filtered, "artists")

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
