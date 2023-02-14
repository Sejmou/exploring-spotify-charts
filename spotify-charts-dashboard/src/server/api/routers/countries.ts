import { createTRPCRouter, publicProcedure } from "../trpc";

export const countriesRouter = createTRPCRouter({
  getAllWithCharts: publicProcedure.query(async ({ ctx }) => {
    const result: { countryName: string }[] = await ctx.prisma
      .$queryRaw`SELECT DISTINCT countryName FROM CountryChartEntry`; // had to use raw query because Prisma's distinct select resulted in a query that was slower and somehow returned more than 100k rows, resulting in an error on PlanetScale
    const countryNames = result.map((e) => e.countryName);
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
