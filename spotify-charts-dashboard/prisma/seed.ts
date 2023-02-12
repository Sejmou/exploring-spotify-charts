import { PrismaClient } from "@prisma/client";
import { promises as fs } from "fs";
import path from "path";
import { z } from "zod";
import { truncate } from "../src/utils/misc";

// This script fills the database with data from the JSON files created via create_seed_data.py (check this script for details on how this data was obtained - side note: it's a bit messy lol)
// If this script is re-executed it will reset all the matching data in the database with the values from the JSON files as well (should not be a problem since the data is not modified in the application - at least as of today (8 Feb 2023))

// CONFIG
const skipIfRowCountsMatch = true; // if true, the script will skip the seeding process if the row counts of the tables match the row counts of the JSON files
const useSubsetOfCountries = true; // if true, only the three countries (Germany, United States, Brazil) will be used for the country charts

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
    instrumentalness: z.number(),
    isrc: z.string(),
    isrcAgency: z.string(),
    isrcTerritory: z.string(),
    isrcYear: z.number(),
    liveness: z.number(),
    loudness: z.number(),
    previewUrl: z.string().or(z.null()),
    speechiness: z.number(),
    tempo: z.number(),
    valence: z.number(),
    mode: z.string(),
    key: z.string(),
    explicit: z.string(),
    timeSignature: z.string(),
  })
);

