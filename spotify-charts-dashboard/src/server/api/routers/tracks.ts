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
  getTrackData: publicProcedure
    .input(
      z.object({
        trackIds: z.array(z.string()),
      })
    )
    .query(async ({ ctx, input }) => {
      const tracks = await ctx.prisma.track.findMany({
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
            in: input.trackIds,
          },
        },
      });
      return tracks
        .map((track) => {
          const artistsSorted = track.featuringArtists.sort(
            (a, b) => a.rank - b.rank
          );
          const artists = artistsSorted.map((entry) => entry.artist);
          const genres = artists.flatMap((artist) => {
            // necessary workaround as artist genres are stored as a stringified JSON array in the database
            return z
              .array(z.string())
              .parse(JSON.parse(artist.genres.replace(/'/g, '"'))); // need to convert single to double quotes as I f*cked up when I created the database (should have stored strings in JSON array with double quotes -> otherwise invalid JSON)
          });
          const genresNoDuplicates = genres.reduce((acc, curr) => {
            if (!acc.includes(curr)) {
              acc.push(curr);
            }
            return acc;
          }, [] as string[]);
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
        .sort(
          (a, b) => input.trackIds.indexOf(a.id) - input.trackIds.indexOf(b.id)
        );
    }),
});
