import ChartsDatePicker from "../filtering-and-selecting/DatePicker";
import RegionSelect from "../filtering-and-selecting/RegionSelect";
import SpotifyChartsHeading from "../SpotifyChartsHeading";
import DailyChartTable from "../visualizations/DailyChartTable";
import VizViewSwitcher from "../VizViewSwitcher";

const DailyCharts = () => {
  return (
    <div className="flex h-full w-full flex-1 flex-col gap-2">
      <div className="flex grow-0 flex-wrap gap-2 lg:flex-nowrap">
        <SpotifyChartsHeading />
        <VizViewSwitcher className="w-full md:w-min" />
        <ChartsDatePicker className="w-full min-w-[160px]" />
        <RegionSelect className="w-full" />
      </div>
      <DailyChartTable />
    </div>
  );
};
export default DailyCharts;
