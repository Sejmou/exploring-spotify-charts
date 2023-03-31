import RegionFilter from "../filtering-and-selecting/RegionFilter";
import SpotifyChartsHeading from "../SpotifyChartsHeading";
import SpotifyTrackDataScatterPlot from "../visualizations/SpotifyTrackDataScatterPlot";
import VizViewSwitcher from "../VizViewSwitcher";

const TrackDataExploration = () => {
  return (
    <div className="flex h-full w-full flex-col gap-2">
      <div className="flex flex-wrap gap-4">
        <SpotifyChartsHeading />
        <VizViewSwitcher />
      </div>
      <div className="grid h-full w-full flex-1 grid-cols-2">
        <div className="grid h-full w-full grid-rows-6">
          <SpotifyTrackDataScatterPlot />
        </div>
        <div>
          <div></div>
          <div>
            <RegionFilter />
          </div>
          {/* <div>Filter by genres</div> */}
        </div>
      </div>
    </div>
  );
};

export default TrackDataExploration;
