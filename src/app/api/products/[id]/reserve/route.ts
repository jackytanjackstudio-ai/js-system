import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  const { outletId, outletName, quantity } = await req.json();
  if (!outletId || !outletName) return apiError("outletId and outletName required");

  const reservation = await prisma.reservation.upsert({
    where: { productId_outletId: { productId: params.id, outletId } },
    update: { outletName, quantity: quantity ?? 0 },
    create: { productId: params.id, outletId, outletName, quantity: quantity ?? 0 },
  });

  return apiOk(reservation);
}
