import type { RouterOutputs } from "../../utils/api";
import { getFeatureLabel, getFeatureDataFormat } from "../../utils/data";
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
  className?: string;
};

const TrackDataBarChart = ({ trackData, feature, className }: Props) => {
  const chartProps = {
    propName: getFeatureLabel(feature),
    data: trackData.map((trackData) => ({
      x: trackData.name,
      y: trackData[feature],
    })),
    yTickFormat: getFeatureDataFormat(feature),
  };

  return (
    <div className={className}>
      <BarChart {...chartProps} />
    </div>
  );
};

export default TrackDataBarChart;
