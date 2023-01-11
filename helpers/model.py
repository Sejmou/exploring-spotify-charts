from functools import cache
from . import get_track_data, get_countries_charts
import pandas as pd


@cache
def get_basic_track_features():
    tracks = get_track_data()
    isrc_cols = tracks.columns[tracks.columns.str.contains("isrc")].tolist()
    album_cols = tracks.columns[tracks.columns.str.contains("album")].tolist()
    artist_cols = tracks.columns[tracks.columns.str.contains("artist")].tolist()
    other_irrelevant_cols = ["name", "preview_url", "genres"]
    irrelevant_cols = isrc_cols + album_cols + artist_cols + other_irrelevant_cols

    track_feats = tracks.drop(columns=irrelevant_cols)
    track_feats["single_release"] = tracks.album_type == "single"
    track_feats = track_feats.dropna()
    return track_feats


countries_charts = get_countries_charts()
track_feats = get_basic_track_features()


@cache
def get_track_feature_region_dataset():
    """
    Returns a dataframe with the track features for each track that only charted in one region. Oceania is removed because of low number of observations.
    """
    charting_tracks_by_region = countries_charts.drop_duplicates(
        subset=["id", "geo_region"]
    )[["id", "geo_region"]].rename(columns={"geo_region": "region"})
    tracks_charting_only_in_one_region = charting_tracks_by_region[
        ~charting_tracks_by_region.duplicated(keep=False, subset=["id"])
    ].reset_index(drop=True)
    region_tracks_features = pd.merge(
        track_feats, tracks_charting_only_in_one_region, on="id"
    ).set_index("id")
    region_track_feats_dataset = region_tracks_features.copy().loc[
        region_tracks_features.region != "Oceania"
    ]
    region_track_feats_dataset.region = (
        region_track_feats_dataset.region.cat.remove_unused_categories()
    )
    return region_track_feats_dataset


@cache
def get_track_feature_subregion_dataset():
    """
    Returns a dataframe with the track features for each track that only charted in one subregion.
    """
    charting_tracks_by_subregion = countries_charts.drop_duplicates(
        subset=["id", "geo_subregion"]
    )[["id", "geo_region", "geo_subregion"]].rename(
        columns={"geo_region": "region", "geo_subregion": "subregion"}
    )
    tracks_charting_only_in_one_subregion = charting_tracks_by_subregion[
        ~charting_tracks_by_subregion.duplicated(keep=False, subset="id")
    ].reset_index(drop=True)
    subregion_tracks_features = pd.merge(
        track_feats, tracks_charting_only_in_one_subregion, on="id"
    ).set_index("id")
    return subregion_tracks_features


if __name__ == "__main__":
    print(get_track_feature_region_dataset())
