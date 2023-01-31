// import Image from "next/image"; // TODO: figure out how to use this instead of <img> tags for better performance

import { Card, Chip } from "@mui/material";
import { color as d3color } from "d3";
import moment from "moment";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";

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
  onRemove: (trackId: string) => void;
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
    onRemove,
  } = props;

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
        <div>
          {albumCoverUrl ? (
            <img src={albumCoverUrl} alt="Album Cover" width={64} height={64} />
          ) : (
            <div className="h-64 w-64 fill-slate-400"></div>
          )}
        </div>
        <div className="px-2 pt-1">
          <h2 className="text-xl">{trackTitle}</h2>
          <p className="text-base text-gray-300">{artists.join(", ")}</p>
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
      <div className="absolute bottom-2 right-2">
        <IconButton size="small" onClick={() => onRemove(props.trackId)}>
          <DeleteIcon />
        </IconButton>
      </div>
    </div>
  );
};

export default TrackInfo;
