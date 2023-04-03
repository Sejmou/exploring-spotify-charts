import { createTRPCRouter } from "./trpc";
import { tracksRouter } from "./routers/tracks";
import { countriesRouter } from "./routers/countries";
import { chartsRouter } from "./routers/charts";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here
 */
export const appRouter = createTRPCRouter({
  tracks: tracksRouter,
  countries: countriesRouter,
  charts: chartsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
