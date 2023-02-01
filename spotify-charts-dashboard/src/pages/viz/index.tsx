import { type NextPage } from "next";
import Head from "next/head";
import TrackSelect from "../../components/TrackSelect";
import { useState } from "react";
import dayjs from "dayjs";
import DateRangeFilter from "../../components/DateRangeFilter";
import BarChart from "../../components/visualizations/BarChart";
import RegionSelect from "../../components/RegionSelect";
import RadarChart from "../../components/visualizations/RadarChart";
import { api } from "../../utils/api";
import TracksFilter from "../../components/TracksFilter";
import dynamic from "next/dynamic";
import BarCharts from "../../components/visualizations/BarCharts";

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

const ChartsViz = dynamic(
  () => import("../../components/visualizations/ChartsViz"),
  { ssr: false }
);

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
  const readyForViz =
    filterParams.region &&
    filterParams.trackIds &&
    filterParams.trackIds.length > 0;
  if (readyForViz) {
    if (charts.isLoading) {
      vizArea = <div>Loading data...</div>;
    } else {
      if (charts.data) {
        const data = charts.data;
        vizArea = (
          <div className="grid h-full w-full flex-1 grid-cols-9 grid-rows-3">
            <div className="col-span-6 row-span-2">
              <ChartsViz data={data} />
            </div>
            <div className="col-span-3 row-span-2">
              <RadarChart data={data} />
            </div>
            <div className="col-span-9 row-span-1">
              <BarCharts trackData={data.trackData} />
            </div>
          </div>
        );
      }
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
      <main className="flex h-screen w-full flex-col items-center gap-4 bg-[#121212] p-4 text-white">
        <div className="flex h-full w-full flex-col gap-2">
          <div className="flex flex-wrap gap-4">
            <h1 className="text-5xl font-extrabold tracking-tight text-white">
              <span className="text-[#1ED760]">Spotify</span> Charts
            </h1>
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
          {readyForViz && (
            <TracksFilter
              trackIds={filterParams.trackIds ?? []}
              onHide={(tId) => {
                console.log(tId, "should be hidden");
              }}
              onRemove={(tId) => {
                setFilterParams({
                  ...filterParams,
                  trackIds: filterParams.trackIds?.filter((t) => t !== tId),
                });
              }}
            />
          )}
          {vizArea}
        </div>
      </main>
    </>
  );
};

export default Dashboard;
