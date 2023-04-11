import { api } from "~/utils/api";
import LoadingSpinner from "../LoadingSpinner";

const Table = () => {
  const region = "Argentina";
  const date = new Date("2021-01-01T00:00:00.000Z");
  const charts = api.charts.getDailyCharts.useQuery({ region, date });

  if (!charts.data) return <LoadingSpinner />;

  return (
    <table>
      <thead>
        <tr>
          <th>Position</th>
          <th>Track</th>
          <th>Streams</th>
        </tr>
      </thead>
      <tbody>
        {charts.data.map((entry) => (
          <tr key={entry.track.id}>
            <td>{entry.rank}</td>
            <td>
              <div className="flex flex-col">
                <h3>
                  <a
                    target="_blank"
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    href={createSpotifyTrackLink(entry.track.id!)}
                  >
                    {entry.track.name}
                  </a>
                </h3>
                <p>
                  {entry.track.artists.map((a) => (
                    <a
                      key={a.id}
                      target="_blank"
                      href={createSpotifyArtistLink(a.id)}
                    >
                      {a.name}
                    </a>
                  ))}
                </p>
              </div>
            </td>
            <td>{entry.streams}</td>
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
