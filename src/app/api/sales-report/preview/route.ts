import { getSession, apiError, apiOk } from "@/lib/auth";
import * as XLSX from "xlsx";

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

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return apiError("No file");

  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(Buffer.from(buffer), { type: "buffer" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<(string | number | boolean)[]>(ws, { header: 1, defval: "" });

  if (raw.length < 2) return apiError("Empty file");

  const headerRow = raw[0] as (string | number | boolean)[];
  const cm = buildColMap(headerRow);

  const iSku     = colIdx(cm, "StockCode", "Stock Code", "SKU")                      ?? 1;
  const iDesc    = colIdx(cm, "StockDescription", "Stock Description", "Description") ?? 5;
  const iReceipt = colIdx(cm, "Description", "LineNo", "ReceiptNo")                  ?? 12;
  const iQty     = colIdx(cm, "Quantity", "Qty")                                     ?? 7;
  const iDisc    = colIdx(cm, "DiscAmount", "Disc Amount", "DiscAmt")                ?? 9;
  const iCog     = colIdx(cm, "C.O.G", "COG", "Cog")                                ?? 10;
  const iProfit  = colIdx(cm, "Profit", "Prof")                                      ?? 11;
  const iAmount  = colIdx(cm, "Amount", "Amou", "NetAmount")                         ?? 14;
  const iWh      = colIdx(cm, "WarehouseName", "Warehouse Name")                     ?? 18;

  const iReceiptFinal = iReceipt !== iDesc ? iReceipt : 12;

  const rows = [];
  let warehouseName = "";

  for (let i = 1; i < raw.length; i++) {
    const r = raw[i] as (string | number | boolean)[];
    if (!r[iSku]) continue;
    const amt    = Number(r[iAmount]) || 0;
    const disc   = Number(r[iDisc])   || 0;
    const qty    = Number(r[iQty])    || 0;
    const profit = Number(r[iProfit]) || 0;
    const cogs   = Number(r[iCog])    || 0;
    const wh     = String(r[iWh] ?? "").replace(/^TOP SHOP-/i, "").trim();
    if (!warehouseName && wh) warehouseName = wh;
    rows.push({
      sku:         String(r[iSku]          ?? "").trim(),
      description: String(r[iDesc]         ?? "").trim(),
      receiptNo:   String(r[iReceiptFinal] ?? ""),
      warehouse:   String(r[2]             ?? ""),
      qty,
      amount:      amt,
      profit,
      cogs,
      discAmt:     disc,
      grossAmt:    amt + disc,
      warehouseName: wh,
    });
  }

  const revenue     = rows.reduce((s, r) => s + r.amount, 0);
  const totalProfit = rows.reduce((s, r) => s + r.profit, 0);
  const totalQty    = rows.reduce((s, r) => s + r.qty, 0);
  const totalDisc   = rows.reduce((s, r) => s + r.discAmt, 0);

  const productMap: Record<string, { qty: number; amount: number; profit: number }> = {};
  for (const r of rows) {
    const name = r.description || r.sku || "Unknown";
    if (!productMap[name]) productMap[name] = { qty: 0, amount: 0, profit: 0 };
    productMap[name].qty    += r.qty;
    productMap[name].amount += r.amount;
    productMap[name].profit += r.profit;
  }
  const topProducts = Object.entries(productMap)
    .sort((a, b) => b[1].amount - a[1].amount)
    .slice(0, 10)
    .map(([name, d]) => ({ name, qty: d.qty, amount: d.amount, profit: d.profit }));

  return apiOk({ warehouseName, revenue, totalProfit, totalQty, totalDisc, rows, topProducts, totalRows: rows.length });
}
