import { Button } from "@mui/material";
import { useState } from "react";
import { useTracksExplorationStore } from "../../../store/trackDataExploration";
import { api } from "../../../utils/api";
import DialogWithCloseIcon from "../../DialogWithCloseIcon";
import ChoroplethWorld from "../../visualizations/ChoroplethWorld";
import SpotifyCountrySelectWorldMap from "./SpotifyCountrySelectWorldMap";

const RegionFilter = () => {
  const regionNames = useTracksExplorationStore((state) => state.regionNames);
  const addRegionName = useTracksExplorationStore(
    (state) => state.addRegionName
  );
  const removeRegionName = useTracksExplorationStore(
    (state) => state.removeRegionName
  );
  const countries = api.countries.getAllWithCharts.useQuery();
  const [popupActive, setPopupActive] = useState(false);

  let countryMap = (
    <ChoroplethWorld data={[]} propName={""} colorMap={() => ""} />
  );

  if (countries.data) {
    countryMap = (
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
    <>
      <div className="max-h-96 py-2 px-4">
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
        {countryMap}
      </DialogWithCloseIcon>
    </>
  );
};
export default RegionFilter;
