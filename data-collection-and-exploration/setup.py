from setuptools import find_packages, setup


setup(
    name="helpers",
    version="0.1",
    description="utility functions to make my life easier working on the Visual Data Science data collection/wrangling/profiling/modeling part",
    author="Samo Kolter",
    author_email="e11810909@student.tuwien.ac.at",  # picked arbitrary group member email
    license="MIT",
    install_requires=[
        # this implicitly requires all the stuff mentioned in environment.yml - install and activate conda environment first! - see README.md in root
    ],
    packages=find_packages(),
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Education",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.10",
    ],
    zip_safe=False,
)
