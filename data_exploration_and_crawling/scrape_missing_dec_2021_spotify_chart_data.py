# %%
import pandas as pd
from selenium import webdriver
from helpers import get_data_path, create_data_out_path
import os
import numpy as np

#%%
codes_and_regions = pd.read_csv(get_data_path("codes_and_regions.csv"))
profile_path = "/home/sejmou/.config/google-chrome"  # change to your profile path - this way we will remain logged into Spotify even if browser reopens (script will not work initially - need to log into Spotify by hand)
download_path = create_data_out_path("scraped_chart_data")
os.listdir(download_path)

dates = [f"2021-12-{i:02}" for i in list(range(1, 32))]

region_codes = codes_and_regions["alpha-2"].values

#%%
options = webdriver.ChromeOptions()

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


for date in dates:
    for code in region_codes:
        file_name = f"regional-{code}-daily-{date}.csv"
        print("current:", file_name)
        if os.path.exists(os.path.join(download_path, file_name)):
            print("already exists, skipping...")
            continue
        url = f"https://charts.spotify.com/charts/view/regional-{code}-daily/{date}"
        driver.get(url)
        driver.find_element_by_css_selector(
            "button[aria-labelledby='csv_download']"
        ).click()

# %%
