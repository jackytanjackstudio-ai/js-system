import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";
import * as XLSX from "xlsx";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (!["admin", "manager"].includes(session.role)) return apiError("Forbidden", 403);

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return apiError("No file uploaded");

    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(Buffer.from(buffer), { type: "buffer" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const raw = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(ws, {
      header: 1,
      defval: null,
    });

    // Build all items (active, not deleted, has stockCode)
    const items = raw.slice(1)
      .filter(r => r[0] && r[51] && !r[43])
      .map(r => {
        const now = new Date();
        return {
          id:        randomUUID(),
          stockCode: String(r[0] ?? "").trim(),
          barcode:   r[7] != null ? String(r[7]).trim() || null : null,
          name:      String(r[3] ?? "").trim() || String(r[0] ?? "").trim(),
          brand:     r[19] != null ? String(r[19]).trim() || null : null,
          category:  String(r[14] ?? r[13] ?? "").trim() || "General",
          price:     Number(r[10]) || 0,
          isActive:  true,
          createdAt: now,
          updatedAt: now,
        };
      });

    if (!items.length) return apiError("No valid rows found in file");

    // Deduplicate by stockCode — keep last occurrence per code
    const seen = new Map<string, typeof items[0]>();
    for (const item of items) seen.set(item.stockCode, item);
    const deduped = Array.from(seen.values());

    // Full replace: delete all → batch insert
    await prisma.skuCatalog.deleteMany({});

    const CHUNK = 500;
    for (let i = 0; i < deduped.length; i += CHUNK) {
      await prisma.skuCatalog.createMany({ data: deduped.slice(i, i + CHUNK) });
    }

    return apiOk({ imported: deduped.length, total: raw.length - 1, duplicatesRemoved: items.length - deduped.length });
  } catch (err) {
    console.error("SKU catalog import error:", err);
    return apiError(err instanceof Error ? err.message : "Import failed");
  }
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (!["admin", "manager"].includes(session.role)) return apiError("Forbidden", 403);

  const count = await prisma.skuCatalog.count();
  return apiOk({ count });
}
