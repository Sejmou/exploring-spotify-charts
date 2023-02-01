import { type NextPage } from "next";
import Head from "next/head";
import { ReactElement, useCallback } from "react";
import { useState } from "react";
import CountryTrackCountOverview from "../../components/dashboard-views/CountryChartsOverview";
import TrackDataExploration from "../../components/dashboard-views/TrackDataExploration";
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
    setCurrentView(
      <TrackComparison onSwitchView={switchToTrackDataExploration} />
    );
  };

  const [currentView, setCurrentView] = useState<ReactElement>(
    <CountryTrackCountOverview onStart={handleStart} />
  );

  const switchToTrackDataExploration = () => {
    setCurrentView(
      <TrackDataExploration onSwitchView={switchToTrackComparison} />
    );
  };

  const switchToTrackComparison = () => {
    setCurrentView(
      <TrackComparison onSwitchView={switchToTrackDataExploration} />
    );
  };

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
        <div className="flex h-full w-full flex-col gap-2">{currentView}</div>
      </main>
    </>
  );
};

export default Dashboard;
