import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  const body = await req.json();

  const task = await prisma.executionTask.update({
    where: { id: params.id },
    data: {
      ...(body.status !== undefined ? { status: body.status } : {}),
      ...(body.result !== undefined ? { result: body.result } : {}),
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.due !== undefined ? { due: body.due } : {}),
    },
  });

  return apiOk(task);
}
