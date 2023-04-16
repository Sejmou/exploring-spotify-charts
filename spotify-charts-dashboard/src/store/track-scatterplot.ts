import type { StateCreator } from "zustand";
import type { RouterOutputs } from "../utils/api";
import { numericTrackFeatures } from "../utils/data";
import type { NumericTrackFeatureName } from "../utils/data";
import type { StoreState } from ".";

type TrackIDsAndXYs = RouterOutputs["tracks"]["getXYDataForIds"][0];

export type TracksScatterplotState = {
  datapointsToPlot: TrackIDsAndXYs[];
  setDatapointsToPlot: (data: TrackIDsAndXYs[]) => void;
  xFeature: NumericTrackFeatureName;
  yFeature: NumericTrackFeatureName;
  setXFeature: (feature: NumericTrackFeatureName) => void;
  setYFeature: (feature: NumericTrackFeatureName) => void;
};

export const createScatterplotSlice: StateCreator<
  StoreState,
  [],
  [],
  TracksScatterplotState
> = (set) => ({
  datapointsToPlot: [],
  setDatapointsToPlot(data) {
    set({ datapointsToPlot: data });
  },
  xFeature: numericTrackFeatures[0],
  setXFeature(feature) {
    set({ xFeature: feature });
  },
  yFeature: numericTrackFeatures[1],
  setYFeature(feature) {
    set({ yFeature: feature });
  },
});
