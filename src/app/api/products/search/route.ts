import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (!q) return apiOk([]);

  // Search Product War Room
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { productCode: { equals: q, mode: "insensitive" } },
        { productCode: { startsWith: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
      ],
    },
    select: {
      id: true, name: true, productCode: true,
      category: true, defaultUseCase: true, defaultTrigger: true,
      targetPrice: true, imageUrl: true,
    },
    take: 5,
  });

  // Search SKU Catalog (barcode exact match first, then stockCode / name)
  const skus = await prisma.skuCatalog.findMany({
    where: {
      isActive: true,
      OR: [
        { barcode:   { equals: q,   mode: "insensitive" } },
        { stockCode: { contains: q, mode: "insensitive" } },
        { name:      { contains: q, mode: "insensitive" } },
      ],
    },
    orderBy: [
      // Exact barcode matches float to the top
      { barcode: "asc" },
    ],
    take: 10,
  });

  // Convert SkuCatalog rows to ProductResult shape
  const skuResults = skus.map(s => ({
    id:             s.id,
    name:           s.name,
    productCode:    s.stockCode,
    category:       s.category,
    defaultUseCase: null as string | null,
    defaultTrigger: null as string | null,
    targetPrice:    s.price,
    imageUrl:       null as string | null,
  }));

  // War Room exact barcode/code matches take priority, then SKU catalog
  const merged = [...products, ...skuResults];
  return apiOk(merged.slice(0, 10));
}
