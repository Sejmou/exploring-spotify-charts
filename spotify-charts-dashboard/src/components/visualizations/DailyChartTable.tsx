import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";
import LoadingSpinner from "../LoadingSpinner";
import classNames from "classnames";
import { useChartsStore } from "~/store";
import { useMemo } from "react";

type Data = RouterOutputs["charts"]["getDailyCharts"];

type ChartTrend = Data[number]["trend"];

const Table = () => {
  const region = useChartsStore((state) => state.region);
  const day = useChartsStore((state) => state.day);
  const date = useMemo(() => new Date(day.format("YYYY-MM-DD")), [day]); // timezone information is included in date which can lead to wrong date being selected -> dirty hack to still get right date
  const charts = api.charts.getDailyCharts.useQuery({ region, date });

  if (!charts.data) return <LoadingSpinner />;

  return (
    <table className="w-full text-left">
      <thead>
        <tr className="text-gray-400">
          <th className="border-b  border-gray-800 px-3 pt-0 pb-3 font-normal">
            #
          </th>
          <th className="border-b  border-gray-800 px-3 pt-0 pb-3 font-normal">
            Track
          </th>
          <th className="border-b  border-gray-800 px-3 pt-0 pb-3 font-normal">
            <span className="hidden sm:inline">Streams</span>
          </th>
        </tr>
      </thead>
      <tbody className="text-gray-100">
        {charts.data.map((entry) => (
          <tr key={entry.track.id}>
            <td className="border-b  border-gray-800 py-2 px-1 sm:p-3">
              <div className="flex items-center">
                <span>{entry.rank}</span>
                <ChartTrendIndicator trend={entry.trend} className="ml-4" />
                {entry.change !== null && <span>{Math.abs(entry.change)}</span>}
              </div>
            </td>
            <td className="border-b border-gray-800 py-2 px-1 sm:p-3">
              <div className="flex flex-col">
                <h3 className="">
                  <a
                    className=""
                    target="_blank"
                    href={createSpotifyTrackLink(entry.track.id)}
                  >
                    {entry.track.name}
                  </a>
                </h3>
                <p>
                  {entry.track.artists.map((a, i) => (
                    <>
                      <a
                        key={a.id}
                        target="_blank"
                        href={createSpotifyArtistLink(a.id)}
                        className="text-sm"
                      >
                        {a.name}
                      </a>
                      {i !== entry.track.artists.length - 1 && ", "}
                    </>
                  ))}
                </p>
              </div>
            </td>
            <td className="border-b  border-gray-800 py-2 px-1 sm:p-3">
              <div className="flex items-center">
                <div className="hidden flex-col sm:flex">{entry.streams}</div>
                <button className="ml-auto inline-flex h-8 w-8 items-center justify-center text-gray-400">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-5"
                    stroke="currentColor"
                    stroke-width="2"
                    fill="none"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <circle cx="12" cy="12" r="1"></circle>
                    <circle cx="19" cy="12" r="1"></circle>
                    <circle cx="5" cy="12" r="1"></circle>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
export default Table;

function createSpotifyArtistLink(artistId: string) {
  return `https://open.spotify.com/artist/${artistId}`;
}

function createSpotifyTrackLink(trackId: string) {
  return `https://open.spotify.com/track/${trackId}`;
}

const ChartTrendIndicator = ({
  trend,
  className,
}: {
  trend: ChartTrend;
  className?: string;
}) => {
  switch (trend) {
    case "up":
      return <UpArrowSVG className={className} />;
    case "down":
      return <DownArrowSVG className={className} />;
    case "same":
      return <NoChangeSVG className={className} />;
    default:
      return <NewEntryBadge className={className} />;
  }
};

const DownArrowSVG = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={classNames("w-4 text-red-500", className)}
    stroke="currentColor"
    stroke-width="3"
    fill="none"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <polyline points="19 12 12 19 5 12"></polyline>
  </svg>
);

const UpArrowSVG = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={classNames("w-4 -scale-y-100 text-green-500", className)}
    stroke="currentColor"
    strokeWidth="3"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <polyline points="19 12 12 19 5 12"></polyline>
  </svg>
);

const NoChangeSVG = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={classNames("w-4 text-gray-400", className)}
    stroke="currentColor"
    strokeWidth="3"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const NewEntryBadge = ({ className }: { className?: string }) => (
  <div
    className={classNames(
      "items-center justify-center rounded bg-blue-300 px-1 text-xs font-medium text-blue-700",
      className
    )}
  >
    NEW
  </div>
);
