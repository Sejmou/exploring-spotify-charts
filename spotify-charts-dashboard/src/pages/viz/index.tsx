import { type NextPage } from "next";
import Head from "next/head";
import { api } from "../../utils/api";
import TrackSelect from "../../components/TrackSelect";
import BasicDatePicker from "../../components/BasicDatePicker";
import { useState } from "react";
import type { RouterInputs } from "../../utils/api";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";

type getNamesAndArtistNamesInput =
  RouterInputs["tracks"]["getNamesAndArtistNames"];

const minDate = dayjs("2017-01-01");
const maxDate = dayjs("2021-12-31");
const defaultStartDate = dayjs("2021-01-01");
const defaultEndDate = dayjs("2021-12-31");

const Dashboard: NextPage = () => {
  const [startDate, setStartDate] = useState<Dayjs | null>(defaultStartDate);
  const [endDate, setEndDate] = useState<Dayjs | null>(defaultEndDate);
  const [filterParams, setFilterParams] = useState<getNamesAndArtistNamesInput>(
    {
      chartedOnOrAfter: startDate?.toDate(),
      chartedOnOrBefore: endDate?.toDate(),
    }
  );
  const availableTracks = api.tracks.getNamesAndArtistNames.useQuery(
    filterParams
    // { enabled: false }
  );

  console.log(startDate, endDate);

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
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#121212] text-white">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
            This is still{" "}
            <span className="text-[#1ED760]">Work in Progress</span>
          </h1>
        </div>
        <div className="flex gap-2">
          <BasicDatePicker
            value={startDate}
            label="Start Date"
            minDate={minDate}
            maxDate={maxDate}
            onChange={(newValue) => {
              console.log(newValue);
              setStartDate(newValue);
              setFilterParams((old) => ({
                ...old,
                chartedOnOrAfter: newValue ? newValue.toDate() : undefined,
              }));
            }}
          />
          <BasicDatePicker
            value={endDate}
            label="End Date"
            minDate={minDate}
            maxDate={maxDate}
            onChange={(newValue) => {
              setEndDate(newValue);
              setFilterParams((old) => ({
                ...old,
                chartedOnOrBefore: newValue ? newValue.toDate() : undefined,
              }));
            }}
          />
        </div>
        <TrackSelect resp={availableTracks.data} />
      </main>
    </>
  );
};

export default Dashboard;
