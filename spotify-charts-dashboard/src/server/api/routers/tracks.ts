import { createTRPCRouter, publicProcedure } from "../trpc";
import { z } from "zod";
import type { Genre, Prisma, PrismaClient } from "@prisma/client";
import { createUnionSchema } from "../../utils";
import { numericTrackFeatures } from "../../../utils/data";
import { NumericTrackFeatureName } from "../../../utils/data";

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
  getTrackMetadata: publicProcedure
    .input(filterParams)
    .query(async ({ ctx, input }) => {
      const trackIds = await getTrackIdsMatchingFilter(ctx.prisma, input);
      const trackMetadata = await getTrackMetadata(ctx.prisma, trackIds);
      return trackMetadata;
    }),
});

async function getTrackIdsMatchingFilter(
  prisma: PrismaClient<
    Prisma.PrismaClientOptions,
    "info" | "warn" | "error" | "query",
    Prisma.RejectOnNotFound | Prisma.RejectPerOperation | undefined
  >,
  filterParams: {
    startInclusive?: Date;
    endInclusive?: Date;
    regionNames?: string[];
  }
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
  console.log("globalChartsWhereClause", globalChartsWhereClause);
  const trackIds = await prisma.track.findMany({
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
  });
  return trackIds.map((t) => t.id);
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
  return tracks
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
    .sort((a, b) => trackIds.indexOf(a.id) - trackIds.indexOf(b.id));
}
