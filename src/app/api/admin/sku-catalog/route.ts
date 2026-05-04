import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";
import * as XLSX from "xlsx";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (!["admin", "manager"].includes(session.role)) return apiError("Forbidden", 403);

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

  // Skip header row, keep active & not deleted rows with a stockCode
  const rows = raw.slice(1).filter(r => r[0] && r[51] && !r[43]);

  if (!rows.length) return apiError("No valid rows found in file");

  let imported = 0;

  // Upsert in chunks of 50 to avoid overwhelming the connection
  const CHUNK = 50;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    await Promise.all(chunk.map(async r => {
      const stockCode = String(r[0] ?? "").trim();
      if (!stockCode) return;

      const barcode  = r[7] != null ? String(r[7]).trim() || null : null;
      const name     = String(r[3] ?? "").trim() || stockCode;
      const brand    = r[19] != null ? String(r[19]).trim() || null : null;
      const category = String(r[14] ?? r[13] ?? "").trim() || "General";
      const price    = Number(r[10]) || 0;

      await prisma.skuCatalog.upsert({
        where:  { stockCode },
        create: { stockCode, barcode, name, brand, category, price, isActive: true },
        update: { barcode, name, brand, category, price, isActive: true },
      });
      imported++;
    }));
  }

  return apiOk({ imported, total: rows.length });
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (!["admin", "manager"].includes(session.role)) return apiError("Forbidden", 403);

  const count = await prisma.skuCatalog.count();
  return apiOk({ count });
}
