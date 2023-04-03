import { api } from "../utils/api";
import TrackInfo from "./TrackDetails";
import { divergingColors } from "../utils/misc";
import { useMemo, useState } from "react";
import { Button } from "@mui/material";
import BasicTrackInfo from "./BasicTrackInfo";
import { useTrackComparisonFilterStore } from "../store/trackComparison";
import DialogWithCloseIcon from "./DialogWithCloseIcon";

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

  const trackData = useMemo(() => {
    if (!tracks.data) {
      return [];
    }
    const dataComplete = trackIds.every((id) => id in tracks.data);
    if (!dataComplete) {
      return [];
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return trackIds.map((id) => ({ id, ...tracks.data[id]! }));
  }, [tracks.data, trackIds]);

  if (tracks.isFetching) {
    return (
      <div className="flex h-10">
        <span className="self-center">Loading...</span>
      </div>
    );
  }

  if (trackData.length === 0) {
    return (
      <div className="flex h-10">
        <span className="self-center">
          Please add at least one track whose data you wish to explore.
        </span>
      </div>
    );
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
          <DialogWithCloseIcon
            open={expanded}
            onClose={() => setExpanded(false)}
            fullWidth={true}
            maxWidth="lg"
            title="Track Details"
          >
            <div className="bg-[#121212] p-4 ">
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
          </DialogWithCloseIcon>
        </>
      </div>
      <Button onClick={() => setExpanded((prev) => !prev)}>Details</Button>
      <Button onClick={clearTrackIds}>Clear All</Button>
    </div>
  );
};

export default SelectedTracksInfoAndLegend;
