import dayjs from "dayjs";
import { create } from "zustand";
import { divergingColors } from "~/utils/misc";

type TrackComparisonFilterState = {
  startInclusive?: Date;
  endInclusive?: Date;
  region: string;
  comparisonTrackDisplayData: { id: string; color: string }[];
  availableColors: string[];
  addComparisonTrackId: (id: string) => void;
  removeComparisonTrackId: (id: string) => void;
  clearComparisonTrackIds: () => void; // TODO: not used atm, maybe remove
  setStartInclusive: (date?: Date) => void;
  setEndInclusive: (date?: Date) => void;
  setRegion: (region?: string) => void;
};

export const useTrackComparisonFilterStore =
  create<TrackComparisonFilterState>()((set) => ({
    comparisonTrackDisplayData: [],
    availableColors: [...divergingColors],
    startInclusive: dayjs("2021-01-01").toDate(),
    endInclusive: dayjs("2021-12-31").toDate(),
    region: "Global",
    addComparisonTrackId(id) {
      set((state) => {
        if (state.comparisonTrackDisplayData.map((d) => d.id).includes(id)) {
          return state;
        }
        const color = state.availableColors.shift() || generateRandomColor();
        const comparisonTrackDisplayData = [
          ...state.comparisonTrackDisplayData,
          { id, color },
        ];
        return { comparisonTrackDisplayData };
      });
    },
    removeComparisonTrackId(id) {
      set((state) => {
        const comparisonTrackDisplayData =
          state.comparisonTrackDisplayData.filter((d) => d.id !== id);

        const color = state.comparisonTrackDisplayData.find(
          (d) => d.id === id
        )?.color;
        if (color) {
          state.availableColors.unshift(color);
        }
        return { comparisonTrackDisplayData };
      });
    },
    clearComparisonTrackIds() {
      set({
        comparisonTrackDisplayData: [],
        availableColors: [...divergingColors],
      });
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

function generateRandomColor() {
  return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
}

export function useComparisonTrackIds() {
  const comparisonTrackData = useTrackComparisonFilterStore(
    (state) => state.comparisonTrackDisplayData
  );
  const comparisonTrackIds = comparisonTrackData.map((d) => d.id);
  return comparisonTrackIds;
}

export function useComparisonTrackColors() {
  const comparisonTrackData = useTrackComparisonFilterStore(
    (state) => state.comparisonTrackDisplayData
  );
  const comparisonTrackColorsMap = comparisonTrackData.reduce(
    (acc, { id, color }) => {
      acc[id] = color;
      return acc;
    },
    {} as Record<string, string>
  );
  return comparisonTrackColorsMap;
}
