import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../trpc";

export const tracksRouter = createTRPCRouter({
  getNamesAndArtistNames: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.track.findMany({
      select: { name: true, id: true, artists: { select: { name: true } } },
    });
  }),
  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.track.findMany({ include: { artists: true } });
  }),
});
