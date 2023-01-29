import { type NextPage } from "next";
import Head from "next/head";
import TrackSelect from "../../components/TrackSelect";
import { useState } from "react";
import dayjs from "dayjs";
import DateRangeFilter from "../../components/DateRangeFilter";
import BarChart from "../../components/BarChart";
import RegionSelect from "../../components/RegionSelect";

export type VizFilterParams = {
  startInclusive?: Date;
  endInclusive?: Date;
  region?: string;
  trackIds?: string[];
};

const Dashboard: NextPage = () => {
  const [filterParams, setFilterParams] = useState<VizFilterParams>({
    startInclusive: dayjs("2021-01-01").toDate(),
    endInclusive: dayjs("2021-12-31").toDate(),
    region: undefined,
    trackIds: undefined,
  });

  console.log("current filters:", filterParams);

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

          <BarChart data={[]} xColumn={""} yColumn={""} />
        </div>
      </main>
    </>
  );
};

export default Dashboard;
