import { CircularProgress } from "@mui/material";
import { color } from "d3";
import { api } from "../../utils/api";
import { useCallback, useMemo, useState } from "react";
import type { RouterOutputs } from "../../utils/api";
import BasicSelect from "../filtering-and-selecting/BasicSelect";
import { capitalizeFirstLetter, truncate } from "../../utils/misc";
import { useTracksExplorationStore } from "../../store/trackDataExploration";
import { numericTrackFeatures } from "../../utils/data";
import type { NumericTrackFeatureName } from "../../utils/data";

import dynamic from "next/dynamic";
const Scatterplot = dynamic(
  () => import("react-large-scale-data-scatterplot"),
  {
    ssr: false,
  }
);

import type {
  AxisConfig,
  ColorEncodingConfig,
} from "react-large-scale-data-scatterplot";

type TrackData = RouterOutputs["tracks"]["getTrackMetadataForIds"][0] &
  RouterOutputs["tracks"]["getTrackXY"][0];

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const pointColorObj = color("#1ED760")!;
pointColorObj.opacity = 0.2;
const pointColor = pointColorObj.toString();

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
  const trackMetadata = api.tracks.getTrackMetadata.useQuery();

  const [activeDatapointIdx, setActiveDatapointIdx] = useState<number>();
  const [activeDatapoint, setActiveDatapoint] = useState<TrackData>();
  const activeDatapointTooltip = useMemo(() => {
    if (!activeDatapoint) return <div></div>;
    return (
      <div>
        <div>Track: {activeDatapoint.name}</div>
      </div>
    );
  }, [activeDatapoint]);

  const handlePointHoverStart = useCallback(
    (idx: number) => {
      setActiveDatapointIdx(idx);
    },
    [setActiveDatapointIdx]
  );
  const handlePointClick = useCallback(
    (idx: number) => {
      alert(`clicked ${idx}`);
      alert(JSON.stringify(activeDatapoint));
    },
    [activeDatapoint, setActiveDatapoint]
  );
  const handlePointHoverEnd = useCallback(() => {
    setActiveDatapointIdx(undefined);
  }, [setActiveDatapointIdx]);

  const xAxisConfig: AxisConfig = useMemo(() => {
    return {
      data: trackXYData.data?.map((track) => track.x) ?? [],
      featureName: capitalizeFirstLetter(xFeature),
      beginAtZero: !["tempo", "durationMs", "isrcYear"].includes(xFeature),
    };
  }, [xFeature, trackXYData.data]);

  const yAxisConfig: AxisConfig = useMemo(() => {
    return {
      data: trackXYData.data?.map((track) => track.y) ?? [],
      featureName: capitalizeFirstLetter(yFeature),
      beginAtZero: !["tempo", "durationMs", "isrcYear"].includes(yFeature),
    };
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
      <Scatterplot
        className="h-full w-full"
        xAxis={xAxisConfig}
        yAxis={yAxisConfig}
      />
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
              label: capitalizeFirstLetter(o),
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
              label: capitalizeFirstLetter(o),
            }))}
          />
        </div>
      </div>
      <div className="row-span-5">{plotArea}</div>
    </>
  );
};

export default SpotifyTrackDataScatterPlot;
