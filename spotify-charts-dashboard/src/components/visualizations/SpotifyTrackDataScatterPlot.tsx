import { CircularProgress } from "@mui/material";
import { color } from "d3";
import { api } from "../../utils/api";
import ScatterPlot from "./ScatterPlot";
import { useEffect, useMemo, useRef, useState } from "react";
import type { RouterOutputs } from "../../utils/api";
import BasicSelect from "../filtering-and-selecting/BasicSelect";
import { capitalizeFirstLetter, truncate } from "../../utils/misc";
import { useTracksExplorationStore } from "../../store/trackDataExploration";
import { numericTrackFeatures } from "../../utils/data";
import type { NumericTrackFeatureName } from "../../utils/data";

export type ScatterPlotWorkerMessage = {
  trackData: RouterOutputs["tracks"]["getTrackXY"];
  filters: {
    trackIds?: string[];
  };
};

export type ScatterPlotWorkerResponse = RouterOutputs["tracks"]["getTrackXY"];

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
  const trackMetadata = api.tracks.getTrackMetadata.useQuery(filterParams);

  const datapointsToPlot = useTracksExplorationStore(
    (state) => state.datapointsToPlot
  );
  const setDatapointsToPlot = useTracksExplorationStore(
    (state) => state.setDatapointsToPlot
  );

  console.log({
    plotData: trackXYData.data,
    trackMetadata: trackMetadata.data,
  });

  const workerRef = useRef<Worker>();

  useEffect(() => {
    workerRef.current = new Worker(
      new URL("./trackChartDataWorker.ts", import.meta.url)
    );
    workerRef.current.onmessage = (
      event: MessageEvent<ScatterPlotWorkerResponse>
    ) => {
      console.log("got message from worker", event.data);
      setDatapointsToPlot(event.data);
    };
    return () => {
      workerRef.current?.terminate();
    };
  }, [setDatapointsToPlot]);

  useEffect(() => {
    const xyData = trackXYData.data;
    if (!xyData) {
      setDatapointsToPlot([]);
      return;
    }
    if (xyData.length < 3000) {
      setDatapointsToPlot(xyData);
      return;
    }
    workerRef.current?.postMessage({
      trackData: xyData,
    }); // tell the worker to process the data as we don't want to block the UI thread
  }, [trackXYData.data, setDatapointsToPlot]);

  if (trackXYData.isError) {
    return <div>Error loading data, please try refreshing the page.</div>;
  }

  const plotArea =
    trackXYData.isStale || trackXYData.isLoading ? (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2">
        <span>{trackXYData.isLoading && "Loading data..."}</span>
        <CircularProgress />
      </div>
    ) : (
      <ScatterPlot
        datasets={[
          {
            data: datapointsToPlot.map((track) => {
              return {
                x: track.x,
                y: track.y,
              };
            }),
            backgroundColor: pointColor,
          },
        ]}
        xAttr={capitalizeFirstLetter(xFeature)}
        yAttr={capitalizeFirstLetter(yFeature)}
        beginAtZero={true}
        getLabel={(_, dataIdx) => {
          const metadata = trackMetadata.data;
          if (!metadata) {
            return "loading metadata...";
          }
          const dataForTrack = metadata[dataIdx];
          if (!dataForTrack) {
            return "Could not find metadata :/";
          }
          return [
            `"${truncate(dataForTrack.name, 30)}"`,
            `by ${truncate(
              dataForTrack.featuringArtists[0]?.name ?? "Unknown Artist",
              30
            )}`,
            `${dataForTrack.genres[0]?.label ?? "Unknown Genre"}`,
          ];
        }}
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
