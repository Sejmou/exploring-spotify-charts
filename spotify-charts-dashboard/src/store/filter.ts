import dayjs from "dayjs";
import { create } from "zustand";

type FilterState = {
  startInclusive?: Date;
  endInclusive?: Date;
  region: string;
  trackIds: string[];
  addTrackId: (id: string) => void;
  removeTrackId: (id: string) => void;
  clearTrackIds: () => void;
  setStartInclusive: (date?: Date) => void;
  setEndInclusive: (date?: Date) => void;
  setRegion: (region?: string) => void;
};

export const useFilterStore = create<FilterState>()((set) => ({
  trackIds: [],
  startInclusive: dayjs("2021-01-01").toDate(),
  endInclusive: dayjs("2021-12-31").toDate(),
  region: "Global",
  addTrackId(id) {
    set((state) => {
      const trackIds = [...state.trackIds, id];
      return { trackIds };
    });
  },
  removeTrackId(id) {
    set((state) => {
      const trackIds = state.trackIds.filter((trackId) => trackId !== id);
      return { trackIds };
    });
  },
  clearTrackIds() {
    set({ trackIds: [] });
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
