import type {
  Artist,
  Track,
  Album,
  AlbumArtistEntry,
  Region,
  RegionChartEntry,
} from "@prisma/client";
import { PrismaClient } from "@prisma/client";
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
        create: {
          ...artist,
          genres: JSON.stringify(artist.genres), // genres is actually a string array in the JSON file, but we can't store string arrays in SQLite :/
        },
      })
    )
  );
  console.log("inserted", artists.length, "artists");

  const albums = await getSeedData<Album>("albums.json");
  const albumsWithParsedDates = albums.map((album) => {
    album.releaseDate = new Date(album.releaseDate); // releDate is actually still a string at this point
    return album;
  });
  await prisma.$transaction(
    albumsWithParsedDates.map((album) => {
      return prisma.album.upsert({
        where: { id: album.id },
        update: {},
        create: album,
      });
    })
  );
  console.log("inserted", albums.length, "albums");

  const tracks = await getSeedData<Track>("tracks.json");
  await prisma.$transaction(
    tracks.map((track) => {
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

  const albumArtists = await getSeedData<AlbumArtistEntry>(
    "album_artists.json"
  );

  await prisma.$transaction(
    albumArtists.map((feature) => {
      return prisma.albumArtistEntry.upsert({
        where: {
          albumFeatureId: {
            artistId: feature.artistId,
            albumId: feature.albumId,
          },
        },
        update: {},
        create: feature,
      });
    })
  );
  console.log("inserted", albumArtists.length, "album-artist entries");

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
