import type { RouterOutputs } from "../utils/api";
import { api } from "../utils/api";
import TrackInfo from "./TrackDetails";
import { useMemo, useState } from "react";
import { Button } from "@mui/material";
import BasicTrackInfo from "./BasicTrackInfo";
import {
  useComparisonTrackColors,
  useComparisonTrackIds,
  useTrackComparisonFilterStore,
} from "../store/trackComparison";
import DialogWithCloseIcon from "./DialogWithCloseIcon";
import { useInView } from "react-intersection-observer";
import classNames from "classnames";
import LoadingSpinner from "./LoadingSpinner";

type TrackMetadata = RouterOutputs["tracks"]["getMetadataForIds"][string] & {
  id: string;
};

const SelectedTracksInfoAndLegend = () => {
  const [expanded, setExpanded] = useState(false);
  const trackIds = useComparisonTrackIds();
  const colors = useComparisonTrackColors();
  const removeTrackId = useTrackComparisonFilterStore(
    (state) => state.removeComparisonTrackId
  );

  const tracks = api.tracks.getMetadataForIds.useQuery(
    { trackIds },
    { keepPreviousData: true, enabled: trackIds.length > 0 }
  );

  const trackMetadata = useMemo(() => {
    const data = tracks.data;
    if (!data) {
      return [];
    }
    const arr: TrackMetadata[] = [];
    for (const id of trackIds) {
      const value = data[id];
      if (value) {
        arr.push({ id, ...value });
      }
    }
    return arr;
  }, [tracks.data, trackIds]);

  const legendContent = (
    <div className="flex flex-1 overflow-x-auto">
      {trackMetadata?.length > 0 ? (
        trackMetadata.map((t) => {
          return (
            <BasicTrackInfo
              key={t.id}
              onRemove={removeTrackId}
              trackId={t.id}
              color={colors[t.id] || "white"}
              artists={t.featuringArtists.map((a) => a.name)}
              trackTitle={t.name}
            />
          );
        })
      ) : tracks.isFetching ? (
        <LoadingSpinner text="" />
      ) : (
        <div className="flex h-10">
          <span className="self-center">
            Add tracks to see their features and chart performance here.
          </span>
        </div>
      )}
    </div>
  );

  const { ref: wrapperRef, inView: wrapperInView } = useInView();

  const [showStickyLegend, setShowStickyLegend] = useState(false);

  return (
    <>
      {!wrapperInView && (
        <div
          className={classNames(
            "sticky top-0 left-0 z-10 flex w-full flex-col gap-2 p-2 sm:flex-row",
            { "bg-[#121212]": showStickyLegend }
          )}
        >
          {!showStickyLegend && <div className="flex-1"></div>}
          {showStickyLegend && legendContent}
          <div className="self-end bg-[#121212]">
            <Button
              className="self-center"
              onClick={() => setShowStickyLegend((prev) => !prev)}
            >
              {!showStickyLegend ? "Show" : "Hide"} Legend
            </Button>
          </div>
        </div>
      )}
      <div ref={wrapperRef} className="flex w-full flex-col gap-2 sm:flex-row">
        {legendContent}
        {trackMetadata.length > 0 && (
          <Button className="self-center" onClick={() => setExpanded(true)}>
            Track Details
          </Button>
        )}
      </div>

      <DialogWithCloseIcon
        open={expanded}
        onClose={() => setExpanded(false)}
        fullWidth={true}
        maxWidth="lg"
        title="Track Details"
      >
        <div className="bg-[#121212] p-4 ">
          <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2">
            {trackMetadata.map((t) => (
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
                color={colors[t.id]}
                previewUrl={t.previewUrl}
              />
            ))}
          </div>
        </div>
      </DialogWithCloseIcon>
    </>
  );
};

export default SelectedTracksInfoAndLegend;
