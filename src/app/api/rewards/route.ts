import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  const [points, feedback] = await Promise.all([
    prisma.rewardPoint.findMany({
      include: { user: { select: { name: true, role: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.systemFeedback.findMany({
      where: { bonus: { gt: 0 } },
      include: { user: { select: { name: true } } },
      orderBy: { bonus: "desc" },
    }),
  ]);

  // Build leaderboard
  const totals: Record<string, { name: string; role: string; total: number; breakdown: Record<string, number> }> = {};
  for (const p of points) {
    if (!totals[p.userId]) {
      totals[p.userId] = { name: p.user.name, role: p.user.role, total: 0, breakdown: {} };
    }
    totals[p.userId].total += p.points;
    totals[p.userId].breakdown[p.category] = (totals[p.userId].breakdown[p.category] ?? 0) + p.points;
  }

  const leaderboard = Object.entries(totals)
    .map(([userId, data]) => ({ userId, ...data }))
    .sort((a, b) => b.total - a.total);

  return apiOk({ leaderboard, points, impactBonuses: feedback });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (!["admin", "manager"].includes(session.role)) return apiError("Forbidden", 403);

  const body = await req.json();
  if (!body.userId || !body.category || body.points === undefined || !body.reason) {
    return apiError("userId, category, points, reason required");
  }

  const point = await prisma.rewardPoint.create({
    data: {
      userId: body.userId,
      category: body.category,
      points: body.points,
      reason: body.reason,
      weekRef: body.weekRef ?? null,
    },
  });

  return apiOk(point, 201);
}
