import pandas as pd
from helpers import get_data_path, create_data_out_path

missing_data = pd.read_csv(
    get_data_path("missing_chart_data.csv")
)  # data before Dec. 2021

country_iso_codes = pd.read_csv(
    get_data_path(
        "iso_codes.csv",
        download_url="https://raw.githubusercontent.com/lukes/ISO-3166-Countries-with-Regional-Codes/master/all/all.csv",
    ),
    index_col="name",
)["alpha-2"].str.lower()

missing_with_iso_code = pd.merge(
    missing_data, country_iso_codes, left_on="region", right_index=True, how="left"
)

# some regions cannot be matched using country_iso_codes
missing_with_iso_code.loc[missing_with_iso_code.region == "Taiwan", "alpha-2"] = "tw"
missing_with_iso_code.loc[
    missing_with_iso_code.region == "Global", "alpha-2"
] = "global"
missing_with_iso_code.loc[
    missing_with_iso_code.region == "Czech Republic", "alpha-2"
] = "cz"
missing_with_iso_code.loc[
    missing_with_iso_code.region == "United Kingdom", "alpha-2"
] = "gb"
missing_with_iso_code.loc[
    missing_with_iso_code.region == "United States", "alpha-2"
] = "us"
missing_with_iso_code.loc[missing_with_iso_code.region == "Bolivia", "alpha-2"] = "bo"

missing_with_iso_code["url"] = (
    "https://charts.spotify.com/charts/view/regional-"
    + missing_with_iso_code["alpha-2"]
    + "-daily/"
    + missing_with_iso_code["date"]
)

codes_and_regions = missing_with_iso_code[["alpha-2", "region"]].drop_duplicates()

codes_and_regions.to_csv(create_data_out_path("codes_and_regions.csv"), index=False)
