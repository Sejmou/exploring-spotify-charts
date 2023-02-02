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
  return (
    <>
      <div className="max-h-96 py-2 px-4">
        <h3 className="text-xl font-bold">Filter by region</h3>
        <p>
          Click on any number of countries. The scatter plot will be filtered to
          only include tracks that charted in that country. Otherwise, tracks
          charting in any chart (including global) will be included.
        </p>
        <p className="mt-2 text-sm">
          {countryNames
            ? "Filtering for tracks charting in: " + countryNames.join(", ")
            : "(no countries selected)"}
        </p>
      </div>
      {countryMap}
    </>
  );
};
export default CountrySelection;
