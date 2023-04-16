import type { StateCreator } from "zustand";
import { divergingColors } from "~/utils/misc";
import type { StoreState } from ".";
import { useChartsStore } from ".";

export type TrackComparisonState = {
  comparisonTrackDisplayData: { id: string; color: string }[];
  availableColors: string[];
  addComparisonTrackId: (id: string) => void;
  removeComparisonTrackId: (id: string) => void;
  clearComparisonTrackIds: () => void; // TODO: not used atm, maybe remove
};

export const createTrackComparisonSlice: StateCreator<
  StoreState,
  [],
  [],
  TrackComparisonState
> = (set) => ({
  comparisonTrackDisplayData: [],
  availableColors: [...divergingColors],
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
});

function generateRandomColor() {
  return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
}

export function useComparisonTrackIds() {
  const comparisonTrackData = useChartsStore(
    (state) => state.comparisonTrackDisplayData
  );
  const comparisonTrackIds = comparisonTrackData.map((d) => d.id);
  return comparisonTrackIds;
}

export function useComparisonTrackColors() {
  const comparisonTrackData = useChartsStore(
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
