import { api } from "../../utils/api";
import TrackInfo from "./TrackInfo";
import { divergingColors } from "../../pages/viz";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { useState } from "react";
import { IconButton } from "@mui/material";
import BasicTrackInfo from "./BasicTrackInfo";

type Props = {
  trackIds: string[];
  onRemove: (trackId: string) => void;
  onHide: (trackId: string) => void;
};

const TracksFilter = ({ trackIds, onRemove }: Props) => {
  const [expanded, setExpanded] = useState(true);

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

  const items = expanded ? (
    <div className="grid flex-1 grid-cols-2 gap-4 lg:grid-cols-4">
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
          onRemove={(trackId) => onRemove(trackId)}
        />
      ))}
    </div>
  ) : (
    <div className="flex">
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
    </div>
  );

  return (
    <div className="flex w-full">
      <div>
        <IconButton onClick={() => setExpanded((prev) => !prev)}>
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </div>
      {items}
    </div>
  );
};

export default TracksFilter;
