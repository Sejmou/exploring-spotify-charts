import type { Region } from "@prisma/client";
import type { ReactNode } from "react";
import { useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import ReactTooltip from "react-tooltip";

type Props = {
  data: {
    country: Region;
    value: number;
  }[];
  propName: string;
  missingDataColor?: string;
  valueFormatPrecision?: number;
  mapZoom?: number;
  colorMap: (value: number) => string;
  // colorMapMax: number;
  // colorMapMin: number;
};

function formatNumber(num: number, precision = 0) {
  return num.toLocaleString(undefined, {
    maximumFractionDigits: precision,
  });
}

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

const ChoroplethWorld = (props: Props) => {
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
              const countryData = props.data.find(
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                (c) => c.country.isoAlpha3 === geo.id
              );
              const tooltipContent = countryData ? (
                <>
                  <h5 className="font-bold">{props.propName}</h5>
                  <span>{`${countryData.country.name}: ${formatNumber(
                    countryData.value,
                    props.valueFormatPrecision
                  )}`}</span>
                </>
              ) : (
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                `${geo.properties.name as string} (no data)`
              );

              return (
                <Geography
                  className="outline-none" // disables ugly squared outline
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                  key={geo.rsmKey}
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                  geography={geo}
                  fill={
                    countryData
                      ? props.colorMap(countryData.value)
                      : props.missingDataColor ?? "#DDD"
                  }
                  stroke="#FFF"
                  onMouseEnter={() => {
                    console.log("geo", geo);
                    setMapTooltipContent(tooltipContent);
                  }}
                  onMouseLeave={() => {
                    setMapTooltipContent("");
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

export default ChoroplethWorld;
