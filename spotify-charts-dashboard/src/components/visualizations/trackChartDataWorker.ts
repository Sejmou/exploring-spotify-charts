import type { ScatterPlotWorkerMessage } from "./SpotifyTrackDataScatterPlot";

function randomSubset<T>(array: T[], size: number) {
  const shuffled = array.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, size);
}

addEventListener("message", (event: MessageEvent<ScatterPlotWorkerMessage>) => {
  const { trackData } = event.data;
  const { trackIds } = event.data.filters;
  const data = trackIds
    ? trackData.filter((t) => trackIds.includes(t.id))
    : trackData;
  postMessage(randomSubset(data, 3000));
});
