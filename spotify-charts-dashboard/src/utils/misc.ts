export function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function truncate(input: string, maxLength = 20) {
  if (input.length > maxLength) {
    return input.substring(0, maxLength) + "...";
  }
  return input;
}
