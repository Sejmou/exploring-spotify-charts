import type { Country } from "@prisma/client";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import dynamic from "next/dynamic";

const ReactTooltip = dynamic(() => import("react-tooltip"), {
  ssr: false,
});

type Props = {
  data: {
    country: Country;
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

const ChoroplethWorld = (props: Props) => {
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
          // this is to prevent panning out of map
          translateExtent={[
            [0, 0],
            [mapWidth, mapHeight],
          ]}
          maxZoom={10}
        >
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
        </ZoomableGroup>
      </ComposableMap>
      <ReactTooltip className="flex flex-col bg-black">
        {mapTooltipContent}
      </ReactTooltip>
    </>
  );
};

export default ChoroplethWorld;
