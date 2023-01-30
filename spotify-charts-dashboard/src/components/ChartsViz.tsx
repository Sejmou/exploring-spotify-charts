import { divergingColors } from "../pages/viz";
import type { RouterOutputs } from "../utils/api";
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
  data?: RouterOutputs["charts"]["getTrackCharts"];
};

const ChartsViz = ({ data }: Props) => {
  if (data) {
    console.log(data);
    const chartDatasets = data.trackData.map((data, i) => ({
      id: data.id,
      label: data.name,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      data: data.charts!.map((c) => c?.rank || null),
      backgroundColor: divergingColors[i],
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      borderColor: color(divergingColors[i]!)?.darker(0.5).toString(),
    }));

    const chartData = {
      labels: data.dateRange.map((d) => moment(d)),
      datasets: chartDatasets,
    };

    return (
      <Line
        data={chartData}
        datasetIdKey="id"
        options={{
          spanGaps: false,
          scales: {
            x: {
              type: "time",
            },
            y: {
              type: "linear",
              reverse: true,
              min: 1,
              max: 50,
            },
          },
          plugins: {
            tooltip: {
              callbacks: {
                title: (context) => {
                  // for some reason, context is an array of length 1?!
                  // parsed.x is the date timestamp in milliseconds
                  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                  return moment(new Date(context[0]!.parsed.x)).format(
                    "dddd, MMMM Do YYYY"
                  );
                },
              },
            },
          },
        }}
      />
    );
  }

  return <div></div>;
};

export default ChartsViz;
