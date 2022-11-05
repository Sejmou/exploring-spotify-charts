# %%
import pandas as pd
from helpers import get_data_path, create_data_out_path

scraped_data_folder_path = pd.read_csv(get_data_path("scraped_chart_data"))
