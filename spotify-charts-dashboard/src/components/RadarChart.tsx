import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { color } from "d3";
import { Radar } from "react-chartjs-2";
import { divergingColors } from "../pages/viz";
import type { RouterOutputs } from "../utils/api";

type Props = {
  data?: RouterOutputs["charts"]["getTrackCharts"];
};

const SpotifySongMetrics = [
  "acousticness",
  "danceability",
  "energy",
  "instrumentalness",
  "liveness",
] as const;

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

export default function RadarChart({ data }: Props) {
  if (!data) return <div>RadarChart would show here</div>;
  const chartDatasets = data.trackData.map((trackData, i) => {
    console.log(trackData);
    const data = SpotifySongMetrics.map((metric) => trackData[metric]);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const colorObj = color(divergingColors[i]!)!;
    const bgColorObj = colorObj.copy();
    bgColorObj.opacity = 0.1;

    return {
      id: trackData.id,
      label: trackData.name,
      data: data,
      backgroundColor: bgColorObj.toString(),
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      borderColor: colorObj.darker(0.5).toString(),
    };
  });

  const chartData = {
    labels: [...SpotifySongMetrics],
    datasets: chartDatasets,
  };

  return (
    <Radar
      data={chartData}
      options={{
        radar: {},
        scales: {
          r: {
            grid: {
              color: "white",
              tickColor: "white",
            },
            angleLines: {
              color: "white",
            },
            pointLabels: {
              color: "white",
            },
            ticks: {
              color: "white",
              backdropColor: "#222",
            },
          },
        },
      }}
    />
  );
}
