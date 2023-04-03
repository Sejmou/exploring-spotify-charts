import dayjs from "dayjs";
import { create } from "zustand";
import type { RouterOutputs } from "../utils/api";
import { numericTrackFeatures } from "../utils/data";
import type { NumericTrackFeatureName } from "../utils/data";

type TrackIDsAndXYs = RouterOutputs["tracks"]["getTrackXY"][0];

type TracksExplorationState = {
  datapointsToPlot: TrackIDsAndXYs[];
  setDatapointsToPlot: (data: TrackIDsAndXYs[]) => void;
  xFeature: NumericTrackFeatureName;
  yFeature: NumericTrackFeatureName;
  setXFeature: (feature: NumericTrackFeatureName) => void;
  setYFeature: (feature: NumericTrackFeatureName) => void;
  startInclusive?: Date;
  endInclusive?: Date;
  regionNames?: string[];
  addRegionName: (name: string) => void;
  removeRegionName: (name: string) => void;
  setStartInclusive: (date?: Date) => void;
  setEndInclusive: (date?: Date) => void;
};

export const useTracksExplorationStore = create<TracksExplorationState>()(
  (set) => ({
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
          regionNames:
            countryNamesNew.length == 0 ? undefined : countryNamesNew,
        };
      });
    },
    setEndInclusive(date) {
      set({ endInclusive: date });
    },
    setStartInclusive(date) {
      set({ startInclusive: date });
    },
  })
);
