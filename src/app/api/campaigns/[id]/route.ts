import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  const { id } = await params;

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      vmGuide:     true,
      tasks:       { orderBy: { createdAt: "asc" } },
      submissions: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!campaign) return apiError("Not found", 404);
  return apiOk(campaign);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (!["admin", "manager", "product"].includes(session.role)) return apiError("Forbidden", 403);
  const { id } = await params;

  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (body.name        !== undefined) data.name        = body.name;
  if (body.type        !== undefined) data.type        = body.type;
  if (body.startDate   !== undefined) data.startDate   = body.startDate;
  if (body.endDate     !== undefined) data.endDate     = body.endDate;
  if (body.status      !== undefined) data.status      = body.status;
  if (body.salesScript !== undefined) data.salesScript = body.salesScript;
  if (body.channels    !== undefined) data.channels    = JSON.stringify(body.channels);
  if (body.objective   !== undefined) data.objective   = JSON.stringify(body.objective);
  if (body.mechanics   !== undefined) data.mechanics   = JSON.stringify(body.mechanics);
  if (body.contentPlan !== undefined) data.contentPlan = JSON.stringify(body.contentPlan);

  const campaign = await prisma.campaign.update({ where: { id }, data });
  return apiOk(campaign);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (!["admin", "manager", "product"].includes(session.role)) return apiError("Forbidden", 403);
  const { id } = await params;

  await prisma.campaign.delete({ where: { id } });
  return apiOk({ deleted: true });
}
