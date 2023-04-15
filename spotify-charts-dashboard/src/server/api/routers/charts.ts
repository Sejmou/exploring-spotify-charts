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
import { and, eq, gte, inArray, lte } from "drizzle-orm/expressions";
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
      const { region, trackIds, startInclusive, endInclusive } = input;

      if (!trackIds) {
        console.warn("No track ids provided");
        return {
          trackChartData: [],
          dates: [],
        };
      }
      const country = region && region !== "Global" ? region : undefined;

      // this is so ugly, it physically hurts me
      const queryDateRangeMin =
        startInclusive ||
        new Date(
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          (
            await ctx.drizzle
              .select({
                date: sql<string>`MIN(${
                  country ? countryChartEntry.date : globalChartEntry.date
                })`,
              })
              .from(country ? countryChartEntry : globalChartEntry)
          )[0]!.date
        );

      const queryDateRangeMax =
        endInclusive ||
        new Date(
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          (
            await ctx.drizzle
              .select({
                date: sql<string>`MAX(${
                  country ? countryChartEntry.date : globalChartEntry.date
                })`,
              })
              .from(country ? countryChartEntry : globalChartEntry)
          )[0]!.date
        );

      const sqlDateStringsForRange = createDateStringsForEveryDayInRange(
        queryDateRangeMin,
        queryDateRangeMax
      );

      const dates = sqlDateStringsForRange.map((date) => new Date(date));

      const trackChartData: {
        id: string;
        name: string;
        chartEntries: (ChartEntry | null)[];
      }[] = [];

      console.log({ queryDateRangeMin, queryDateRangeMax });

      for (const trackId of trackIds) {
        const trackName = (
          await ctx.drizzle
            .select({
              name: track.name,
            })
            .from(track)
            .where(eq(track.id, trackId))
        )[0]?.name;

        if (!trackName) {
          console.warn(`No track found with id ${trackId}`);
          continue;
        }

        // this is quite ugly tbh
        const chartEntriesDB = await ctx.drizzle
          .select({
            date: (country ? countryChartEntry : globalChartEntry).date,
            rank: (country ? countryChartEntry : globalChartEntry).rank,
            streams: (country ? countryChartEntry : globalChartEntry).streams,
          })
          .from(country ? countryChartEntry : globalChartEntry)
          .where(
            and(
              eq(
                (country ? countryChartEntry : globalChartEntry).trackId,
                trackId
              ),
              gte(
                (country ? countryChartEntry : globalChartEntry).date,
                javaScriptDateToMySQLDate(queryDateRangeMin)
              ),
              lte(
                (country ? countryChartEntry : globalChartEntry).date,
                javaScriptDateToMySQLDate(queryDateRangeMax)
              ),
              country ? eq(countryChartEntry.countryName, country) : undefined
            )
          )
          .orderBy((country ? countryChartEntry : globalChartEntry).date);

        const chartEntriesForEveryDayMap = new Map<string, ChartEntry | null>(
          sqlDateStringsForRange.map((date) => [date, null])
        );
        chartEntriesDB.forEach((chartEntry) => {
          chartEntriesForEveryDayMap.set(chartEntry.date, {
            rank: chartEntry.rank,
            streams: chartEntry.streams,
          });
        });

        trackChartData.push({
          id: trackId,
          name: trackName,
          chartEntries: [...chartEntriesForEveryDayMap.values()],
        });
      }

      return { trackChartData, dates };
    }),
  getCountriesWithCharts: publicProcedure.query(async ({ ctx }) => {
    const distinctCountryNames = await ctx.drizzle
      .select({
        name: countryChartEntry.countryName,
      })
      .from(countryChartEntry)
      .groupBy(countryChartEntry.countryName);

    const countries = await ctx.drizzle
      .select({
        name: country.name,
        isoAlpha3: country.isoAlpha3,
        geoRegion: country.geoRegion,
        geoSubregion: country.geoSubregion,
      })
      .from(country)
      .where(
        inArray(
          country.name,
          distinctCountryNames.map((c) => c.name)
        )
      )
      .orderBy(
        country.geoRegion,
        sql`${country.geoSubregion} DESC`,
        country.name
      );

    return countries;
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
          : await ctx.drizzle
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

function createDateStringsForEveryDayInRange(startDate: Date, endDate: Date) {
  const dateArray = [];
  const currentDate = moment(startDate);
  const endDateMoment = moment(endDate);

  while (currentDate <= endDateMoment) {
    const dateString = currentDate.format("YYYY-MM-DD");
    dateArray.push(dateString);
    currentDate.add(1, "days");
  }

  return dateArray;
}

type ChartEntry = {
  // date: Date;
  rank: number;
  streams: number;
};
