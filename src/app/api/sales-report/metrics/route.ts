import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";
import { normalizeRole } from "@/lib/permissions";

type LineItem = { d: string; s?: string; q: number; a: number; p: number };

function round2(n: number) { return Math.round(n * 100) / 100; }

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  const { searchParams } = new URL(req.url);
  const outletId = searchParams.get("outletId") ?? undefined;
  const from     = searchParams.get("from") ?? undefined;
  const to       = searchParams.get("to") ?? undefined;

  // Build where clause — outlet users are always scoped to their own outlet
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  const sessionRole = normalizeRole(session.role);
  const isOutletUser = ["supervisor", "staff"].includes(sessionRole);
  if (isOutletUser && session.outletId) {
    where.outletId = session.outletId;
  } else if (outletId) {
    where.outletId = outletId;
  }
  if (from || to) {
    where.salesDate = {
      ...(from ? { gte: from } : {}),
      ...(to   ? { lte: to   } : {}),
    };
  }

  const [reports, addons] = await Promise.all([
    prisma.salesReport.findMany({ where, select: { lineItems: true } }),
    prisma.addonPromotion.findMany({ where: { active: true } }),
  ]);

  // Parse all positive-qty line items across all matching reports
  const allItems: LineItem[] = [];
  for (const r of reports) {
    try {
      const items = JSON.parse(r.lineItems ?? "[]") as LineItem[];
      allItems.push(...items.filter(i => (i.q ?? 0) > 0));
    } catch { /* skip malformed */ }
  }

  // ── Customer count + ATV ─────────────────────────────────────────────────
  const receiptRevenue: Record<string, number> = {};
  for (const item of allItems) {
    if (!item.d) continue;
    receiptRevenue[item.d] = (receiptRevenue[item.d] ?? 0) + item.a;
  }
  const customerCount  = Object.keys(receiptRevenue).length;
  const totalRev       = Object.values(receiptRevenue).reduce((s, v) => s + v, 0);
  const atv            = customerCount > 0 ? totalRev / customerCount : 0;

  // ── Add-on analysis ──────────────────────────────────────────────────────
  const addonSkus = new Set(addons.map(a => a.sku));
  const addonReceipts = new Set<string>();
  for (const item of allItems) {
    if (item.d && item.s && addonSkus.has(item.s)) addonReceipts.add(item.d);
  }

  const addonReceiptArr = Array.from(addonReceipts);
  const atvWithAddon = addonReceiptArr.length > 0
    ? addonReceiptArr.reduce((s, rn) => s + (receiptRevenue[rn] ?? 0), 0) / addonReceiptArr.length
    : 0;

  const noAddonValues = Object.entries(receiptRevenue)
    .filter(([rn]) => !addonReceipts.has(rn))
    .map(([, v]) => v);
  const atvWithoutAddon = noAddonValues.length > 0
    ? noAddonValues.reduce((s, v) => s + v, 0) / noAddonValues.length
    : atv;

  // Per-addon breakdown
  const addonBreakdown = addons.map(promo => {
    const promoItems   = allItems.filter(i => i.s === promo.sku);
    const promoReceipts = new Set(promoItems.map(i => i.d).filter(Boolean) as string[]);
    const promoRevenue  = promoItems.reduce((s, i) => s + i.a, 0);
    const promoProfit   = promoItems.reduce((s, i) => s + i.p, 0);
    const promoReceiptArr = Array.from(promoReceipts);
    const promoATV      = promoReceiptArr.length > 0
      ? promoReceiptArr.reduce((s, rn) => s + (receiptRevenue[rn] ?? 0), 0) / promoReceiptArr.length
      : 0;
    return {
      sku:           promo.sku,
      promoName:     promo.promoName,
      addonPrice:    promo.addonPrice,
      originalPrice: promo.originalPrice,
      minSpend:      promo.minSpend,
      customersTook: promoReceipts.size,
      totalRevenue:  round2(promoRevenue),
      totalProfit:   round2(promoProfit),
      profitMargin:  promoRevenue > 0 ? round2((promoProfit / promoRevenue) * 100) : 0,
      atvWithAddon:  round2(promoATV),
      atvWithoutAddon: round2(atvWithoutAddon),
      atvUplift:     round2(promoATV - atvWithoutAddon),
      addonRate:     customerCount > 0 ? round2((promoReceipts.size / customerCount) * 100) : 0,
    };
  });

  return apiOk({
    customerCount,
    atv:             round2(atv),
    addonCustomers:  addonReceipts.size,
    atvWithAddon:    round2(atvWithAddon),
    atvWithoutAddon: round2(atvWithoutAddon),
    atvUplift:       round2(atvWithAddon - atvWithoutAddon),
    addonBreakdown,
    hasSkuData:      allItems.some(i => i.s),
    reportCount:     reports.length,
  });
}
