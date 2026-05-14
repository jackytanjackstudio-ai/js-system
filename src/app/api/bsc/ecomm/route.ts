import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";
import { buildForecast } from "@/lib/ecomm-forecast";

export async function GET() {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  const [channels, actuals] = await Promise.all([
    prisma.ecommChannel.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.ecommActual.findMany({ where: { year: { in: [2025, 2026] } } }),
  ]);

  const forecasts = channels.map(ch => {
    const arr2026 = Array(12).fill(0);
    const arr2025 = Array(12).fill(0);
    for (const row of actuals) {
      if (row.channelKey !== ch.channelKey) continue;
      if (row.year === 2026) arr2026[row.month - 1] = row.amount;
      if (row.year === 2025) arr2025[row.month - 1] = row.amount;
    }
    return buildForecast(
      { channelKey: ch.channelKey, channelName: ch.channelName, platform: ch.platform, target2026: ch.target2026 },
      arr2026,
      arr2025,
    );
  });

  const totalTarget   = forecasts.reduce((s, f) => s + f.target2026, 0);
  const totalYtd      = forecasts.reduce((s, f) => s + f.ytdActual, 0);
  const totalForecast = forecasts.reduce((s, f) => s + f.fullYearForecast, 0);

  const totalMonthlyForecast = Array(12).fill(0);
  const totalMonthly2025     = Array(12).fill(0);
  for (const f of forecasts) {
    f.monthlyForecast.forEach((v, i) => { totalMonthlyForecast[i] += v; });
    f.monthly2025.forEach((v, i)     => { totalMonthly2025[i]     += v; });
  }

  return apiOk({
    forecasts,
    summary: {
      totalTarget,
      totalYtd,
      totalForecast,
      forecastVsTarget: totalTarget > 0 ? Math.round((totalForecast / totalTarget) * 1000) / 10 : 0,
      totalMonthlyForecast,
      totalMonthly2025,
      actual2025: 5914459,
    },
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (!["admin", "manager", "supervisor"].includes(session.role)) return apiError("Forbidden", 403);

  const { channelKey, year, month, amount } = await req.json();
  if (!channelKey || !year || !month || amount === undefined) return apiError("Missing fields");

  await prisma.ecommActual.upsert({
    where:  { channelKey_year_month: { channelKey, year, month } },
    update: { amount, updatedBy: session.name, updatedAt: new Date() },
    create: { channelKey, year, month, amount, updatedBy: session.name },
  });

  return apiOk({ success: true });
}
