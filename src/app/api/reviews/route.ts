import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  const { searchParams } = new URL(req.url);
  const store = searchParams.get("store") ?? undefined;
  const productTag = searchParams.get("productTag") ?? undefined;

  const reviews = await prisma.review.findMany({
    where: {
      ...(store ? { store } : {}),
      ...(productTag ? { productTag } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return apiOk(reviews);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  const body = await req.json();
  const { store, rating, reviewText, productTag } = body as {
    store: string;
    rating: number;
    reviewText: string;
    productTag: string;
  };

  if (!store || !rating || !reviewText || !productTag) {
    return apiError("Missing required fields");
  }
  if (rating < 1 || rating > 5) return apiError("Rating must be 1–5");

  const review = await prisma.review.create({
    data: { store, rating, reviewText, productTag },
  });

  return apiOk(review, 201);
}
