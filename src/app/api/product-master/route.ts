import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  const { searchParams } = new URL(req.url);
  const q        = searchParams.get("q")?.trim() ?? "";
  const category = searchParams.get("category") ?? "";
  const useCase  = searchParams.get("useCase")  ?? "";
  const series   = searchParams.get("series")   ?? "";
  const status   = searchParams.get("status")   ?? "";

  const products = await prisma.productMaster.findMany({
    where: {
      AND: [
        q ? {
          OR: [
            { sku:  { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
            { barcode: { contains: q, mode: "insensitive" } },
          ],
        } : {},
        category ? { category: { equals: category, mode: "insensitive" } } : {},
        useCase  ? { useCase:  { equals: useCase,  mode: "insensitive" } } : {},
        series   ? { series:   { equals: series,   mode: "insensitive" } } : {},
        status   ? { status:   { equals: status,   mode: "insensitive" } } : {},
      ],
    },
    include: { media: { orderBy: { sortOrder: "asc" } } },
    orderBy: { updatedAt: "desc" },
  });

  return apiOk(products);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (!["admin", "manager", "product"].includes(session.role)) return apiError("Forbidden", 403);

  try {
    const body = await req.json();
    const { name, category, useCase, series, price, status, barcode,
            mainImageUrl, mediaFolderUrl, sellingPoints, shortPitch, warRoomId } = body;

    const sku = body.sku?.trim();
    if (!sku)              return apiError("SKU is required");
    if (!name?.trim())     return apiError("name is required");
    if (!category || !useCase) return apiError("category and useCase are required");

    const existing = await prisma.productMaster.findUnique({ where: { sku } });
    if (existing) return apiError(`SKU "${sku}" already exists`);

    const product = await prisma.productMaster.create({
      data: {
        sku,
        name:          name.trim(),
        category:      category.toLowerCase(),
        useCase:       useCase.toLowerCase(),
        series:        (series ?? "core").toLowerCase(),
        price:         Number(price) || 0,
        status:        status ?? "selling",
        barcode:       barcode?.trim() || null,
        mainImageUrl:  mainImageUrl?.trim() || null,
        mediaFolderUrl: mediaFolderUrl?.trim() || null,
        sellingPoints: JSON.stringify(sellingPoints ?? []),
        shortPitch:    shortPitch?.trim() || null,
        warRoomId:     warRoomId ?? null,
      },
      include: { media: true },
    });

    return apiOk(product, 201);
  } catch (err) {
    console.error("Product master create error:", err);
    return apiError(err instanceof Error ? err.message : "Create failed");
  }
}
