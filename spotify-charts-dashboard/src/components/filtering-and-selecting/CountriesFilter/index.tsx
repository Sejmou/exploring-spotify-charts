import { useTracksExplorationStore } from "../../../store/trackDataExploration";
import { api } from "../../../utils/api";
import ChoroplethWorld from "../../visualizations/ChoroplethWorld";
import SpotifyCountrySelectWorldMap from "./SpotifyCountrySelectWorldMap";

const CountriesFilter = () => {
  const regionNames = useTracksExplorationStore((state) => state.regionNames);
  const addRegionName = useTracksExplorationStore(
    (state) => state.addRegionName
  );
  const removeRegionName = useTracksExplorationStore(
    (state) => state.removeRegionName
  );
  const countries = api.countries.getAllWithCharts.useQuery();

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
        <h3 className="text-xl font-bold">Filter by country/countries</h3>
        <p>
          Click on any country. The scatter plot will be filtered to only
          include tracks that charted in the countries you selected. Otherwise,
          tracks charting in any chart (including global) will be included.
        </p>
        <p className="mt-2 text-sm">
          {regionNames
            ? "Filtering for tracks charting in: " + regionNames.join(", ")
            : "(no countries selected)"}
        </p>
      </div>
      {countryMap}
    </>
  );
};
export default CountriesFilter;
