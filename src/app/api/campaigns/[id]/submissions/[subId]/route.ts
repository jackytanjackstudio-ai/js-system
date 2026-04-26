import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; subId: string }> }) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (!["admin", "manager"].includes(session.role)) return apiError("Forbidden", 403);
  const { subId } = await params;

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.status           !== undefined) data.status           = body.status;
  if (body.displayScore     !== undefined) data.displayScore     = body.displayScore;
  if (body.complianceScore  !== undefined) data.complianceScore  = body.complianceScore;
  if (body.cleanlinessScore !== undefined) data.cleanlinessScore = body.cleanlinessScore;
  if (body.notes            !== undefined) data.notes            = body.notes;

  const sub = await prisma.vMSubmission.update({ where: { id: subId }, data });
  return apiOk(sub);
}
