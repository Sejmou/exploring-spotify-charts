import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { color } from "d3";
import { useRef } from "react";
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
  className?: string;
  getLabel?: (datasetIndex: number, dataIndex: number) => string | string[];
};

export default function ScatterPlot(props: Props) {
  const chartRef = useRef<ChartJS>();
  return (
    <Scatter
      className={props.className}
      ref={chartRef}
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
          tooltip: {
            callbacks: {
              labelColor: function (context) {
                const bgColorObj = color(
                  context.dataset.backgroundColor as string
                )!;
                bgColorObj.opacity = 1;
                const newColor = bgColorObj.toString();
                return {
                  borderColor: newColor,
                  backgroundColor: newColor,
                };
              },
              label: function (context) {
                if (props.getLabel)
                  return props.getLabel(
                    context.datasetIndex,
                    context.dataIndex
                  );
              },
            },
          },
        },
      }}
      data={{
        datasets: props.datasets,
      }}
    />
  );
}
