import { createTRPCRouter, publicProcedure } from "../trpc";

export const regionsRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const regions = await ctx.prisma.region.findMany({
      select: {
        name: true,
        geoSubregion: true,
      },
      orderBy: [
        {
          geoRegion: "asc",
        },
        {
          geoSubregion: "desc",
        },
        { name: "asc" },
      ],
    });
    return regions;
  }),
});
