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
import TracksFilter from "../../components/TracksFilter";

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
          <>
            <ChartsViz data={data} />
            <RadarChart data={data} />
            <BarChart
              data={data.trackData.map((d) => ({
                x: d.name,
                y: d.tempo,
              }))}
              propName="tempo"
            />
          </>
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
      <main className="flex min-h-screen w-full flex-col items-center gap-4 bg-[#121212] text-white">
        <div className="flex w-full flex-col items-center justify-start justify-center gap-4 self-start p-4">
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
