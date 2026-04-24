import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  const { outletId, outletName, confidenceScore, wouldSell, expectedSales, reason, staffName } = await req.json();
  if (!outletId || !outletName) return apiError("outletId and outletName required");

  const validation = await prisma.salesValidation.upsert({
    where: { productId_outletId: { productId: params.id, outletId } },
    update: {
      outletName,
      confidenceScore: confidenceScore ?? 0,
      wouldSell:       wouldSell ?? true,
      expectedSales:   expectedSales ?? 0,
      reason:          reason ?? null,
      staffName:       staffName ?? null,
    },
    create: {
      productId:      params.id,
      outletId,
      outletName,
      confidenceScore: confidenceScore ?? 0,
      wouldSell:       wouldSell ?? true,
      expectedSales:   expectedSales ?? 0,
      reason:          reason ?? null,
      staffName:       staffName ?? null,
    },
  });

  return apiOk(validation);
}
