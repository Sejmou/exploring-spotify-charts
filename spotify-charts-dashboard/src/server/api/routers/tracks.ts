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
  getTrackDataForIds: publicProcedure
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
          const artists = track.featuringArtists.map((entry) => entry.artist);
          const genres = artists.flatMap((artist) => {
            console.log(
              "genres for artist",
              artist.name,
              artist.genres,
              artist.genres[0],
              artist.genres.length
            );
            return artist.genres;
          });
          console.log("first genres", genres[0], typeof genres[0]);
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
  getTrackData: publicProcedure.query(async ({ ctx }) => {
    const tracks = await ctx.prisma.track.findMany({
      select: {
        id: true,
        name: true,
        speechiness: true,
        acousticness: true,
        danceability: true,
        energy: true,
        instrumentalness: true,
        liveness: true,
        loudness: true,
        tempo: true,
        valence: true,
        timeSignature: true,
        key: true,
        durationMs: true,
        featuringArtists: {
          select: {
            artist: {
              select: {
                id: true,
                name: true,
                genres: true,
              },
            },
            rank: true,
          },
          orderBy: {
            rank: "asc",
          },
        },
        album: {
          select: {
            releaseDate: true,
          },
        },
      },
    });
    return tracks.map((track) => {
      const artists = track.featuringArtists.map((entry) => entry.artist);
      const genres = artists.flatMap((a) => a.genres);
      const genresNoDuplicates = genres.reduce((acc, curr) => {
        if (!acc.includes(curr)) {
          acc.push(curr);
        }
        return acc;
      }, [] as string[]);
      const { album, ...stuffToKeep } = track;
      return {
        ...stuffToKeep,
        genres: genresNoDuplicates,
        releaseDate: album.releaseDate,
      };
    });
  }),
  getTrackIdsMatchingFilter: publicProcedure
    .input(
      z.object({
        startInclusive: z.date().optional(),
        endInclusive: z.date().optional(),
        countryNames: z.array(z.string()).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const trackIds = input.countryNames
        ? (
            await ctx.prisma.countryChartEntry.groupBy({
              by: ["trackId"],
              where: {
                date: {
                  gte: input.startInclusive,
                  lte: input.endInclusive,
                },
                countryName: {
                  in: input.countryNames,
                },
              },
            })
          ).map((t) => t.trackId)
        : (
            await ctx.prisma.track.findMany({
              select: {
                id: true,
              },
            })
          ).map((t) => t.id);
      return trackIds;
    }),
});

function arraysEqual<T>(a: T[], b: T[]) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;

  // If you don't care about the order of the elements inside
  // the array, you should sort both arrays here.
  // Please note that calling sort on an array will modify that array.
  // you might want to clone your array first.

  for (let i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
