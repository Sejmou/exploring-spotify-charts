import { api } from "../../utils/api";
import TrackInfo from "./TrackInfo";
import { divergingColors } from "../../pages/viz";

type Props = {
  trackIds: string[];
  onRemove: (trackId: string) => void;
  onHide: (trackId: string) => void;
};

const TracksFilter = ({ trackIds, onRemove }: Props) => {
  const tracks = api.tracks.getTrackData.useQuery(
    { trackIds },
    { keepPreviousData: true }
  ); // TODO: cleaner solution (useMutation etc.)

  if (tracks.status === "loading") {
    return <div>Loading...</div>;
  }

  if (tracks.status === "error") {
    return <div>Error: {tracks.error.message}</div>;
  }

  const trackData = tracks.data;

  return (
    <div className="grid w-full grid-cols-2 gap-4 lg:grid-cols-4">
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
          onRemove={(trackId) => onRemove(trackId)}
        />
      ))}
    </div>
  );
};

export default TracksFilter;
