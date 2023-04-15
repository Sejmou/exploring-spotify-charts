import { createTRPCRouter, publicProcedure } from "../trpc";
import { z } from "zod";
import { createUnionSchema } from "../../utils";
import {
  javaScriptDateToMySQLDate,
  javaScriptDateToMySQLDateTime,
  numericTrackFeatures,
} from "../../../utils/data";
import type { NumericTrackFeatureName } from "../../../utils/data";
import {
  album,
  artist,
  artistToGenre,
  countryChartEntry,
  globalChartEntry,
  track,
  trackArtistEntry,
} from "~/server/drizzle/schema";
import { and, gte, inArray, lte, not, eq } from "drizzle-orm/expressions";
import type { PlanetScaleDatabase } from "drizzle-orm/planetscale-serverless";
import type { MySql2Database } from "drizzle-orm/mysql2";
import { sql, type SQL } from "drizzle-orm";
import NodeCache from "node-cache";

const plotFeatureSchema = createUnionSchema(numericTrackFeatures); // really don't understand *how exactly* this works, but it does
const plotFeatureInput = z.object({
  xFeature: plotFeatureSchema,
  yFeature: plotFeatureSchema,
});
const filterParams = z.object({
  startInclusive: z.date().optional(),
  endInclusive: z.date().optional(),
  regionNames: z.array(z.string()).optional(),
});

