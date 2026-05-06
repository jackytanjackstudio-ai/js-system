import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";

function getISOWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  const { searchParams } = new URL(req.url);
  const outletId = searchParams.get("outletId") ?? undefined;
  const limit    = parseInt(searchParams.get("limit") ?? "50");

  const canSeeAll = ["admin", "product", "manager"].includes(session.role);
  const filterOutlet = canSeeAll ? outletId : (session.outletId ?? undefined);

  const entries = await prisma.saleEntry.findMany({
    where: filterOutlet ? { outletId: filterOutlet } : {},
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { user: { select: { name: true } }, outlet: { select: { name: true } } },
  });

  return apiOk(entries);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  const body = await req.json();
  const { productCode, productName, category, useCase, buyingTrigger,
          customerType, lostReason, addOns, outletId } = body;

  if (!productCode || !useCase || !buyingTrigger)
    return apiError("productCode, useCase, buyingTrigger are required");

  const now   = new Date();
  const week  = getISOWeek(now);
  const month = now.getMonth() + 1;

  const entry = await prisma.saleEntry.create({
    data: {
      userId:       session.id,
      outletId:     outletId ?? session.outletId ?? "",
      productCode,
      productName:  productName ?? "",
      category:     category ?? "",
      useCase,
      buyingTrigger,
      customerType: customerType ?? null,
      lostReason:   lostReason ?? null,
      addOns:       JSON.stringify(addOns ?? []),
      week,
      month,
    },
  });

  await prisma.rewardPoint.create({
    data: {
      userId:   session.id,
      category: "sale_log",
      points:   2,
      reason:   `Logged sale: ${productCode}`,
      weekRef:  week,
    },
  });

  // ── Write to DataHub (fire-and-forget, don't block response) ──
  const dhOutlet = outletId ?? session.outletId ?? "";
  Promise.all([
    prisma.dataHubEntry.create({
      data: {
        type:    "sales",
        refId:   productCode,
        outletId: dhOutlet,
        value:   1,
        meta:    JSON.stringify({ productName: productName ?? "", category: category ?? "", source: "quick_log" }),
        week,
        month,
      },
    }),
    prisma.dataHubEntry.create({
      data: {
        type:    "customer_reason",
        refId:   productCode,
        outletId: dhOutlet,
        value:   1,
        meta:    JSON.stringify({ reason: buyingTrigger, useCase, source: "quick_log" }),
        week,
        month,
      },
    }),
  ]).catch(() => { /* non-critical */ });

  return apiOk(entry, 201);
}
