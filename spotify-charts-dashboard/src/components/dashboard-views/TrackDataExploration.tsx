import { Button } from "@mui/material";
import { useFilterStore } from "../../store/filter";
import CountrySelection from "../CountrySelection";
import DateRangeFilter from "../DateRangeFilter";
import SpotifyTrackDataScatterPlot from "../visualizations/SpotifyTrackDataScatterPlot";

type Props = {
  onSwitchView: () => void;
};

const TrackDataExploration = ({ onSwitchView }: Props) => {
  const countryNames = useFilterStore((state) => state.countryNames);
  return (
    <>
      <div className="flex flex-wrap gap-4">
        <h1 className="text-5xl font-extrabold tracking-tight text-white">
          <span className="text-[#1ED760]">Spotify</span> Charts
        </h1>
        <DateRangeFilter />
        {/* <SelectedTracksInfoAndLegend /> */}
        <div className="ml-auto self-center">
          <Button onClick={onSwitchView}>Switch View</Button>
        </div>
      </div>
      <div className="grid h-full w-full flex-1 grid-cols-12 grid-rows-6">
        <div className="col-span-6 row-span-1 bg-slate-500"></div>
        <div className="col-span-6 row-span-1 bg-slate-600">
          {countryNames?.join(", ")}
        </div>
        <div className="col-span-6 row-span-5">
          <SpotifyTrackDataScatterPlot />
        </div>
        <div className="col-span-6 row-span-5 bg-slate-400">
          <CountrySelection />
        </div>
      </div>
    </>
  );
};

export default TrackDataExploration;
