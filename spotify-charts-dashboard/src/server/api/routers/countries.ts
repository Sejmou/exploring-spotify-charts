import { createTRPCRouter, publicProcedure } from "../trpc";

export const countriesRouter = createTRPCRouter({
  getAllWithCharts: publicProcedure.query(async ({ ctx }) => {
    const countryNames = (
      await ctx.prisma.countryChartEntry.findMany({
        select: {
          countryName: true,
        },
        distinct: ["countryName"],
      })
    ).map((e) => e.countryName);
    const countries = await ctx.prisma.country.findMany({
      where: {
        name: {
          in: countryNames,
        },
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
