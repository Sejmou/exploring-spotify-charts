import urllib.request
from tqdm import tqdm
from io import BytesIO
from zipfile import ZipFile
import requests
import os
from pathlib import Path

ROOT_DIR = Path(os.path.abspath(__file__)).parent.parent.parent

DATA_DIR = os.path.join(ROOT_DIR, "data")


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


def download_data(url: str, name: str, unzip=False):
    """
    Downloads a file from a URL to the DATA_DIR under the given name
    """
    target_path = os.path.join(DATA_DIR, name)
    if unzip:
        download_and_extract_zip(url, target_path)
        print("Downloaded and extracted data")
    else:
        download(url, target_path)
        print("Downloaded data")


def get_data_path(name: str, download_url: str = None, unzip=False):
    """
    Returns the local absolute path for a file in DATA_DIR.

    If a download_url is provided and the data is not available locally, it will be fetched from this URL and stored inside the DATA_DIR under the given name. The path will be returned afterwards.

    In the case that the remote file is a zip file that should be extracted, set unzip to True.
    """
    target_path = os.path.join(DATA_DIR, name)
    if not os.path.exists(target_path):
        print(f"'{name}' not available locally")
        if not download_url:
            raise RuntimeError(
                f"No download_url provided, cannot fetch data! Add '{name}' to '{DATA_DIR}' by hand!"
            )
        else:
            print(
                f"Fetching data from '{download_url}'{'(will unzip afterwards)' if unzip else ''}"
            )
            download_data(download_url, name, unzip=unzip)
    return target_path


def create_data_out_path(name: str):
    """
    used by data fetching scripts to create a path inside DATA_DIR to write a newly created file to
    """
    out_path = Path(os.path.join(DATA_DIR, name))
    print("Data output path:", out_path)
    return out_path


# https://stackoverflow.com/a/28882020/13727176
def split_dataframe(df, chunk_size=100):
    chunks = list()
    num_chunks = len(df) // chunk_size + 1
    for i in range(num_chunks):
        chunks.append(df[i * chunk_size : (i + 1) * chunk_size])
    return chunks


if __name__ == "__main__":
    # example usage
    print(
        get_data_path(
            "test.zip", "https://www.tagtraum.com/genres/msd_tagtraum_cd2c.cls.zip"
        )
    )
    print(
        get_data_path(
            "test.cls",
            "https://www.tagtraum.com/genres/msd_tagtraum_cd2c.cls.zip",
            unzip=True,
        )
    )
    pass
