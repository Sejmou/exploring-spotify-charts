import { createTRPCRouter, publicProcedure } from "../trpc";
import { z } from "zod";
import { GlobalChartEntry } from "@prisma/client";

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

      const allDatesWithData =
        input.region || input.region === "Global"
          ? await ctx.prisma.globalChartEntry.findMany({
              where: {
                trackId: {
                  in: trackIds,
                },
                date: {
                  gte: input.startInclusive,
                  lte: input.endInclusive,
                },
              },
              select: {
                date: true,
              },
              orderBy: {
                date: "asc",
              },
              distinct: ["date"],
            })
          : await ctx.prisma.regionChartEntry.findMany({
              where: {
                trackId: {
                  in: trackIds,
                },
                date: {
                  gte: input.startInclusive,
                  lte: input.endInclusive,
                },
              },
              select: {
                date: true,
              },
              orderBy: {
                date: "asc",
              },
              distinct: ["date"],
            });

      // need arrays of equal length for all tracks for building the chart in the frontend
      const getMatchingDateIdx = (date: Date, dates: Date[]) => {
        const match = allDatesWithData.find((d) => d.date === date);
        if (!match) {
          return -1;
        }
        return dates.findIndex((d) => d.getTime() === match.date.getTime());
      };
      const chartDataForStartToEndWithEmptyValues = new Map(
        Object.entries(chartsGroupedByTrackId).map(
          ([trackId, trackChartData]) => {
            return [
              trackId,
              allDatesWithData.map((d) => {
                const matchingDateIdx = getMatchingDateIdx(
                  d.date,
                  trackChartData.map((d) => d.date)
                );
                if (matchingDateIdx !== -1) {
                  return trackChartData[matchingDateIdx]!;
                }
                return null;
              }),
            ];
          }
        )
      );

      return {
        trackData: tracks.map((track) => ({
          ...track,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          charts: chartDataForStartToEndWithEmptyValues.get(track.id),
        })),
        datesWithData: allDatesWithData.map((entry) => entry.date),
      };
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
