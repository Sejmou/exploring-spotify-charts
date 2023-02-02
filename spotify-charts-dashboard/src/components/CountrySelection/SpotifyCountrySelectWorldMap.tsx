import type { Country } from "@prisma/client";
import type { ReactNode } from "react";
import { useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import dynamic from "next/dynamic";

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

// TODO: think about how to make this more generic and combine with ChoroplethWorld.tsx maybe?

// Don't understand it really, GitHub Copilot generated the function lol - but it works
const calculateSVGZoomedViewBox = (input: {
  width: number;
  height: number;
  xOrigin: number;
  yOrigin: number;
  zoom: number;
}) => {
  const { width, height, xOrigin, yOrigin, zoom } = input;
  const x = width / 2 + xOrigin;
  const y = height / 2 + yOrigin;
  return `${x - x / zoom} ${y - y / zoom} ${width / zoom} ${height / zoom}`;
};

const SpotifyCountrySelectWorldMap = (props: Props) => {
  const [mapTooltipContent, setMapTooltipContent] = useState<ReactNode>("");

  return (
    <>
      {/*  */}
      <ComposableMap
        viewBox={calculateSVGZoomedViewBox({
          // viewBox is 0 0 800 600 per default, which should kinda correspond with width of 800 and height of 600?
          width: 800,
          height: 600,
          xOrigin: 0,
          yOrigin: -100, // -100 to center the map
          zoom: 1.3 * (props.mapZoom ?? 1), // if zooming 30% further into original map it fills the SVG pretty well
        })}
      >
        {/* for tooltip to work, we need to set an data-tip attribute - note: I tried using v5 of library with different approach but didn't figure it out lol */}
        <Geographies data-tip="" geography="/features.json">
          {({ geographies }) =>
            geographies.map((geo) => {
              const spotifyRegionCountry = props.countries.find(
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                (c) => c.isoAlpha3 === geo.id
              );
              const isSelected =
                spotifyRegionCountry &&
                props.selectedCountryNames.includes(spotifyRegionCountry.name);

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
                          <p>Subregion: {spotifyRegionCountry.geoSubregion}</p>
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
      </ComposableMap>
      <ReactTooltip className="flex flex-col bg-black">
        {mapTooltipContent}
      </ReactTooltip>
    </>
  );
};

export default SpotifyCountrySelectWorldMap;
