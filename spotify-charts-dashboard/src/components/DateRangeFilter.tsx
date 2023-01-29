import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { useState } from "react";
import BasicDatePicker from "./BasicDatePicker";

type FilterParams = {
  startInclusive?: Date;
  endInclusive?: Date;
};

type Props = {
  filterParams: FilterParams;
  onChange: (newValue: FilterParams) => void;
  minDate?: Dayjs;
  maxDate?: Dayjs;
};

const DateRangeFilter = ({
  filterParams,
  onChange,
  minDate,
  maxDate,
}: Props) => {
  const [startDate, setStartDate] = useState<Dayjs | null>(
    filterParams.startInclusive ? dayjs(filterParams.startInclusive) : null
  );
  const [endDate, setEndDate] = useState<Dayjs | null>(
    filterParams.endInclusive ? dayjs(filterParams.endInclusive) : null
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
          onChange({
            ...filterParams,
            startInclusive: newValue ? newValue.toDate() : undefined,
          });
        }}
      />
      <BasicDatePicker
        value={endDate}
        label="End Date"
        minDate={startDate?.add(1, "day") || minDate}
        maxDate={maxDate}
        onChange={(newValue) => {
          setEndDate(newValue);
          onChange({
            ...filterParams,
            endInclusive: newValue ? newValue.toDate() : undefined,
          });
        }}
      />
    </div>
  );
};

export default DateRangeFilter;
