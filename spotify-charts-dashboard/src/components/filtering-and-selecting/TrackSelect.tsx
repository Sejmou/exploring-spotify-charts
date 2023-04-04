import TextField from "@mui/material/TextField";
import Autocomplete, { createFilterOptions } from "@mui/material/Autocomplete";
import type { RouterOutputs } from "../../utils/api";
import { api } from "../../utils/api";
import {
  Avatar,
  Button,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from "@mui/material";
import { useEffect, useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import { useTrackComparisonFilterStore } from "../../store/trackComparison";
import classNames from "classnames";

type TrackDataAPIResponse =
  RouterOutputs["tracks"]["getTrackNamesArtistsAndStreamsOrdered"];

export default function TrackSelect({ className }: { className?: string }) {
  const region = useTrackComparisonFilterStore((state) => state.region);
  const startInclusive = useTrackComparisonFilterStore(
    (state) => state.startInclusive
  );
  const endInclusive = useTrackComparisonFilterStore(
    (state) => state.endInclusive
  );
  const trackIds = useTrackComparisonFilterStore(
    (state) => state.comparisonTrackIds
  );
  const addTrackId = useTrackComparisonFilterStore(
    (state) => state.addComparisonTrackId
  );

  const tracks = api.tracks.getTrackNamesArtistsAndStreamsOrdered.useQuery(
    { startInclusive, endInclusive, region },
    {
      enabled: !!region,
    }
  );
  const autocompleteFilterOptions = createFilterOptions<
    TrackDataAPIResponse[0]
  >({
    matchFrom: "any",
    limit: 100,
  });

  let inputText = "";
  if (!region) {
    inputText = "... then find charting tracks here";
  } else if (tracks.isLoading) {
    inputText = "Loading tracks...";
  }
  if (tracks.data) {
    inputText = "Find a track";
  }
  if (tracks.error) {
    inputText = "Error loading tracks";
  }

  const [currentTrack, setCurrentTrack] = useState<
    TrackDataAPIResponse[0] | null
  >(null);

  const [key, setKey] = useState(0); // need this hack to force re-render when filterParams.region changes: https://stackoverflow.com/a/59845474/13727176
  useEffect(() => {
    setKey((key) => key + 1);
  }, [region]);

  return (
    <div className={classNames("flex items-center gap-2", className)}>
      <div className="w-full min-w-[240px]">
        <Autocomplete
          key={key}
          disabled={!region}
          options={tracks.data?.filter((t) => !trackIds.includes(t.id)) ?? []}
          filterOptions={autocompleteFilterOptions}
          autoHighlight
          getOptionLabel={(option) =>
            option.name + " - " + option.featuringArtists.join(", ")
          }
          renderOption={(props, option) => (
            // important: key should be LAST here, i.e. NOT before {...props}: https://stackoverflow.com/a/69396153/13727176
            <ListItem component="li" {...props} key={option.id}>
              <ListItemAvatar>
                {!option.album.thumbnailUrl ? (
                  <Avatar variant="square">
                    <MusicNoteIcon />
                  </Avatar>
                ) : (
                  <Avatar
                    variant="square"
                    alt={option.album.name}
                    src={option.album.thumbnailUrl}
                  />
                )}
              </ListItemAvatar>
              <ListItemText
                primary={option.name}
                secondary={option.featuringArtists.join(", ")}
              />
            </ListItem>
          )}
          renderInput={(params) => (
            <div>
              <TextField
                {...params}
                label={inputText}
                inputProps={{
                  ...params.inputProps,
                  autoComplete: "new-password", // disable autocomplete and autofill
                }}
              />
            </div>
          )}
          onChange={(_, newValue) => setCurrentTrack(newValue)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (currentTrack) {
                addTrackId(currentTrack.id);
                setCurrentTrack(null);
                setKey((key) => key + 1); // need this hack to clear autocomplete
              }
            }
          }}
          isOptionEqualToValue={(option, value) => option.id === value.id}
        />
      </div>
      <Button
        disabled={!currentTrack}
        variant="outlined"
        endIcon={<AddIcon />}
        onClick={() => {
          if (currentTrack) {
            addTrackId(currentTrack.id);
            setCurrentTrack(null);
            setKey((key) => key + 1); // need this hack to clear autocomplete
          }
        }}
      >
        Add
      </Button>
    </div>
  );
}
