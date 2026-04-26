import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";

function getISOWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function calcSignalScore(views: number, likes: number, comments: number, linkedSales: number): number {
  if (views === 0) return 0;
  const engagementRate = ((likes + comments) / views) * 100;
  const conversionBonus = linkedSales * 5;
  const commentBonus = comments > 500 ? 20 : comments > 100 ? 10 : 0;
  return Math.min(100, Math.round(engagementRate * 3 + conversionBonus + commentBonus));
}

// Extract product signals from raw comment text
function extractSignals(rawComments: string): string[] {
  const signals: string[] = [];
  const lower = rawComments.toLowerCase();

  const patterns: [RegExp, string][] = [
    [/bigger|larger|more space|compartment/i, "Bigger size / more compartments"],
    [/colour|color|brown|black|grey|blue|pink/i, "More colour options"],
    [/waterproof|water.?resist/i, "Waterproof feature"],
    [/price|expensive|cheap|affordable|rm\d/i, "Price sensitivity"],
    [/coin.?pocket|coin slot/i, "Coin pocket"],
    [/crossbody|strap|shoulder/i, "Crossbody / strap option"],
    [/cabin|carry.?on|travel/i, "Travel / cabin size"],
    [/slim|thin|compact/i, "Slim / compact design"],
    [/when.?(restock|available)|out.?of.?stock/i, "Restock demand"],
    [/where.?to.?buy|purchase|order/i, "Purchase intent"],
  ];

  for (const [regex, label] of patterns) {
    if (regex.test(lower)) signals.push(label);
  }
  return signals;
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  const { searchParams } = new URL(req.url);
  const week  = searchParams.get("week");
  const month = searchParams.get("month");

  const content = await prisma.creatorContent.findMany({
    where: {
      ...(week  ? { week }                   : {}),
      ...(month ? { month: parseInt(month) } : {}),
    },
    include: { user: { select: { name: true } } },
    orderBy: { signalScore: "desc" },
  });

  return apiOk(content);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (!["creator", "admin", "sales", "manager"].includes(session.role)) return apiError("Forbidden", 403);

  const body = await req.json();
  const {
    platform, title, contentUrl, contentType, productTags,
    views, likes, comments, linkedSales, topComment, productSignal,
  } = body;

  if (!platform || !title) return apiError("platform and title required");

  const now          = new Date();
  const week         = getISOWeek(now);
  const month        = now.getMonth() + 1;
  const signalScore  = calcSignalScore(views ?? 0, likes ?? 0, comments ?? 0, linkedSales ?? 0);
  const aiSignals    = topComment ? extractSignals(topComment) : [];
  const pushedToWarRoom = signalScore >= 70;

  const content = await prisma.creatorContent.create({
    data: {
      userId:         session.id,
      platform,
      title,
      contentUrl:     contentUrl ?? null,
      contentType:    contentType ?? null,
      productTags:    JSON.stringify(productTags ?? []),
      views:          views ?? 0,
      likes:          likes ?? 0,
      comments:       comments ?? 0,
      linkedSales:    linkedSales ?? 0,
      topComment:     topComment ?? null,
      productSignal:  productSignal ?? null,
      signalScore,
      aiSignals:      JSON.stringify(aiSignals),
      pushedToWarRoom,
      week,
      month,
    },
  });

  // Auto-push to War Room: create a product signal note if score >= 70
  if (pushedToWarRoom && productTags?.length > 0) {
    const tag = productTags[0];
    const existing = await prisma.product.findFirst({
      where: { name: { contains: tag, mode: "insensitive" } },
    });
    if (existing && existing.status === "Watchlist") {
      await prisma.product.update({
        where: { id: existing.id },
        data:  { notes: `${existing.notes ?? ""}\n[Auto-signal] ${title} — Score ${signalScore}`.trim() },
      });
    }
  }

  return apiOk({ ...content, aiSignals, signalScore, pushedToWarRoom }, 201);
}
