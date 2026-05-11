import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (!["admin", "manager"].includes(session.role)) return apiError("Forbidden", 403);

  const { id } = await params;
  await prisma.creatorHubExample.delete({ where: { id } });
  return apiOk({ ok: true });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (!["admin", "manager"].includes(session.role)) return apiError("Forbidden", 403);

  const { id } = await params;
  const body = await req.json() as Partial<{ isFeatured: boolean }>;

  const example = await prisma.creatorHubExample.update({ where: { id }, data: body });
  return apiOk(example);
}
