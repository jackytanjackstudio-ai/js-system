import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  const [inputs, salesReports, products, tasks, feedback] = await Promise.all([
    prisma.customerInput.findMany({ include: { outlet: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.salesReport.findMany({ include: { outlet: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.product.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.executionTask.findMany({ orderBy: { due: "asc" } }),
    prisma.systemFeedback.findMany({ include: { user: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 10 }),
  ]);

  // Aggregate top requested items across all inputs
  const lookingForCounts: Record<string, number> = {};
  for (const inp of inputs) {
    const items: string[] = JSON.parse(inp.lookingFor || "[]");
    for (const item of items) lookingForCounts[item] = (lookingForCounts[item] ?? 0) + 1;
  }
  const topRequests = Object.entries(lookingForCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([item, count]) => ({ item, count }));

  // Weekly revenue (last 8 weeks from sales reports)
  const revenueByWeek: Record<string, number> = {};
  for (const r of salesReports) {
    revenueByWeek[r.week] = (revenueByWeek[r.week] ?? 0) + r.revenue;
  }

  // Outlet-level top products
  const productCounts: Record<string, number> = {};
  for (const r of salesReports) {
    const prods: string[] = JSON.parse(r.topProducts || "[]");
    for (const p of prods) productCounts[p] = (productCounts[p] ?? 0) + 1;
  }
  const topProducts = Object.entries(productCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  const pendingTasks = tasks.filter(t => t.status !== "Completed").length;
  const overdueTasks = tasks.filter(t => t.status !== "Completed" && t.due < new Date().toISOString().slice(0, 10)).length;
  const activeProducts = products.filter(p => p.status !== "Eliminated").length;

  return apiOk({
    topRequests,
    topProducts,
    weeklyRevenue: Object.entries(revenueByWeek).map(([week, revenue]) => ({ week, revenue })),
    recentFeedback: feedback,
    stats: {
      totalInputs: inputs.length,
      pendingTasks,
      overdueTasks,
      activeProducts,
      watchlistProducts: products.filter(p => p.status === "Watchlist").length,
      testingProducts: products.filter(p => p.status === "Testing").length,
      scaleProducts: products.filter(p => p.status === "Scale").length,
    },
  });
}
