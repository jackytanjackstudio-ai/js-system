import { getSession, apiError, apiOk } from "@/lib/auth";
import * as XLSX from "xlsx";

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

  const rows = [];
  let warehouseName = "";

  for (let i = 1; i < raw.length; i++) {
    const r = raw[i] as (string | number | boolean)[];
    if (!r[1]) continue;
    const qty    = Number(r[3]) || 0;
    const amount = Number(r[5]) || 0;
    const profit = Number(r[8]) || 0;
    const cogs   = Number(r[7]) || 0;
    const wh     = String(r[14] ?? "");
    if (!warehouseName && wh) warehouseName = wh;
    rows.push({
      description: String(r[1] ?? ""),
      warehouse:   String(r[2] ?? ""),
      qty, amount, profit, cogs,
      discAmt:     Number(r[6]) || 0,
      grossAmt:    Number(r[4]) || 0,
      warehouseName: wh,
    });
  }

  const revenue     = rows.reduce((s, r) => s + r.amount, 0);
  const totalProfit = rows.reduce((s, r) => s + r.profit, 0);
  const totalQty    = rows.reduce((s, r) => s + r.qty, 0);
  const totalDisc   = rows.reduce((s, r) => s + r.discAmt, 0);

  // Top 10 by amount
  const productMap: Record<string, { qty: number; amount: number; profit: number }> = {};
  for (const r of rows) {
    if (!productMap[r.description]) productMap[r.description] = { qty: 0, amount: 0, profit: 0 };
    productMap[r.description].qty    += r.qty;
    productMap[r.description].amount += r.amount;
    productMap[r.description].profit += r.profit;
  }
  const topProducts = Object.entries(productMap)
    .sort((a, b) => b[1].amount - a[1].amount)
    .slice(0, 10)
    .map(([name, d]) => ({ name, qty: d.qty, amount: d.amount, profit: d.profit }));

  return apiOk({ warehouseName, revenue, totalProfit, totalQty, totalDisc, rows, topProducts, totalRows: rows.length });
}
