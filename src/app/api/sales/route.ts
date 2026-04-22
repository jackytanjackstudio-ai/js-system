import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  const { searchParams } = new URL(req.url);
  const outletId = searchParams.get("outletId");
  const week = searchParams.get("week");

  const reports = await prisma.salesReport.findMany({
    where: {
      ...(outletId ? { outletId } : {}),
      ...(week ? { week } : {}),
      ...(session.role === "sales" || session.role === "manager"
        ? { userId: session.id }
        : {}),
    },
    include: { outlet: { select: { name: true } }, user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return apiOk(reports);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  const body = await req.json();
  const { outletId, week, revenue, topProducts, slowProducts, quote, objection } = body;

  if (!outletId || !week) return apiError("outletId and week required");

  const report = await prisma.salesReport.create({
    data: {
      userId: session.id,
      outletId,
      week,
      revenue: parseFloat(revenue ?? 0),
      topProducts: JSON.stringify(topProducts ?? []),
      slowProducts: JSON.stringify(slowProducts ?? []),
      quote: quote ?? null,
      objection: objection ?? null,
    },
  });

  return apiOk(report, 201);
}
