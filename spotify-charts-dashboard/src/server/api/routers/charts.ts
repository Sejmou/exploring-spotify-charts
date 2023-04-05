import { createTRPCRouter, publicProcedure } from "../trpc";
import { z } from "zod";
import moment from "moment";

export const chartsRouter = createTRPCRouter({
  getTrackCharts: publicProcedure
    .input(
      z.object({
        startInclusive: z.date().optional(),
        endInclusive: z.date().optional(),
        region: z.string().optional(),
        trackIds: z.array(z.string()),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!input.trackIds) {
        console.warn("No track ids provided");
        return {
          trackChartData: [],
          dateRange: [],
        };
      }
      const trackIds = input.trackIds;
      const country =
        input.region && input.region !== "Global" ? input.region : undefined;
      const trackCharts = country
        ? await ctx.prisma.countryChartEntry.findMany({
            where: {
              trackId: {
                in: trackIds,
              },
              date: {
                gte: input.startInclusive,
                lte: input.endInclusive,
              },
              country: {
                name: country,
              },
            },
            orderBy: {
              date: "asc",
            },
          })
        : await ctx.prisma.globalChartEntry.findMany({
            where: {
              trackId: {
                in: trackIds,
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

      console.log("track charts", trackCharts);
      const chartsGroupedByTrackId = groupByTrackId(trackCharts);

      console.log("TRACK IDS", trackIds);

      const allDatesWithData = !country
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
        : await ctx.prisma.countryChartEntry.findMany({
            where: {
              trackId: {
                in: trackIds,
              },
              country: {
                name: country,
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

      const minDate = allDatesWithData[0]?.date;
      const maxDate = allDatesWithData[allDatesWithData.length - 1]?.date;

      if (!minDate || !maxDate) {
        return {
          trackChartData: [],
          dateRange: [],
        };
      }
      const daysFromMinToMax = moment(maxDate).diff(moment(minDate), "days");
      const datesFromMinToMax = Array.from(
        { length: daysFromMinToMax + 1 },
        (_, i) => moment(minDate).add(i, "days").toDate()
      );

      console.log("minDate", minDate);
      console.log("maxDate", maxDate);

      // need arrays of equal length for all tracks for building the chart in the frontend
      const chartDataForStartToEndWithEmptyValues = new Map(
        Object.entries(chartsGroupedByTrackId).map(
          ([trackId, trackChartData]) => {
            const chartEntriesIncludingNullForMissingDates =
              datesFromMinToMax.map((d) => {
                const chartEntryForDate = trackChartData.find((entry) =>
                  moment(entry.date).isSame(moment(d), "day")
                );
                return chartEntryForDate || null;
              });
            console.log(
              "number of values in original track chart data",
              trackChartData?.length
            );
            console.log(
              "non-null values in chart data with nulls for missing",
              chartEntriesIncludingNullForMissingDates.filter((c) => c !== null)
                ?.length
            );
            console.log(
              "first and last non-null value in chart data with nulls for missing",
              chartEntriesIncludingNullForMissingDates.filter(
                (c) => c !== null
              )[0]?.date,
              chartEntriesIncludingNullForMissingDates
                .filter((c) => c !== null)
                .at(-1)?.date
            );
            console.log(
              "first and last value in original track chart data",
              trackChartData[0]?.date,
              trackChartData.at(-1)?.date
            );
            return [trackId, chartEntriesIncludingNullForMissingDates];
          }
        )
      );

      const otherTrackData = await ctx.prisma.track.findMany({
        select: {
          id: true,
          name: true,
        },
        where: {
          id: {
            in: trackIds,
          },
        },
      });

      return {
        trackChartData: otherTrackData.map((data) => ({
          ...data,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          charts: chartDataForStartToEndWithEmptyValues.get(data.id),
        })),
        dateRange: datesFromMinToMax,
      };
    }),
  getTrackCountsByCountry: publicProcedure.query(async ({ ctx }) => {
    const trackCountsByCountry = await ctx.prisma.countryChartEntry.groupBy({
      by: ["countryName"],
      _count: {
        trackId: true,
      },
    });
    const trackCounts = trackCountsByCountry.map((e) => ({
      countryName: e.countryName,
      count: e._count.trackId,
    }));
    const trackCountryData = (
      await ctx.prisma.country.findMany({
        where: {
          name: {
            in: trackCounts.map((tc) => tc.countryName),
          },
        },
      })
    ).map((e) => ({
      country: e,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      count: trackCounts.find((tc) => tc.countryName == e.name)!.count,
    }));
    return trackCountryData;
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
