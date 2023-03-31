import { CircularProgress } from "@mui/material";
import { api } from "../../utils/api";
import { useCallback, useMemo, useState } from "react";
import BasicSelect from "../filtering-and-selecting/BasicSelect";
import { useTracksExplorationStore } from "../../store/trackDataExploration";
import { numericTrackFeatures } from "../../utils/data";
import type { NumericTrackFeatureName } from "../../utils/data";

import dynamic from "next/dynamic";
const Scatterplot = dynamic(() => import("react-big-dataset-scatterplot"), {
  ssr: false,
});
const ReactTooltip = dynamic(() => import("react-tooltip"), {
  ssr: false,
});

import type { RouterOutputs } from "../../utils/api";
import type { AxisConfig } from "react-big-dataset-scatterplot";
import { capitalizeFirstLetter } from "../../utils/misc";
type TrackData = RouterOutputs["tracks"]["getTrackXY"];

const SpotifyTrackDataScatterPlot = () => {
  const regionNames = useTracksExplorationStore((state) => state.regionNames);
  const startInclusive = useTracksExplorationStore(
    (state) => state.startInclusive
  );
  const endInclusive = useTracksExplorationStore((state) => state.endInclusive);
  const filterParams = useMemo(() => {
    return {
      regionNames,
      startInclusive,
      endInclusive,
    };
  }, [regionNames, startInclusive, endInclusive]);
  const xFeature = useTracksExplorationStore((state) => state.xFeature);
  const yFeature = useTracksExplorationStore((state) => state.yFeature);
  const setXFeature = useTracksExplorationStore((state) => state.setXFeature);
  const setYFeature = useTracksExplorationStore((state) => state.setYFeature);

  const trackXYData = api.tracks.getTrackXY.useQuery(
    { ...filterParams, xFeature, yFeature },
    {
      keepPreviousData: true,
    }
  );
  const [hoveredDatapointIdx, setHoveredDatapointIdx] = useState<number | null>(
    null
  );
  const hoveredTrackID = useMemo(() => {
    if (hoveredDatapointIdx === null) return null;
    return trackXYData.data?.[hoveredDatapointIdx]?.id ?? null;
  }, [hoveredDatapointIdx, trackXYData.data]);
  const trackMetadata = api.tracks.getTrackMetadataForIds.useQuery({
    trackIds: hoveredTrackID ? [hoveredTrackID] : [],
  });
  const hoveredTrackTooltipContent = useMemo(() => {
    if (!hoveredTrackID) return "";
    const data = trackMetadata.data;
    if (!data) return <div>Loading metadata...</div>;
    const metadata = data[hoveredTrackID];
    if (!metadata) return <div>Track metadata not found</div>;
    return <div>{metadata.name}</div>;
  }, [trackMetadata.data, hoveredTrackID]);

  const handlePointHover = useCallback(
    (datapointIdx: number) => {
      setHoveredDatapointIdx(datapointIdx);
    },
    [setHoveredDatapointIdx]
  );
  const handlePointClick = useCallback(
    (datapointIdx: number) => {
      console.log(datapointIdx !== hoveredDatapointIdx);
      if (datapointIdx !== hoveredDatapointIdx) {
        setHoveredDatapointIdx(datapointIdx);
      }
    },
    [hoveredDatapointIdx]
  );
  const handlePointUnhover = useCallback(() => {
    setHoveredDatapointIdx(null);
  }, [setHoveredDatapointIdx]);

  const xAxisConfig: AxisConfig = useMemo(() => {
    const trackData = trackXYData.data;
    if (trackData === undefined) return { data: [], featureName: "(no data)" };
    return getDisplayDataForAxis("x", xFeature, trackData);
  }, [xFeature, trackXYData.data]);

  const yAxisConfig: AxisConfig = useMemo(() => {
    const trackData = trackXYData.data;
    if (trackData === undefined) return { data: [], featureName: "(no data)" };
    return getDisplayDataForAxis("y", yFeature, trackData);
  }, [yFeature, trackXYData.data]);

  if (trackXYData.isError) {
    return <div>Error loading data, please try refreshing the page.</div>;
  }

  const plotArea =
    trackXYData.isPreviousData || trackXYData.isLoading ? (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2">
        <span>{trackXYData.isLoading ? "Loading data..." : "Updating..."}</span>
        <CircularProgress />
      </div>
    ) : (
      <div data-tip="" className="h-full w-full">
        <Scatterplot
          darkMode
          margins={{ right: 1, top: 0 }}
          className="h-full w-full fill-white" // fill sets color of SVG <text> elements for axis labels
          xAxis={xAxisConfig}
          yAxis={yAxisConfig}
          onPointHoverStart={handlePointHover}
          onPointHoverEnd={handlePointUnhover}
          onPointClick={handlePointClick}
        />
        <ReactTooltip>{hoveredTrackTooltipContent}</ReactTooltip>
      </div>
    );

  return (
    <>
      <div>
        <h2 className="mb-2 text-3xl font-bold">Explore relationships</h2>
        <p className="my-2">
          This scatterplot contains all the tracks in the dataset matching the
          filter criteria (for now, only country filtering is supported).
        </p>
        <div className="flex w-full gap-2">
          <BasicSelect
            className="w-full"
            label="x-axis attribute"
            value={xFeature}
            onChange={(newValue: string) =>
              setXFeature(newValue as NumericTrackFeatureName)
            }
            options={numericTrackFeatures.map((o) => ({
              value: o,
              label: getFeatureLabel(o),
            }))}
          />
          <BasicSelect
            className="w-full"
            label="y-axis attribute"
            value={yFeature}
            onChange={(newValue: string) =>
              setYFeature(newValue as NumericTrackFeatureName)
            }
            options={numericTrackFeatures.map((o) => ({
              value: o,
              label: getFeatureLabel(o),
            }))}
          />
        </div>
      </div>
      <div className="row-span-5">{plotArea}</div>
    </>
  );
};

function getDisplayDataForAxis(
  axis: "x" | "y",
  featureName: NumericTrackFeatureName,
  trackData: TrackData
): AxisConfig {
  const data = trackData.map((d) => d[axis]);
  return {
    data,
    featureName: getFeatureLabel(featureName),
    beginAtZero: !["tempo", "durationMs", "isrcYear"].includes(featureName),
    tickFormat: getFeatureTickFormat(featureName),
  };
}

function getFeatureLabel(featureName: NumericTrackFeatureName) {
  switch (featureName) {
    case "isrcYear":
      return "Year recorded";
    case "durationMs":
      return "Duration (min:sec)";
    case "tempo":
      return "Tempo (BPM)";
    default:
      return capitalizeFirstLetter(featureName);
  }
}

function getFeatureTickFormat(featureName: NumericTrackFeatureName) {
  switch (featureName) {
    case "isrcYear":
      return (d: number) => d.toString();
    case "durationMs":
      return (d: number) => millisecondsToMinutesAndSeconds(d);
    default:
      return undefined;
  }
}

function millisecondsToMinutesAndSeconds(ms: number) {
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}:${seconds.padStart(2, "0")}`;
}

export default SpotifyTrackDataScatterPlot;
