import { useFilterStore } from "../../store/filter";
import { api } from "../../utils/api";
import ChoroplethWorld from "../visualizations/ChoroplethWorld";
import SpotifyCountrySelectWorldMap from "./SpotifyCountrySelectWorldMap";

const CountrySelection = () => {
  const countryNames = useFilterStore((state) => state.countryNames);
  const addCountryName = useFilterStore((state) => state.addCountryName);
  const removeCountryName = useFilterStore((state) => state.removeCountryName);
  const countries = api.countries.getAll.useQuery();

  let countryMap = (
    <ChoroplethWorld data={[]} propName={""} colorMap={() => ""} />
  );

  if (countries.data) {
    countryMap = (
      <SpotifyCountrySelectWorldMap
        mapZoom={0.75}
        countries={countries.data}
        selectedCountryNames={countryNames ?? []}
        onToggleCountry={(countryName) => {
          if (countryNames?.includes(countryName)) {
            removeCountryName(countryName);
          } else {
            addCountryName(countryName);
          }
        }}
      />
    );
  }
  return countryMap;
};
export default CountrySelection;
