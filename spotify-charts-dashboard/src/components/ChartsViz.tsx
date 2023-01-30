import type { VizFilterParams } from "../pages/viz";
import { divergingColors } from "../pages/viz";
import { api } from "../utils/api";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { color } from "d3";
import "chartjs-adapter-moment";
import moment from "moment";

ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export const options = {
  responsive: true,
  plugins: {
    legend: {
      position: "top" as const,
    },
    title: {
      display: true,
      text: "Chart.js Line Chart",
    },
  },
};

type Props = {
  filterParams: VizFilterParams;
};

const ChartsViz = ({ filterParams }: Props) => {
  const charts = api.charts.getTrackCharts.useQuery(filterParams, {
    enabled: !!filterParams.region && !!filterParams.trackIds,
  });

  if (!filterParams.region || !filterParams.trackIds) {
    return <div>Choose a region and at least one track to see charts</div>;
  }
  if (charts.error) {
    return <div>Error loading charts</div>;
  }

  if (charts.data) {
    const data = charts.data;
    console.log(data);
    const chartDatasets = data.map((trackData, i) => ({
      id: trackData.id,
      label: trackData.name,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      data: trackData.charts!.map((d) => d.rank),
      backgroundColor: divergingColors[i],
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      borderColor: color(divergingColors[i]!)?.darker(0.5).toString(),
    }));
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const labels = data[0]!.charts!.map((d) => moment(d.date));
    const chartData = {
      labels,
      datasets: chartDatasets,
    };

    return (
      <Line
        data={chartData}
        datasetIdKey="id"
        options={{
          scales: {
            x: {
              type: "time",
            },
            y: {
              type: "linear",
              reverse: true,
              min: 1,
              max: 50,
              ticks: {
                stepSize: 5,
              },
            },
          },
        }}
      />
    );
  }

  return <div>ChartsViz</div>;
};

export default ChartsViz;
