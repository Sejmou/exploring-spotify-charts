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
import { useComparisonTrackColors } from "~/store/track-comparison";
import type { RouterOutputs } from "../../utils/api";
import { capitalizeFirstLetter } from "../../utils/misc";

type Props = {
  trackData?: RouterOutputs["tracks"]["getNumericFeaturesForIds"];
};

const SpotifySongMetrics = [
  "acousticness",
  "danceability",
  "energy",
  "valence",
  "speechiness",
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

export default function TrackDataRadarChart({ trackData }: Props) {
  const colors = useComparisonTrackColors();

  if (!trackData) return <div>RadarChart would show here</div>;
  const chartDatasets = trackData.map((trackData) => {
    const data = SpotifySongMetrics.map((metric) => trackData[metric]);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const colorObj = color(colors[trackData.id] || "white")!;
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
    labels: SpotifySongMetrics.map((metric) => capitalizeFirstLetter(metric)),
    datasets: chartDatasets,
  };

  return (
    <Radar
      data={chartData}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              labelColor: function (context) {
                const color = context.dataset.borderColor as string;
                return {
                  borderColor: color,
                  backgroundColor: color,
                };
              },
            },
          },
        },
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
