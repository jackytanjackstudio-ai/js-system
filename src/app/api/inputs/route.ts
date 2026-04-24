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
  const outletId = searchParams.get("outletId");
  const week     = searchParams.get("week");
  const month    = searchParams.get("month");
  const limit    = parseInt(searchParams.get("limit") ?? "50");

  const inputs = await prisma.customerInput.findMany({
    where: {
      ...(outletId ? { outletId } : {}),
      ...(week     ? { week }     : {}),
      ...(month    ? { month: parseInt(month) } : {}),
    },
    include: { outlet: { select: { name: true } }, user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return apiOk(inputs);
}

// POST is public — used from /input/[outlet] by staff without accounts
export async function POST(req: Request) {
  const body = await req.json();
  const { outletId, staffName, lookingFor, nobuReasons, suggestions, quote, customerName, customerPhone, imageUrl, imageTags, useCase } = body;

  if (!outletId || !staffName) return apiError("outletId and staffName required");

  let user = await prisma.user.findFirst({ where: { name: staffName, outletId } });
  if (!user) user = await prisma.user.findFirst({ where: { name: staffName } });
  if (!user) user = await prisma.user.findFirst({ where: { role: "admin" } });
  if (!user) return apiError("No user found", 500);

  const now   = new Date();
  const week  = getISOWeek(now);
  const month = now.getMonth() + 1;

  const [input] = await prisma.$transaction([
    prisma.customerInput.create({
      data: {
        userId:        user.id,
        outletId,
        staffName:     staffName ?? null,
        lookingFor:    JSON.stringify(lookingFor ?? []),
        nobuReasons:   JSON.stringify(nobuReasons ?? []),
        suggestions:   JSON.stringify(suggestions ?? []),
        quote:         quote ?? null,
        week,
        month,
        customerName:  customerName ?? null,
        customerPhone: customerPhone ?? null,
        imageUrl:      imageUrl ?? null,
        imageTags:     JSON.stringify(imageTags ?? []),
        useCase:       JSON.stringify(useCase ?? []),
      },
    }),
    prisma.rewardPoint.create({
      data: {
        userId:   user.id,
        category: "customer_input",
        points:   5,
        reason:   "Submitted customer input",
        weekRef:  week,
      },
    }),
  ]);

  // Return stats for success screen
  const weekCount = await prisma.customerInput.count({ where: { week } });

  const allThisWeek = await prisma.customerInput.findMany({
    where: { week },
    select: { lookingFor: true },
  });
  const tagCounts: Record<string, number> = {};
  for (const inp of allThisWeek) {
    try {
      const tags: string[] = JSON.parse(inp.lookingFor || "[]");
      for (const tag of tags) tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
    } catch { /* skip */ }
  }
  const topDemand = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return apiOk({ input, weekCount, topDemand }, 201);
}
