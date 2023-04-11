import { type NextPage } from "next";
import Head from "next/head";
import DailyCharts from "~/components/data-views/DailyCharts";

const DailyChartsPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Daily Charts</title>
        <meta name="description" content="Visualizing Spotify Charts" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen w-full flex-col items-center gap-4 bg-[#121212] p-4 text-white">
        <DailyCharts />
      </main>
    </>
  );
};

export default DailyChartsPage;
