import type { ReactNode } from "react";
import { useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import dynamic from "next/dynamic";

import type { RouterOutputs } from "~/utils/api";

type Country = RouterOutputs["charts"]["getCountriesWithCharts"][number];

const ReactTooltip = dynamic(() => import("react-tooltip"), {
  ssr: false,
});

type Props = {
  countries: Country[];
  selectedCountryNames: string[];
  onToggleCountry: (countryName: string) => void;
  valueFormatPrecision?: number;
  mapZoom?: number;
};

const SpotifyCountrySelectWorldMap = (props: Props) => {
  const [mapTooltipContent, setMapTooltipContent] = useState<ReactNode>("");
  const mapWidth = 800;
  const mapHeight = 400;

  return (
    <>
      <ComposableMap
        projectionConfig={{
          scale: 155,
        }}
        width={mapWidth}
        height={mapHeight}
        style={{ width: "100%", height: "auto" }}
      >
        {/* for tooltip to work, we need to set an data-tip attribute - note: I tried using v5 of library with different approach but didn't figure it out lol */}
        <ZoomableGroup
          translateExtent={[
            [0, 0],
            [mapWidth, mapHeight],
          ]} // this is to prevent panning out of map
          onMoveEnd={({ coordinates }) => {
            console.log(coordinates);
            // setMapPosition([coordinates[0], coordinates[1], zoom]);
          }}
          maxZoom={10}
        >
          <Geographies data-tip="" geography="/features.json">
            {({ geographies }) =>
              geographies.map((geo) => {
                const spotifyRegionCountry = props.countries.find(
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                  (c) => c.isoAlpha3 === geo.id
                );
                const isSelected =
                  spotifyRegionCountry &&
                  props.selectedCountryNames.includes(
                    spotifyRegionCountry.name
                  );

                return (
                  <Geography
                    className="outline-none" // disables ugly squared outline
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                    key={geo.rsmKey}
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    geography={geo}
                    fill={
                      spotifyRegionCountry
                        ? isSelected
                          ? "#1DB954"
                          : "#93dfae"
                        : "#DDD"
                    }
                    stroke="#FFF"
                    onMouseEnter={() => {
                      if (spotifyRegionCountry)
                        setMapTooltipContent(
                          <>
                            <h5 className="font-bold">
                              {spotifyRegionCountry.name}
                            </h5>
                            <p>Region: {spotifyRegionCountry.geoRegion}</p>
                            <p>
                              Subregion: {spotifyRegionCountry.geoSubregion}
                            </p>
                          </>
                        );
                    }}
                    onMouseLeave={() => {
                      setMapTooltipContent("");
                    }}
                    onClick={() => {
                      if (spotifyRegionCountry)
                        props.onToggleCountry(spotifyRegionCountry.name);
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
      <ReactTooltip className="flex flex-col bg-black">
        {mapTooltipContent}
      </ReactTooltip>
    </>
  );
};

export default SpotifyCountrySelectWorldMap;
