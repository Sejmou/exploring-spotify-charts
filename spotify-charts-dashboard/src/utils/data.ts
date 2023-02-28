import type { Track } from "@prisma/client";
import type { PickByType } from "../server/utils";
import { capitalizeFirstLetter } from "./misc";

export type NumericTrackFeatures = PickByType<Track, number>;
export type NumericTrackFeatureName = keyof NumericTrackFeatures;

export const numericTrackFeatures = [
  "acousticness",
  "danceability",
  "energy",
  "instrumentalness",
  "liveness",
  "speechiness",
  "valence",
  "tempo",
  "durationMs",
  "loudness",
  "isrcYear",
] as const satisfies readonly NumericTrackFeatureName[];

export function getFeatureLabel(featureName: NumericTrackFeatureName) {
  if (featureName === "isrcYear") return "Year recorded";
  if (featureName === "durationMs") return "Duration (ms)";
  if (featureName === "tempo") return "Tempo (BPM)";
  return capitalizeFirstLetter(featureName);
}
