import OpenAI from "openai";
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

// Weighted score normalized to 0-100
// Divide by 1000 so 280K views → 84 pts (HIGH)
function calcScore(views: number, likes: number, comments: number, sales: number): number {
  const raw = views * 0.3 + likes * 0.2 + comments * 0.2 + sales * 0.3;
  return Math.min(100, Math.round(raw / 1000));
}

function perfLevel(score: number): "high" | "medium" | "low" {
  if (score > 80) return "high";
  if (score > 50) return "medium";
  return "low";
}

async function extractKeywords(comment: string): Promise<string[]> {
  if (!process.env.OPENAI_API_KEY) return [];
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  try {
    const res = await client.responses.create({
      model: "gpt-4o",
      input: `From this customer comment:\n"${comment}"\n\nExtract 3–5 short keywords that represent what customers care about.\n\nReturn JSON array only.\n\nExample:\n["size", "lightweight", "travel friendly"]`,
    });
    const arr = JSON.parse(res.output_text.trim());
    return Array.isArray(arr) ? (arr as string[]).slice(0, 5) : [];
  } catch {
    return [];
  }
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
  if (!["creator", "admin", "sales", "manager"].includes(session.role)) {
    return apiError("Forbidden", 403);
  }

  const body = await req.json();
  const {
    platform, title, contentUrl,
    views = 0, likes = 0, comments = 0, saves = 0, shares = 0, linkedSales = 0,
    topComment, objective = "traffic", productId,
    // legacy fields kept for backwards compat
    contentType, productTags, productSignal,
  } = body as {
    platform: string;
    title: string;
    contentUrl?: string;
    views?: number;
    likes?: number;
    comments?: number;
    saves?: number;
    shares?: number;
    linkedSales?: number;
    topComment?: string;
    objective?: string;
    productId?: string;
    contentType?: string;
    productTags?: string[];
    productSignal?: string;
  };

  if (!platform || !title) return apiError("platform and title required");
  if (!["traffic", "trust", "conversion"].includes(objective)) {
    return apiError("invalid objective");
  }

  const now  = new Date();
  const week = getISOWeek(now);
  const month = now.getMonth() + 1;

  const score = calcScore(views, likes, comments, linkedSales);
  const level = perfLevel(score);

  // AI keyword extraction from top comment
  const keywords: string[] = topComment ? await extractKeywords(topComment) : [];

  const pushedToWarRoom = level === "high";

  const content = await prisma.creatorContent.create({
    data: {
      userId:          session.id,
      platform,
      title,
      contentUrl:      contentUrl ?? null,
      contentType:     contentType ?? null,
      productTags:     JSON.stringify(productTags ?? []),
      views,
      likes,
      comments,
      saves,
      shares,
      linkedSales,
      topComment:      topComment ?? null,
      productSignal:   productSignal ?? null,
      signalScore:     score,
      aiSignals:       JSON.stringify(keywords),
      detectedKeywords: JSON.stringify(keywords),
      performanceLevel: level,
      objective,
      dataSource:      "manual",
      aiGenerated:     keywords.length > 0,
      productId:       productId ?? null,
      pushedToWarRoom,
      week,
      month,
    },
  });

  // Auto War Room signal when HIGH
  if (pushedToWarRoom && productId) {
    const product = await prisma.productMaster.findUnique({ where: { id: productId } });
    if (product) {
      await prisma.productMaster.update({
        where: { id: productId },
        data: {
          notes: `[Content Signal] ${platform} ${score}/100 — "${title}". Keywords: ${keywords.join(", ")}`,
        } as Parameters<typeof prisma.productMaster.update>[0]["data"],
      });
    }
  }

  return apiOk({
    ...content,
    detectedKeywords: keywords,
    signalScore: score,
    performanceLevel: level,
    pushedToWarRoom,
  }, 201);
}
