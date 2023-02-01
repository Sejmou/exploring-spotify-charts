// import Image from "next/image"; // TODO: figure out how to use this instead of <img> tags for better performance
import { Avatar, Chip } from "@mui/material";
import { color as d3color } from "d3";
import moment from "moment";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import { useCallback, useEffect, useMemo, useState } from "react";

type Props = {
  trackId: string;
  trackTitle: string;
  artists: string[];
  albumTitle: string;
  releaseDate: Date;
  releaseType: string;
  genres: string[];
  label: string;
  albumCoverUrl?: string;
  color?: string;
  previewUrl?: string;
};

const TrackInfo = (props: Props) => {
  const {
    trackTitle,
    artists,
    albumTitle,
    releaseDate,
    releaseType,
    genres,
    albumCoverUrl,
    label,
    color,
    previewUrl,
  } = props;

  const audio = useMemo(() => {
    if (previewUrl) {
      const audio = new Audio(previewUrl);
      return audio;
    }
  }, [previewUrl]);

  useEffect(() => {
    // audio should not be playing when component is unmounted
    if (audio) {
      return () => {
        audio.pause();
        audio.currentTime = 0;
      };
    }
  }, [audio]);

  const playPauseAudio = useCallback(() => {
    if (audio) {
      if (audio.paused) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        audio.play().then(() => setIsPlaying(true));
      } else {
        audio.pause();
        setIsPlaying(false);
        audio.currentTime = 0;
      }
    }
  }, [audio]);
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="relative flex  flex-col bg-[#1d1d1d] p-4 hover:bg-[#222]">
      <div
        className="flex"
        style={{
          backgroundColor: color
            ? d3color(color)!.darker(4).toString()
            : undefined,
        }}
      >
        <div className="relative h-[64] w-[64]" onClick={playPauseAudio}>
          <>
            {albumCoverUrl ? (
              <img
                src={albumCoverUrl}
                alt="Album Cover"
                width={64}
                height={64}
              />
            ) : (
              <div className="h-[64] w-[64] fill-slate-400"></div>
            )}
            {audio && (
              <div
                className={`absolute inset-0 flex items-center justify-center opacity-${
                  isPlaying ? "100" : "0"
                } hover:opacity-100`}
              >
                <Avatar sx={{ bgcolor: "#1ED760" }}>
                  {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                </Avatar>
              </div>
            )}
          </>
        </div>
        <div className="overflow-hidden px-2 pt-1">
          <h2
            className="overflow-hidden text-ellipsis whitespace-nowrap text-xl"
            title={trackTitle}
          >
            {trackTitle}
          </h2>
          <p
            className="overflow-hidden text-ellipsis whitespace-nowrap text-base text-gray-300"
            title={artists.join(", ")}
          >
            {artists.join(", ")}
          </p>
        </div>
      </div>
      <p className="text-md py-2 text-gray-200">
        <span className="capitalize">{releaseType}</span>: {albumTitle}
      </p>
      <div className="flex flex-wrap gap-1 overflow-auto pb-2">
        {genres.map((g, i) => (
          <Chip className="capitalize" key={i} label={g} />
        ))}
      </div>
      <p className="text-sm text-gray-400">
        {moment(releaseDate).format("ll")} · {label}
      </p>
    </div>
  );
};

export default TrackInfo;
