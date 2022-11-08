# fetches all the relevant data for the project that was uploaded to a public Google Drive folder
from helpers import DATA_DIR
import gdown

gdown.download_folder(
    "https://drive.google.com/drive/folders/1bW2Gh3Xrcj6Dnaooe12JyCgYtmLh7Zt5?usp=sharing",
    output=DATA_DIR,
)
