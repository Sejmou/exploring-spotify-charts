import type { RouterOutputs } from "../../utils/api";
import { capitalizeFirstLetter } from "../../utils/misc";
import BarChart from "./BarChart";

type Props = {
  trackData: RouterOutputs["charts"]["getTrackCharts"]["trackData"];
};

type TrackDataProps = keyof Props["trackData"][0];
type Extends<T, U extends T> = U;
// numerical props that are suitable for bar charts (i.e. not categorical, and not between 0 and 1 (those were used in radar charts))
type NumericalProps = Extends<
  TrackDataProps,
  "tempo" | "durationMs" | "loudness"
>;

const numericalProps: NumericalProps[] = [
  // "key",
  // "timeSignature",
  // "mode",
  "tempo",
  "durationMs",
  "loudness",
];

const BarCharts = ({ trackData }: Props) => {
  const dataForCharts = numericalProps.map((prop) => ({
    propName: prop,
    data: trackData.map((d) => ({
      x: d.name,
      y: prop != "durationMs" ? d[prop] : d[prop] / 60000,
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
          <BarChart
            data={data}
            propName={
              propName != "durationMs"
                ? capitalizeFirstLetter(propName)
                : "Duration (mins)"
            }
          />
        </div>
      ))}
    </div>
  );
};

export default BarCharts;
