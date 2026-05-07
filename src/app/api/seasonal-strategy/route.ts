import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  const list = await prisma.seasonalStrategy.findMany({ orderBy: { createdAt: "desc" } });
  return apiOk(list);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (!["admin", "manager"].includes(session.role)) return apiError("Forbidden", 403);

  const body = await req.json();
  if (!body.quarter || !body.theme || !body.heroProduct) return apiError("quarter, theme, heroProduct required");

  // If setting as active, deactivate others first
  if (body.isActive) await prisma.seasonalStrategy.updateMany({ data: { isActive: false } });

  const record = await prisma.seasonalStrategy.create({
    data: {
      quarter:           body.quarter,
      theme:             body.theme,
      heroProduct:       body.heroProduct,
      supportingItems:   JSON.stringify(body.supportingItems ?? []),
      contentDirections: JSON.stringify(body.contentDirections ?? []),
      vmDirection:       body.vmDirection ?? "",
      keySignal:         body.keySignal ?? "",
      backupStrategy:    body.backupStrategy ?? "",
      isActive:          body.isActive ?? false,
    },
  });
  return apiOk(record, 201);
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (!["admin", "manager"].includes(session.role)) return apiError("Forbidden", 403);

  const body = await req.json();
  if (!body.id) return apiError("id required");

  if (body.isActive) await prisma.seasonalStrategy.updateMany({ where: { id: { not: body.id } }, data: { isActive: false } });

  const record = await prisma.seasonalStrategy.update({
    where: { id: body.id },
    data: {
      ...(body.quarter !== undefined && { quarter: body.quarter }),
      ...(body.theme !== undefined && { theme: body.theme }),
      ...(body.heroProduct !== undefined && { heroProduct: body.heroProduct }),
      ...(body.supportingItems !== undefined && { supportingItems: JSON.stringify(body.supportingItems) }),
      ...(body.contentDirections !== undefined && { contentDirections: JSON.stringify(body.contentDirections) }),
      ...(body.vmDirection !== undefined && { vmDirection: body.vmDirection }),
      ...(body.keySignal !== undefined && { keySignal: body.keySignal }),
      ...(body.backupStrategy !== undefined && { backupStrategy: body.backupStrategy }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    },
  });
  return apiOk(record);
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (!["admin", "manager"].includes(session.role)) return apiError("Forbidden", 403);

  const { id } = await req.json();
  if (!id) return apiError("id required");
  await prisma.seasonalStrategy.delete({ where: { id } });
  return apiOk({ deleted: id });
}
