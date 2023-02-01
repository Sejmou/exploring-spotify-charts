import type { RouterOutputs } from "../../utils/api";
import BarChart from "./BarChart";

type Props = {
  trackData: RouterOutputs["charts"]["getTrackCharts"]["trackData"];
};

type TrackDataProps = keyof Props["trackData"][0];
type Extends<T, U extends T> = U;
// numerical props that are suitable for bar charts (i.e. not categorical, and not between 0 and 1 (those were used in radar charts))
type NumericalProps = Extends<
  TrackDataProps,
  | "tempo"
  | "key"
  | "mode"
  | "durationMs"
  | "loudness"
  | "timeSignature"
  | "valence"
>;

const numericalProps: NumericalProps[] = [
  // "key",
  // "timeSignature",
  // "mode",
  "tempo",
  "durationMs",
  "loudness",
  "valence",
];

const BarCharts = ({ trackData }: Props) => {
  const dataForCharts = numericalProps.map((prop) => ({
    propName: prop,
    data: trackData.map((d) => ({
      x: d.name,
      y: d[prop],
    })),
  }));

  return (
    // this is soooo hacky, but it works for now lol
    <div
      className="grid h-full w-full gap-8"
      style={{
        gridTemplateColumns: `repeat(${dataForCharts.length}, 1fr)`,
      }}
    >
      {dataForCharts.map(({ propName, data }, i) => (
        <div key={i}>
          <BarChart data={data} propName={propName} />
        </div>
      ))}
    </div>
  );
};

export default BarCharts;
