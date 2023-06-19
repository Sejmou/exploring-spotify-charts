import { create } from "zustand";
import type { FilterState } from "./filters";
import { createFilterSlice } from "./filters";
import type { TracksScatterplotState } from "./track-scatterplot";
import { createScatterplotSlice } from "./track-scatterplot";
import type { TrackComparisonState } from "./track-comparison";
import { createTrackComparisonSlice } from "./track-comparison";

export type StoreState = FilterState &
  TrackComparisonState &
  TracksScatterplotState;

export const useChartsStore = create<StoreState>()((...a) => ({
  ...createFilterSlice(...a),
  ...createTrackComparisonSlice(...a),
  ...createScatterplotSlice(...a),
}));
