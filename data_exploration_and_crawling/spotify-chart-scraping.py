# %%
import pandas as pd
from selenium import webdriver
from helpers import get_data_path, create_data_out_path

# this script was run with two files:
# missing_data = pd.read_csv(get_data_path("missing_chart_data.csv"))# data before Dec. 2021
missing_data = pd.read_csv(
    get_data_path("missing_chart_data_dec_2021.csv")
)  # data for Dec. 2021
missing_data.region

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
missing_with_iso_code.to_csv(
    create_data_out_path("missing_chart_data_with_urls.csv"), index=False
)

profile_path = "/home/sejmou/.config/google-chrome"  # change to your profile path - this way we will remain logged into Spotify even if browser reopens (script will not work initially - need to log into Spotify by hand)

options = webdriver.ChromeOptions()

download_path = create_data_out_path("scraped_chart_data")
prefs = {}
prefs["profile.default_content_settings.popups"] = 0
prefs["download.default_directory"] = str(download_path)
options.add_experimental_option("prefs", prefs)
options.add_argument(f"user-data-dir={profile_path}")

# %%
driver = webdriver.Chrome(options=options)
driver.implicitly_wait(
    10
)  # An implicit wait tells WebDriver to poll the DOM for a certain amount of time when trying to find any element (or elements) not immediately available. The default setting is 0 (zero). Once set, the implicit wait is set for the life of the WebDriver object.


def download_csv(row):
    print(row)
    driver.get(row.url)
    driver.find_element_by_css_selector(
        "button[aria-labelledby='csv_download']"
    ).click()


missing_with_iso_code.apply(download_csv, axis=1)
