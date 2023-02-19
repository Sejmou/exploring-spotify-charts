import { createTRPCRouter, publicProcedure } from "../trpc";
import { z } from "zod";
import type { Genre, Prisma, PrismaClient } from "@prisma/client";
import { createUnionSchema } from "../../utils";
import { numericTrackFeatures } from "../../../utils/data";
import type { NumericTrackFeatureName } from "../../../utils/data";
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
  getTrackNamesArtistsAndStreamsOrdered: publicProcedure
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
  getTrackMetadataForIds: publicProcedure
    .input(
      z.object({
        trackIds: z.array(z.string()),
      })
    )
    .query(async ({ ctx, input }) => {
      const trackMetadata = await getTrackMetadata(ctx.prisma, input.trackIds);
      return trackMetadata;
    }),
  getTrackXY: publicProcedure
    .input(plotFeatureInput.merge(filterParams))
    .query(async ({ ctx, input }) => {
      const trackIds = await getTrackIdsMatchingFilter(ctx.prisma, input);
      const trackXY = await getTrackXY(ctx.prisma, { trackIds, ...input });
      return trackXY;
    }),
  getTrackMetadata: publicProcedure.query(async ({ ctx }) => {
    const trackIds = await getTrackIdsMatchingFilter(ctx.prisma, {}); // just get all track ids
    const trackMetadata = await getTrackMetadata(ctx.prisma, trackIds);
    return trackMetadata;
  }),
});

const filterResultCache = new NodeCache({
  stdTTL: 20 * 60,
  checkperiod: 20 * 60, // don't really understand why keeping this at default (should be 600 according to docs) causes the cache to be cleared immediately
}); // cache key cleared after 20 minutes

type FilterParams = {
  startInclusive?: Date;
  endInclusive?: Date;
  regionNames?: string[];
};

function createFilterParamsKey(filterParams: FilterParams) {
  return `${filterParams.startInclusive?.toISOString() ?? ""}-${
    filterParams.endInclusive?.toISOString() ?? ""
  }-${[...(filterParams.regionNames ?? "")].sort().join("")}`;
}

async function getTrackIdsMatchingFilter(
  prisma: PrismaClient<
    Prisma.PrismaClientOptions,
    "info" | "warn" | "error" | "query",
    Prisma.RejectOnNotFound | Prisma.RejectPerOperation | undefined
  >,
  filterParams: FilterParams
) {
  const startTime = performance.now();
  const cacheKey = createFilterParamsKey(filterParams);
  const cachedTrackIds: string[] | undefined = filterResultCache.get(cacheKey);
  if (cachedTrackIds) {
    return cachedTrackIds;
  }
  const { startInclusive, endInclusive, regionNames } = filterParams;
  const globalChartsWhereClause = {
    some: {
      date: {
        gte: startInclusive,
        lte: endInclusive,
      },
    },
  };
  const trackIds = (
    await prisma.track.findMany({
      select: { id: true },
      where: {
        globalChartEntries: regionNames?.includes("Global")
          ? globalChartsWhereClause
          : undefined,
        countryChartEntries: {
          some: {
            date: {
              gte: startInclusive,
              lte: endInclusive,
            },
            country: {
              name: {
                in: regionNames,
              },
            },
          },
        },
      },
    })
  ).map((t) => t.id);

  filterResultCache.set(cacheKey, trackIds);

  console.log(
    `Fetched trackIDs and cached result under cache key ${cacheKey} in ${
      performance.now() - startTime
    } ms`
  );
  return trackIds;
}

async function getTrackXY(
  prisma: PrismaClient<
    Prisma.PrismaClientOptions,
    "info" | "warn" | "error" | "query",
    Prisma.RejectOnNotFound | Prisma.RejectPerOperation | undefined
  >,
  input: {
    trackIds: string[];
    xFeature: NumericTrackFeatureName;
    yFeature: NumericTrackFeatureName;
  }
) {
  const { trackIds, xFeature, yFeature } = input;
  const trackXY: { id: string; x: number; y: number }[] =
    await prisma.$queryRawUnsafe(
      // query should be safe as inputs are "sanitized" at this point
      `SELECT id, ${xFeature} as 'x', ${yFeature} as 'y' FROM Track` +
        (trackIds
          ? ` WHERE id IN (${trackIds.map((id) => `'${id}'`).join(",")})`
          : "")
    );
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
