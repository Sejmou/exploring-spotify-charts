# %%
import pandas as pd
from helpers import get_data_path, create_data_out_path

# %%
tracks = pd.read_csv(get_data_path("tracks.csv"))
track_id_to_name = tracks.set_index("id").name
track_artists = pd.read_csv(get_data_path("track_artists.csv"))
tracks_primary_artist_only = track_artists.loc[track_artists["rank"] == 1].drop(
    columns="rank"
)
primary_artists = tracks_primary_artist_only.artist_id.drop_duplicates()
artist_data = pd.read_csv(get_data_path("artist_data.csv"))
primary_artist_id_to_name = (
    artist_data.loc[artist_data.id.isin(primary_artists)].set_index("id").name
)

track_and_artist_names = (
    tracks_primary_artist_only.merge(
        primary_artist_id_to_name, left_on="artist_id", right_index=True
    )
    .rename(columns={"name": "artist"})
    .merge(track_id_to_name, left_on="track_id", right_index=True)
    .rename(columns={"name": "title"})
    .reset_index()
    .drop(columns="index")
)
# %%
track_and_artist_names.to_csv(
    create_data_out_path("track_and_artist_names.csv"), index=False
)
