import { CircularProgress } from "@mui/material";
import { color } from "d3";
import { useFilterStore } from "../../store/filter";
import { api } from "../../utils/api";
import ScatterPlot from "./ScatterPlot";
import { useMemo } from "react";

function randomSubset<T>(array: T[], size: number) {
  const shuffled = array.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, size);
}

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

  console.log({
    trackData: tracks.data,
    filteredTrackIds: filteredTrackIds.data,
  });

  const plotTracks = useMemo(() => {
    return tracks.data && filteredTrackIds.data
      ? randomSubset(
          tracks.data.filter((t) => filteredTrackIds.data.includes(t.id)),
          3000
        )
      : []; // cannot plot all tracks as it will be too slow
  }, [tracks.data, filteredTrackIds.data]);

  if (tracks.isError) {
    return <div>Error loading data, please try refreshing the page.</div>;
  }

  return tracks.isStale || tracks.isLoading ? (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2">
      <span>{tracks.isLoading && "Loading data..."}</span>
      <CircularProgress />
    </div>
  ) : (
    <ScatterPlot
      datasets={[
        {
          data: plotTracks.map((track) => {
            return {
              x: track.energy,
              y: track.danceability,
            };
          }),
          backgroundColor: pointColor,
        },
      ]}
      xAttr="Energy"
      yAttr="Danceability"
    />
  );
};

export default SpotifyTrackDataScatterPlot;
