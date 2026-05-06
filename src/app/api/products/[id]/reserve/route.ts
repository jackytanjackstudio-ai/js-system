import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  const body = await req.json() as {
    outletId: string;
    outletName: string;
    quantity?: number;
    colourBreakdown?: Record<string, number>;
    signalTag?: string | null;
  };
  const { outletId, outletName, colourBreakdown } = body;
  if (!outletId || !outletName) return apiError("outletId and outletName required");

  const quantity = colourBreakdown
    ? Object.values(colourBreakdown).reduce((s, n) => s + (Number(n) || 0), 0)
    : (body.quantity ?? 0);

  const reservation = await prisma.reservation.upsert({
    where: { productId_outletId: { productId: params.id, outletId } },
    update: {
      outletName,
      quantity,
      colourBreakdown: colourBreakdown ? JSON.stringify(colourBreakdown) : "{}",
      signalTag: body.signalTag ?? null,
      submittedBy: session.id,
    },
    create: {
      productId: params.id,
      outletId,
      outletName,
      quantity,
      colourBreakdown: colourBreakdown ? JSON.stringify(colourBreakdown) : "{}",
      signalTag: body.signalTag ?? null,
      submittedBy: session.id,
    },
  });

  return apiOk(reservation);
}
