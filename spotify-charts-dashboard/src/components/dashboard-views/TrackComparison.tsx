import dynamic from "next/dynamic";
import { useFilterStore } from "../../store/filter";
import { api } from "../../utils/api";
import BarCharts from "../visualizations/BarCharts";
import RadarChart from "../visualizations/RadarChart";

const ChartsViz = dynamic(() => import("../visualizations/ChartsViz"), {
  ssr: false,
});

export default function TrackComparison() {
  const region = useFilterStore((state) => state.region);
  const startInclusive = useFilterStore((state) => state.startInclusive);
  const endInclusive = useFilterStore((state) => state.endInclusive);
  const trackIds = useFilterStore((state) => state.trackIds);

  const charts = api.charts.getTrackCharts.useQuery(
    { region, startInclusive, endInclusive },
    {
      enabled: !!region,
      keepPreviousData: true,
    }
  );

  const canViewTrackComparison = region && trackIds && trackIds.length > 0;
  if (!canViewTrackComparison) {
    return (
      <div>Please add at least one track whose data you wish to explore.</div>
    );
  }

  if (charts.isError) {
    return <div>Error loading data, please try refreshing the page.</div>;
  }

  if (charts.isLoading) {
    return <div>Loading data...</div>;
  }

  if (charts.data) {
    return (
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
    );
  } else {
    return <div>No data to display.</div>;
  }
}
