# Exploring Spotify Charts

In this repo, I explored data revolving around the daily Spotify Charts. I started this project in the [Visual Data Science](https://tiss.tuwien.ac.at/course/courseDetails.xhtml?dswid=9736&dsrid=772&courseNr=186868&semester=2022W) course I took during my Master's Studies at TU Wien but continued to work on it afterwards.

The project is split into two parts and respective subfolders:
 - `data-collection-and-exploration` contains Python code (Jupter notebooks and scripts) I used to obtain and explore data related to tracks that charted on the Spotify Charts. I chose to focus on the Top 50 daily charts for a set of 50 Spotify regions (49 countries and global charts), as this gave me the best data coverage.
 - `dataviz-website` contains code for a Next.js web app with several types of custom-built visualizations for the data I collected. To make the thing work, I modified the data I collected previously further and put it into a SQL database that I hosted in the cloud. You can check it out [here](spotify-charts-viz.vercel.app). Note that I had to make the database smaller and remove quite a bit of data.

I do realize that the code for this project is quite a bit of a mess. I intend to do a complete rewrite of everything. Code for this can be found [here](https://github.com/Sejmou/spotify-charts-analysis).