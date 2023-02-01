import { Button } from "@mui/material";

type Props = {
  onSwitchView: () => void;
};

const TrackDataExploration = ({ onSwitchView }: Props) => {
  return (
    <div>
      <div>TrackDataExploration</div>
      <Button onClick={onSwitchView}>Switch View</Button>
    </div>
  );
};

export default TrackDataExploration;
