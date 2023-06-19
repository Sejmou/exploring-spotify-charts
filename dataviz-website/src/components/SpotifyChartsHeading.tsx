import classNames from "classnames";
import dynamic from "next/dynamic";
import { useState } from "react";
import Link from "next/link";

const ReactTooltip = dynamic(() => import("react-tooltip"), {
  ssr: false,
});

type Props = {
  className?: string;
};

const SpotifyChartsHeading = ({ className }: Props) => {
  const [showTooltip, setShowTooltip] = useState(false);
  return (
    <Link href="/">
      <h1
        data-tip=""
        id="chart-heading"
        className={classNames(
          "text-white, min-h-[56px] whitespace-nowrap text-5xl font-extrabold tracking-tight",
          className
        )}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <span className="text-[#1ED760]">Spotify</span> Charts
      </h1>
      <ReactTooltip
        className="flex flex-col bg-black"
        place="bottom"
        effect="solid"
        clickable
      >
        {showTooltip ? "Back to Landing Page" : ""}
      </ReactTooltip>
    </Link>
  );
};

export default SpotifyChartsHeading;
