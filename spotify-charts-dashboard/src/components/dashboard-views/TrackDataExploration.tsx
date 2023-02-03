import CountriesFilter from "../filtering-and-selecting/CountriesFilter";
import PageLinkButton from "../PageLinkButton";
import SpotifyChartsHeading from "../SpotifyChartsHeading";
import SpotifyTrackDataScatterPlot from "../visualizations/SpotifyTrackDataScatterPlot";

const TrackDataExploration = () => {
  return (
    <div className="flex h-full w-full flex-col gap-2">
      <div className="flex flex-wrap gap-4">
        <SpotifyChartsHeading />
        <PageLinkButton
          className="self-center"
          path="/viz/compare-tracks"
          text="Switch View"
        />
      </div>
      <div className="grid h-full w-full flex-1 grid-cols-2">
        <div className="grid h-full w-full grid-rows-6">
          <SpotifyTrackDataScatterPlot />
        </div>
        <div>
          <div></div>
          <div>
            <CountriesFilter />
          </div>
          {/* <div>Filter by genres</div> */}
        </div>
      </div>
    </div>
  );
};

export default TrackDataExploration;
