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
import { useFilterStore } from "../../store/filter";

type TrackDataAPIResponse = RouterOutputs["tracks"]["getNamesAndArtists"];

export default function TrackSelect() {
  const region = useFilterStore((state) => state.region);
  const startInclusive = useFilterStore((state) => state.startInclusive);
  const endInclusive = useFilterStore((state) => state.endInclusive);
  const trackIds = useFilterStore((state) => state.trackIds);
  const addTrackId = useFilterStore((state) => state.addTrackId);

  const tracks = api.tracks.getNamesAndArtists.useQuery(
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
    <div className="flex items-center gap-2">
      <Autocomplete
        key={key}
        disabled={!region}
        sx={{ width: 400 }}
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
