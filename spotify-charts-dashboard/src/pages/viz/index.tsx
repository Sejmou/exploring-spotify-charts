import { type NextPage } from "next";
import Head from "next/head";
import TrackSelect from "../../components/TrackSelect";
import { useState } from "react";
import dayjs from "dayjs";
import DateRangeFilter from "../../components/DateRangeFilter";
import BarChart from "../../components/BarChart";
import RegionSelect from "../../components/RegionSelect";
import ChartsViz from "../../components/ChartsViz";
import RadarChart from "../../components/RadarChart";
import { api } from "../../utils/api";

export type VizFilterParams = {
  startInclusive?: Date;
  endInclusive?: Date;
  region?: string;
  trackIds?: string[];
};

export const divergingColors = [
  "#7fc97f",
  "#beaed4",
  "#fdc086",
  "#ffff99",
  "#386cb0",
  "#f0027f",
  "#bf5b17",
  "#666666",
] as const;

const Dashboard: NextPage = () => {
  const [filterParams, setFilterParams] = useState<VizFilterParams>({
    startInclusive: dayjs("2021-01-01").toDate(),
    endInclusive: dayjs("2021-12-31").toDate(),
    region: undefined,
    trackIds: undefined,
  });

  const charts = api.charts.getTrackCharts.useQuery(filterParams, {
    enabled: !!filterParams.region,
    keepPreviousData: true,
  });

  let vizArea = <div>Please select a region and at least one track.</div>;
  if (charts.isError) {
    vizArea = <div>Error loading data, please try refreshing the page.</div>;
  }
  if (
    filterParams.region &&
    filterParams.trackIds &&
    filterParams.trackIds.length > 0
  ) {
    if (charts.isLoading) {
      vizArea = <div>Loading data...</div>;
    } else {
      vizArea = (
        <>
          <ChartsViz data={charts.data} />
          <RadarChart data={charts.data} />
        </>
      );
    }
  }

  console.log("current filters:", filterParams);
  const utils = api.useContext();

  return (
    <>
      <Head>
        <title>Spotify Charts Dashboard</title>
        <meta
          name="description"
          content="Visualizing Spotify Charts (global and 49 regions) from 2017 to 2021"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center gap-4 bg-[#121212] text-white">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
          <h1 className="text-5xl font-extrabold tracking-tight text-white">
            Explore <span className="text-[#1ED760]">Spotify</span> Charts
          </h1>
          <div className="flex gap-4">
            <DateRangeFilter
              filterParams={filterParams}
              onChange={(newParams) => setFilterParams(newParams)}
              minDate={dayjs("2017-01-01")}
              maxDate={dayjs("2021-12-31")}
            />
            <RegionSelect
              value={filterParams.region ? filterParams.region : null}
              onChange={(newRegion) => {
                setFilterParams((prev) => ({
                  ...filterParams,
                  region: newRegion ?? undefined,
                  trackIds:
                    newRegion !== prev.region ? undefined : prev.trackIds,
                }));
                utils
                  .invalidate()
                  .then(() => {
                    console.log("invalidated");
                  })
                  .catch((e) => {
                    console.log("error invalidating", e);
                  });
              }}
            />
            <TrackSelect
              filterParams={filterParams}
              onAdd={(newTrackId) => {
                if (newTrackId) {
                  setFilterParams({
                    ...filterParams,
                    trackIds: [...(filterParams.trackIds || []), newTrackId],
                  });
                }
              }}
            />
          </div>
          {vizArea}
          <BarChart data={[]} xColumn={""} yColumn={""} />
        </div>
      </main>
    </>
  );
};

export default Dashboard;
