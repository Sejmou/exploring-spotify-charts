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
import { divergingColors } from "../pages/viz";

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

export const options = {
  responsive: true,
  plugins: {
    // legend: {
    //   display: false,
    // },
  },
};

export default function BarChart({ data, propName }: Props) {
  const chartData = {
    labels: [propName],
    datasets: data.map((d, i) => ({
      label: d.x,
      data: [d.y],
      backgroundColor: divergingColors[i],
      borderColor: color(divergingColors[i]!)?.darker(0.5).toString(),
    })),
  };
  return <Bar options={options} data={chartData} />;
}
