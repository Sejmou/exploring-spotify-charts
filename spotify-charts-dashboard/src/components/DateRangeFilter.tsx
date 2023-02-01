import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { useState } from "react";
import { useFilterStore } from "../store/filter";
import BasicDatePicker from "./BasicDatePicker";

const minDate = dayjs("2017-01-01");
const maxDate = dayjs("2021-12-31");

const DateRangeFilter = () => {
  const startInclusive = useFilterStore((state) => state.startInclusive);
  const endInclusive = useFilterStore((state) => state.endInclusive);
  const setStartInclusive = useFilterStore((state) => state.setStartInclusive);
  const setEndInclusive = useFilterStore((state) => state.setEndInclusive);

  const [startDate, setStartDate] = useState<Dayjs | null>(
    startInclusive ? dayjs(startInclusive) : null
  );
  const [endDate, setEndDate] = useState<Dayjs | null>(
    endInclusive ? dayjs(endInclusive) : null
  );

  return (
    <div className="flex gap-2">
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