export const tracksRouter = createTRPCRouter({
  getNamesArtistsAndStreamsOrdered: publicProcedure
    .input(
      z.object({
        startInclusive: z.date().optional(),
        endInclusive: z.date().optional(),
        region: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const totalStreamCount =
        input.region == "Global"
          ? await ctx.prisma.globalChartEntry.groupBy({
              by: ["trackId"],
              where: {
                date: {
                  gte: input.startInclusive,
                  lte: input.endInclusive,
                },
              },
              _sum: { streams: true },
            })
          : await ctx.prisma.countryChartEntry.groupBy({
              by: ["trackId"],
              where: {
                date: {
                  gte: input.startInclusive,
                  lte: input.endInclusive,
                },
                country: {
                  name: input.region,
                },
              },
              _sum: { streams: true },
            });

      const trackArtistsAndNames = await ctx.prisma.track
        .findMany({
          select: {
            name: true,
            id: true,
            featuringArtists: {
              select: {
                artist: {
                  select: { name: true },
                },
              },
              orderBy: {
                rank: "asc",
              },
            },
            album: {
              select: {
                name: true,
                type: true,
                thumbnailUrl: true,
                releaseDate: true,
              },
            },
          },
          where:
            !input.region || input.region === "Global"
              ? {
                  globalChartEntries: {
                    some: {
                      date: {
                        gte: input.startInclusive,
                        lte: input.endInclusive,
                      },
                    },
                  },
                }
              : {
                  countryChartEntries: {
                    some: {
                      date: {
                        gte: input.startInclusive,
                        lte: input.endInclusive,
                      },
                      country: {
                        name: input.region,
                      },
                    },
                  },
                },
        })
        .then((tracks) =>
          tracks.map((track) => ({
            ...track,
            featuringArtists: track.featuringArtists.map(
              (entry) => entry.artist.name
            ),
          }))
        );

      const trackArtistsAndNamesWithStreams = trackArtistsAndNames.map(
        (track) => {
          const totalStreams =
            totalStreamCount.find((entry) => entry.trackId === track.id)?._sum
              ?.streams || 0;
          return {
            ...track,
            totalStreams,
          };
        }
      );
      trackArtistsAndNamesWithStreams.sort(
        (a, b) => b.totalStreams - a.totalStreams
      );

      return trackArtistsAndNamesWithStreams;
    }),
  getMetadataForIds: publicProcedure
    .input(
      z.object({
        trackIds: z.array(z.string()),
      })
    )
    .query(async ({ ctx, input }) => {
      const trackMetadata = await getTrackMetadata(ctx.drizzle, input.trackIds);
      return trackMetadata;
    }),
  getMetadataForId: publicProcedure
    .input(
      z.object({
        trackId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const trackMetadata = await getTrackMetadata(ctx.drizzle, [
        input.trackId,
      ]);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return trackMetadata[input.trackId]!;
    }),
  getXYDataForIds: publicProcedure
    .input(plotFeatureInput.merge(filterParams))
    .query(async ({ ctx, input }) => {
      const { matchingTrackIds, notMatchingTrackIds } =
        await getTrackIdsMatchingFilter(ctx.drizzle, input);
      const trackXYMatching = (
        await getTrackXY(ctx.drizzle, {
          trackIds: matchingTrackIds,
          ...input,
        })
      ).map((trackXY) => ({
        ...trackXY,
        matching: true,
      }));
      const trackXYNotMatching = (
        await getTrackXY(ctx.drizzle, {
          trackIds: notMatchingTrackIds,
          ...input,
        })
      ).map((trackXY) => ({
        ...trackXY,
        matching: false,
      }));
      return [...trackXYNotMatching, ...trackXYMatching];
    }),
  getNumericFeaturesForIds: publicProcedure
    .input(
      z.object({
        trackIds: z.array(z.string()),
      })
    )
    .query(async ({ ctx, input }) => {
      const trackIds = input.trackIds;
      const trackData = await ctx.drizzle
        .select({
          id: track.id,
          name: track.name,
          acousticness: track.acousticness,
          danceability: track.danceability,
          energy: track.energy,
          instrumentalness: track.instrumentalness,
          liveness: track.liveness,
          speechiness: track.speechiness,
          valence: track.valence,
          tempo: track.tempo,
          durationMs: track.durationMs,
          loudness: track.loudness,
          isrcYear: track.isrcYear,
        })
        .from(track)
        .where(inArray(track.id, trackIds));

      return trackData;
    }),
});

type FilterParams = {
  startInclusive?: Date;
  endInclusive?: Date;
  regionNames?: string[];
};

type FilterResult = {
  matchingTrackIds: string[];
  notMatchingTrackIds: string[];
};

// we can cache trackID filter results as the data is static atm
const filterResultCache = new NodeCache({
  stdTTL: 20 * 60,
  checkperiod: 20 * 60, // don't really understand why keeping this at default (should be 600 according to docs) causes the cache to be cleared immediately
}); // cache key cleared after 20 minutes

function createFilterParamsKey(filterParams: FilterParams) {
  const key = `${filterParams.startInclusive?.toISOString() ?? ""}-${
    filterParams.endInclusive?.toISOString() ?? ""
  }-${[...(filterParams.regionNames ?? "")].sort().join("")}`;
  console.log("created filter key", key);
  return key;
}

async function getTrackIdsMatchingFilter(
  db: PlanetScaleDatabase | MySql2Database,
  filterParams: FilterParams
): Promise<FilterResult> {
  const start = Date.now();
  const { startInclusive, endInclusive, regionNames = [] } = filterParams;

  const cacheKey = createFilterParamsKey(filterParams);
  const cachedTrackIds: FilterResult | undefined =
    filterResultCache.get(cacheKey);
  if (cachedTrackIds) {
    console.log("using cached track ids for key", cacheKey);
    console.log(
      "lookup of cached track ID filter result took",
      Date.now() - start,
      "ms"
    );
    return cachedTrackIds;
  }

  console.log({ filterParams });

  const countryChartsBase = db
    .select({
      trackId: sql<string>`distinct(${countryChartEntry.trackId})`,
    })
    .from(countryChartEntry);

  const regionChartWhereClauses: SQL[] = [];

  if (startInclusive)
    regionChartWhereClauses.push(
      gte(countryChartEntry.date, javaScriptDateToMySQLDate(startInclusive))
    );
  if (endInclusive)
    regionChartWhereClauses.push(
      lte(countryChartEntry.date, javaScriptDateToMySQLDate(endInclusive))
    );
  if (regionNames.length > 0)
    regionChartWhereClauses.push(
      inArray(countryChartEntry.countryName, regionNames)
    );

  const trackIdsInCountryCharts = (
    await (regionChartWhereClauses.length > 0
      ? countryChartsBase.where(and(...regionChartWhereClauses))
      : countryChartsBase)
  ).map((row) => row.trackId);

  const globalChartsBase = db
    .select({
      trackId: sql<string>`distinct(${globalChartEntry.trackId})`,
    })
    .from(globalChartEntry);

  const globalChartWhereClauses: SQL[] = [];

  if (startInclusive)
    globalChartWhereClauses.push(
      gte(globalChartEntry.date, javaScriptDateToMySQLDateTime(startInclusive))
    );
  if (endInclusive)
    globalChartWhereClauses.push(
      lte(globalChartEntry.date, javaScriptDateToMySQLDateTime(endInclusive))
    );

  const trackIdsInGlobalCharts = regionNames.includes("Global")
    ? (
        await (globalChartWhereClauses.length > 0
          ? globalChartsBase.where(and(...globalChartWhereClauses))
          : globalChartsBase)
      ).map((row) => row.trackId)
    : [];

  const matchingTrackIds = [
    ...new Set([...trackIdsInCountryCharts, ...trackIdsInGlobalCharts]),
  ];

  const notMatchingTrackIds = (
    await db
      .select({ trackId: track.id })
      .from(track)
      .where(not(inArray(track.id, matchingTrackIds)))
  ).map((row) => row.trackId);

  console.log(`fetching filter result took ${Date.now() - start}ms`);

  filterResultCache.set(cacheKey, { matchingTrackIds, notMatchingTrackIds });

  return { matchingTrackIds, notMatchingTrackIds };
}

async function getTrackXY(
  db: PlanetScaleDatabase | MySql2Database,
  input: {
    trackIds: string[];
    xFeature: NumericTrackFeatureName;
    yFeature: NumericTrackFeatureName;
  }
) {
  const start = Date.now();
  const { trackIds, xFeature, yFeature } = input;
  const trackXY = await db
    .select({ id: track.id, x: track[xFeature], y: track[yFeature] })
    .from(track)
    .where(inArray(track.id, trackIds));
  console.log(`getTrackXY took ${Date.now() - start}ms`);
  return trackXY;
}

async function getTrackMetadata(
  db: PlanetScaleDatabase | MySql2Database,
  trackIds: string[]
) {
  const tracksDB = await db
    .select({
      id: track.id,
      name: track.name,
      previewUrl: track.previewUrl,
      album: {
        name: album.name,
        type: album.type,
        thumbnailUrl: album.thumbnailUrl,
        releaseDate: album.releaseDate,
        label: album.label,
      },
    })
    .from(track)
    .leftJoin(album, eq(track.albumId, album.id))
    .where(inArray(track.id, trackIds));

  const tracks = tracksDB
    .map((t) => ({
      ...t,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      album: t.album!, // not sure why this is necessary
    }))
    .map((t) => ({
      ...t,
      album: {
        ...t.album,
        releaseDate: new Date(t.album.releaseDate),
      },
    }));

  const trackArtists = await db
    .select({
      trackId: trackArtistEntry.trackId,
      artistIdsString: sql<string>`group_concat(${trackArtistEntry.artistId} ORDER BY ${trackArtistEntry.rank})`,
    })
    .from(trackArtistEntry)
    .where(inArray(trackArtistEntry.trackId, trackIds))
    .groupBy(trackArtistEntry.trackId);

  const trackIdsAndArtistIds = new Map<string, string[]>();
  for (const trackArtist of trackArtists) {
    trackIdsAndArtistIds.set(
      trackArtist.trackId,
      trackArtist.artistIdsString.split(",")
    );
  }

  const distinctTrackArtistIds = (
    await db
      .select({
        artistId: sql<string>`distinct(${trackArtistEntry.artistId})`,
      })
      .from(trackArtistEntry)
      .where(inArray(trackArtistEntry.trackId, trackIds))
  ).map((row) => row.artistId);

  const artistData = (
    await db
      .select({
        id: artist.id,
        name: artist.name,
        genres: sql<string>`group_concat(${artistToGenre.genreLabel})`,
      })
      .from(artist)
      .where(inArray(artist.id, distinctTrackArtistIds))
      .leftJoin(artistToGenre, eq(artist.id, artistToGenre.artistId))
      .groupBy(artist.id)
  ).map((row) => ({
    id: row.id,
    name: row.name,
    genres: row.genres.split(","),
  }));

  const artistDataMap = new Map<string, { name: string; genres: string[] }>(
    artistData.map((artist) => [
      artist.id,
      { name: artist.name, genres: artist.genres },
    ])
  );

  const metadata = tracks.map((track) => {
    const artistIds = trackIdsAndArtistIds.get(track.id);
    if (!artistIds)
      throw new Error(`artistIds not found for track ID ${track.id}`);
    const featuringArtists: typeof artistData = [];
    const artistGenres: string[] = [];
    for (const artistId of artistIds) {
      const artistData = artistDataMap.get(artistId);
      if (!artistData)
        throw new Error(`artistData not found for artist ID ${artistId}`);
      artistGenres.push(...artistData.genres);
      featuringArtists.push({ ...artistData, id: artistId });
    }
    // track genres == artist genres without duplicates (primary artist genres come first)
    const trackGenres = artistGenres.reduce((acc, curr) => {
      if (!acc.includes(curr)) {
        acc.push(curr);
      }
      return acc;
    }, [] as string[]);

    return {
      ...track,
      featuringArtists,
      genres: trackGenres,
    };
  });

  const returnValue = Object.fromEntries(
    metadata.map((track) => [track.id, track])
  );

  return returnValue;
}
