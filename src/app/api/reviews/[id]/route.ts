import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  const body = await req.json();
  const { usedForContent, store, rating, reviewText, productTag } = body as {
    usedForContent?: boolean;
    store?: string;
    rating?: number;
    reviewText?: string;
    productTag?: string;
  };

  const review = await prisma.review.update({
    where: { id: params.id },
    data: {
      ...(usedForContent !== undefined ? { usedForContent } : {}),
      ...(store ? { store } : {}),
      ...(rating ? { rating } : {}),
      ...(reviewText ? { reviewText } : {}),
      ...(productTag ? { productTag } : {}),
    },
  });

  return apiOk(review);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (!["admin", "manager"].includes(session.role)) return apiError("Forbidden", 403);

  await prisma.review.delete({ where: { id: params.id } });
  return apiOk({ deleted: true });
}
