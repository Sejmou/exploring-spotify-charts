import { createTRPCRouter, publicProcedure } from "../trpc";
import { z } from "zod";
import type { Genre, Prisma, PrismaClient } from "@prisma/client";
import { createUnionSchema } from "../../utils";
import { numericTrackFeatures } from "../../../utils/data";
import type { NumericTrackFeatureName } from "../../../utils/data";
import { track } from "~/server/drizzle/schema";
import { eq, inArray } from "drizzle-orm/expressions";

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
      const trackIds = await getTrackIdsMatchingFilter(ctx.prisma, input);
      const trackXY = await getTrackXY(ctx.prisma, { trackIds, ...input });
      return trackXY;
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
  getTracksDrizzle: publicProcedure
    .input(
      z.object({
        trackIds: z.array(z.string()),
      })
    )
    .query(async ({ ctx, input }) => {
      const trackIds = input.trackIds;
      // equivalent query in Prisma
      // const tracks = await ctx.prisma.track.findMany({
      //   where: { id: { in: trackIds } },
      // });
      console.log("fetching tracks with drizzle");
      const tracks = await ctx.drizzle
        .select()
        .from(track)
        .where(inArray(track.id, trackIds));
      console.log({ fetchedTracks: tracks });
      return tracks;
    }),
});

type FilterParams = {
  startInclusive?: Date;
  endInclusive?: Date;
  regionNames?: string[];
};

async function getTrackIdsMatchingFilter(
  prisma: PrismaClient<
    Prisma.PrismaClientOptions,
    "info" | "warn" | "error" | "query",
    Prisma.RejectOnNotFound | Prisma.RejectPerOperation | undefined
  >,
  filterParams: FilterParams
) {
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
  const query =
    `SELECT id, ${xFeature} as 'x', ${yFeature} as 'y' FROM Track` +
    (trackIds
      ? ` WHERE id IN (${trackIds.map((id) => `'${id}'`).join(",")})`
      : "");
  const trackXY: { id: string; x: number; y: number }[] =
    // query should be safe as inputs are "sanitized" at this point
    await prisma.$queryRawUnsafe(query);
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
