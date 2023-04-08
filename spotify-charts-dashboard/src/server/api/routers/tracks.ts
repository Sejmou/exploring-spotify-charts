import { createTRPCRouter, publicProcedure } from "../trpc";
import { z } from "zod";
import type { Genre, Prisma, PrismaClient } from "@prisma/client";
import { createUnionSchema } from "../../utils";
import {
  javaScriptDateToMySQLDateTime,
  numericTrackFeatures,
} from "../../../utils/data";
import type { NumericTrackFeatureName } from "../../../utils/data";
import {
  countryChartEntry,
  globalChartEntry,
  track,
} from "~/server/drizzle/schema";
import { and, gte, inArray, lte, not } from "drizzle-orm/expressions";
import type { PlanetScaleDatabase } from "drizzle-orm/planetscale-serverless";
import type { MySql2Database } from "drizzle-orm/mysql2";
import { sql, type SQL } from "drizzle-orm";

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
      const trackMetadata = await getTrackMetadata(ctx.prisma, input.trackIds);
      return trackMetadata;
    }),
  getMetadataForId: publicProcedure
    .input(
      z.object({
        trackId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const trackMetadata = await getTrackMetadata(ctx.prisma, [input.trackId]);
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
      const numericFeaturesSelect = numericTrackFeatures.reduce(
        (acc, feature) => ({
          ...acc,
          [feature]: true,
        }),
        {} as Record<NumericTrackFeatureName, boolean>
      );
      const trackData = await ctx.prisma.track.findMany({
        select: {
          id: true,
          name: true,
          ...numericFeaturesSelect,
        },
        where: {
          id: {
            in: trackIds,
          },
        },
      });
      return trackData;
    }),
});

type FilterParams = {
  startInclusive?: Date;
  endInclusive?: Date;
  regionNames?: string[];
};

async function getTrackIdsMatchingFilter(
  db: PlanetScaleDatabase | MySql2Database,
  filterParams: FilterParams
) {
  const { startInclusive, endInclusive, regionNames = [] } = filterParams;

  const countryChartsBase = db
    .select({
      trackId: sql<string>`distinct(${countryChartEntry.trackId})`,
    })
    .from(countryChartEntry);

  const regionChartWhereClauses: SQL[] = [];

  if (startInclusive)
    regionChartWhereClauses.push(
      gte(countryChartEntry.date, javaScriptDateToMySQLDateTime(startInclusive))
    );
  if (endInclusive)
    regionChartWhereClauses.push(
      lte(countryChartEntry.date, javaScriptDateToMySQLDateTime(endInclusive))
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
  const { trackIds, xFeature, yFeature } = input;
  const trackXY = await db
    .select({ id: track.id, x: track[xFeature], y: track[yFeature] })
    .from(track)
    .where(inArray(track.id, trackIds));
  return trackXY;
}

async function getTrackMetadata(
  prisma: PrismaClient<
    Prisma.PrismaClientOptions,
    "info" | "warn" | "error" | "query",
    Prisma.RejectOnNotFound | Prisma.RejectPerOperation | undefined
  >,
  trackIds: string[]
) {
  const tracks = await prisma.track.findMany({
    select: {
      id: true,
      name: true,
      previewUrl: true,
      featuringArtists: {
        select: {
          artist: {
            select: { name: true, genres: true },
          },
          rank: true,
        },
      },
      album: {
        select: {
          name: true,
          type: true,
          thumbnailUrl: true,
          releaseDate: true,
          label: true,
        },
      },
    },
    where: {
      id: {
        in: trackIds,
      },
    },
  });
  const trackIdsAndMetadata = tracks
    .map((track) => {
      const artists = track.featuringArtists.map((entry) => entry.artist);
      const genres = artists.flatMap((artist) => {
        return artist.genres;
      });
      const genresNoDuplicates = genres.reduce((acc, curr) => {
        if (!acc.includes(curr)) {
          acc.push(curr);
        }
        return acc;
      }, [] as Genre[]);
      return {
        ...track,
        featuringArtists: artists,
        genres: genresNoDuplicates,
        album: {
          ...track.album,
          thumbnailUrl: track.album.thumbnailUrl ?? undefined,
        },
        previewUrl: track.previewUrl ?? undefined,
      };
    })
    .map((track) => {
      const { id, ...metadata } = track;
      return [id, metadata] as [string, typeof metadata];
    });
  return Object.fromEntries(trackIdsAndMetadata) as Record<
    string,
    (typeof trackIdsAndMetadata)[0][1]
  >;
}
