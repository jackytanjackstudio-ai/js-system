import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";
import * as XLSX from "xlsx";

function getISOWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

type ExcelRow = {
  sku: string;
  description: string;      // receipt_no — col[12], used for customer grouping
  stockDescription: string; // product display name — col[5]
  colour: string;
  qty: number;
  grossAmt: number;         // amount + discAmt (computed)
  amount: number;           // net revenue — col[14]
  discAmt: number;          // discount given — col[9]
  cogs: number;
  profit: number;
  warehouseName: string;    // col[18], "TOP SHOP-" prefix stripped
  originalPrice: number;
  category2: string;        // col[16]
};

function buildColMap(header: (string | number | boolean)[]): Record<string, number> {
  const map: Record<string, number> = {};
  header.forEach((h, i) => {
    const key = String(h).toLowerCase().replace(/\s+/g, "");
    map[key] = i;
  });
  return map;
}

function colIdx(map: Record<string, number>, ...candidates: string[]): number | undefined {
  for (const c of candidates) {
    const k = c.toLowerCase().replace(/\s+/g, "");
    if (map[k] !== undefined) return map[k];
  }
  return undefined;
}

function parseExcel(buffer: ArrayBuffer): { rows: ExcelRow[]; warehouseName: string } {
  const wb = XLSX.read(Buffer.from(buffer), { type: "buffer" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<(string | number | boolean)[]>(ws, { header: 1, defval: "" });

  if (raw.length < 2) return { rows: [], warehouseName: "" };

  // Detect header row (first row with recognisable column names)
  const headerRow = raw[0] as (string | number | boolean)[];
  const cm = buildColMap(headerRow);

  // Column indices — fall back to hardcoded positions when header not found
  const iSku       = colIdx(cm, "StockCode", "Stock Code", "SKU")                     ?? 1;
  const iDesc      = colIdx(cm, "StockDescription", "Stock Description", "Description") ?? 5;
  const iReceipt   = colIdx(cm, "Description", "LineNo", "ReceiptNo")                  ?? 12;
  const iColour    = colIdx(cm, "Colour", "Color")                                     ?? 2;
  const iQty       = colIdx(cm, "Quantity", "Qty")                                     ?? 7;
  const iUnitPrice = colIdx(cm, "UnitPrice", "Unit Price", "UnitPri")                  ?? 8;
  const iDisc      = colIdx(cm, "DiscAmount", "Disc Amount", "DiscAmt")                ?? 9;
  const iCog       = colIdx(cm, "C.O.G", "COG", "Cog")                                ?? 10;
  const iProfit    = colIdx(cm, "Profit", "Prof")                                      ?? 11;
  const iAmount    = colIdx(cm, "Amount", "Amou", "NetAmount")                         ?? 14;
  const iCat2      = colIdx(cm, "Category2", "Category 2")                             ?? 16;
  const iWh        = colIdx(cm, "WarehouseName", "Warehouse Name")                     ?? 18;

  // When header detection gives same index for receipt and description, prefer col 12 for receipt
  const iReceiptFinal = iReceipt !== iDesc ? iReceipt : 12;

  const rows: ExcelRow[] = [];
  let warehouseName = "";

  for (let i = 1; i < raw.length; i++) {
    const r = raw[i] as (string | number | boolean)[];
    if (!r[iSku]) continue;
    const amt  = Number(r[iAmount])  || 0;
    const disc = Number(r[iDisc])    || 0;
    const row: ExcelRow = {
      sku:              String(r[iSku]          ?? "").trim(),
      stockDescription: String(r[iDesc]         ?? "").trim(),
      description:      String(r[iReceiptFinal] ?? ""),
      colour:           String(r[iColour]       ?? ""),
      qty:              Number(r[iQty])         || 0,
      amount:           amt,
      discAmt:          disc,
      grossAmt:         amt + disc,
      cogs:             Number(r[iCog])         || 0,
      profit:           Number(r[iProfit])      || 0,
      warehouseName:    String(r[iWh]           ?? "").replace(/^TOP SHOP-/i, "").trim(),
      originalPrice:    Number(r[iUnitPrice])   || 0,
      category2:        String(r[iCat2]         ?? "").trim(),
    };
    rows.push(row);
    if (!warehouseName && row.warehouseName) warehouseName = row.warehouseName;
  }

  return { rows, warehouseName };
}

// GET: list recent sales reports
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  const { searchParams } = new URL(req.url);

  // sales/manager scoped to their own outlet; admin/product sees all
  const canSeeAll = ["admin", "product", "manager"].includes(session.role);
  const outletId  = canSeeAll
    ? (searchParams.get("outletId") ?? undefined)
    : (session.outletId ?? undefined);

  const reports = await prisma.salesReport.findMany({
    where: outletId ? { outletId } : {},
    include: { outlet: { select: { name: true } }, user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return apiOk(reports);
}

// POST: upload Excel file — sales/manager/admin only
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (!["sales", "manager", "admin", "staff", "supervisor"].includes(session.role)) return apiError("Forbidden", 403);

  const formData = await req.formData();
  const file      = formData.get("file") as File | null;
  const outletId  = formData.get("outletId") as string | null;
  const weekStr   = formData.get("week") as string | null;
  const salesDate = formData.get("salesDate") as string | null;

  if (!file)     return apiError("No file uploaded");
  if (!outletId) return apiError("outletId required");

  const buffer = await file.arrayBuffer();
  const { rows, warehouseName } = parseExcel(buffer);

  if (!rows.length) return apiError("No data rows found in Excel file");

  // ── Duplicate guard ────────────────────────────────────────────────────────
  const force = formData.get("force") === "true";
  const week  = weekStr ?? getISOWeek(salesDate ? new Date(salesDate) : new Date());

  const existing = await prisma.salesReport.findFirst({
    where: salesDate
      ? { outletId, salesDate }
      : { outletId, week },
    include: { outlet: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  if (existing && !force) {
    return Response.json(
      {
        error:          "duplicate",
        existingId:     existing.id,
        existingDate:   existing.salesDate ?? existing.week,
        existingRevenue: existing.revenue,
        outletName:     existing.outlet.name,
      },
      { status: 409 }
    );
  }

  if (existing && force) {
    await prisma.salesReport.delete({ where: { id: existing.id } });
  }
  // ──────────────────────────────────────────────────────────────────────────

  // Aggregates
  const revenue     = rows.reduce((s, r) => s + r.amount, 0);
  const totalProfit = rows.reduce((s, r) => s + r.profit, 0);
  const totalCogs   = rows.reduce((s, r) => s + r.cogs, 0);
  const totalQty    = rows.reduce((s, r) => s + r.qty, 0);

  // Top products by revenue (amount)
  const productMap: Record<string, { qty: number; amount: number; profit: number }> = {};
  for (const r of rows) {
    const name = r.stockDescription || r.sku;
    if (!productMap[name]) productMap[name] = { qty: 0, amount: 0, profit: 0 };
    productMap[name].qty    += r.qty;
    productMap[name].amount += r.amount;
    productMap[name].profit += r.profit;
  }
  const ranked = Object.entries(productMap).sort((a, b) => b[1].amount - a[1].amount);
  const topProducts = ranked.slice(0, 10).map(([name, d]) => `${name} (${d.qty}pcs · RM${d.amount.toFixed(0)})`);

  const user = await prisma.user.findFirst({ where: { id: session.id } });
  if (!user) return apiError("User not found", 404);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const report = await (prisma.salesReport.create as any)({
    data: {
      userId:       session.id,
      outletId,
      week,
      salesDate:    salesDate ?? null,
      revenue:      Math.round(revenue * 100) / 100,
      totalProfit:  Math.round(totalProfit * 100) / 100,
      totalCogs:    Math.round(totalCogs * 100) / 100,
      totalQty,
      topProducts:  JSON.stringify(topProducts),
      slowProducts: JSON.stringify([]),
      lineItems:    JSON.stringify(rows.map(r => ({
        d: r.description,  // receipt_no for customer grouping
        s: r.sku,          // SKU for add-on detection
        n: r.stockDescription, // product name
        q: r.qty, g: r.grossAmt,
        a: r.amount, x: r.discAmt, c: r.cogs, p: r.profit,
        c2: r.category2 || undefined,
      }))),
      warehouseName,
    },
  });

  // Reward points
  await prisma.rewardPoint.create({
    data: {
      userId:   session.id,
      category: "sales_report",
      points:   10,
      reason:   "Uploaded sales report",
      weekRef:  week,
    },
  });

  // ── Write to DataHub — one entry per line item with qty > 0 ──
  const dhMonth = (salesDate ? new Date(salesDate) : new Date()).getMonth() + 1;
  const dhEntries = rows
    .filter(r => r.qty > 0)
    .map(r => ({
      type:     "sales",
      refId:    r.description,
      outletId,
      value:    r.qty,
      meta:     JSON.stringify({ amount: r.amount, source: "excel_upload", warehouseName }),
      week,
      month:    dhMonth,
    }));
  if (dhEntries.length > 0) {
    prisma.dataHubEntry.createMany({ data: dhEntries }).catch(() => { /* non-critical */ });
  }

  return apiOk({ report, totalRows: rows.length, revenue, totalProfit, totalQty }, 201);
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (!["admin", "manager"].includes(session.role)) return apiError("Forbidden", 403);

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return apiError("id required");

  await prisma.salesReport.delete({ where: { id } });
  return apiOk({ deleted: true });
}
