import { type NextPage } from "next";
import Head from "next/head";
import { api } from "../../utils/api";
import TrackSelect from "../../components/TrackSelect";
import { useState } from "react";
import type { RouterInputs } from "../../utils/api";
import dayjs from "dayjs";
import DateRangeFilter from "../../components/DateRangeFilter";

const Dashboard: NextPage = () => {
  const [filterParams, setFilterParams] = useState<
    RouterInputs["tracks"]["getNamesAndArtists"]
  >({
    startInclusive: dayjs("2021-01-01").toDate(),
    endInclusive: dayjs("2021-12-31").toDate(),
  });
  const availableTracks = api.tracks.getNamesAndArtists.useQuery(filterParams);

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
          <h1 className="text-xl font-extrabold tracking-tight text-white sm:text-[5rem]">
            This is still{" "}
            <span className="text-[#1ED760]">Work in Progress</span>
          </h1>
          <div className="flex gap-4">
            <DateRangeFilter
              filterParams={filterParams}
              onChange={(newParams) => setFilterParams(newParams)}
              minDate={dayjs("2017-01-01")}
              maxDate={dayjs("2021-12-31")}
            />
            <TrackSelect resp={availableTracks.data} />
          </div>
        </div>
      </main>
    </>
  );
};

export default Dashboard;
