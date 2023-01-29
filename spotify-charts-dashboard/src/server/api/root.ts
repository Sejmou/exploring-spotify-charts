import { createTRPCRouter } from "./trpc";
import { exampleRouter } from "./routers/example";
import { tracksRouter } from "./routers/tracks";
import { regionsRouter } from "./routers/regions";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here
 */
export const appRouter = createTRPCRouter({
  example: exampleRouter,
  tracks: tracksRouter,
  regions: regionsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;