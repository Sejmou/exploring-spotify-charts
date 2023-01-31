import { IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

type Props = {
  onRemove: (trackId: string) => void;
  trackId: string;
  color: string;
  artists: string[];
  trackTitle: string;
};

const BasicTrackInfo = (props: Props) => {
  return (
    <div className="flex items-center gap-2  px-2">
      <div
        className="h-8 w-8 rounded-full"
        style={{ backgroundColor: props.color }}
      ></div>
      <div className="flex-1">
        <div className="text-sm font-medium">{props.trackTitle}</div>
        <div className="text-xs text-gray-500">{props.artists.join(", ")}</div>
      </div>
      <div>
        <IconButton onClick={() => props.onRemove(props.trackId)}>
          <DeleteIcon />
        </IconButton>
      </div>
    </div>
  );
};

export default BasicTrackInfo;
