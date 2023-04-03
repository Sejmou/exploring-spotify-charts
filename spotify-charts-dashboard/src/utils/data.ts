import type { Track } from "@prisma/client";
import type { PickByType } from "../server/utils";

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
