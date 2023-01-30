import { createTRPCRouter, publicProcedure } from "../trpc";
import { z } from "zod";

export const chartsRouter = createTRPCRouter({
  getTrackCharts: publicProcedure
    .input(
      z.object({
        startInclusive: z.date().optional(),
        endInclusive: z.date().optional(),
        region: z.string().optional(),
        trackIds: z.array(z.string()).optional(), // I don't want to make this optional, but I can't figure out how to make it required and still usable in a convenient way from the client
      })
    )
    .query(async ({ ctx, input }) => {
      const trackCharts = input.region
        ? await ctx.prisma.regionChartEntry.findMany({
            where: {
              trackId: {
                in: input.trackIds,
              },
              date: {
                gte: input.startInclusive,
                lte: input.endInclusive,
              },
              region: {
                name: input.region,
              },
            },
            orderBy: {
              date: "asc",
            },
          })
        : await ctx.prisma.globalChartEntry.findMany({
            where: {
              trackId: {
                in: input.trackIds,
              },
              date: {
                gte: input.startInclusive,
                lte: input.endInclusive,
              },
            },
            orderBy: {
              date: "asc",
            },
          });

      const chartsGroupedByTrackId = groupByTrackId(trackCharts);
      const trackIds = Object.keys(chartsGroupedByTrackId);
      const tracks = await ctx.prisma.track.findMany({
        where: {
          id: {
            in: trackIds,
          },
        },
      });
      return tracks.map((track) => ({
        ...track,
        charts: chartsGroupedByTrackId[track.id],
      }));
    }),
});

function groupByTrackId<T extends { trackId: string }>(
  arr: T[]
): Record<string, T[]> {
  return arr.reduce((acc, curr) => {
    if (!acc[curr.trackId]) {
      acc[curr.trackId] = [];
    }
    acc[curr.trackId]?.push(curr);
    return acc;
  }, {} as Record<string, T[]>);
}
