import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk, isAdmin } from "@/lib/auth";
import { normalizeOutletName } from "@/lib/outlet-name-alias";

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
        OR: [
          // uploaded this year
          { createdAt: { gte: new Date(`${year}-01-01T00:00:00Z`), lte: new Date(`${year}-12-31T23:59:59Z`) } },
          // document date is this year (uploaded late)
          { salesDate: { gte: `${year}-01-01`, lte: `${year}-12-31` } },
        ],
      },
      select: { revenue: true, salesDate: true, createdAt: true, outlet: { select: { name: true } } },
    }),
  ]);

  // Group actuals by normalized outlet name and document month (salesDate > createdAt)
  const actuals: Record<string, Record<number, number>> = {};
  for (const r of reports) {
    const name        = normalizeOutletName(r.outlet.name);
    const effectiveDate = r.salesDate ? new Date(r.salesDate) : r.createdAt;
    const effectiveYear = effectiveDate.getFullYear();
    if (effectiveYear !== year) continue; // skip if doc date is a different year
    const month = effectiveDate.getMonth() + 1;
    if (!actuals[name]) actuals[name] = {};
    actuals[name][month] = (actuals[name][month] ?? 0) + r.revenue;
  }

  return apiOk({ targets, actuals, currentMonth, year });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (!isAdmin(session)) return apiError("Forbidden", 403);

  const { targets } = await req.json();
  if (!Array.isArray(targets) || targets.length === 0) {
    return apiError("targets array is required");
  }

  await Promise.all(
    targets.map((t: { outlet: string; year: number; month: number; targetRm: number }) =>
      prisma.outletTarget.upsert({
        where: { outlet_year_month: { outlet: t.outlet, year: Number(t.year), month: Number(t.month) } },
        update: { targetRm: Number(t.targetRm) },
        create: { outlet: t.outlet, year: Number(t.year), month: Number(t.month), targetRm: Number(t.targetRm) },
      })
    )
  );

  return apiOk({ success: true });
}
