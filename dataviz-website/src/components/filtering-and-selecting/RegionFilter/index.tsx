import { Button } from "@mui/material";
import { useState } from "react";
import { api } from "../../../utils/api";
import DialogWithCloseIcon from "../../DialogWithCloseIcon";
import SpotifyCountrySelectWorldMap from "./SpotifyCountrySelectWorldMap";
import LoadingSpinner from "~/components/LoadingSpinner";
import { useChartsStore } from "~/store";

const RegionFilter = () => {
  const regionNames = useChartsStore((state) => state.regionNames);
  const addRegionName = useChartsStore((state) => state.addRegionName);
  const removeRegionName = useChartsStore((state) => state.removeRegionName);
  const countries = api.charts.getCountriesWithCharts.useQuery();
  const [popupActive, setPopupActive] = useState(false);

  let content = <LoadingSpinner className="h-full w-full" />;

  if (countries.data) {
    content = (
      <SpotifyCountrySelectWorldMap
        mapZoom={0.75}
        countries={countries.data}
        selectedCountryNames={regionNames ?? []}
        onToggleCountry={(countryName) => {
          if (regionNames?.includes(countryName)) {
            removeRegionName(countryName);
          } else {
            addRegionName(countryName);
          }
        }}
      />
    );
  }
  return (
    <div>
      <div className="max-h-96">
        <h3 className="text-xl font-bold">Region</h3>
        <p className="mt-2 text-sm">
          {regionNames
            ? "Included chart regions: " + regionNames.join(", ")
            : "(no countries selected)"}
        </p>
        <Button onClick={() => setPopupActive(true)}>Change</Button>
      </div>
      <DialogWithCloseIcon
        open={popupActive}
        onClose={() => setPopupActive(false)}
        fullWidth={true}
        maxWidth="lg"
        title="Filter by region(s)"
      >
        <p className="px-4">
          Click on any country. The scatter plot will be filtered to only
          include tracks that charted in the countries you selected. Otherwise,
          tracks charting in any chart (including global) will be included.
        </p>
        {content}
      </DialogWithCloseIcon>
    </div>
  );
};
export default RegionFilter;
