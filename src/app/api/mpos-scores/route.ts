import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";

function calcMposScore(pct: number): number {
  if (pct >= 120) return 100;
  if (pct >= 100) return 80;
  if (pct >= 80)  return 60;
  return 40;
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  const { searchParams } = new URL(req.url);
  const periodId = searchParams.get("periodId") ?? undefined;

  const scores = await prisma.mposScore.findMany({
    where: periodId ? { periodId } : {},
    orderBy: { createdAt: "desc" },
    include: { period: { select: { name: true } } },
  });

  return apiOk(scores);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (!["admin", "manager"].includes(session.role)) return apiError("Forbidden", 403);

  const body = await req.json() as {
    outletId: string;
    outletName: string;
    periodId: string;
    achievementPercent: number;
  };
  const { outletId, outletName, periodId, achievementPercent } = body;

  if (!outletId || !periodId || achievementPercent === undefined) {
    return apiError("outletId, periodId, achievementPercent required");
  }

  const score = calcMposScore(achievementPercent);

  const mpos = await prisma.mposScore.upsert({
    where: { outletId_periodId: { outletId, periodId } },
    update:  { outletName, achievementPercent, score },
    create:  { outletId, outletName, periodId, achievementPercent, score },
  });

  return apiOk(mpos);
}
