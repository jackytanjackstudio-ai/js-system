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
  description: string;
  warehouse: string;
  qty: number;
  grossAmt: number;
  amount: number;
  discAmt: number;
  cogs: number;
  profit: number;
  stockDescription: string;
  warehouseName: string;
};

function parseExcel(buffer: ArrayBuffer): { rows: ExcelRow[]; warehouseName: string } {
  const wb = XLSX.read(Buffer.from(buffer), { type: "buffer" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<(string | number | boolean)[]>(ws, { header: 1, defval: "" });

  const rows: ExcelRow[] = [];
  let warehouseName = "";

  for (let i = 1; i < raw.length; i++) {
    const r = raw[i] as (string | number | boolean)[];
    if (!r[1]) continue; // skip empty rows
    const row: ExcelRow = {
      description:      String(r[1] ?? ""),
      warehouse:        String(r[2] ?? ""),
      qty:              Number(r[3]) || 0,
      grossAmt:         Number(r[4]) || 0,
      amount:           Number(r[5]) || 0,
      discAmt:          Number(r[6]) || 0,
      cogs:             Number(r[7]) || 0,
      profit:           Number(r[8]) || 0,
      stockDescription: String(r[10] ?? ""),
      warehouseName:    String(r[14] ?? ""),
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
  if (!["sales", "manager", "admin"].includes(session.role)) return apiError("Forbidden", 403);

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

  // Aggregates
  const revenue     = rows.reduce((s, r) => s + r.amount, 0);
  const totalProfit = rows.reduce((s, r) => s + r.profit, 0);
  const totalCogs   = rows.reduce((s, r) => s + r.cogs, 0);
  const totalQty    = rows.reduce((s, r) => s + r.qty, 0);

  // Top products by revenue (amount)
  const productMap: Record<string, { qty: number; amount: number; profit: number }> = {};
  for (const r of rows) {
    const name = r.description;
    if (!productMap[name]) productMap[name] = { qty: 0, amount: 0, profit: 0 };
    productMap[name].qty    += r.qty;
    productMap[name].amount += r.amount;
    productMap[name].profit += r.profit;
  }
  const ranked = Object.entries(productMap).sort((a, b) => b[1].amount - a[1].amount);
  const topProducts = ranked.slice(0, 10).map(([name, d]) => `${name} (${d.qty}pcs · RM${d.amount.toFixed(0)})`);

  const week = weekStr ?? getISOWeek(salesDate ? new Date(salesDate) : new Date());

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
        d: r.description, q: r.qty, g: r.grossAmt,
        a: r.amount, x: r.discAmt, c: r.cogs, p: r.profit,
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

  return apiOk({ report, totalRows: rows.length, revenue, totalProfit, totalQty }, 201);
}
