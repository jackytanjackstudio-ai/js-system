import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  const feedback = await prisma.systemFeedback.findMany({
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return apiOk(feedback);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  const body = await req.json();
  if (!body.insight) return apiError("insight required");

  const fb = await prisma.systemFeedback.create({
    data: {
      userId: session.id,
      week: body.week ?? `W${Math.ceil(new Date().getDate() / 7)}`,
      outlet: body.outlet ?? null,
      insight: body.insight,
      action: body.action ?? null,
      status: body.status ?? "pending",
      productId: body.productId ?? null,
      bonus: body.bonus ?? 0,
    },
  });

  return apiOk(fb, 201);
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (!["admin", "manager"].includes(session.role)) return apiError("Forbidden", 403);

  const body = await req.json();
  if (!body.id) return apiError("id required");

  const fb = await prisma.systemFeedback.update({
    where: { id: body.id },
    data: {
      ...(body.action !== undefined ? { action: body.action } : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
      ...(body.bonus !== undefined ? { bonus: body.bonus } : {}),
    },
  });

  return apiOk(fb);
}
