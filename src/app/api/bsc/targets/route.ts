import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") ?? "2026");
  const currentMonth = new Date().getMonth() + 1;

  const [targets, reports] = await Promise.all([
    prisma.outletTarget.findMany({
      where: { year },
      orderBy: [{ outlet: "asc" }, { month: "asc" }],
    }),
    prisma.salesReport.findMany({
      where: {
        createdAt: {
          gte: new Date(`${year}-01-01T00:00:00Z`),
          lte: new Date(`${year}-12-31T23:59:59Z`),
        },
      },
      include: { outlet: { select: { name: true } } },
    }),
  ]);

  // Group actuals by UPPERCASE outlet name and month
  const actuals: Record<string, Record<number, number>> = {};
  for (const r of reports) {
    const name = r.outlet.name.toUpperCase();
    const month = new Date(r.createdAt).getMonth() + 1;
    if (!actuals[name]) actuals[name] = {};
    actuals[name][month] = (actuals[name][month] ?? 0) + r.revenue;
  }

  return apiOk({ targets, actuals, currentMonth, year });
}
