import { type NextPage } from "next";
import Head from "next/head";
import TrackSelect from "../../components/TrackSelect";
import DateRangeFilter from "../../components/DateRangeFilter";
import RegionSelect from "../../components/RegionSelect";
import type { ReactElement } from "react";
import { useState } from "react";
import CountryTrackCountOverview from "../../components/dashboard-views/CountryChartsOverview";
import TrackComparison from "../../components/dashboard-views/TrackComparison";

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
  const handleStart = () => {
    setCurrentView(<TrackComparison />);
  };
  const [currentView, setCurrentView] = useState<ReactElement>(
    <CountryTrackCountOverview onStart={handleStart} />
  );

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
          {currentView.type == TrackComparison && (
            <div className="flex flex-wrap gap-4">
              <h1 className="text-5xl font-extrabold tracking-tight text-white">
                <span className="text-[#1ED760]">Spotify</span> Charts
              </h1>
              <DateRangeFilter />
              <RegionSelect />
              <TrackSelect />
            </div>
          )}
          {currentView}
        </div>
      </main>
    </>
  );
};

export default Dashboard;
