import urllib.request
from tqdm import tqdm
from io import BytesIO
from zipfile import ZipFile
import requests
import os
from pathlib import Path


class DownloadProgressBar(tqdm):
    def update_to(self, b=1, bsize=1, tsize=None):
        if tsize is not None:
            self.total = tsize
        self.update(b * bsize - self.n)


def download(url, output_path=None):
    with DownloadProgressBar(
        unit="B", unit_scale=True, miniters=1, desc=url.split("/")[-1]
    ) as t:
        urllib.request.urlretrieve(url, filename=output_path, reporthook=t.update_to)


def download_and_extract_zip(url, target_path):
    with requests.get(url, stream=True) as resp:
        message = f"Downloading ZIP from {url}"
        total = int(resp.headers.get("content-length", 0))
        # Can also replace 'file' with a io.BytesIO object
        with BytesIO() as buffer, tqdm(
            desc=message,
            total=total,
            unit="iB",
            unit_scale=True,
            unit_divisor=1024,
        ) as bar:
            for data in resp.iter_content(chunk_size=1024):
                size = buffer.write(data)
                bar.update(size)
            zip_file = ZipFile(buffer)
            with zip_file.open(zip_file.namelist()[0]) as f:
                content = f.read().decode()
                with open(target_path, "w") as out:
                    print(f"extracting to '{target_path}'")
                    out.write(content)


def fetch_data(url, target_path, unzip=False):
    if unzip:
        download_and_extract_zip(url, target_path)
    else:
        download(url, target_path)


ROOT_DIR = Path(
    os.path.abspath(os.path.join(os.path.abspath(__file__), os.path.pardir))
).parent.parent
DATA_DIR = os.path.join(
    ROOT_DIR, "data"
)  # import this from files using the data path to always get the correct path to the data no matter where script is executed from


if __name__ == "__main__":
    # testing stuff
    fetch_data("https://www.tagtraum.com/genres/msd_tagtraum_cd2c.cls.zip", "test.zip")
    fetch_data(
        "https://www.tagtraum.com/genres/msd_tagtraum_cd2c.cls.zip", "test.cls", True
    )
