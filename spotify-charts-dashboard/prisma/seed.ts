import {
  PrismaClient,
  Artist,
  Track,
  Region,
  RegionChartEntry,
  GlobalChartEntry,
} from "@prisma/client";
import { promises as fs } from "fs";
import path from "path";

// Note: you do NOT need to execute this script if you already downloaded the db.sqlite file from Google Drive and put it into the prisma folder.
// This script is only needed if you want to seed the database from scratch using JSON files created from .csv files in the data subfolder of the root folder of this GitHub repo (downloaded via the download.py script).

const seedDataDir = path.join(__dirname, "seed-data");

async function getSeedData<T>(filename: string) {
  const file = await fs.readFile(path.join(seedDataDir, filename), "utf-8");
  return JSON.parse(file) as T[];
}

function createChunks<T>(array: T[], chunkSize: number) {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

const prisma = new PrismaClient();
async function main() {
  const artists = await getSeedData<Artist>("artists.json");
  await prisma.$transaction(
    artists.map((artist) =>
      prisma.artist.upsert({
        where: { id: artist.id },
        update: {},
        create: artist,
      })
    )
  );
  console.log("inserted", artists.length, "artists");

  const tracks = await getSeedData<Track>("tracks.json");
  const tracksWithParsedDates = tracks.map((track) => {
    track.albumReleaseDate = new Date(track.albumReleaseDate); // albumReleaseDate is a string in the JSON file, but we want it to be a Date in the database
    return track;
  });
  await prisma.$transaction(
    tracksWithParsedDates.map((track) => {
      return prisma.track.upsert({
        where: { id: track.id },
        update: {},
        create: track,
      });
    })
  );
  console.log("inserted", tracks.length, "tracks");

  const tracksAndArtists = await getSeedData<{
    trackId: string;
    artistId: string;
    rank: number;
  }>("track_artists.json");
  await prisma.$transaction(
    tracksAndArtists.map((feature) => {
      return prisma.trackArtistEntry.upsert({
        where: {
          trackFeatureId: {
            trackId: feature.trackId,
            artistId: feature.artistId,
          },
        },
        update: {},
        create: feature,
      });
    })
  );
  console.log("inserted", tracksAndArtists.length, "track-artist entries");

  const regions = await getSeedData<Region>("regions.json");
  for (const region of regions) {
    await prisma.region.upsert({
      where: { name: region.name },
      update: {},
      create: region,
    });
  }
  console.log("inserted metadata for", regions.length, "Spotify regions");

  const top50 = await getSeedData<RegionChartEntry>("top50.json");
  const chunks = createChunks(top50, 10000);
  let i = 0;
  for (const chunk of chunks) {
    console.log("processing chart data chunk", ++i, "of", chunks.length);
    await prisma.$transaction(
      chunk.map((chartEntry) => {
        chartEntry.date = new Date(chartEntry.date);
        if (chartEntry.regionName === "Global") {
          const { regionName, ...globalChartEntry } = chartEntry;
          return prisma.globalChartEntry.upsert({
            where: {
              chartEntryId: {
                trackId: globalChartEntry.trackId,
                date: globalChartEntry.date,
              },
            },
            update: {},
            create: globalChartEntry,
          });
        }
        return prisma.regionChartEntry.upsert({
          where: {
            chartEntryId: {
              trackId: chartEntry.trackId,
              regionName: chartEntry.regionName,
              date: chartEntry.date,
            },
          },
          update: {},
          create: chartEntry,
        });
      })
    );
  }
  console.log("inserted", top50.length, "chart entries");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
