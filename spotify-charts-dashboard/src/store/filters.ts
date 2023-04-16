import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import type { StateCreator } from "zustand";
import type { StoreState } from ".";

export type FilterState = {
  day: Dayjs;
  setDay: (day: Dayjs) => void;

  region: string;
  setRegion: (region: string) => void;

  startInclusive?: Date;
  setStartInclusive: (date?: Date) => void;

  endInclusive?: Date;
  setEndInclusive: (date?: Date) => void;

  regionNames?: string[];
  addRegionName: (name: string) => void;
  removeRegionName: (name: string) => void;
};

export const createFilterSlice: StateCreator<
  StoreState,
  [],
  [],
  FilterState
> = (set) => ({
  day: dayjs("2021-01-01"),
  region: "Global",
  setDay(day) {
    set({ day });
  },
  setRegion(region) {
    set({ region });
  },
  startInclusive: dayjs("2021-01-01").toDate(),
  endInclusive: dayjs("2021-12-31").toDate(),
  regionNames: undefined,
  addRegionName(name) {
    set((state) => {
      if (state.regionNames?.includes(name)) {
        return state;
      }
      const regionNames = [...(state.regionNames || []), name];
      return { regionNames };
    });
  },
  removeRegionName(name) {
    set((state) => {
      const countryNamesNew = state.regionNames?.filter(
        (countryName) => countryName !== name
      );
      if (countryNamesNew === undefined) {
        return { regionNames: undefined };
      }

      return {
        regionNames: countryNamesNew.length == 0 ? undefined : countryNamesNew,
      };
    });
  },
  setEndInclusive(date) {
    set({ endInclusive: date });
  },
  setStartInclusive(date) {
    set({ startInclusive: date });
  },
});
