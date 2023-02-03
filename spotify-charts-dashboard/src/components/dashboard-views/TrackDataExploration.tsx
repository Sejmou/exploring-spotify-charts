import CountriesFilter from "../filtering-and-selecting/CountriesFilter";
import PageLinkButton from "../PageLinkButton";
import SpotifyTrackDataScatterPlot from "../visualizations/SpotifyTrackDataScatterPlot";

const TrackDataExploration = () => {
  return (
    <div className="flex h-full w-full flex-col gap-2">
      <div className="flex flex-wrap gap-4">
        <h1 className="text-5xl font-extrabold tracking-tight text-white">
          <span className="text-[#1ED760]">Spotify</span> Charts
        </h1>
        {/* <DateRangeFilter /> */}
        {/* <SelectedTracksInfoAndLegend /> */}
        <div className="ml-auto self-center">
          <PageLinkButton path="/viz/compare-tracks" text="Switch View" />
        </div>
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
