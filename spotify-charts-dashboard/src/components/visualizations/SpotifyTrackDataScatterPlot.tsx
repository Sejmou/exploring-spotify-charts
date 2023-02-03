import { CircularProgress } from "@mui/material";
import { color } from "d3";
import { useFilterStore } from "../../store/filter";
import { api } from "../../utils/api";
import ScatterPlot from "./ScatterPlot";
import { useEffect, useState } from "react";
import type { RouterOutputs } from "../../utils/api";
import BasicSelect from "../filtering-and-selecting/BasicSelect";
import { capitalizeFirstLetter, truncate } from "../../utils/misc";
import { useTrackDataExplorationStore } from "../../store/trackDataExploration";

function randomSubset<T>(array: T[], size: number) {
  const shuffled = array.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, size);
}

type PickByType<T, Value> = {
  [P in keyof T as T[P] extends Value | undefined ? P : never]: T[P];
};

type TrackAttribute = keyof PickByType<
  RouterOutputs["tracks"]["getTrackData"][0],
  number
>;

const attributeOptions: TrackAttribute[] = [
  "acousticness",
  "danceability",
  "energy",
  "instrumentalness",
  "liveness",
  "loudness",
  "acousticness",
  "speechiness",
  "tempo",
  "valence",
];

const pointColorObj = color("#1ED760")!;
pointColorObj.opacity = 0.2;
const pointColor = pointColorObj.toString();

const SpotifyTrackDataScatterPlot = () => {
  const countryNames = useFilterStore((state) => state.countryNames);
  const tracks = api.tracks.getTrackData.useQuery(undefined, {
    staleTime: Infinity,
    keepPreviousData: true,
  });
  const filteredTrackIds = api.tracks.getTrackIdsMatchingFilter.useQuery(
    { countryNames },
    { staleTime: Infinity, keepPreviousData: true }
  );

  const trackData = useTrackDataExplorationStore((state) => state.trackData);
  const setTrackData = useTrackDataExplorationStore(
    (state) => state.setTrackData
  );

  const [xAttr, setXAttr] = useState<TrackAttribute>("danceability");
  const [yAttr, setYAttr] = useState<TrackAttribute>("energy");

  console.log({
    allTrackData: tracks.data,
    filteredTrackIds: filteredTrackIds.data,
  });

  useEffect(() => {
    setTrackData(
      tracks.data && filteredTrackIds.data
        ? randomSubset(
            tracks.data.filter((t) => filteredTrackIds.data.includes(t.id)),
            3000
          )
        : []
    ); // cannot plot all tracks as it will be too slow
  }, [tracks.data, filteredTrackIds.data, setTrackData]);

  if (tracks.isError) {
    return <div>Error loading data, please try refreshing the page.</div>;
  }

  const plotArea =
    tracks.isStale || tracks.isLoading ? (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2">
        <span>{tracks.isLoading && "Loading data..."}</span>
        <CircularProgress />
      </div>
    ) : (
      <ScatterPlot
        datasets={[
          {
            data: trackData.map((track) => {
              return {
                x: track[xAttr],
                y: track[yAttr],
              };
            }),
            backgroundColor: pointColor,
          },
        ]}
        xAttr={capitalizeFirstLetter(xAttr)}
        yAttr={capitalizeFirstLetter(yAttr)}
        beginAtZero={true}
        getLabel={(_, dataIdx) => {
          const dataForTrack = trackData[dataIdx];
          if (!dataForTrack) {
            return "";
          }
          return [
            `"${truncate(dataForTrack.name, 30)}"`,
            `by ${truncate(
              dataForTrack.featuringArtists[0]?.artist.name ?? "Unknown Artist",
              30
            )}`,
            `${dataForTrack.genres[0] ?? "Unknown Genre"}`,
          ];
        }}
      />
    );

  return (
    <>
      <div>
        <h2 className="mb-2 text-3xl font-bold">Explore relationships</h2>
        <p className="my-2">
          This scatterplot contains all the tracks in the dataset matching the
          filter criteria (for now, only country filtering is supported).
        </p>
        <div className="flex w-full gap-2">
          <BasicSelect
            className="w-full"
            label="x-axis attribute"
            value={xAttr}
            onChange={(newValue: string) =>
              setXAttr(newValue as TrackAttribute)
            }
            options={attributeOptions.map((o) => ({
              value: o,
              label: capitalizeFirstLetter(o),
            }))}
          />
          <BasicSelect
            className="w-full"
            label="y-axis attribute"
            value={yAttr}
            onChange={(newValue: string) =>
              setYAttr(newValue as TrackAttribute)
            }
            options={attributeOptions.map((o) => ({
              value: o,
              label: capitalizeFirstLetter(o),
            }))}
          />
        </div>
      </div>
      <div className="row-span-5">{plotArea}</div>
    </>
  );
};

export default SpotifyTrackDataScatterPlot;
