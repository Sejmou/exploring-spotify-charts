import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Autocomplete, { createFilterOptions } from "@mui/material/Autocomplete";
import type { RouterOutputs } from "../../utils/api";
import { api } from "../../utils/api";
import { useFilterStore } from "../../store/filter";

type CountriesAPIResponse = RouterOutputs["countries"]["getAll"];

const globalRegionSelectOption = {
  name: "Global",
  geoSubregion: "Worldwide",
  geoRegion: "Worldwide",
  isoAlpha2: "WW",
  isoAlpha3: "WWW",
};

export default function RegionSelect() {
  const countries = api.countries.getAll.useQuery(undefined, {
    staleTime: Infinity,
  });

  const region = useFilterStore((state) => state.region);
  const setRegion = useFilterStore((state) => state.setRegion);

  const filterOptions = createFilterOptions<CountriesAPIResponse[0]>({
    matchFrom: "any",
    limit: 100,
  });

  return (
    <Autocomplete
      disabled={!countries.data}
      disableClearable={true}
      sx={{ width: 300 }}
      options={
        countries.data ? [globalRegionSelectOption, ...countries.data] : []
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
          label={!countries.data ? "Loading regions..." : "Select a region"}
          inputProps={{
            ...params.inputProps,
            autoComplete: "new-password", // disable autocomplete and autofill
          }}
        />
      )}
      value={
        region == "Global"
          ? globalRegionSelectOption
          : countries.data?.find((r) => r.name === region)
      }
      onChange={(_, newValue) => {
        setRegion(newValue?.name ?? "Global");
      }}
      isOptionEqualToValue={(option, value) => option.name === value.name}
    />
  );
}
