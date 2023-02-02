import { color } from "d3";
import { useFilterStore } from "../../store/filter";
import { api } from "../../utils/api";
import ScatterPlot from "./ScatterPlot";

function randomSubset<T>(array: T[], size: number) {
  const shuffled = array.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, size);
}

const pointColorObj = color("#1ED760")!;
pointColorObj.opacity = 0.2;
const pointColor = pointColorObj.toString();

const SpotifyTrackDataScatterPlot = () => {
  const countryNames = useFilterStore((state) => state.countryNames);
  const tracks = api.tracks.getTrackData.useQuery(
    { countryNames },
    { staleTime: Infinity }
  );

  if (tracks.isError) {
    return <div>Error loading data, please try refreshing the page.</div>;
  }

  if (tracks.isLoading) {
    return <div>Loading data...</div>;
  }

  const plotTracks = tracks.data ? randomSubset(tracks.data, 3000) : []; // cannot plot all tracks as it will be too slow

  return plotTracks ? (
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
  ) : (
    <div>Plot will be here</div>
  );
};

export default SpotifyTrackDataScatterPlot;
