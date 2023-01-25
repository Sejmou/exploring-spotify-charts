import * as React from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Autocomplete, { createFilterOptions } from "@mui/material/Autocomplete";
import type { RouterOutputs } from "../utils/api";

type TrackDataAPIResponse = RouterOutputs["tracks"]["getNamesAndArtistNames"];

type Props = {
  resp?: TrackDataAPIResponse;
};

export default function TrackSelect({ resp }: Props) {
  console.log(resp);
  const options = !resp ? [] : createOptions(resp);
  const filterOptions = createFilterOptions<(typeof options)[0]>({
    matchFrom: "any",
    limit: 100,
  });

  return (
    <Autocomplete
      id="track-select-demo"
      disabled={!resp}
      sx={{ width: 600 }}
      options={options}
      filterOptions={filterOptions}
      autoHighlight
      getOptionLabel={(option) => option.label}
      renderOption={(props, option) => (
        // important: key should be LAST here, i.e. NOT before {...props}: https://stackoverflow.com/a/69396153/13727176
        <Box component="li" {...props} key={option.id}>
          {option.label}
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
    />
  );
}

function createOptions(resp: TrackDataAPIResponse) {
  console.log("recalculating options...");
  const options = resp.map((track) => {
    const firstArtist = track.artists[0];
    const trackLabel = `${track.name} - ${
      firstArtist ? firstArtist.name : "Unknown Artist"
    }`;
    return {
      label: trackLabel,
      id: track.id,
    };
  });
  return options;
}
