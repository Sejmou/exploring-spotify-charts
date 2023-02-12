import { api } from "../utils/api";
import TrackInfo from "./TrackDetails";
import { divergingColors } from "../utils/misc";
import { useState } from "react";
import { Button, Dialog } from "@mui/material";
import BasicTrackInfo from "./BasicTrackInfo";
import { useTrackComparisonFilterStore } from "../store/trackComparison";

const SelectedTracksInfoAndLegend = () => {
  const [expanded, setExpanded] = useState(false);
  const trackIds = useTrackComparisonFilterStore(
    (state) => state.comparisonTrackIds
  );
  const removeTrackId = useTrackComparisonFilterStore(
    (state) => state.removeComparisonTrackId
  );
  const clearTrackIds = useTrackComparisonFilterStore(
    (state) => state.clearComparisonTrackIds
  );

  const tracks = api.tracks.getTrackMetadataForIds.useQuery(
    { trackIds },
    { keepPreviousData: true }
  );

  if (tracks.status === "loading") {
    return <div>Loading...</div>;
  }

  if (tracks.status === "error") {
    return <div>Error: {tracks.error.message}</div>;
  }

  const trackData = tracks.data;

  if (trackData.length === 0) {
    return <div></div>;
  }

  return (
    <div className="flex w-full flex-wrap gap-2">
      <div className="self-center">Tracks:</div>
      <div className="flex">
        <>
          {trackData.map((t, i) => {
            return (
              <BasicTrackInfo
                key={t.id}
                onRemove={removeTrackId}
                trackId={t.id}
                color={divergingColors[i] || "white"}
                artists={t.featuringArtists.map((a) => a.name)}
                trackTitle={t.name}
              />
            );
          })}
          <Dialog
            open={expanded}
            onClose={() => setExpanded(false)}
            fullWidth={true}
            maxWidth="lg"
          >
            <div className="bg-[#121212] p-4 ">
              <div className="mb-4 flex gap-2">
                <h1 className="text-4xl font-extrabold tracking-tight text-white">
                  Track Details
                </h1>
                <div className="self-center">
                  <Button onClick={() => setExpanded(false)}>Close</Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-2">
                {trackData.map((t, i) => (
                  <TrackInfo
                    key={t.id}
                    trackId={t.id}
                    trackTitle={t.name}
                    artists={t.featuringArtists.map((a) => a.name)}
                    albumTitle={t.album.name}
                    releaseDate={t.album.releaseDate}
                    releaseType={t.album.type}
                    genres={t.genres.map((g) => g.label)}
                    label={t.album.label}
                    albumCoverUrl={t.album.thumbnailUrl}
                    color={divergingColors[i]}
                    previewUrl={t.previewUrl}
                  />
                ))}
              </div>
            </div>
          </Dialog>
        </>
      </div>
      <Button onClick={() => setExpanded((prev) => !prev)}>Details</Button>
      <Button onClick={clearTrackIds}>Clear All</Button>
    </div>
  );
};

export default SelectedTracksInfoAndLegend;
