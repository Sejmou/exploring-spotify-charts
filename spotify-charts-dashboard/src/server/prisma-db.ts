import type { Prisma } from "@prisma/client";
import { PrismaClient } from "@prisma/client";

import { env } from "../env/server.mjs";

// TODO: get rid of all of this - should be fine as I replaced all DB queries with drizzle?

declare global {
  // eslint-disable-next-line no-var
  var prisma:
    | PrismaClient<
        Prisma.PrismaClientOptions,
        "info" | "warn" | "error" | "query"
      >
    | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: [
      {
        emit: "event",
        level: "query",
      },
      {
        emit: "stdout",
        level: "error",
      },
      {
        emit: "stdout",
        level: "info",
      },
      {
        emit: "stdout",
        level: "warn",
      },
    ],
  });

if (env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

prisma.$on("query", (e) => {
  console.log("Query: " + e.query);
  console.log("Params: " + e.params);
  console.log(`Duration: ${e.duration} ms`);
});
