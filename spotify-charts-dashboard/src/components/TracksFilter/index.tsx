import { api } from "../../utils/api";
import TrackInfo from "./TrackInfo";
import { divergingColors } from "../../pages/viz";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { useState } from "react";
import { Button, Dialog, IconButton } from "@mui/material";
import BasicTrackInfo from "./BasicTrackInfo";

type Props = {
  trackIds: string[];
  onRemove: (trackId: string) => void;
  onHide: (trackId: string) => void;
  className?: string;
};

const TracksFilter = ({ trackIds, onRemove, className }: Props) => {
  const [expanded, setExpanded] = useState(false);

  const tracks = api.tracks.getTrackData.useQuery(
    { trackIds },
    { enabled: trackIds.length > 0, keepPreviousData: true }
  ); // TODO: cleaner solution (useMutation etc.)

  if (tracks.status === "loading") {
    return <div>Loading...</div>;
  }

  if (tracks.status === "error") {
    return <div>Error: {tracks.error.message}</div>;
  }

  const trackData = tracks.data;

  return (
    <div className="flex w-full gap-2">
      <div className="self-center">Tracks:</div>
      <div className="flex">
        <>
          {trackData.map((t, i) => {
            return (
              <BasicTrackInfo
                key={t.id}
                onRemove={onRemove}
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
              <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-white">
                Track Details
              </h1>
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
                    genres={t.genres}
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
    </div>
  );
};

export default TracksFilter;
