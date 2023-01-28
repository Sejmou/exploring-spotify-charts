import { createTRPCRouter, publicProcedure } from "../trpc";

export const tracksRouter = createTRPCRouter({
  getNamesAndArtistNames: publicProcedure.query(async ({ ctx }) => {
    const totalStreamCountGlobal = await ctx.prisma.globalChartEntry.groupBy({
      by: ["trackId"],
      _sum: { streams: true },
    });
    const totalStreamCountRegions = await ctx.prisma.regionChartEntry.groupBy({
      by: ["trackId"],
      _sum: { streams: true },
    });
    console.log(totalStreamCountGlobal);

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
        const globalStreams =
          totalStreamCountGlobal.find((entry) => entry.trackId === track.id)
            ?._sum?.streams || 0;
        const regionStreams =
          totalStreamCountRegions.find((entry) => entry.trackId === track.id)
            ?._sum?.streams || 0;
        const totalStreams = globalStreams + regionStreams;
        return {
          ...track,
          totalStreams,
        };
      }
    );
    trackArtistsAndNamesWithStreams.sort(
      (a, b) => b.totalStreams - a.totalStreams
    );

    return trackArtistsAndNamesWithStreams.map((track) => ({
      id: track.id,
      name: track.name,
      featuringArtists: track.featuringArtists,
    }));
  }),
});
