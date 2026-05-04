import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (!["admin", "manager", "product"].includes(session.role)) return apiError("Forbidden", 403);

  try {
    const { warRoomProductId, retailPrice, shortPitch, sku } = await req.json();
    if (!warRoomProductId) return apiError("warRoomProductId required");
    if (!sku?.trim())       return apiError("SKU is required");

    const src = await prisma.product.findUnique({ where: { id: warRoomProductId } });
    if (!src) return apiError("War Room product not found", 404);

    const skuClean = String(sku).trim().toUpperCase();
    const existing = await prisma.productMaster.findUnique({ where: { sku: skuClean } });
    if (existing) return apiError(`SKU "${skuClean}" already exists in Product Master`);

    const uc: string[] = (() => { try { return JSON.parse(src.useCase); } catch { return []; } })();
    const sp: string[] = (() => { try { return JSON.parse(src.sellingPoints || "[]"); } catch { return []; } })();

    const product = await prisma.productMaster.create({
      data: {
        sku:           skuClean,
        name:          src.name,
        category:      src.category.toLowerCase(),
        useCase:       (uc[0] ?? "daily").toLowerCase(),
        series:        "core",
        price:         Number(retailPrice) || (src.targetPrice ?? 0),
        status:        "selling",
        barcode:       src.productCode ?? null,
        mainImageUrl:  src.imageUrl ?? null,
        sellingPoints: JSON.stringify(sp),
        shortPitch:    shortPitch?.trim() || null,
        warRoomId:     src.id,
      },
      include: { media: true },
    });

    return apiOk(product, 201);
  } catch (err) {
    console.error("Promote error:", err);
    return apiError(err instanceof Error ? err.message : "Promote failed");
  }
}
