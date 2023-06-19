import { CircularProgress } from "@mui/material";
import classNames from "classnames";
import type { ReactNode } from "react";

type Props = {
  status: "error" | "success" | "loading";
  className?: string;
  children?: ReactNode;
};
const QueryStatusWrapper = ({ status, className, children }: Props) => {
  const text = (() => {
    switch (status) {
      case "error":
        return "Error loading data";
      case "loading":
        return "Loading data...";
      case "success":
        return "";
    }
  })();

  return (
    <div
      className={classNames(
        "flex h-full w-full flex-col items-center justify-center gap-2",
        className
      )}
    >
      {status === "success" ? children : <span>{text}</span>}
      {status === "loading" && <CircularProgress />}
    </div>
  );
};
export default QueryStatusWrapper;
