/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  select,
  json,
  scaleLinear,
  max,
  scaleBand,
  axisBottom,
  axisLeft,
} from "d3";

type GraphData = {
  [key: string]: number | string;
};

type Props = { data: GraphData[]; xColumn: string; yColumn: string };

const margin = { top: 20, right: 20, bottom: 100, left: 100 };
const graphWidth = 600 - margin.left - margin.right;
const graphHeight = 600 - margin.top - margin.bottom;

const BarChart = ({ data }: Props) => {
  const x = scaleBand()
    .domain(data.map((d) => d.name as string))
    .range([0, graphWidth])
    .paddingInner(0.2) // space between bars
    .paddingOuter(0.1); // space between bars and edges of SVG

  const yValue = (d: any) => d.streams as number;
  const y = scaleLinear()
    .domain([0, max(data, yValue)!])
    .range([graphHeight, 0]);

  const bars = data.map((d) => {
    return (
      <rect
        key={d.name}
        x={x(d.name as string)!}
        y={y(yValue(d))}
        width={x.bandwidth()}
        height={graphHeight - y(yValue(d))}
        fill="#1ED760"
      ></rect>
    );
  });

  return (
    <div>
      <>
        {data}
        <svg>
          <g
            transform={`translate(${margin.left}, ${margin.top})`}
            width={graphWidth}
            height={graphHeight}
          >
            {bars}
          </g>
        </svg>
      </>
    </div>
  );
};

export default BarChart;
