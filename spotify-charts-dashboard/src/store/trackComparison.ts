import dayjs from "dayjs";
import { create } from "zustand";

type TrackComparisonFilterState = {
  startInclusive?: Date;
  endInclusive?: Date;
  region: string;
  comparisonTrackIds: string[];
  addComparisonTrackId: (id: string) => void;
  removeComparisonTrackId: (id: string) => void;
  clearComparisonTrackIds: () => void; // TODO: not used atm, maybe remove
  setStartInclusive: (date?: Date) => void;
  setEndInclusive: (date?: Date) => void;
  setRegion: (region?: string) => void;
};

export const useTrackComparisonFilterStore =
  create<TrackComparisonFilterState>()((set) => ({
    comparisonTrackIds: [],
    startInclusive: dayjs("2021-01-01").toDate(),
    endInclusive: dayjs("2021-12-31").toDate(),
    region: "Global",
    addComparisonTrackId(id) {
      set((state) => {
        if (state.comparisonTrackIds.includes(id)) {
          return state;
        }
        const comparisonTrackIds = [...state.comparisonTrackIds, id];
        return { comparisonTrackIds };
      });
    },
    removeComparisonTrackId(id) {
      set((state) => {
        const comparisonTrackIds = state.comparisonTrackIds.filter(
          (trackId) => trackId !== id
        );
        return { comparisonTrackIds };
      });
    },
    clearComparisonTrackIds() {
      set({ comparisonTrackIds: [] });
    },
    setEndInclusive(date) {
      set({ endInclusive: date });
    },

    setStartInclusive(date) {
      set({ startInclusive: date });
    },
    setRegion(region) {
      set({ region });
    },
  }));
