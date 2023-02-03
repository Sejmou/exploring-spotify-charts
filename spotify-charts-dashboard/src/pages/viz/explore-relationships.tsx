import { type NextPage } from "next";
import Head from "next/head";
import TrackDataExploration from "../../components/dashboard-views/TrackDataExploration";

const ExploreTrackRelationships: NextPage = () => {
  return (
    <>
      <Head>
        <title>Explore Relationships</title>
        <meta
          name="description"
          content="Visualizing Spotify Charts (global and 49 regions) from 2017 to 2021"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex h-screen w-full flex-col items-center gap-4 bg-[#121212] p-4 text-white">
        <TrackDataExploration />
      </main>
    </>
  );
};

export default ExploreTrackRelationships;
