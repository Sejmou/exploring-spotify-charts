export function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function truncate(input: string, maxTotalLength = 20) {
  if (input.length > maxTotalLength - 3) {
    return input.substring(0, maxTotalLength - 3) + "...";
  }
  return input;
}

export function millisecondsToMinutesAndSeconds(ms: number) {
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}:${seconds.padStart(2, "0")}`;
}

export const divergingColors = [
  "#7fc97f",
  "#beaed4",
  "#fdc086",
  "#ffff99",
  "#386cb0",
  "#f0027f",
  "#bf5b17",
  "#666666",
] as const;
