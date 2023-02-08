import { PrismaClient } from "@prisma/client";
import { promises as fs } from "fs";
import path from "path";
import { z } from "zod";

// Note: you do NOT need to execute this script if you already downloaded the db.sqlite file from Google Drive and put it into the prisma folder.
// This script is only needed if you want to seed the database from scratch using JSON files created from .csv files in the data subfolder of the root folder of this GitHub repo (downloaded via the download.py script).

const seedDataDir = path.join(__dirname, "seed-data");

const artistsValidator = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    genres: z.array(z.string()), // genres is actually a stringified array of strings (don't ask me why, I was extremely tired when I wrote the code that produced the JSON file lol)
    thumbnailUrl: z.string().or(z.null()),
    imgUrl: z.string().or(z.null()),
  })
);

const albumsValidator = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    releaseDate: z.string(),
    releaseDatePrecision: z.string(),
    label: z.string(),
    thumbnailUrl: z.string().or(z.null()),
    imgUrl: z.string().or(z.null()),
    type: z.string(),
  })
);

const albumArtistsValidator = z.array(
  z.object({
    albumId: z.string(),
    artistId: z.string(),
    rank: z.number(),
  })
);

const trackArtistsValidator = z.array(
  z.object({
    trackId: z.string(),
    artistId: z.string(),
    rank: z.number(),
  })
);

const tracksValidator = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    acousticness: z.number(),
    albumId: z.string(),
    danceability: z.number(),
    durationMs: z.number(),
    energy: z.number(),
    explicit: z.boolean(),
    instrumentalness: z.number(),
    isrc: z.string(),
    isrcAgency: z.string(),
    isrcTerritory: z.string(),
    isrcYear: z.number(),
    key: z.number(),
    liveness: z.number(),
    loudness: z.number(),
    mode: z.number(),
    previewUrl: z.string().or(z.null()),
    speechiness: z.number(),
    tempo: z.number(),
    timeSignature: z.number(),
    valence: z.number(),
  })
);

const top50CountriesValidator = z.array(
  z.object({
    countryName: z.string(),
    date: z.string(),
    rank: z.number(),
    trackId: z.string(),
    streams: z.number(),
  })
);

const top50GlobalValidator = z.array(
  z.object({
    date: z.string(),
    rank: z.number(),
    trackId: z.string(),
    streams: z.number(),
  })
);

async function processFile(filename: string) {
  console.log("processing file", filename);
  const file = await fs.readFile(path.join(seedDataDir, filename), "utf-8");
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const content = JSON.parse(file);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return content;
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
  const artists = artistsValidator.parse(await processFile("artists.json"));
  const artistsFixed = artists.map((a) => ({
    ...a,
    thumbnailUrl: a.thumbnailUrl ?? undefined,
    imgUrl: a.imgUrl ?? undefined,
  }));
  await prisma.$transaction(
    artistsFixed.map((artist) =>
      prisma.artist.upsert({
        where: { id: artist.id },
        update: {},
        create: artist,
      })
    )
  );
  console.log("inserted", artists.length, "artists");

  const albums = albumsValidator.parse(await processFile("albums.json"));
  const albumsWithParsedDates = albums.map((album) => ({
    ...album,
    releaseDate: new Date(album.releaseDate),
  }));
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

  const albumArtists = albumArtistsValidator.parse(
    await processFile("album_artists.json")
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

  const tracks = tracksValidator.parse(await processFile("tracks.json"));
  await prisma.$transaction(
    tracks.map((input) => {
      const { albumId, ...track } = input;
      return prisma.track.upsert({
        where: { id: track.id },
        update: {},
        create: { ...track, album: { connect: { id: albumId } } },
      });
    })
  );
  console.log("inserted", tracks.length, "tracks");

  const tracksAndArtists = trackArtistsValidator.parse(
    await processFile("track_artists.json")
  );
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

  const top50Countries = top50CountriesValidator.parse(
    await processFile("top50_countries.json")
  );
  const top50CountriesWithParsedDates = top50Countries.map((entry) => ({
    ...entry,
    date: new Date(entry.date),
  }));
  const chunks = createChunks(top50CountriesWithParsedDates, 10000);
  let i = 0;
  for (const chunk of chunks) {
    console.log("processing chart data chunk", ++i, "of", chunks.length);
    await prisma.$transaction(
      chunk.map((chartEntry) => {
        return prisma.countryChartEntry.upsert({
          where: {
            chartEntryId: {
              trackId: chartEntry.trackId,
              countryName: chartEntry.countryName,
              date: chartEntry.date,
            },
          },
          update: {},
          create: chartEntry,
        });
      })
    );
  }
  console.log("inserted", top50Countries.length, "country chart entries");

  const top50Global = top50GlobalValidator.parse(
    await processFile("top50_global.json")
  );
  const top50GlobalWithParsedDates = top50Global.map((entry) => ({
    ...entry,
    date: new Date(entry.date),
  }));
  const globalChunks = createChunks(top50GlobalWithParsedDates, 10000);
  i = 0;
  for (const chunk of globalChunks) {
    console.log("processing chart data chunk", ++i, "of", globalChunks.length);
    await prisma.$transaction(
      chunk.map((chartEntry) => {
        return prisma.globalChartEntry.upsert({
          where: {
            chartEntryId: {
              trackId: chartEntry.trackId,
              date: chartEntry.date,
            },
          },
          update: {},
          create: chartEntry,
        });
      })
    );
  }
  console.log("inserted", top50Global.length, "global chart entries");
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
