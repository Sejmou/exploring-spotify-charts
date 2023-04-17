import type { Track } from "~/server/drizzle/schema";
import type { PickByType } from "~/server/utils";
import { capitalizeFirstLetter, millisecondsToMinutesAndSeconds } from "./misc";

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
  switch (featureName) {
    case "isrcYear":
      return "Year recorded";
    case "durationMs":
      return "Duration (min:sec)";
    case "tempo":
      return "Tempo (BPM)";
    default:
      return capitalizeFirstLetter(featureName);
  }
}

export function getFeatureDataFormat(featureName: NumericTrackFeatureName) {
  switch (featureName) {
    case "isrcYear":
      return (d: number) => d.toString();
    case "durationMs":
      return (d: number) => millisecondsToMinutesAndSeconds(d);
    default:
      return undefined;
  }
}

export function javaScriptDateToMySQLDateTime(date: Date) {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

export function javaScriptDateToMySQLDate(date: Date) {
  return date.toISOString().slice(0, 10);
}
