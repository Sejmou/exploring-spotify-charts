import { type NextPage } from "next";
import Head from "next/head";
import CountryTrackCountOverview from "../../components/data-views/CountryChartsOverview";

const DataOverview: NextPage = () => {
  return (
    <>
      <Head>
        <title>Dataset Overview</title>
        <meta name="description" content="Visualizing Spotify Charts" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex h-screen w-full flex-col items-center gap-4 bg-[#121212] p-4 text-white">
        <CountryTrackCountOverview />
      </main>
    </>
  );
};

export default DataOverview;
