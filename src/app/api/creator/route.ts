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
  const week  = searchParams.get("week");
  const month = searchParams.get("month");

  const content = await prisma.creatorContent.findMany({
    where: {
      ...(week  ? { week }                     : {}),
      ...(month ? { month: parseInt(month) }   : {}),
    },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return apiOk(content);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (!["creator", "admin"].includes(session.role)) return apiError("Forbidden", 403);

  const body = await req.json();
  const { platform, title, views, likes, comments, linkedSales, topComment, productSignal } = body;

  if (!platform || !title) return apiError("platform and title required");

  const now   = new Date();
  const week  = getISOWeek(now);
  const month = now.getMonth() + 1;

  const content = await prisma.creatorContent.create({
    data: {
      userId:        session.id,
      platform,
      title,
      views:         views ?? 0,
      likes:         likes ?? 0,
      comments:      comments ?? 0,
      linkedSales:   linkedSales ?? 0,
      topComment:    topComment ?? null,
      productSignal: productSignal ?? null,
      week,
      month,
    },
  });

  return apiOk(content, 201);
}
