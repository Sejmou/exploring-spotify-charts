import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { useState } from "react";
import { useTrackComparisonFilterStore } from "../../store/trackComparison";
import BasicDatePicker from "./BasicDatePicker";
import classNames from "classnames";
import { useTracksExplorationStore } from "~/store/trackDataExploration";

const minDate = dayjs("2017-01-01");
const maxDate = dayjs("2021-12-31");

type Props = {
  className?: string;
  startInclusive?: Date;
  endInclusive?: Date;
  setStartInclusive: (date?: Date | undefined) => void;
  setEndInclusive: (date?: Date | undefined) => void;
};

const DateRangeFilter = ({
  className,
  startInclusive,
  endInclusive,
  setStartInclusive,
  setEndInclusive,
}: Props) => {
  const [startDate, setStartDate] = useState<Dayjs | null>(
    startInclusive ? dayjs(startInclusive) : null
  );
  const [endDate, setEndDate] = useState<Dayjs | null>(
    endInclusive ? dayjs(endInclusive) : null
  );

  return (
    <div className={classNames("flex min-w-[320px] gap-2", className)}>
      <BasicDatePicker
        value={startDate}
        label="Start Date"
        minDate={minDate}
        maxDate={endDate?.subtract(1, "day") || maxDate}
        onChange={(newValue) => {
          setStartDate(newValue);
          setStartInclusive(newValue ? newValue.toDate() : undefined);
        }}
      />
      <BasicDatePicker
        value={endDate}
        label="End Date"
        minDate={startDate?.add(1, "day") || minDate}
        maxDate={maxDate}
        onChange={(newValue) => {
          setEndDate(newValue);
          setEndInclusive(newValue ? newValue.toDate() : undefined);
        }}
      />
    </div>
  );
};

//TODO: is this the best solution to configure the same component for different stores?

export const DateRangeFilterTrackComparison = ({
  className,
}: {
  className?: string;
}) => {
  const startInclusive = useTrackComparisonFilterStore(
    (state) => state.startInclusive
  );
  const endInclusive = useTrackComparisonFilterStore(
    (state) => state.endInclusive
  );
  const setStartInclusive = useTrackComparisonFilterStore(
    (state) => state.setStartInclusive
  );
  const setEndInclusive = useTrackComparisonFilterStore(
    (state) => state.setEndInclusive
  );

  return (
    <DateRangeFilter
      startInclusive={startInclusive}
      endInclusive={endInclusive}
      setStartInclusive={setStartInclusive}
      setEndInclusive={setEndInclusive}
      className={className}
    />
  );
};

export const DateRangeFilterTrackExploration = ({
  className,
}: {
  className?: string;
}) => {
  const startInclusive = useTracksExplorationStore(
    (state) => state.startInclusive
  );
  const endInclusive = useTracksExplorationStore((state) => state.endInclusive);
  const setStartInclusive = useTracksExplorationStore(
    (state) => state.setStartInclusive
  );
  const setEndInclusive = useTracksExplorationStore(
    (state) => state.setEndInclusive
  );

  return (
    <DateRangeFilter
      startInclusive={startInclusive}
      endInclusive={endInclusive}
      setStartInclusive={setStartInclusive}
      setEndInclusive={setEndInclusive}
      className={className}
    />
  );
};
