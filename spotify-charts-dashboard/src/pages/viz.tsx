import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

const Dashboard: NextPage = () => {
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
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#121212]">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
            This is still{" "}
            <span className="text-[#1ED760]">Work in Progress</span>
          </h1>
        </div>
      </main>
    </>
  );
};

export default Dashboard;
