import { type AppType } from "next/app";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { api } from "../utils/api";

import "../styles/globals.css";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#1ED760",
    },
  },
});

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <ThemeProvider theme={darkTheme}>
      <ReactQueryDevtools initialIsOpen={false} />
      <Component {...pageProps} />
    </ThemeProvider>
  );
};

export default api.withTRPC(MyApp);
