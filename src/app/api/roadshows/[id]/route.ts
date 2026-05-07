import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (!["admin", "manager"].includes(session.role)) return apiError("Forbidden", 403);

  const body = await req.json();
  const record = await prisma.roadshow.update({
    where: { id: params.id },
    data: {
      ...(body.mallName      !== undefined && { mallName: body.mallName }),
      ...(body.startDate     !== undefined && { startDate: body.startDate }),
      ...(body.endDate       !== undefined && { endDate: body.endDate }),
      ...(body.sqFt          !== undefined && { sqFt: body.sqFt }),
      ...(body.mission       !== undefined && { mission: body.mission }),
      ...(body.status        !== undefined && { status: body.status }),
      ...(body.pic           !== undefined && { pic: body.pic }),
      ...(body.expectedSales !== undefined && { expectedSales: body.expectedSales }),
      ...(body.actualSales   !== undefined && { actualSales: body.actualSales }),
      ...(body.notes         !== undefined && { notes: body.notes }),
      ...(body.floorPlanUrls !== undefined && { floorPlanUrls: JSON.stringify(body.floorPlanUrls) }),
      ...(body.photoUrls     !== undefined && { photoUrls: JSON.stringify(body.photoUrls) }),
      ...(body.postMortem    !== undefined && { postMortem: body.postMortem ? JSON.stringify(body.postMortem) : null }),
      ...(body.partners      !== undefined && { partners: JSON.stringify(body.partners) }),
    },
  });
  return apiOk(record);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (!["admin", "manager"].includes(session.role)) return apiError("Forbidden", 403);

  await prisma.roadshow.delete({ where: { id: params.id } });
  return apiOk({ deleted: params.id });
}
