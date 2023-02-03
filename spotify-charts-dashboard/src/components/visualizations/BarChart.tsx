import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { color } from "d3";
import { divergingColors } from "../../utils/misc";

type Props = {
  propName: string;
  data: {
    x: string;
    y: number;
  }[];
};

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function BarChart({ data, propName }: Props) {
  const chartData = {
    labels: [propName],
    datasets: data.map((d, i) => ({
      label: d.x,
      data: [d.y],
      backgroundColor: divergingColors[i] || "white",
      borderColor: color(divergingColors[i] || "white")
        ?.darker(0.5)
        .toString(),
    })),
  };
  return (
    <Bar
      className="relative"
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            grid: {
              color: "white",
              tickColor: "white",
            },
            ticks: {
              color: "white",
              backdropColor: "#222",
            },
          },
          y: {
            grid: {
              color: "grey",
              tickColor: "white",
            },
            ticks: {
              color: "white",
              backdropColor: "#222",
            },
          },
        },
      }}
      data={chartData}
    />
  );
}
