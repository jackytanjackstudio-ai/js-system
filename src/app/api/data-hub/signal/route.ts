import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  const { searchParams } = new URL(req.url);
  const week  = searchParams.get("week")  ?? undefined;
  const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : undefined;

  const where = {
    ...(week  ? { week }   : {}),
    ...(month ? { month }  : {}),
  };

  const [salesEntries, reasonEntries] = await Promise.all([
    prisma.dataHubEntry.findMany({
      where: { type: "sales", ...where },
      select: { refId: true, value: true, meta: true, outletId: true },
    }),
    prisma.dataHubEntry.findMany({
      where: { type: "customer_reason", ...where },
      select: { refId: true, meta: true, outletId: true },
    }),
  ]);

  // ── Top Products by volume ──────────────────────────────────────────────────
  const productMap: Record<string, { qty: number; name: string; revenue: number }> = {};
  for (const e of salesEntries) {
    const meta = (() => { try { return JSON.parse(e.meta); } catch { return {}; } })();
    const name = (meta.productName as string) || e.refId;
    if (!productMap[e.refId]) productMap[e.refId] = { qty: 0, name, revenue: 0 };
    productMap[e.refId].qty     += e.value;
    productMap[e.refId].revenue += (meta.amount as number) || 0;
  }
  const topProducts = Object.values(productMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10);

  // ── Why People Buy (buying triggers) ───────────────────────────────────────
  const reasonCounts: Record<string, number> = {};
  for (const e of reasonEntries) {
    const meta = (() => { try { return JSON.parse(e.meta); } catch { return {}; } })();
    const reason = meta.reason as string;
    if (reason) reasonCounts[reason] = (reasonCounts[reason] ?? 0) + 1;
  }
  const whyBuy = Object.entries(reasonCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([reason, count]) => ({ reason, count }));

  // ── Use Case breakdown ──────────────────────────────────────────────────────
  const useCaseCounts: Record<string, number> = {};
  for (const e of reasonEntries) {
    const meta = (() => { try { return JSON.parse(e.meta); } catch { return {}; } })();
    const uc = meta.useCase as string;
    if (uc) useCaseCounts[uc] = (useCaseCounts[uc] ?? 0) + 1;
  }
  const whyUseCase = Object.entries(useCaseCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([useCase, count]) => ({ useCase, count }));

  // ── Product × Reason (top 5 products with their top reasons) ───────────────
  const productReasonMap: Record<string, Record<string, number>> = {};
  for (const e of reasonEntries) {
    const meta = (() => { try { return JSON.parse(e.meta); } catch { return {}; } })();
    const reason = meta.reason as string;
    if (!reason) continue;
    if (!productReasonMap[e.refId]) productReasonMap[e.refId] = {};
    productReasonMap[e.refId][reason] = (productReasonMap[e.refId][reason] ?? 0) + 1;
  }

  // Get top 5 products by reason count, attach their name from productMap
  const productInsights = Object.entries(productReasonMap)
    .map(([refId, reasons]) => {
      const total = Object.values(reasons).reduce((s, n) => s + n, 0);
      const topReasons = Object.entries(reasons)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([reason, count]) => ({ reason, count }));
      const productInfo = productMap[refId];
      return {
        refId,
        name: productInfo?.name ?? refId,
        totalSales: productInfo?.qty ?? 0,
        totalRevenue: productInfo?.revenue ?? 0,
        totalReasons: total,
        topReasons,
      };
    })
    .sort((a, b) => b.totalSales - a.totalSales)
    .slice(0, 5);

  // ── Outlet leaderboard ──────────────────────────────────────────────────────
  const outletSales: Record<string, number> = {};
  for (const e of salesEntries) {
    outletSales[e.outletId] = (outletSales[e.outletId] ?? 0) + e.value;
  }
  const outletLeaderboard = Object.entries(outletSales)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([outletId, qty]) => ({ outletId, qty }));

  const totalUnits   = salesEntries.reduce((s, e) => s + e.value, 0);
  const totalEntries = salesEntries.length + reasonEntries.length;

  return apiOk({
    topProducts,
    whyBuy,
    whyUseCase,
    productInsights,
    outletLeaderboard,
    totalUnits,
    totalEntries,
  });
}
