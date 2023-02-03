import classNames from "classnames";

type Props = {
  className?: string;
};

const SpotifyChartsHeading = ({ className }: Props) => {
  return (
    <h1
      className={classNames(
        "min-h-[56px] text-5xl font-extrabold tracking-tight text-white",
        className
      )}
    >
      <span className="text-[#1ED760]">Spotify</span> Charts
    </h1>
  );
};

export default SpotifyChartsHeading;
