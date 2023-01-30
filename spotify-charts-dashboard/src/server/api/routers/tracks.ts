import { createTRPCRouter, publicProcedure } from "../trpc";
import { z } from "zod";

export const tracksRouter = createTRPCRouter({
  getNamesAndArtists: publicProcedure
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
          : await ctx.prisma.regionChartEntry.groupBy({
              by: ["trackId"],
              where: {
                date: {
                  gte: input.startInclusive,
                  lte: input.endInclusive,
                },
                region: {
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
                  regionChartEntries: {
                    some: {
                      date: {
                        gte: input.startInclusive,
                        lte: input.endInclusive,
                      },
                      region: {
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
});
