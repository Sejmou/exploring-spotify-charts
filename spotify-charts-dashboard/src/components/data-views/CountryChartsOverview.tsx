import { api } from "../../utils/api";
import LoadingSpinner from "../LoadingSpinner";
import PageLinkButton from "../PageLinkButton";
import ChoroplethWorld from "../visualizations/ChoroplethWorld";
import type {
  MatchInput,
  NumericInput,
} from "../visualizations/ChoroplethWorld";

export default function CountryTrackCountOverview() {
  // running two queries in parallel (one for countries, one for countries AND track counts)
  // this is because the second query is much slower, and we want to show the map as soon as possible

  // skipBatch: true means that the query will not be batched together with any others (i.e. not executed in same HTTP request)
  // had to do some additional config in api.ts as well for this to work
  // details: https://trpc.io/docs/v9/links#disable-batching-for-certain-requests
  const countries = api.charts.getCountriesWithCharts.useQuery(undefined, {
    trpc: { context: { skipBatch: true } },
  });
  const trackCounts = api.charts.getTrackCountsByCountry.useQuery();

  let mapContainerContent = <LoadingSpinner />;

  if (trackCounts.isError) {
    mapContainerContent = (
      <div>Error loading data, please try refreshing the page.</div>
    );
  }

  const trackCountData = trackCounts.data;
  const countriesData = countries.data;
  console.log({ trackCountData, countriesData });
  if (trackCountData) {
    const input: NumericInput = {
      type: "numeric",
      data: trackCountData.map((d) => ({
        country: {
          name: d.name,
          isoAlpha3: d.isoAlpha3,
        },
        value: d.count,
      })),
      colorMap: () => "#1ED760",
    };
    mapContainerContent = (
      <ChoroplethWorld
        input={input}
        propName={"number of Top 50 chart entries"}
      />
    );
  } else if (countriesData) {
    const input: MatchInput = {
      type: "match",
      data: countriesData.map((d) => ({
        country: {
          name: d.name,
          isoAlpha3: d.isoAlpha3,
        },
      })),
      matchColor: "#1ED760",
    };
    mapContainerContent = (
      <ChoroplethWorld
        input={input}
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
          Welcome! On this website, you can explore daily Top 50 Charts for
          several regions. The map below shows the included countries.
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
      {mapContainerContent}
    </div>
  );
}
