import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (!["admin", "product"].includes(session.role)) return apiError("Forbidden", 403);

  const body = await req.json();

  const product = await prisma.product.update({
    where: { id: params.id },
    data: {
      ...(body.name         !== undefined ? { name: body.name }                           : {}),
      ...(body.category     !== undefined ? { category: body.category }                   : {}),
      ...(body.status       !== undefined ? { status: body.status }                       : {}),
      ...(body.stage        !== undefined ? { stage: body.stage }                         : {}),
      ...(body.hitRate      !== undefined ? { hitRate: body.hitRate }                     : {}),
      ...(body.signalSource !== undefined ? { signalSource: body.signalSource }           : {}),
      ...(body.notes        !== undefined ? { notes: body.notes }                         : {}),
      ...(body.decisionDate !== undefined ? { decisionDate: body.decisionDate }           : {}),
      ...(body.tasks        !== undefined ? { tasks: JSON.stringify(body.tasks) }         : {}),
      ...(body.targetPrice  !== undefined ? { targetPrice: body.targetPrice }             : {}),
      ...(body.cost         !== undefined ? { cost: body.cost }                           : {}),
      ...(body.imageUrl     !== undefined ? { imageUrl: body.imageUrl }                                       : {}),
      ...(body.imageUrls    !== undefined ? { imageUrls: JSON.stringify(body.imageUrls) }                    : {}),
      ...(body.useCase      !== undefined ? { useCase: JSON.stringify(body.useCase) }     : {}),
      ...(body.style        !== undefined ? { style: body.style }                         : {}),
      ...(body.demandScore  !== undefined ? { demandScore: body.demandScore }             : {}),
    },
    include: { validations: true, reservations: true },
  });

  return apiOk(product);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (session.role !== "admin") return apiError("Forbidden", 403);

  await prisma.product.delete({ where: { id: params.id } });
  return apiOk({ deleted: true });
}
