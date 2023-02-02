import dayjs from "dayjs";
import { create } from "zustand";

type FilterState = {
  startInclusive?: Date;
  endInclusive?: Date;
  region: string;
  trackIds: string[];
  countryNames?: string[];
  addCountryName: (name: string) => void;
  removeCountryName: (name: string) => void;
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
  countryNames: undefined,
  addTrackId(id) {
    set((state) => {
      if (state.trackIds.includes(id)) {
        return state;
      }
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
  addCountryName(name) {
    set((state) => {
      if (state.countryNames?.includes(name)) {
        return state;
      }
      const countryNames = [...(state.countryNames || []), name];
      return { countryNames };
    });
  },
  removeCountryName(name) {
    set((state) => {
      const countryNamesNew = state.countryNames?.filter(
        (countryName) => countryName !== name
      );
      if (countryNamesNew === undefined) {
        return { countryNames: undefined };
      }

      return {
        countryNames: countryNamesNew.length == 0 ? undefined : countryNamesNew,
      };
    });
  },
}));
