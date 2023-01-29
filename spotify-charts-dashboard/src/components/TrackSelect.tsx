import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Autocomplete, { createFilterOptions } from "@mui/material/Autocomplete";
import type { RouterOutputs } from "../utils/api";
import { ListItemText } from "@mui/material";

type TrackDataAPIResponse = RouterOutputs["tracks"]["getNamesAndArtists"];

type Props = {
  resp?: TrackDataAPIResponse;
};

export default function TrackSelect({ resp }: Props) {
  const filterOptions = createFilterOptions<TrackDataAPIResponse[0]>({
    matchFrom: "any",
    limit: 100,
  });

  return (
    <Autocomplete
      disabled={!resp}
      sx={{ width: 600 }}
      options={resp ? resp : []}
      filterOptions={filterOptions}
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
          label={!resp ? "Loading tracks..." : "Find a track"}
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
