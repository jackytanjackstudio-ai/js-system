import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  const { id } = await params;

  const tasks = await prisma.campaignTask.findMany({
    where: { campaignId: id },
    orderBy: { createdAt: "asc" },
  });
  return apiOk(tasks);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (!["admin", "manager"].includes(session.role)) return apiError("Forbidden", 403);
  const { id } = await params;

  const body = await req.json();
  if (!body.taskName) return apiError("taskName required");

  const task = await prisma.campaignTask.create({
    data: {
      campaignId: id,
      taskName:   body.taskName,
      category:   body.category   ?? "general",
      assignedTo: body.assignedTo ?? null,
      deadline:   body.deadline   ?? null,
      outletId:   body.outletId   ?? null,
      status:     "pending",
    },
  });
  return apiOk(task, 201);
}
