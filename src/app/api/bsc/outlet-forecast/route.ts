import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";

const OUTLET_TARGETS_2026: Record<string, number> = {
  "AEON BUKIT TINGGI":  536000,
  "MAIN PLACE":         279691.61,
  "PARADIGM MALL":      450000,
  "EAST COAST MALL":    850000,
  "AEON PERMAS JAYA":   401328.80,
  "AEON BUKIT INDAH":   860000,
  "AEON SEREMBAN":      860000,
  "AEON WANGSA MAJU":   309210.23,
  "ALAMANDA":           472591.83,
  "BERJAYA TIMES SQ":   1004358.77,
  "AEON KULAIJAYA":     451000,
  "SUNWAY CARNIVAL":    674449.33,
  "MAYANG MALL":        1001381.75,
};

export async function GET() {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  const currentMonth = new Date().getMonth(); // 0-indexed
  const monthsDone   = currentMonth + 1;

  const [actuals2025rows, actuals2026rows] = await Promise.all([
    prisma.outletMonthlyActual.findMany({ where: { year: 2025 } }),
    prisma.outletMonthlyActual.findMany({ where: { year: 2026 } }),
  ]);

  const outlets = Object.keys(OUTLET_TARGETS_2026);

  const forecasts = outlets.map(outletName => {
    const target = OUTLET_TARGETS_2026[outletName];

    const arr2025 = Array(12).fill(0);
    actuals2025rows
      .filter(r => r.outlet === outletName)
      .forEach(r => { arr2025[r.month - 1] = Number(r.amount); });

    const arr2026 = Array(12).fill(0);
    actuals2026rows
      .filter(r => r.outlet === outletName)
      .forEach(r => { arr2026[r.month - 1] = Number(r.amount); });

    const ytdActual  = arr2026.slice(0, monthsDone).reduce((s, v) => s + v, 0);
    const ytd2025    = arr2025.slice(0, monthsDone).reduce((s, v) => s + v, 0);
    const remain2025 = arr2025.slice(monthsDone).reduce((s, v) => s + v, 0);
    const full2025   = arr2025.reduce((s, v) => s + v, 0);
    const ytdGrowth  = ytd2025 > 0 ? (ytdActual - ytd2025) / ytd2025 : 0;

    const growthRate = ytdGrowth > 0.3
      ? ytdGrowth * 0.75
      : Math.max(ytdGrowth, -0.25);

    const monthlyForecast = [...arr2026];
    for (let i = monthsDone; i < 12; i++) {
      monthlyForecast[i] = Math.round(arr2025[i] * (1 + growthRate));
    }

    const forecastRemaining  = remain2025 * (1 + growthRate);
    const fullYearForecast   = ytdActual + forecastRemaining;
    const vsTarget           = target > 0 ? (fullYearForecast / target) * 100 : 0;

    const status: "on-track" | "caution" | "behind" =
      vsTarget >= 95 ? "on-track" :
      vsTarget >= 75 ? "caution"  : "behind";

    return {
      outlet:           outletName,
      target2026:       target,
      ytdActual,
      ytdGrowth:        ytdGrowth * 100,
      fullYearForecast: Math.round(fullYearForecast),
      forecastVsTarget: Math.round(vsTarget * 10) / 10,
      status,
      monthlyForecast,
      monthly2025:      arr2025,
      full2025,
    };
  });

  forecasts.sort((a, b) => b.fullYearForecast - a.fullYearForecast);

  const totalTarget   = Object.values(OUTLET_TARGETS_2026).reduce((s, v) => s + v, 0);
  const totalForecast = forecasts.reduce((s, f) => s + f.fullYearForecast, 0);
  const totalYtd      = forecasts.reduce((s, f) => s + f.ytdActual, 0);

  const totalMonthlyForecast = Array(12).fill(0);
  const totalMonthly2025     = Array(12).fill(0);
  forecasts.forEach(f => {
    f.monthlyForecast.forEach((v, i) => { totalMonthlyForecast[i] += v; });
    f.monthly2025.forEach((v, i)     => { totalMonthly2025[i]     += v; });
  });

  return apiOk({
    forecasts,
    summary: {
      totalTarget,
      totalYtd,
      totalForecast,
      forecastVsTarget: totalTarget > 0 ? Math.round((totalForecast / totalTarget) * 1000) / 10 : 0,
      total2025:        7149483.75,
      totalMonthlyForecast,
      totalMonthly2025,
    },
  });
}
