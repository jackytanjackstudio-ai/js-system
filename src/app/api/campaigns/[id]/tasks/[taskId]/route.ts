import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; taskId: string }> }) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  const { taskId } = await params;

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.status     !== undefined) data.status     = body.status;
  if (body.assignedTo !== undefined) data.assignedTo = body.assignedTo;
  if (body.deadline   !== undefined) data.deadline   = body.deadline;

  const task = await prisma.campaignTask.update({ where: { id: taskId }, data });
  return apiOk(task);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; taskId: string }> }) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (!["admin", "manager"].includes(session.role)) return apiError("Forbidden", 403);
  const { taskId } = await params;

  await prisma.campaignTask.delete({ where: { id: taskId } });
  return apiOk({ deleted: true });
}
