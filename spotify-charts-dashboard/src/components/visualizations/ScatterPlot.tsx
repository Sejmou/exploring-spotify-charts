import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Scatter } from "react-chartjs-2";

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend);

type Props = {
  datasets: {
    // label: string;
    data: { x: number; y: number }[];
    backgroundColor: string;
  }[];
  xAttr: string;
  yAttr: string;
};

export default function ScatterPlot(props: Props) {
  return (
    <Scatter
      options={{
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            beginAtZero: true,
            title: {
              display: true,
              text: props.xAttr,
              color: "white",
            },
            grid: {
              tickColor: "white",
              color: "#333",
            },
            ticks: {
              color: "white",
            },
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: props.yAttr,
              color: "white",
            },
            grid: {
              tickColor: "white",
              color: "#333",
            },
            ticks: {
              color: "white",
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
        },
      }}
      data={{
        datasets: props.datasets,
      }}
    />
  );
}
