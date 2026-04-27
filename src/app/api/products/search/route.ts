import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (!q) return apiOk([]);

  const products = await prisma.product.findMany({
    where: {
      OR: [
        { productCode: { equals: q, mode: "insensitive" } },
        { productCode: { startsWith: q, mode: "insensitive" } },
        { name:        { contains: q, mode: "insensitive" } },
      ],
    },
    select: {
      id: true, name: true, productCode: true,
      category: true, defaultUseCase: true, defaultTrigger: true,
      targetPrice: true, imageUrl: true,
    },
    take: 10,
  });

  return apiOk(products);
}
