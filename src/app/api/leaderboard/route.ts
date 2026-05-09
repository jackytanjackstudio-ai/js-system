import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";

type OsWeights = { customer_input: number; quick_log?: number; content: number; review: number; campaign: number };

// ── Anti-cheat: cap quick-log at 5 entries/day/user ──────────────────────────
function capDailyQuickLog(entries: { userId: string; createdAt: Date }[]): number[] {
  const byUserDay: Record<string, Record<string, number>> = {};
  for (const e of entries) {
    const day = e.createdAt.toISOString().slice(0, 10);
    if (!byUserDay[e.userId]) byUserDay[e.userId] = {};
    byUserDay[e.userId][day] = (byUserDay[e.userId][day] ?? 0) + 1;
  }
  return Object.values(byUserDay).flatMap(days =>
    Object.values(days).map(cnt => Math.min(cnt, 5))
  );
}

// ── Raw → normalized score (0-100) ───────────────────────────────────────────
function norm(raw: number, cap: number): number {
  return Math.min(Math.round((raw / cap) * 100), 100);
}

function mposScore(pct: number): number {
  if (pct >= 120) return 100;
  if (pct >= 100) return 80;
  if (pct >= 80)  return 60;
  return 40;
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  const { searchParams } = new URL(req.url);
  const periodId = searchParams.get("periodId") ?? undefined;

  // ── 1. Resolve period ────────────────────────────────────────────────────────
  const strategy = periodId
    ? await prisma.weightConfig.findUnique({ where: { id: periodId } })
    : await prisma.weightConfig.findFirst({ where: { isActive: true }, orderBy: { createdAt: "desc" } });

  if (!strategy) return apiOk({ staffRanking: [], storeRanking: [], strategy: null, strategies: [] });

  const weights: OsWeights = (() => {
    try { return JSON.parse(strategy.osWeights) as OsWeights; }
    catch { return { customer_input: 40, content: 20, review: 20, campaign: 20 }; }
  })();

  const start = new Date(strategy.startDate + "T00:00:00Z");
  const end   = new Date(strategy.endDate   + "T23:59:59Z");

  // ── 2. Fetch all data for the period ─────────────────────────────────────────
  const [users, outlets, mposScores, saleEntries, customerInputs, creatorContent, reviews, campaignTasks] = await Promise.all([
    prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, role: true, outletId: true },
    }),
    prisma.outlet.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    }),
    prisma.mposScore.findMany({ where: { periodId: strategy.id } }),
    prisma.saleEntry.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: { userId: true, outletId: true, createdAt: true },
    }),
    prisma.customerInput.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: { userId: true, outletId: true, customerName: true, customerPhone: true },
    }),
    prisma.creatorContent.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: { userId: true, signalScore: true, contentUrl: true },
    }),
    prisma.review.findMany({
      where: { createdAt: { gte: start, lte: end }, rating: { gte: 4 } },
      select: { store: true, rating: true, reviewText: true },
    }),
    prisma.campaignTask.findMany({
      where: { status: "completed", updatedAt: { gte: start, lte: end } },
      select: { assignedTo: true },
    }),
  ]);

  // ── 3. Build lookup maps ──────────────────────────────────────────────────────
  const mposMap: Record<string, number> = {};
  const mposPctMap: Record<string, number> = {};
  for (const m of mposScores) {
    mposMap[m.outletId] = m.score;
    mposPctMap[m.outletId] = m.achievementPercent;
  }

  // Customer Input: 3 pts base; +2 bonus if both customerName AND customerPhone are filled
  const ciByUser: Record<string, number> = {};
  for (const ci of customerInputs) {
    const base  = 3;
    const bonus = (ci.customerName && ci.customerPhone) ? 2 : 0;
    ciByUser[ci.userId] = (ciByUser[ci.userId] ?? 0) + base + bonus;
  }

  // Quick Log: per user, with daily cap
  const qlByUser: Record<string, number> = {};
  for (const e of saleEntries) {
    if (!qlByUser[e.userId]) qlByUser[e.userId] = 0;
    qlByUser[e.userId]++;
  }
  // Apply daily cap (5/day)
  const qlByUserCapped: Record<string, number> = {};
  const byUserDay: Record<string, Record<string, number>> = {};
  for (const e of saleEntries) {
    const day = e.createdAt.toISOString().slice(0, 10);
    if (!byUserDay[e.userId]) byUserDay[e.userId] = {};
    byUserDay[e.userId][day] = (byUserDay[e.userId][day] ?? 0) + 1;
  }
  for (const [uid, days] of Object.entries(byUserDay)) {
    qlByUserCapped[uid] = Object.values(days).reduce((s, n) => s + Math.min(n, 5), 0);
  }

  // Content: per user, dedup by contentUrl, high-score bonus
  const seenUrls = new Set<string>();
  const contentByUser: Record<string, number> = {};
  for (const c of creatorContent) {
    const url = c.contentUrl ?? "";
    if (url && seenUrls.has(url)) continue;
    if (url) seenUrls.add(url);
    if (!contentByUser[c.userId]) contentByUser[c.userId] = 0;
    contentByUser[c.userId] += 5;
    if (c.signalScore > 70) contentByUser[c.userId] += 10;
  }

  // Review: per outlet (store name → outletId match)
  const reviewByOutlet: Record<string, number> = {};
  for (const r of reviews) {
    const outlet = outlets.find(o =>
      o.name.toLowerCase().includes(r.store.toLowerCase()) ||
      r.store.toLowerCase().includes(o.name.toLowerCase())
    );
    const oid = outlet?.id ?? r.store;
    const words = r.reviewText.trim().split(/\s+/).length;
    const isQuality = words > 15;
    reviewByOutlet[oid] = (reviewByOutlet[oid] ?? 0) + (isQuality ? 5 : 2);
  }

  // Campaign: per user name
  const campaignByName: Record<string, number> = {};
  for (const t of campaignTasks) {
    if (!t.assignedTo) continue;
    campaignByName[t.assignedTo] = (campaignByName[t.assignedTo] ?? 0) + 5;
  }

  // ── 4. Calculate scores per staff ─────────────────────────────────────────────
  const MAX_CI = 60; const MAX_CONTENT = 150; const MAX_REVIEW = 50; const MAX_CAMPAIGN = 100;

  const staffRanking = users
    .filter(u => u.role !== "admin")
    .map(u => {
      const outletName = outlets.find(o => o.id === u.outletId)?.name ?? "";
      const mpos = mposMap[u.outletId ?? ""] ?? 0;

      const ciRaw       = ciByUser[u.id]                    ?? 0;
      const contentRaw  = contentByUser[u.id]                ?? 0;
      const reviewRaw   = reviewByOutlet[u.outletId ?? ""]   ?? 0;
      const campaignRaw = campaignByName[u.name]             ?? 0;

      const ci       = norm(ciRaw,       MAX_CI);
      const content  = norm(contentRaw,  MAX_CONTENT);
      const review   = norm(reviewRaw,   MAX_REVIEW);
      const campaign = norm(campaignRaw, MAX_CAMPAIGN);

      const osScore = Math.round(
        ci      * (weights.customer_input ?? 0) / 100 +
        content * weights.content / 100 +
        review  * weights.review  / 100 +
        campaign * weights.campaign / 100
      );

      const finalScore = Math.round(
        mpos * strategy.mposWeight / 100 +
        osScore * (100 - strategy.mposWeight) / 100
      );

      return {
        userId: u.id, name: u.name, role: u.role,
        outletId: u.outletId ?? "", outletName,
        mposScore: mpos,
        osScore,
        finalScore,
        breakdown: { customerInput: ci, content, review, campaign },
        rawCounts:  { customerInput: ciRaw, content: contentRaw, review: reviewRaw, campaign: campaignRaw },
      };
    })
    .sort((a, b) => b.finalScore - a.finalScore);

  // ── 5. Store ranking ───────────────────────────────────────────────────────────
  const storeMap: Record<string, { name: string; mpos: number; mposPct: number; finalScores: number[]; osScores: number[]; staffCount: number }> = {};
  for (const s of staffRanking) {
    if (!s.outletId) continue;
    if (!storeMap[s.outletId]) {
      storeMap[s.outletId] = {
        name: s.outletName,
        mpos: s.mposScore,
        mposPct: mposPctMap[s.outletId] ?? 0,
        finalScores: [], osScores: [], staffCount: 0,
      };
    }
    storeMap[s.outletId].finalScores.push(s.finalScore);
    storeMap[s.outletId].osScores.push(s.osScore);
    storeMap[s.outletId].staffCount++;
  }

  const storeRanking = Object.entries(storeMap)
    .map(([outletId, d]) => {
      const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((s, n) => s + n, 0) / arr.length) : 0;
      return {
        outletId, outletName: d.name,
        mposScore: d.mpos, mposPct: d.mposPct,
        avgFinalScore: avg(d.finalScores),
        avgOsScore:    avg(d.osScores),
        staffCount:    d.staffCount,
      };
    })
    .sort((a, b) => b.avgFinalScore - a.avgFinalScore);

  // ── 6. All strategies for period selector ─────────────────────────────────────
  const allStrategies = await prisma.weightConfig.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, startDate: true, endDate: true, isActive: true },
  });

  return apiOk({ strategy, weights, staffRanking, storeRanking, strategies: allStrategies });
}
