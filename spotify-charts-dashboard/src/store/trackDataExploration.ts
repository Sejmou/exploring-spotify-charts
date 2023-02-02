import { create } from "zustand";
import type { RouterOutputs } from "../utils/api";

type TrackData = RouterOutputs["tracks"]["getTrackData"][0];

type TrackDataState = {
  trackData: TrackData[];
  setTrackData: (data: TrackData[]) => void;
};

export const useTrackDataExplorationStore = create<TrackDataState>()((set) => ({
  trackData: [],
  setTrackData(data) {
    set({ trackData: data });
  },
}));
