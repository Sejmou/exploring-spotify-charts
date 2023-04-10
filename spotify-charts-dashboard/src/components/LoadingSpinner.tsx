import { CircularProgress } from "@mui/material";
import classNames from "classnames";

type Props = { text?: string; className?: string };
const LoadingSpinner = ({ text = "Loading", className }: Props) => {
  return (
    <div
      className={classNames(
        "flex h-full w-full flex-col items-center justify-center gap-2",
        className
      )}
    >
      <span>{text}</span>
      <CircularProgress />
    </div>
  );
};
export default LoadingSpinner;
