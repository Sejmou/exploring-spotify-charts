import dynamic from "next/dynamic";
import { useTrackComparisonFilterStore } from "../../store/trackComparison";
import { api } from "../../utils/api";
import DateRangeFilter from "../filtering-and-selecting/DateRangeFilter";
import RegionSelect from "../filtering-and-selecting/RegionSelect";
import SelectedTracksInfoAndLegend from "../SelectedTracksInfoAndLegend";
import TrackSelect from "../filtering-and-selecting/TrackSelect";
import TrackDataBarChart from "../visualizations/TrackDataBarChart";
import TrackDataRadarChart from "../visualizations/TrackDataRadarChart";
import SpotifyChartsHeading from "../SpotifyChartsHeading";
import VizViewSwitcher from "../VizViewSwitcher";

const ChartsViz = dynamic(() => import("../visualizations/ChartsViz"), {
  ssr: false,
});

export default function CompareTracks() {
  const region = useTrackComparisonFilterStore((state) => state.region);
  const startInclusive = useTrackComparisonFilterStore(
    (state) => state.startInclusive
  );
  const endInclusive = useTrackComparisonFilterStore(
    (state) => state.endInclusive
  );
  const trackIds = useTrackComparisonFilterStore(
    (state) => state.comparisonTrackIds
  );

  const charts = api.charts.getTrackCharts.useQuery(
    { region, startInclusive, endInclusive, trackIds },
    {
      enabled: !!region && !!trackIds,
      keepPreviousData: true,
    }
  );

  if (charts.isError) {
    return <div>Error loading data, please try refreshing the page.</div>;
  }

  if (charts.isLoading) {
    return <div>Loading data...</div>;
  }

  const canViewTrackComparison = region && trackIds && trackIds.length > 0;

  return (
    <div className="flex h-full w-full flex-col gap-2">
      <div className="flex flex-col gap-2 md:flex-row md:flex-wrap 2xl:flex-nowrap">
        <div className="flex grow-0 flex-wrap gap-2 md:flex-nowrap">
          <SpotifyChartsHeading />
          <VizViewSwitcher className="w-full" />
        </div>
        <DateRangeFilter className="w-full md:w-auto" />
        <div className="flex w-full flex-col gap-2 sm:flex-row">
          <RegionSelect className="sm:w-1/3" />
          <TrackSelect className="sm:w-2/3" />
        </div>
      </div>
      <SelectedTracksInfoAndLegend />
      {canViewTrackComparison && (
        <div className="flex h-full w-full flex-1 flex-col gap-2">
          <div className="flex flex-1 flex-col">
            <h2 className="mt-2 text-3xl font-bold">Features</h2>
            <div className="h-[256px] sm:h-[420px] lg:h-[500px]">
              <TrackDataRadarChart trackData={charts.data.trackData} />
            </div>
            <div className="flex w-full flex-col lg:flex-row">
              <TrackDataBarChart
                trackData={charts.data.trackData}
                feature="durationMs"
                className="h-[150px] lg:h-[200px] lg:w-1/2"
              />
              <TrackDataBarChart
                trackData={charts.data.trackData}
                feature="tempo"
                className="lg-h-[200px] h-[150px] lg:w-1/2"
              />
            </div>
          </div>
          <div className="flex flex-1 flex-col">
            <h2 className="text-3xl font-bold">Chart Performance</h2>
            <div className="h-[420px] md:h-[600px]">
              <ChartsViz data={charts.data} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
