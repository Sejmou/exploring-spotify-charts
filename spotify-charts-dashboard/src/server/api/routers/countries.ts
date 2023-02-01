import { createTRPCRouter, publicProcedure } from "../trpc";

export const countriesRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    console.log("here");
    const countries = await ctx.prisma.country.findMany({
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
    return countries;
  }),
});
