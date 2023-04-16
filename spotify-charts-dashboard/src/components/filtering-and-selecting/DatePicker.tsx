import { TextField } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import type { Dayjs } from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useChartsStore } from "~/store";
import dayjs from "dayjs";

type Props = {
  value: Dayjs | null;
  label: string;
  onChange: (newValue: Dayjs | null) => void;
  minDate?: Dayjs;
  maxDate?: Dayjs;
};

export function BasicDatePicker(props: Props) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        {...props}
        inputFormat="DD/MM/YYYY"
        renderInput={(params) => <TextField {...params} fullWidth />}
      />
    </LocalizationProvider>
  );
}

const chartsMinDate = dayjs("2017-01-01");
const chartsMaxDate = dayjs("2021-12-31");

export default function ChartsDatePicker() {
  const day = useChartsStore((state) => state.day);
  const setDay = useChartsStore((state) => state.setDay);

  return (
    <BasicDatePicker
      value={day}
      label="Date"
      onChange={(newValue) => {
        if (newValue) setDay(newValue);
      }}
      minDate={chartsMinDate}
      maxDate={chartsMaxDate}
    />
  );
}