const isrcAgencyValidator = z.array(
  z.object({
    isrcAgency: z.string(),
    isrcTerritory: z.string(),
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

const countriesValidator = z.array(
  z.object({
    name: z.string(),
    isoAlpha2: z.string(),
    isoAlpha3: z.string(),
    geoRegion: z.string(),
    geoSubregion: z.string(),
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

async function runAsyncFnInChunksSequential<T, O>(
  data: T[],
  fn: (chunkData: T[]) => Promise<O>,
  chunkSize = 20
) {
  const chunks = createChunks(data, chunkSize);
  const output = [];
  let i = 1;
  for (const chunk of chunks) {
    console.log("processing chunk", i, "of", chunks.length);
    output.push(await fn(chunk));
    i++;
  }

  return output;
}

// wish I could use this to make things faster but it fails lol
async function runAsyncFnInChunksParallel<T, O>(
  data: T[],
  fn: (chunkData: T[]) => Promise<O>,
  chunkSize = 100,
  maxConcurrent = 10
) {
  const chunks = createChunks(data, chunkSize);
  console.log("processing", chunks.length, "chunks in parallel");
  const taskCallers: ((chunkNr: number, batchNr: number) => Promise<O>)[] = [];
  for (const chunk of chunks) {
    const task = async (chunkNr: number, batchNr: number) => {
      console.log("started processing batch", batchNr, "of chunk", chunkNr);
      const res = await fn(chunk);
      console.log("done with batch", batchNr, "of chunk", chunkNr);
      return res;
    };
    taskCallers.push(task);
  }
  const taskCallerChunks = createChunks(taskCallers, maxConcurrent);
  const output: O[] = [];
  for (let i = 0; i < taskCallerChunks.length; i++) {
    const taskCallerChunk = taskCallerChunks[i];
    const chunkOutput = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      taskCallerChunk!.map((tc, j) => tc(i + 1, j + 1))
    );
    output.push(...chunkOutput);
    console.log("done with chunk", i + 1);
  }
  return output;
}

const prisma = new PrismaClient();
async function main() {
  const artists = artistsValidator.parse(await processFile("artists.json"));
  const existingArtists = await prisma.artist.count();

  if (
    existingArtists == 0 ||
    !skipIfRowCountsMatch ||
    existingArtists !== artists.length
  ) {
    const genresAndArtistIds = new MapWithDefault<string, string[]>(() => []);
    artists.forEach((artist) => {
      artist.genres.forEach((genre) => {
        genresAndArtistIds.get(genre).push(artist.id);
      });
    });
    await prisma.genre.deleteMany({});
    const { count: genreCount } = await prisma.genre.createMany({
      data: [...genresAndArtistIds.keys()].map((genre) => ({ label: genre })),
      skipDuplicates: true,
    });
    console.log("inserted", genreCount, "genres");

    await prisma.artist.deleteMany({});
    const artistsWithoutGenres = artists.map((artist) => {
      const { genres, ...rest } = artist;
      return rest;
    });
    const { count: artistCount } = await prisma.artist.createMany({
      data: artistsWithoutGenres,
    });
    console.log("inserted", artistCount, "artists");

    for (const [genre, artistIds] of genresAndArtistIds) {
      console.log("updating", artistIds.length, "artists with genre", genre);
      await prisma.genre.update({
        where: { label: genre },
        data: {
          artists: {
            connect: artistIds.map((id) => ({ id })),
          },
        },
      });
    }
    console.log("done connecting artists with genres");
  }

  const existingAlbums = await prisma.album.count();
  const albums = albumsValidator.parse(await processFile("albums.json"));

  if (
    existingAlbums == 0 ||
    !skipIfRowCountsMatch ||
    existingAlbums !== albums.length
  ) {
    const albumsTransformed = albums.map((album) => ({
      ...album,
      releaseDate: new Date(album.releaseDate),
      name: truncate(album.name, 191), // truncate name (fails if column value length > 191 when using MySQL DB hosted on PlanetScale)
    }));
    await prisma.album.deleteMany({});
    await prisma.album.createMany({
      data: albumsTransformed,
    });

    const albumArtists = albumArtistsValidator.parse(
      await processFile("album_artists.json")
    );
    await prisma.albumArtistEntry.deleteMany({});
    await runAsyncFnInChunksSequential(
      albumArtists,
      (chunk) =>
        prisma.albumArtistEntry.createMany({
          // crashes if too many entries are inserted at once -> chunk processing
          data: chunk,
        }),
      15000
    );
    console.log("inserted", albumArtists.length, "album-artist entries");
  }

  const countries = countriesValidator.parse(
    await processFile("countries.json")
  );
  await prisma.country.deleteMany({});
  const { count: countryCount } = await prisma.country.createMany({
    data: countries,
  });
  console.log("inserted", countryCount, "countries");

  const existingTracks = await prisma.track.count();
  const tracks = tracksValidator.parse(await processFile("tracks.json"));

  if (
    existingTracks == 0 ||
    !skipIfRowCountsMatch ||
    existingTracks !== tracks.length
  ) {
    await prisma.iSRCAgency.deleteMany({});
    await prisma.track.deleteMany({});
    const agencyData = isrcAgencyValidator.parse(
      await processFile("isrc_agencies.json")
    );
    const createAgencyData = agencyData
      .map((d) => ({
        name: d.isrcAgency,
        territory: d.isrcTerritory,
      }))
      .map((d) => ({
        name: d.name,
        country: countries.find((c) => c.name === d.territory)
          ? {
              connect: {
                // need to do it this way as otherwise linking of country to agency fails at runtime, urgh...
                name: d.territory,
              },
            }
          : undefined, // worldwide agencies have no country -> return undefined here to prevent connect attempt
        tracks: {
          create: tracks
            .filter(
              (t) => t.isrcAgency === d.name && t.isrcTerritory === d.territory
            )
            .map((track) => {
              const { isrcAgency, isrcTerritory, ...trackRest } = track;
              return {
                ...trackRest,
                name: truncate(track.name, 191), // truncate name (fails if column value length > 191 when using MySQL DB hosted on PlanetScale)
              };
            }),
        },
      }));

    for (const agency of createAgencyData) {
      console.log(
        "inserting agency",
        agency.name,
        "with",
        agency.tracks.create.length,
        "tracks"
      );
      await prisma.iSRCAgency.create({
        data: agency,
      });
    }
    console.log("inserted", agencyData.length, "ISRC agencies");
    console.log("inserted", tracks.length, "tracks");
  }

  const existingTrackArtistsEntries = await prisma.trackArtistEntry.count();
  const tracksAndArtists = trackArtistsValidator.parse(
    await processFile("track_artists.json")
  );
  if (
    existingTrackArtistsEntries == 0 ||
    !skipIfRowCountsMatch ||
    existingTrackArtistsEntries !== tracksAndArtists.length
  ) {
    await prisma.trackArtistEntry.deleteMany({});
    await runAsyncFnInChunksSequential(
      tracksAndArtists,
      (chunk) => prisma.trackArtistEntry.createMany({ data: chunk }),
      15000
    );
    console.log("inserted", tracksAndArtists.length, "track-artist entries");
  }

  const existingCountryChartEntries = await prisma.countryChartEntry.count();
  const countrySubset = new Set(["Germany", "United States", "Brazil"]);
  const top50Countries = top50CountriesValidator
    .parse(await processFile("top50_countries.json"))
    .filter((entry) =>
      useSubsetOfCountries ? countrySubset.has(entry.countryName) : true
    );
  if (
    existingCountryChartEntries == 0 ||
    !skipIfRowCountsMatch ||
    existingCountryChartEntries !== top50Countries.length
  ) {
    await prisma.countryChartEntry.deleteMany({});
    const top50CountriesWithParsedDates = top50Countries.map((entry) => ({
      ...entry,
      date: new Date(entry.date),
    }));
    await runAsyncFnInChunksSequential(
      top50CountriesWithParsedDates,
      (chunk) => prisma.countryChartEntry.createMany({ data: chunk }),
      8000 // for some reason it crashed with the 15000 chunk size from above
    );
    console.log("inserted", top50Countries.length, "country chart entries");
  }

  const top50Global = top50GlobalValidator.parse(
    await processFile("top50_global.json")
  );
  const existingGlobalChartEntries = await prisma.globalChartEntry.count();

  if (
    existingGlobalChartEntries == 0 ||
    !skipIfRowCountsMatch ||
    existingGlobalChartEntries !== top50Global.length
  ) {
    await prisma.globalChartEntry.deleteMany({});
    const top50GlobalWithParsedDates = top50Global.map((entry) => ({
      ...entry,
      date: new Date(entry.date),
    }));
    await runAsyncFnInChunksSequential(
      top50GlobalWithParsedDates,
      (chunk) => prisma.globalChartEntry.createMany({ data: chunk }),
      8000 // for some reason it crashed with the 15000 chunk size from above
    );
    console.log("inserted", top50Global.length, "global chart entries");
  }
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

class MapWithDefault<K, V> extends Map<K, V> {
  constructor(defaultValue: () => V) {
    super();
    this.defaultValue = defaultValue;
  }
  private defaultValue: () => V;
  get(key: K): V {
    if (!this.has(key)) {
      this.set(key, this.defaultValue());
    }
    return super.get(key) as V;
  }
}
