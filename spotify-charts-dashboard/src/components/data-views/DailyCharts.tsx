import SpotifyChartsHeading from "../SpotifyChartsHeading";
import DailyChartTable from "../visualizations/DailyChartTable";
import VizViewSwitcher from "../VizViewSwitcher";

const DailyCharts = () => {
  return (
    <div className="flex h-full w-full flex-1 flex-col gap-2">
      <div className="flex grow-0 flex-wrap gap-2 md:flex-nowrap">
        <SpotifyChartsHeading />
        <VizViewSwitcher className="w-full" />
      </div>
      <h2>Daily Charts (currently hardcoded lol)</h2>
      <DailyChartTable />
    </div>
  );
};
export default DailyCharts;
