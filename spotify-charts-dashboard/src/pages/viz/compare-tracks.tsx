import { type NextPage } from "next";
import Head from "next/head";
import TrackComparison from "../../components/data-views/TrackComparison";

const CompareTracks: NextPage = () => {
  return (
    <>
      <Head>
        <title>Compare Tracks</title>
        <meta
          name="description"
          content="Visualizing Spotify Charts (global and 49 regions) from 2017 to 2021"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen w-full flex-col items-center gap-4 bg-[#121212] p-4 text-white">
        <TrackComparison />
      </main>
    </>
  );
};

export default CompareTracks;
