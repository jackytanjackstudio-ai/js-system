import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";

type LineItem = { d: string; s?: string; n?: string; q: number; a: number; p: number; c2?: string };

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  const { searchParams } = new URL(req.url);
  const outletId = searchParams.get("outletId") ?? undefined;
  const from     = searchParams.get("from") ?? undefined;
  const to       = searchParams.get("to") ?? undefined;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (outletId) where.outletId = outletId;
  if (from || to) {
    where.salesDate = {
      ...(from ? { gte: from } : {}),
      ...(to   ? { lte: to   } : {}),
    };
  }

  const reports = await prisma.salesReport.findMany({
    where,
    select: { lineItems: true },
  });

  // Aggregate by category2
  const catMap: Record<string, { qty: number; amount: number; products: Record<string, { qty: number; amount: number }> }> = {};

  for (const r of reports) {
    try {
      const items = JSON.parse(r.lineItems ?? "[]") as LineItem[];
      for (const item of items) {
        if ((item.q ?? 0) <= 0) continue;
        const cat = item.c2 || "Uncategorised";
        if (!catMap[cat]) catMap[cat] = { qty: 0, amount: 0, products: {} };
        catMap[cat].qty    += item.q;
        catMap[cat].amount += item.a;
        const name = item.n || item.s || "Unknown";
        if (!catMap[cat].products[name]) catMap[cat].products[name] = { qty: 0, amount: 0 };
        catMap[cat].products[name].qty    += item.q;
        catMap[cat].products[name].amount += item.a;
      }
    } catch { /* skip */ }
  }

  const categories = Object.entries(catMap)
    .filter(([name]) => name !== "Uncategorised")
    .sort((a, b) => b[1].amount - a[1].amount)
    .slice(0, 8)
    .map(([name, d]) => ({
      name,
      qty:    d.qty,
      amount: Math.round(d.amount * 100) / 100,
      topProducts: Object.entries(d.products)
        .sort((a, b) => b[1].amount - a[1].amount)
        .slice(0, 3)
        .map(([n, pd]) => ({ name: n, qty: pd.qty, amount: Math.round(pd.amount * 100) / 100 })),
    }));

  return apiOk({ categories, reportCount: reports.length });
}
