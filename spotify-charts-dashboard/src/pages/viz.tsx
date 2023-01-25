import { type NextPage } from "next";
import Head from "next/head";
import { api } from "../utils/api";
import type { RouterOutputs } from "../utils/api";

type APIResponse = RouterOutputs["tracks"]["getNamesAndArtistNames"];

const Dashboard: NextPage = () => {
  const tracks = api.tracks.getNamesAndArtistNames.useQuery();

  const displayTrackData = (trackAndArtistNames: APIResponse) => {
    return trackAndArtistNames.map((track) => (
      <div key={track.id}>
        {`${track.name} - ${track.artists[0] ? track.artists[0].name : ""}`}
      </div>
    ));
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
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#121212] text-white">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
            This is still{" "}
            <span className="text-[#1ED760]">Work in Progress</span>
          </h1>
        </div>
        {tracks.data ? displayTrackData(tracks.data) : "Loading tracks..."}
      </main>
    </>
  );
};

export default Dashboard;
