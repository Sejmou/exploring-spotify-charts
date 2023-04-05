import RegionFilter from "../filtering-and-selecting/RegionFilter";
import SpotifyChartsHeading from "../SpotifyChartsHeading";
import TrackDataScatterplot from "../visualizations/TrackDataScatterplot";
import VizViewSwitcher from "../VizViewSwitcher";

const TrackDataExploration = () => {
  return (
    <div className="flex h-full w-full flex-1 flex-col gap-2">
      <div className="flex flex-wrap gap-4">
        <SpotifyChartsHeading />
        <VizViewSwitcher className="w-full md:w-auto" />
      </div>
      <div className="flex h-full w-full flex-1 flex-col xl:flex-row xl:gap-4">
        <div className="h-[420px] md:h-[640px] xl:h-auto xl:flex-1">
          <TrackDataScatterplot />
        </div>
        <div className="flex flex-col xl:w-96">
          <h2 className="text-3xl font-bold">Filters</h2>
          <RegionFilter />
          <span>More coming soon...</span>
        </div>
      </div>
    </div>
  );
};

export default TrackDataExploration;
