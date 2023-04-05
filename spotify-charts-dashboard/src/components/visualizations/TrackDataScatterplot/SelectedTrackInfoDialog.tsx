import { api } from "../../../utils/api";
import DialogWithCloseIcon from "../../DialogWithCloseIcon";
import LoadingSpinner from "../../LoadingSpinner";
import TrackInfo from "../../TrackDetails";

type Props = {
  open: boolean;
  onClose: () => void;
  trackId: string;
};
const SelectedTrackInfoDialog = ({ trackId, open, onClose }: Props) => {
  const track = api.tracks.getMetadataForId.useQuery(
    { trackId },
    { keepPreviousData: true }
  );

  const t = track.data ? { ...track.data, id: trackId } : undefined;
  return (
    <DialogWithCloseIcon
      open={open}
      onClose={onClose}
      fullWidth={true}
      maxWidth="md"
      title="Track Details"
    >
      <div className="bg-[#121212] p-4 ">
        {t ? (
          <TrackInfo
            trackId={t.id}
            trackTitle={t.name}
            artists={t.featuringArtists.map((a) => a.name)}
            albumTitle={t.album.name}
            releaseDate={t.album.releaseDate}
            releaseType={t.album.type}
            genres={t.genres.map((g) => g.label)}
            label={t.album.label}
            albumCoverUrl={t.album.thumbnailUrl}
            color={"#7fc97f"}
            previewUrl={t.previewUrl}
          />
        ) : (
          <LoadingSpinner />
        )}
      </div>
    </DialogWithCloseIcon>
  );
};
export default SelectedTrackInfoDialog;
