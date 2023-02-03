import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  DatasetChartOptions,
} from "chart.js";
import { color, extent } from "d3";
import { useEffect, useMemo, useRef, useState } from "react";
import { Scatter } from "react-chartjs-2";
import { useKeyPress } from "../../hooks/useKeyPress";

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend);
// need to register zoom plugin as well, however import would fail with NextJS SSR as window is not defined
if (typeof window !== "undefined") {
  void import("chartjs-plugin-zoom").then((module) => {
    ChartJS.register(module.default);
  });
}

type Props = {
  datasets: {
    // label: string;
    data: { x: number; y: number }[];
    backgroundColor: string;
  }[];
  xAttr: string;
  yAttr: string;
  beginAtZero?: boolean;
  className?: string;
  getLabel?: (datasetIndex: number, dataIndex: number) => string | string[];
};

export default function ScatterPlot(props: Props) {
  const chartRef = useRef<ChartJS>();
  const xValues = props.datasets.flatMap((d) => d.data).map((d) => d.x);
  const yValues = props.datasets.flatMap((d) => d.data).map((d) => d.y);
  const [xMin, xMax] = extent(xValues)! as [number, number];
  const [yMin, yMax] = extent(yValues)! as [number, number];
  const ctrlKeyPressed = useKeyPress("Control");
  const shiftKeyPressed = useKeyPress("Shift");

  // const [zoomMode, setZoomMode] = useState<"x" | "y" | "xy">("xy");
  // useEffect(() => {
  //   if (ctrlKeyPressed) {
  //     setZoomMode("x");
  //   } else if (shiftKeyPressed) {
  //     setZoomMode("y");
  //   }
  // }, [ctrlKeyPressed, shiftKeyPressed]);
  // useEffect(() => {
  //   const scrollListener = () => {
  //     if (ctrlKeyPressed || shiftKeyPressed) {
  //       return;
  //     }
  //     setZoomMode("xy");
  //   };
  //   window.addEventListener("scroll", scrollListener);
  //   return () => {
  //     window.removeEventListener("scroll", scrollListener);
  //   };
  // }, [ctrlKeyPressed, shiftKeyPressed]);

  // const zoomPluginOptions = useMemo(
  //   () => (),
  //   [ctrlKeyPressed, shiftKeyPressed]
  // );

  return (
    <Scatter
      className={props.className}
      ref={chartRef}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            beginAtZero: props.beginAtZero,
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
            beginAtZero: props.beginAtZero,
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
          zoom: {
            limits: {
              x: {
                min: xMin > 0 && props.beginAtZero ? 0 : xMin,
                max: xMax,
              },
              y: {
                min: yMin > 0 && props.beginAtZero ? 0 : yMin,
                max: yMax,
              },
            },
            zoom: {
              wheel: {
                enabled: true,
              },
              pinch: {
                enabled: true,
              },
              mode: ctrlKeyPressed ? "x" : shiftKeyPressed ? "y" : "xy",
              drag: {
                enabled: true,
                modifierKey: "alt",
              },
            },
            pan: {
              enabled: true,
              mode: ctrlKeyPressed ? "x" : shiftKeyPressed ? "y" : "xy",
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
