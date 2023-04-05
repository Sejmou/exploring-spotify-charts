import { api } from "../../utils/api";
import PageLinkButton from "../PageLinkButton";
import ChoroplethWorld from "../visualizations/ChoroplethWorld";

export default function CountryTrackCountOverview() {
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
        data={trackCounts.data.map((d) => ({
          country: d.country,
          value: d.count,
        }))}
        colorMap={() => "#1ED760"}
        propName={"number of Top 50 chart entries"}
      />
    );
  }

  return (
    <div className="flex h-full w-full flex-col gap-2">
      <div className="mx-auto">
        <h2 className="mt-2 mb-4 text-center text-6xl font-extrabold tracking-tight">
          <span className="text-[#1ED760]">Spotify</span> Charts
        </h2>
        <p className="mb-2 max-w-5xl">
          Welcome! On this website, you can explore daily Top 50 Charts for 50
          regions (Global + 49 countries) from 2017-2021. The map below shows
          the countries data is available for. Hover over each to see the number
          of chart entries (i.e. combinations of date, track, and chart
          position).
        </p>
        <p>
          Once you feel ready, click the button below to get started with the
          rest of the dataviz :)
        </p>
      </div>
      <PageLinkButton
        className="self-center"
        path="/viz/explore-relationships"
        text="Start Exploring"
      />
      {content}
    </div>
  );
}
