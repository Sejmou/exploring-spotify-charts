import type { RouterOutputs } from "../../utils/api";
import { getFeatureLabel } from "../../utils/data";
import BarChart from "./BarChart";

type TrackDataProps = keyof Props["trackData"][0];
type Extends<T, U extends T> = U;
// numerical props that are suitable for bar charts (i.e. not categorical, and not between 0 and 1 (those were used in radar charts))
type BarChartableFeatures = Extends<
  TrackDataProps,
  "tempo" | "durationMs" | "loudness"
>;

type Props = {
  trackData: RouterOutputs["charts"]["getTrackCharts"]["trackData"];
  feature: BarChartableFeatures;
};

const TrackDataBarChart = ({ trackData, feature }: Props) => {
  const chartProps = {
    propName: getFeatureLabel(feature),
    data: trackData.map((trackData) => ({
      x: trackData.name,
      y:
        feature != "durationMs"
          ? trackData[feature]
          : trackData[feature] / 60000,
    })),
  };

  return (
    <div>
      <BarChart {...chartProps} />
    </div>
  );
};

export default TrackDataBarChart;
