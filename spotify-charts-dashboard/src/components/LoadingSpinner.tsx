import { CircularProgress } from "@mui/material";

type Props = { text?: string };
const LoadingSpinner = ({ text = "Loading" }: Props) => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2">
      <span>{text}</span>
      <CircularProgress />
    </div>
  );
};
export default LoadingSpinner;
