import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (!["admin", "manager", "product"].includes(session.role)) return apiError("Forbidden", 403);

  try {
    const { id } = await params;
    const body = await req.json();

    const data: Record<string, unknown> = {};
    const fields = ["name", "category", "useCase", "series", "price", "status", "barcode",
                    "mainImageUrl", "mediaFolderUrl", "shortPitch", "warRoomId"] as const;
    for (const f of fields) {
      if (body[f] !== undefined) data[f] = body[f] === "" ? null : body[f];
    }
    if (body.sellingPoints !== undefined) data.sellingPoints = JSON.stringify(body.sellingPoints);

    // Lowercase enum fields
    if (data.category) data.category = String(data.category).toLowerCase();
    if (data.useCase)  data.useCase  = String(data.useCase).toLowerCase();
    if (data.series)   data.series   = String(data.series).toLowerCase();

    const product = await prisma.productMaster.update({
      where: { id },
      data,
      include: { media: { orderBy: { sortOrder: "asc" } } },
    });

    return apiOk(product);
  } catch (err) {
    console.error("Product master patch error:", err);
    return apiError(err instanceof Error ? err.message : "Update failed");
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (!["admin", "manager", "product"].includes(session.role)) return apiError("Forbidden", 403);

  const { id } = await params;
  await prisma.productMaster.delete({ where: { id } });
  return apiOk({ ok: true });
}
