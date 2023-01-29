import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Autocomplete, { createFilterOptions } from "@mui/material/Autocomplete";
import { api, RouterOutputs } from "../utils/api";

type RegionsAPIResponse = RouterOutputs["regions"]["getAll"];

type Props = {
  value: string | null;
  onChange: (newRegionName: string | null) => void;
};

export default function RegionSelect({ onChange, value }: Props) {
  const filterOptions = createFilterOptions<RegionsAPIResponse[0]>({
    matchFrom: "any",
    limit: 100,
  });

  const regions = api.regions.getAll.useQuery();

  return (
    <Autocomplete
      disabled={!regions.data}
      sx={{ width: 300 }}
      options={
        regions.data
          ? [{ name: "Global", geoSubregion: "Worldwide" }, ...regions.data]
          : []
      }
      filterOptions={filterOptions}
      groupBy={(option) => option.geoSubregion}
      autoHighlight
      getOptionLabel={(option) => option.name}
      renderOption={(props, option) => (
        // important: key should be LAST here, i.e. NOT before {...props}: https://stackoverflow.com/a/69396153/13727176
        <Box component="li" {...props} key={option.name}>
          {option.name}
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label={!regions.data ? "Loading regions..." : "Select a region..."}
          inputProps={{
            ...params.inputProps,
            autoComplete: "new-password", // disable autocomplete and autofill
          }}
        />
      )}
      value={regions.data?.find((region) => region.name === value) ?? null}
      onChange={(_, newValue) => {
        onChange(newValue?.name ?? null);
      }}
    />
  );
}
