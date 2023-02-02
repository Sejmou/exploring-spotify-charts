import * as React from "react";
import Box from "@mui/material/Box";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import type { SelectChangeEvent } from "@mui/material/Select";
import Select from "@mui/material/Select";

type Props = {
  label: string;
  value?: string;
  onChange: (newValue: string) => void;
  options: { value: string; label: string }[];
  className?: string;
};

export default function BasicSelect(props: Props) {
  const handleChange = (event: SelectChangeEvent) => {
    props.onChange(event.target.value);
  };

  return (
    <div className={props.className || ""} style={{ minWidth: 120 }}>
      <FormControl fullWidth>
        <InputLabel>{props.label}</InputLabel>
        <Select value={props.value} label={props.label} onChange={handleChange}>
          {props.options.map((option, i) => (
            <MenuItem key={i} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </div>
  );
}
