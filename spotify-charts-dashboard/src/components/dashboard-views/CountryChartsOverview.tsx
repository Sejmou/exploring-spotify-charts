import { Button } from "@mui/material";
import { api } from "../../utils/api";
import ChoroplethWorld from "../visualizations/ChoroplethWorld";

type Props = {
  onStart: () => void;
};

export default function CountryTrackCountOverview({ onStart }: Props) {
  const trackCounts = api.charts.getTrackCountsByCountry.useQuery();

  let content = <div></div>;

  if (trackCounts.isError) {
    content = <div>Error loading data, please try refreshing the page.</div>;
  }

  if (!trackCounts.data) {
    content = (
      <ChoroplethWorld
        data={[]}
        colorMap={() => "#1ED760"}
        propName={"number of tracks in the dataset"}
      />
    );
  } else {
    content = (
      <ChoroplethWorld
        data={trackCounts.data.map((d) => ({ ...d, value: d.count }))}
        colorMap={() => "#1ED760"}
        propName={"number of Top 50 chart entries"}
      />
    );
  }

  return (
    <>
      <div className="mx-auto">
        <h2 className="mt-2 mb-4 text-center text-4xl">Welcome!</h2>
        <p className="mb-2 max-w-5xl">
          On this website, you can explore the{" "}
          <span className="text-[#1ED760]">Spotify</span> Charts dataset I have
          assembled. It contains the daily Top 50 Charts (Global + 49 countries)
          from 2017-2021. The graph below shows the countries data is available
          for. Hover over a country to see the number of tracks in the dataset.
        </p>
        <p>
          Once you feel ready, click the button below to get started with the
          rest of the dataviz :)
        </p>
      </div>
      <Button className="self-center" onClick={onStart}>
        Start exploring
      </Button>
      {content}
    </>
  );
}
