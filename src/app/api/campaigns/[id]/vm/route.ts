import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  const { id } = await params;

  const vm = await prisma.vMGuide.findUnique({ where: { campaignId: id } });
  if (!vm) return apiError("Not found", 404);
  return apiOk(vm);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (!["admin", "manager"].includes(session.role)) return apiError("Forbidden", 403);
  const { id } = await params;

  const body = await req.json();
  const vm = await prisma.vMGuide.upsert({
    where: { campaignId: id },
    create: {
      campaignId: id,
      images:    JSON.stringify(body.images    ?? []),
      checklist: JSON.stringify(body.checklist ?? []),
    },
    update: {
      images:    body.images    !== undefined ? JSON.stringify(body.images)    : undefined,
      checklist: body.checklist !== undefined ? JSON.stringify(body.checklist) : undefined,
    },
  });
  return apiOk(vm);
}
