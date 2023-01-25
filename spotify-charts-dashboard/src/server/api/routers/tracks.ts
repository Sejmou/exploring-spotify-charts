import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../trpc";

export const tracksRouter = createTRPCRouter({
  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.track.findMany({ include: { artists: true } });
  }),
});
