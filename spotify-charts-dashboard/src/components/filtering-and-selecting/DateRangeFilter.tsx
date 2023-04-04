import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { useState } from "react";
import { useTrackComparisonFilterStore } from "../../store/trackComparison";
import BasicDatePicker from "./BasicDatePicker";
import classNames from "classnames";

const minDate = dayjs("2017-01-01");
const maxDate = dayjs("2021-12-31");

const DateRangeFilter = ({ className }: { className?: string }) => {
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

export default DateRangeFilter;
