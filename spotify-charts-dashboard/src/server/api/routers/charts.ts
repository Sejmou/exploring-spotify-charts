import { createTRPCRouter, publicProcedure } from "../trpc";
import { z } from "zod";
import moment from "moment";
import {
  artist,
  country,
  countryChartEntry,
  globalChartEntry,
  track,
  trackArtistEntry,
} from "~/server/drizzle/schema";
import { countRows } from "~/server/drizzle/db";
import { and, eq, inArray } from "drizzle-orm/expressions";
import { javaScriptDateToMySQLDate } from "~/utils/data";
import { sql } from "drizzle-orm/sql";

export const chartsRouter = createTRPCRouter({
  getChartPerformanceOfTracks: publicProcedure
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
  getCountriesWithCharts: publicProcedure.query(async ({ ctx }) => {
    const countryNames = await ctx.drizzle
      .select({
        name: countryChartEntry.countryName,
      })
      .from(countryChartEntry)
      .groupBy(countryChartEntry.countryName);

    const countryNamesAndIsoCodes = await ctx.drizzle
      .select({
        name: country.name,
        isoAlpha3: country.isoAlpha3,
      })
      .from(country)
      .where(
        inArray(
          country.name,
          countryNames.map((c) => c.name)
        )
      );

    return countryNamesAndIsoCodes;
  }),
  getTrackCountsByCountry: publicProcedure.query(async ({ ctx }) => {
    const countryNamesAndCounts = await ctx.drizzle
      .select({
        name: countryChartEntry.countryName,
        count: countRows(),
      })
      .from(countryChartEntry)
      .groupBy(countryChartEntry.countryName);

    const countryNamesAndIsoCodes = await ctx.drizzle
      .select({
        name: country.name,
        isoAlpha3: country.isoAlpha3,
      })
      .from(country)
      .where(
        inArray(
          country.name,
          countryNamesAndCounts.map((c) => c.name)
        )
      );

    const returnValue = countryNamesAndIsoCodes.map((e) => ({
      ...e,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      count: countryNamesAndCounts.find((tc) => tc.name == e.name)!.count,
    }));
    return returnValue;
  }),
  getDailyCharts: publicProcedure
    .input(
      z.object({
        date: z.date(),
        region: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { date, region } = input;

      const chartsDbRes =
        region === "Global"
          ? await ctx.drizzle
              .select({
                rank: globalChartEntry.rank,
                streams: globalChartEntry.streams,
                trackId: track.id,
                trackName: track.name,
                artistIdsString: sql<string>`group_concat(${artist.id} ORDER BY ${trackArtistEntry.rank})`,
                artistNamesString: sql<string>`group_concat(${artist.name} ORDER BY ${trackArtistEntry.rank})`,
              })
              .from(globalChartEntry)
              .leftJoin(track, eq(globalChartEntry.trackId, track.id))
              .leftJoin(
                trackArtistEntry,
                eq(trackArtistEntry.trackId, track.id)
              )
              .leftJoin(artist, eq(trackArtistEntry.artistId, artist.id))
              .where(
                and(eq(globalChartEntry.date, javaScriptDateToMySQLDate(date)))
              )
              .groupBy(
                globalChartEntry.rank,
                globalChartEntry.streams,
                track.id,
                track.name
              )
          : // equivalent SQL query:
            // SELECT ce.rank, ce.streams, t.id as track_id, t.name as track_name,
            // GROUP_CONCAT(a.id ORDER BY tae.rank) as artist_ids, GROUP_CONCAT(a.name ORDER BY tae.rank) as artist_names
            // FROM CountryChartEntry ce
            // JOIN Track t ON t.id = ce.trackId
            // JOIN Country c ON c.name = ce.countryName AND c.name = "Argentina"
            // JOIN TrackArtistEntry tae ON tae.trackId = t.id
            // JOIN Artist a ON a.id = tae.artistId
            // WHERE ce.date = "2021-01-01"
            // GROUP BY ce.rank, ce.streams, t.id, t.name;
            await ctx.drizzle
              .select({
                rank: countryChartEntry.rank,
                streams: countryChartEntry.streams,
                trackId: track.id,
                trackName: track.name,
                artistIdsString: sql<string>`group_concat(${artist.id} ORDER BY ${trackArtistEntry.rank})`,
                artistNamesString: sql<string>`group_concat(${artist.name} ORDER BY ${trackArtistEntry.rank})`,
              })
              .from(countryChartEntry)
              .leftJoin(track, eq(countryChartEntry.trackId, track.id))
              .leftJoin(
                country,
                eq(countryChartEntry.countryName, country.name)
              )
              .leftJoin(
                trackArtistEntry,
                eq(trackArtistEntry.trackId, track.id)
              )
              .leftJoin(artist, eq(trackArtistEntry.artistId, artist.id))
              .where(
                and(
                  eq(countryChartEntry.countryName, region),
                  eq(countryChartEntry.date, javaScriptDateToMySQLDate(date))
                )
              )
              .groupBy(
                countryChartEntry.rank,
                countryChartEntry.streams,
                track.id,
                track.name
              );

      const previousDay = new Date(date);
      previousDay.setDate(date.getDate() - 1);

      const ranksOfPreviousDay =
        region === "Global"
          ? await ctx.drizzle
              .select({
                trackId: globalChartEntry.trackId,
                rank: globalChartEntry.rank,
              })
              .from(globalChartEntry)
              .where(
                and(
                  eq(countryChartEntry.countryName, region),
                  eq(
                    countryChartEntry.date,
                    javaScriptDateToMySQLDate(previousDay)
                  )
                )
              )
          : await ctx.drizzle
              .select({
                trackId: countryChartEntry.trackId,
                rank: countryChartEntry.rank,
              })
              .from(countryChartEntry)
              .where(
                and(
                  eq(countryChartEntry.countryName, region),
                  eq(
                    countryChartEntry.date,
                    javaScriptDateToMySQLDate(previousDay)
                  )
                )
              );

      const returnValue = chartsDbRes.map((row) => {
        const {
          artistIdsString,
          artistNamesString,
          trackId,
          trackName,
          rank,
          ...rest
        } = row;
        const artistIds = artistIdsString.split(",");
        const artistNames = artistNamesString.split(",");
        const previousDayRank = ranksOfPreviousDay.find(
          (r) => r.trackId === trackId
        )?.rank;
        const trend = getChartTrend(rank, previousDayRank);
        return {
          track: {
            id: trackId,
            name: trackName,
            artists: artistIds.map((id, index) => ({
              id,
              name: artistNames[index],
            })),
          },
          rank,
          trend,
          ...rest,
        };
      });

      return returnValue;
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

function getChartTrend(
  currentRank: number,
  previousRank?: number
): "new" | "up" | "down" | "same" {
  if (previousRank === undefined) {
    return "new";
  }
  if (currentRank === previousRank) {
    return "same";
  }
  if (currentRank < previousRank) {
    return "up";
  }
  return "down";
}
