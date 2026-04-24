import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";

function countTags(rows: { value: string }[]): { label: string; count: number }[] {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    try {
      const tags: string[] = JSON.parse(row.value || "[]");
      for (const tag of tags) {
        if (tag) counts[tag] = (counts[tag] ?? 0) + 1;
      }
    } catch { /* skip malformed */ }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, count }));
}

function buildAction(category: string, issue: string): string {
  const map: Record<string, string> = {
    "Design":     `Redesign ${category} — modern / premium direction`,
    "Size":       `Offer bigger size variant for ${category}`,
    "Price":      `Introduce lower price point for ${category}`,
    "Quality":    `Upgrade ${category} material & construction`,
    "Not urgent": `Add urgency — limited edition or bundle for ${category}`,
    "Function":   `Add functional features to ${category}`,
  };
  return map[issue] ?? `Review ${category} — address ${issue.toLowerCase()} feedback`;
}

const STOP_WORDS = new Set([
  "i", "a", "the", "is", "it", "in", "to", "for", "and", "or", "of",
  "my", "me", "this", "that", "have", "has", "do", "can", "be", "we",
  "are", "an", "im", "you", "he", "she", "they", "its", "but", "so",
  "if", "no", "not", "yes", "get", "got", "one", "more", "want", "need",
]);

function extractKeywords(quotes: (string | null)[]): { word: string; count: number }[] {
  const counts: Record<string, number> = {};
  for (const q of quotes) {
    if (!q) continue;
    const words = q.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/);
    for (const w of words) {
      if (w.length >= 3 && !STOP_WORDS.has(w)) {
        counts[w] = (counts[w] ?? 0) + 1;
      }
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word, count]) => ({ word, count }));
}

