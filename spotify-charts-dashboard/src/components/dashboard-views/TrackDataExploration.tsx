import { Button } from "@mui/material";
import CountrySelection from "../CountrySelection";
import SpotifyTrackDataScatterPlot from "../visualizations/SpotifyTrackDataScatterPlot";

type Props = {
  onSwitchView: () => void;
};

const TrackDataExploration = ({ onSwitchView }: Props) => {
  return (
    <>
      <div className="flex flex-wrap gap-4">
        <h1 className="text-5xl font-extrabold tracking-tight text-white">
          <span className="text-[#1ED760]">Spotify</span> Charts
        </h1>
        {/* <DateRangeFilter /> */}
        {/* <SelectedTracksInfoAndLegend /> */}
        <div className="ml-auto self-center">
          <Button onClick={onSwitchView}>Switch View</Button>
        </div>
      </div>
      <div className="grid h-full w-full flex-1 grid-cols-2">
        <div className="grid h-full w-full grid-rows-6">
          <SpotifyTrackDataScatterPlot />
        </div>
        <div>
          <div></div>
          <div>
            <CountrySelection />
          </div>
          {/* <div>Filter by genres</div> */}
        </div>
      </div>
    </>
  );
};

export default TrackDataExploration;
