import type { Prisma } from "@prisma/client";
import { PrismaClient } from "@prisma/client";

import { env } from "../env/server.mjs";

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
  console.log("Query: " + truncate(e.query, 256));
  console.log("Params: " + truncate(e.params, 128));
  console.log(`Duration: ${e.duration} ms`);
});

function truncate(input: string, maxTotalLength = 20) {
  if (input.length > maxTotalLength - 3) {
    return input.substring(0, maxTotalLength - 3) + "...";
  }
  return input;
}