const ALL_CATEGORIES = ["Wallet", "Card Holder", "Bag", "Luggage", "Accessories", "Gift"];

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  const { searchParams } = new URL(req.url);
  const period   = searchParams.get("period") ?? "month";
  const outletId = searchParams.get("outletId") ?? undefined;

  const now      = new Date();
  const isoMonth = now.getMonth() + 1;

  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  const isoWeek = `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;

  const weekFilter  = period === "week"  ? isoWeek  : undefined;
  const monthFilter = period === "month" ? isoMonth : undefined;

  const [inputs, salesReports, creator, products, tasks] = await Promise.all([
    prisma.customerInput.findMany({
      where: {
        ...(weekFilter  ? { week: weekFilter }   : {}),
        ...(monthFilter ? { month: monthFilter } : {}),
        ...(outletId    ? { outletId }           : {}),
      },
      include: { outlet: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.salesReport.findMany({
      where: outletId ? { outletId } : {},
      include: { outlet: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.creatorContent.findMany({
      where: {
        ...(weekFilter  ? { week: weekFilter }   : {}),
        ...(monthFilter ? { month: monthFilter } : {}),
      },
      include: { user: { select: { name: true } } },
      orderBy: { views: "desc" },
      take: 20,
    }),
    prisma.product.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.executionTask.findMany({ orderBy: { due: "asc" } }),
  ]);

  // --- Standard aggregations ---
  const topDemands     = countTags(inputs.map(i => ({ value: i.lookingFor }))).slice(0, 8);
  const topReasons     = countTags(inputs.map(i => ({ value: i.nobuReasons }))).slice(0, 8);
  const topSuggestions = countTags(inputs.map(i => ({ value: i.suggestions }))).slice(0, 8);

  // --- Use Case Distribution ---
  const useCaseDistribution = countTags(inputs.map(i => ({ value: i.useCase ?? "[]" }))).slice(0, 6);

  // --- Valid inputs = inputs with at least one reason or a quote ---
  const validInputs = inputs.filter(i => {
    try { return (JSON.parse(i.nobuReasons) as string[]).length > 0 || !!i.quote; }
    catch { return !!i.quote; }
  });

  // --- Fit Gap Analysis (per category) ---
  const fitGap = ALL_CATEGORIES.map(cat => {
    const catInputs = inputs.filter(i => {
      try { return (JSON.parse(i.lookingFor) as string[]).includes(cat); } catch { return false; }
    });
    if (catInputs.length === 0) return null;

    const reasons = countTags(catInputs.map(i => ({ value: i.nobuReasons }))).slice(0, 5);
    const didNotBuy = catInputs.filter(i => {
      try { return (JSON.parse(i.nobuReasons) as string[]).length > 0; } catch { return false; }
    }).length;

    const topReason = reasons[0];
    const insight = topReason
      ? `${cat} demand is strong, but ${topReason.label.toLowerCase()} mismatch is the main issue`
      : `${cat} has demand — no specific issues logged yet`;

    return { category: cat, demand: catInputs.length, didNotBuy, reasons, insight };
  })
    .filter(Boolean)
    .sort((a, b) => b!.demand - a!.demand)
    .slice(0, 5) as { category: string; demand: number; didNotBuy: number; reasons: { label: string; count: number }[]; insight: string }[];

  // --- Opportunity Engine ---
  const maxDemand = Math.max(1, ...fitGap.map(f => f.demand));
  const opportunities = fitGap
    .map(f => {
      const demandScore = (f.demand / maxDemand) * 100;
      const fitRate     = f.demand > 0 ? f.didNotBuy / f.demand : 0;
      const score       = Math.round(demandScore * 0.5 + fitRate * 100 * 0.5);
      const topIssue    = f.reasons[0]?.label ?? "Unknown";
      return { category: f.category, fitIssue: topIssue, score, action: buildAction(f.category, topIssue) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((o, i) => ({ ...o, rank: i + 1 }));

  const highOpportunitySignals = opportunities.filter(o => o.score >= 60).length;

  // --- Customer Voice ---
  const quotedInputs  = inputs.filter(i => i.quote);
  const customerVoice = quotedInputs.slice(0, 6).map(i => ({
    quote:    i.quote!,
    outlet:   i.outlet.name,
    category: (() => { try { return (JSON.parse(i.lookingFor) as string[])[0] ?? ""; } catch { return ""; } })(),
  }));
  const topKeywords = extractKeywords(quotedInputs.map(i => i.quote));

  // --- Weekly trend ---
  const weekCounts: Record<string, number> = {};
  for (const inp of inputs) {
    const w = inp.week ?? inp.createdAt.toISOString().slice(0, 10);
    weekCounts[w] = (weekCounts[w] ?? 0) + 1;
  }
  const weeklyTrend = Object.entries(weekCounts)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([week, count]) => ({ week, count }));

  // --- Outlet breakdown ---
  const outletDemands: Record<string, Record<string, number>> = {};
  for (const inp of inputs) {
    const name = inp.outlet.name;
    if (!outletDemands[name]) outletDemands[name] = {};
    try {
      const tags: string[] = JSON.parse(inp.lookingFor || "[]");
      for (const tag of tags) outletDemands[name][tag] = (outletDemands[name][tag] ?? 0) + 1;
    } catch { /* skip */ }
  }
  const outletBreakdown = Object.entries(outletDemands)
    .map(([outlet, tags]) => ({
      outlet,
      top:   Object.entries(tags).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([tag, count]) => ({ tag, count })),
      total: Object.values(tags).reduce((s, n) => s + n, 0),
    }))
    .sort((a, b) => b.total - a.total);

  // --- Revenue trend ---
  const revenueByWeek: Record<string, number> = {};
  for (const r of salesReports) revenueByWeek[r.week] = (revenueByWeek[r.week] ?? 0) + r.revenue;
  const revenueTrend = Object.entries(revenueByWeek)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-8)
    .map(([week, revenue]) => ({ week, revenue }));

  // --- Creator signals ---
  const creatorSignals = creator
    .filter(c => c.productSignal)
    .map(c => ({ id: c.id, title: c.title, views: c.views, signal: c.productSignal!, creator: c.user.name, platform: c.platform }));

  // --- Visual Demand Trends ---
  const imageInputs = inputs.filter(i => i.imageUrl);
  const imageTagMap: Record<string, { count: number; imageUrls: string[]; categoryHints: string[] }> = {};
  for (const inp of imageInputs) {
    try {
      const tags: string[] = JSON.parse(inp.imageTags || "[]");
      const cats: string[] = JSON.parse(inp.lookingFor || "[]");
      const key = tags.length ? [...tags].sort().join(" · ") : cats.length ? [...cats].sort().join(" · ") : "Untagged";
      if (!imageTagMap[key]) imageTagMap[key] = { count: 0, imageUrls: [], categoryHints: [] };
      imageTagMap[key].count++;
      if (imageTagMap[key].imageUrls.length < 3) imageTagMap[key].imageUrls.push(inp.imageUrl!);
      for (const c of cats) {
        if (!imageTagMap[key].categoryHints.includes(c)) imageTagMap[key].categoryHints.push(c);
      }
    } catch { /* skip */ }
  }

  const mentionCounts: Record<string, number> = {};
  for (const inp of inputs) {
    try {
      const tags: string[] = JSON.parse(inp.lookingFor || "[]");
      for (const t of tags) mentionCounts[t] = (mentionCounts[t] ?? 0) + 1;
    } catch { /* skip */ }
  }

  const maxImageCount = Math.max(1, ...Object.values(imageTagMap).map(v => v.count));
  const maxMentions   = Math.max(1, ...Object.values(mentionCounts));

  const visualTrends = Object.entries(imageTagMap)
    .map(([tagKey, data]) => {
      const topCat   = data.categoryHints[0] ?? "";
      const mentions = mentionCounts[topCat] ?? 0;
      const imgScore = (data.count / maxImageCount) * 100;
      const menScore = (mentions / maxMentions) * 100;
      const score    = Math.round(imgScore * 0.5 + menScore * 0.3 + (data.count > 3 ? 20 : data.count * 5) * 0.2);
      const signal   = score >= 85 ? "🔥 High Potential" : score >= 70 ? "📈 Growing" : "👀 Watch";
      return { tagKey, tags: tagKey.split(" · "), count: data.count, imageUrls: data.imageUrls, categories: data.categoryHints.slice(0, 2), score, signal };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  const pendingTasks = tasks.filter(t => t.status !== "Completed").length;
  const overdueTasks = tasks.filter(t => t.status !== "Completed" && t.due < new Date().toISOString().slice(0, 10)).length;

  const testingProducts = products
    .filter(p => p.status === "Testing")
    .map(p => ({ id: p.id, name: p.name, category: p.category, stage: p.stage }));

  return apiOk({
    period,
    week:       isoWeek,
    month:      isoMonth,
    totalInputs: inputs.length,
    validInputs: validInputs.length,
    imageInputsCount: imageInputs.length,
    highOpportunitySignals,
    topDemands,
    topReasons,
    topSuggestions,
    useCaseDistribution,
    fitGap,
    opportunities,
    customerVoice,
    topKeywords,
    weeklyTrend,
    outletBreakdown,
    revenueTrend,
    creatorSignals,
    visualTrends,
    products: {
      total:     products.length,
      watchlist: products.filter(p => p.status === "Watchlist").length,
      testing:   products.filter(p => p.status === "Testing").length,
      scale:     products.filter(p => p.status === "Scale").length,
    },
    testingProducts,
    tasks: { pending: pendingTasks, overdue: overdueTasks },
  });
}
