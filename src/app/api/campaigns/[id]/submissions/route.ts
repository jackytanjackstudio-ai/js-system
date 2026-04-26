import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  const { id } = await params;

  const submissions = await prisma.vMSubmission.findMany({
    where: { campaignId: id },
    orderBy: { createdAt: "desc" },
  });
  return apiOk(submissions);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  const { id } = await params;

  const body = await req.json();
  if (!body.outletId || !body.outletName) return apiError("outletId and outletName required");

  const now = new Date().toISOString();

  const existing = await prisma.vMSubmission.findFirst({
    where: { campaignId: id, outletId: body.outletId },
  });

  let sub;
  if (existing) {
    sub = await prisma.vMSubmission.update({
      where: { id: existing.id },
      data: {
        imageUrls:   JSON.stringify(body.imageUrls ?? []),
        status:      "submitted",
        submittedAt: now,
      },
    });
  } else {
    sub = await prisma.vMSubmission.create({
      data: {
        campaignId:  id,
        outletId:    body.outletId,
        outletName:  body.outletName,
        imageUrls:   JSON.stringify(body.imageUrls ?? []),
        status:      "submitted",
        submittedAt: now,
      },
    });
  }
  return apiOk(sub, 201);
}
