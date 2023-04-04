import dynamic from "next/dynamic";
import { useTrackComparisonFilterStore } from "../../store/trackComparison";
import { api } from "../../utils/api";
import DateRangeFilter from "../filtering-and-selecting/DateRangeFilter";
import RegionSelect from "../filtering-and-selecting/RegionSelect";
import SelectedTracksInfoAndLegend from "../SelectedTracksInfoAndLegend";
import TrackSelect from "../filtering-and-selecting/TrackSelect";
import BarCharts from "../visualizations/BarCharts";
import RadarChart from "../visualizations/RadarChart";
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
      <div className="flex flex-col gap-2 md:flex-row">
        <SpotifyChartsHeading />
        <VizViewSwitcher className="w-full grow-0 sm:w-auto" />
        <DateRangeFilter className="md:grow" />
        <RegionSelect />
        <TrackSelect className="md:w-full md:grow" />
      </div>
      <SelectedTracksInfoAndLegend />
      {canViewTrackComparison && (
        <>
          <div className="grid h-full w-full flex-1 grid-cols-9 grid-rows-3">
            <div className="col-span-6 row-span-2">
              <ChartsViz data={charts.data} />
            </div>
            <div className="col-span-3 row-span-2">
              <RadarChart data={charts.data} />
            </div>
            <div className="col-span-9 row-span-1">
              <BarCharts trackData={charts.data.trackData} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
