import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { useState } from "react";
import { BasicDatePicker } from "./DatePicker";
import classNames from "classnames";
import { useChartsStore } from "~/store";

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
  // TODO: rethink whether we should use dayjs or Date - also, this code is really kinda hacky lol
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

const ChartsDateRangeFilter = ({ className }: { className?: string }) => {
  const startInclusive = useChartsStore((state) => state.startInclusive);
  const endInclusive = useChartsStore((state) => state.endInclusive);
  const setStartInclusive = useChartsStore((state) => state.setStartInclusive);
  const setEndInclusive = useChartsStore((state) => state.setEndInclusive);

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

export default ChartsDateRangeFilter;
