import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Autocomplete, { createFilterOptions } from "@mui/material/Autocomplete";
import type { RouterInputs, RouterOutputs } from "../utils/api";
import { api } from "../utils/api";
import { ListItemText } from "@mui/material";

type TrackDataAPIResponse = RouterOutputs["tracks"]["getNamesAndArtists"];

type Props = {
  filterParams: RouterInputs["tracks"]["getNamesAndArtists"];
};

export default function TrackSelect({ filterParams }: Props) {
  const tracks = api.tracks.getNamesAndArtists.useQuery(filterParams, {
    enabled: !!filterParams.region,
  });
  const autocompleteFilterOptions = createFilterOptions<
    TrackDataAPIResponse[0]
  >({
    matchFrom: "any",
    limit: 100,
  });

  let inputText = "";
  if (!filterParams.region) {
    inputText = "... then you can select a track here";
  } else if (tracks.isLoading) {
    inputText = "Loading tracks...";
  }
  if (tracks.data) {
    inputText = "Find a track";
  }
  if (tracks.error) {
    inputText = "Error loading tracks";
  }

  return (
    <Autocomplete
      disabled={!filterParams.region}
      sx={{ width: 600 }}
      options={tracks.data ? tracks.data : []}
      filterOptions={autocompleteFilterOptions}
      autoHighlight
      getOptionLabel={(option) =>
        option.name + " - " + option.featuringArtists.join(", ")
      }
      renderOption={(props, option) => (
        // important: key should be LAST here, i.e. NOT before {...props}: https://stackoverflow.com/a/69396153/13727176
        <Box component="li" {...props} key={option.id}>
          <ListItemText
            primary={option.name}
            secondary={option.featuringArtists.join(", ")}
          />
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label={inputText}
          inputProps={{
            ...params.inputProps,
            autoComplete: "new-password", // disable autocomplete and autofill
          }}
        />
      )}
      onChange={(_, newValue) => {
        console.log(newValue);
      }}
    />
  );
}
