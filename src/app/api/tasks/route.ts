import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  const tasks = await prisma.executionTask.findMany({ orderBy: { due: "asc" } });
  return apiOk(tasks);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (!["admin", "manager"].includes(session.role)) return apiError("Forbidden", 403);

  const body = await req.json();
  if (!body.title || !body.type || !body.assignee || !body.due) {
    return apiError("title, type, assignee, due required");
  }

  const task = await prisma.executionTask.create({
    data: {
      title: body.title,
      type: body.type,
      assignee: body.assignee,
      due: body.due,
      status: body.status ?? "Not Started",
      result: body.result ?? null,
      productId: body.productId ?? null,
    },
  });

  return apiOk(task, 201);
}
