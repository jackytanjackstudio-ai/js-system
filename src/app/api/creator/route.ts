import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  const content = await prisma.creatorContent.findMany({
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

  const content = await prisma.creatorContent.create({
    data: {
      userId: session.id,
      platform,
      title,
      views: views ?? 0,
      likes: likes ?? 0,
      comments: comments ?? 0,
      linkedSales: linkedSales ?? 0,
      topComment: topComment ?? null,
      productSignal: productSignal ?? null,
    },
  });

  return apiOk(content, 201);
}
