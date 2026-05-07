import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  const list = await prisma.roadshow.findMany({ orderBy: { startDate: "desc" } });
  return apiOk(list);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (!["admin", "manager"].includes(session.role)) return apiError("Forbidden", 403);

  const body = await req.json();
  if (!body.mallName || !body.startDate || !body.endDate) return apiError("mallName, startDate, endDate required");

  const record = await prisma.roadshow.create({
    data: {
      mallName:      body.mallName,
      startDate:     body.startDate,
      endDate:       body.endDate,
      sqFt:          body.sqFt ?? null,
      mission:       body.mission ?? "conversion",
      status:        body.status ?? "pending",
      pic:           body.pic ?? null,
      expectedSales: body.expectedSales ?? null,
      actualSales:   body.actualSales ?? null,
      notes:         body.notes ?? null,
      floorPlanUrls: JSON.stringify(body.floorPlanUrls ?? []),
      photoUrls:     JSON.stringify(body.photoUrls ?? []),
      postMortem:    body.postMortem ? JSON.stringify(body.postMortem) : null,
      partners:      JSON.stringify(body.partners ?? []),
    },
  });
  return apiOk(record, 201);
}
