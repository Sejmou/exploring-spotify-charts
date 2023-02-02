import { Button } from "@mui/material";
import dynamic from "next/dynamic";
import { useFilterStore } from "../../store/filter";
import { api } from "../../utils/api";
import DateRangeFilter from "../DateRangeFilter";
import RegionSelect from "../RegionSelect";
import SelectedTracksInfoAndLegend from "../SelectedTracksInfoAndLegend";
import TrackSelect from "../TrackSelect";
import BarCharts from "../visualizations/BarCharts";
import RadarChart from "../visualizations/RadarChart";

const ChartsViz = dynamic(() => import("../visualizations/ChartsViz"), {
  ssr: false,
});

type Props = {
  onSwitchView: () => void;
};

export default function TrackComparison({ onSwitchView }: Props) {
  const region = useFilterStore((state) => state.region);
  const startInclusive = useFilterStore((state) => state.startInclusive);
  const endInclusive = useFilterStore((state) => state.endInclusive);
  const trackIds = useFilterStore((state) => state.trackIds);

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

  if (charts.data) {
    return (
      <>
        <div className="flex flex-wrap gap-4">
          <h1 className="text-5xl font-extrabold tracking-tight text-white">
            <span className="text-[#1ED760]">Spotify</span> Charts
          </h1>
          <DateRangeFilter />
          <RegionSelect />
          <TrackSelect />
          <div className="ml-auto self-center">
            <Button onClick={onSwitchView}>Switch View</Button>
          </div>
        </div>
        {canViewTrackComparison ? (
          <>
            <SelectedTracksInfoAndLegend />
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
        ) : (
          <div>
            Please add at least one track whose data you wish to explore.
          </div>
        )}
      </>
    );
  } else {
    return <div>No data to display.</div>;
  }
}
