import { CircularProgress } from "@mui/material";
import { api } from "../../../utils/api";
import { useCallback, useMemo, useState } from "react";
import BasicSelect from "../../filtering-and-selecting/BasicSelect";
import SelectedTrackInfoDialog from "./SelectedTrackInfoDialog";

import { useTracksExplorationStore } from "../../../store/trackDataExploration";
import {
  getFeatureDataFormat,
  getFeatureLabel,
  numericTrackFeatures,
} from "../../../utils/data";
import type { NumericTrackFeatureName } from "../../../utils/data";

import dynamic from "next/dynamic";
const Scatterplot = dynamic(() => import("react-big-dataset-scatterplot"), {
  ssr: false,
});
const ReactTooltip = dynamic(() => import("react-tooltip"), {
  ssr: false,
});

import type { RouterOutputs } from "../../../utils/api";
import type {
  AxisConfig,
  VertexColorEncodingConfig,
} from "react-big-dataset-scatterplot";

type TrackData = RouterOutputs["tracks"]["getXYDataForIds"];

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

  const trackXYData = api.tracks.getXYDataForIds.useQuery(
    { ...filterParams, xFeature, yFeature },
    {
      keepPreviousData: true,
    }
  );
  const [activeDatapointIdx, setActiveDatapointIdx] = useState<number | null>(
    null
  );
  const hoveredTrackID = useMemo(() => {
    if (activeDatapointIdx === null) return null;
    return trackXYData.data?.[activeDatapointIdx]?.id ?? null;
  }, [activeDatapointIdx, trackXYData.data]);
  const trackMetadata = api.tracks.getMetadataForIds.useQuery({
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
      setActiveDatapointIdx(datapointIdx);
    },
    [setActiveDatapointIdx]
  );
  const handlePointClick = useCallback(
    (datapointIdx: number) => {
      console.log("clicked", datapointIdx);
      if (datapointIdx === activeDatapointIdx) {
        setActiveDatapointIdx(datapointIdx);
        setTrackInfoDialogOpen(true);
      }
    },
    [activeDatapointIdx]
  );

  console.log({ activeDatapointIdx });

  const handlePointUnhover = useCallback(() => {
    setActiveDatapointIdx(null);
  }, [setActiveDatapointIdx]);

  const [trackInfoDialogOpen, setTrackInfoDialogOpen] = useState(false);
  const handlePointTap = useCallback((datapointIdx: number) => {
    setActiveDatapointIdx(datapointIdx);
    setTrackInfoDialogOpen(true);
  }, []);
  const handleDialogClose = useCallback(() => {
    setTrackInfoDialogOpen(false);
    if (activeDatapointIdx !== null) {
      setActiveDatapointIdx(null);
    }
  }, [activeDatapointIdx]);

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

  const colorEncodings: VertexColorEncodingConfig | undefined = useMemo(() => {
    if (trackXYData.data === undefined) return;
    const spotifyGreen = "#1DB954";
    const notMatchingColor = "#6d6d6d";
    return {
      mode: "color-encodings",
      featureNameHeading: "Matching filter",
      data: trackXYData.data.map((track) => {
        return track.matching ? "Yes" : "No";
      }),
      encodings: [
        ["Yes", spotifyGreen],
        ["No", notMatchingColor],
      ],
    };
  }, [trackXYData.data]);

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
      <div data-tip="" className="plot-container h-full w-full flex-1">
        <Scatterplot
          darkMode
          margins={{ right: 1, top: colorEncodings ? 8 : 0 }}
          xAxis={xAxisConfig}
          yAxis={yAxisConfig}
          onPointHoverStart={handlePointHover}
          onPointHoverEnd={handlePointUnhover}
          onPointClick={handlePointClick}
          onPointTap={handlePointTap}
          color={colorEncodings}
        />
        <ReactTooltip>{hoveredTrackTooltipContent}</ReactTooltip>
      </div>
    );

  return (
    <div className="flex h-full w-full flex-col gap-2">
      <div className="flex w-full flex-col gap-2 md:flex-row">
        <p>
          Discover how track features differ between tracks. Click/tap any
          datapoint for details.
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
      {plotArea}
      {hoveredTrackID && (
        <SelectedTrackInfoDialog
          trackId={hoveredTrackID}
          open={trackInfoDialogOpen}
          onClose={handleDialogClose}
        />
      )}
    </div>
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
    tickFormat: getFeatureDataFormat(featureName),
  };
}

export default SpotifyTrackDataScatterPlot;
