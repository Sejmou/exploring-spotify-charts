export function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function truncate(input: string, maxTotalLength = 20) {
  if (input.length > maxTotalLength - 3) {
    return input.substring(0, maxTotalLength - 3) + "...";
  }
  return input;
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
