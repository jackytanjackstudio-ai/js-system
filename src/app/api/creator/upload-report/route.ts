import * as XLSX from "xlsx";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";

type RawRow = (string | number | boolean)[];

function findHeaderRowIdx(raw: RawRow[]): number {
  for (let i = 0; i < Math.min(8, raw.length); i++) {
    const row = raw[i] as string[];
    if (row.includes("VV") && row.includes("Creator name")) return i;
  }
  return -1;
}

function pct(val: string | number | boolean): number {
  return parseFloat(String(val).replace("%", "")) || 0;
}

function extractDateRange(raw: RawRow[]): string {
  const first = String(raw[0]?.[0] ?? "");
  const m = first.match(/(\d{4}-\d{2}-\d{2}\s*~\s*\d{4}-\d{2}-\d{2})/);
  return m ? m[1].trim() : "";
}

function extractJson(text: string): unknown {
  try { return JSON.parse(text); } catch { /* */ }
  const m = text.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch { /* */ } }
  return null;
}

function buildSignalPrompt(
  dateRange: string,
  totalVideos: number,
  totalVV: number,
  totalGMV: number,
  avgFinishRate: number,
  topGMV: { caption: string; vv: number; shares: number; gmv: number; finishRate: number }[],
  topFinish: { caption: string; vv: number; gmv: number; finishRate: number }[],
  falseHooks: { caption: string; vv: number; finishRate: number }[],
): string {
  const fmtK = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

  const topGMVText = topGMV.map((v, i) =>
    `${i + 1}. GMV: RM${v.gmv.toFixed(0)} | Views: ${fmtK(v.vv)} | Finish: ${v.finishRate.toFixed(2)}% | Shares: ${v.shares}\n   Caption: "${v.caption.slice(0, 180)}"`
  ).join("\n\n");

  const topFinishText = topFinish.map((v, i) =>
    `${i + 1}. Finish: ${v.finishRate.toFixed(2)}% | Views: ${fmtK(v.vv)} | GMV: RM${v.gmv.toFixed(0)}\n   Caption: "${v.caption.slice(0, 180)}"`
  ).join("\n\n");

  const falseHookText = falseHooks.map((v, i) =>
    `${i + 1}. Views: ${fmtK(v.vv)} | Finish: ${v.finishRate.toFixed(2)}%\n   Caption: "${v.caption.slice(0, 150)}"`
  ).join("\n\n");

  return `You are an AI Content Intelligence Analyst for JackStudio, a Malaysian fashion accessories brand (bags, belts, wallets) with TikTok Shop presence.

Analyze this TikTok performance data and extract actionable intelligence.

PERFORMANCE SUMMARY:
- Period: ${dateRange || "recent"}
- Videos analyzed: ${totalVideos.toLocaleString()}
- Total views: ${fmtK(totalVV)}
- Total GMV: RM ${totalGMV.toFixed(2)}
- Avg video finish rate: ${avgFinishRate.toFixed(2)}%

TOP 10 BY GMV (Revenue Drivers):
${topGMVText}

TOP 10 BY FINISH RATE (Retention Champions — min 1,000 views):
${topFinishText}

HIGH-VIEW, LOW-FINISH (False Hook Alert):
${falseHookText}

Respond ONLY with valid JSON:
{
  "hookSignals": ["2–4 specific insights about hook styles, include data"],
  "themeSignals": ["2–4 insights about content themes and their GMV/engagement performance"],
  "audienceEmotions": ["2–4 emotions/desires driving this audience, infer from captions"],
  "alerts": ["2–3 specific underperforming patterns with data"],
  "recommendations": [
    { "action": "Push", "content": "specific campaign idea", "reason": "data-backed reason" },
    { "action": "Create", "content": "specific video concept", "reason": "data-backed reason" },
    { "action": "Product", "content": "specific product to feature", "reason": "data-backed reason" }
  ],
  "topPatterns": {
    "hooks": ["top 3 hook styles"],
    "themes": ["top 3 content themes"],
    "styles": ["top 3 visual/caption styles"]
  }
}

Be specific. Reference actual captions and numbers. Use Malaysian English context where relevant.`;
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return apiError("No file uploaded");

  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(Buffer.from(buffer), { type: "buffer" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<RawRow>(ws, { header: 1, defval: "" });

  const dateRange = extractDateRange(raw);
  const headerIdx = findHeaderRowIdx(raw);
  if (headerIdx === -1) return apiError("Could not detect TikTok report header row");

  const headers = raw[headerIdx] as string[];
  const dataRows = raw.slice(headerIdx + 1).filter(r => r[0]) as RawRow[];

  if (!dataRows.length) return apiError("No data rows found");

  // Column indices
  const col = (name: string) => headers.indexOf(name);
  const cVV       = col("VV");
  const cLikes    = col("Likes");
  const cComments = col("Comments");
  const cShares   = col("Shares");
  const cGMV      = col("Video-attributed GMV (RM)");
  const cFinish   = col("Video Finish Rate");
  const cCaption  = col("Video Info");
  const cCreator  = col("Creator name");
  const cCTOR     = col("CTOR (SKU order)");

  // Compute stats
  const totalVideos   = dataRows.length;
  const totalVV       = dataRows.reduce((s, r) => s + (Number(r[cVV]) || 0), 0);
  const totalGMV      = dataRows.reduce((s, r) => s + (Number(r[cGMV]) || 0), 0);
  const totalLikes    = dataRows.reduce((s, r) => s + (Number(r[cLikes]) || 0), 0);
  const totalShares   = dataRows.reduce((s, r) => s + (Number(r[cShares]) || 0), 0);
  const finishRates   = dataRows.map(r => pct(r[cFinish]));
  const avgFinishRate = finishRates.reduce((s, v) => s + v, 0) / (finishRates.length || 1);

  // Top 10 by GMV
  const topByGMV = [...dataRows]
    .sort((a, b) => (Number(b[cGMV]) || 0) - (Number(a[cGMV]) || 0))
    .slice(0, 10)
    .map(r => ({
      creator:    String(r[cCreator] ?? ""),
      caption:    String(r[cCaption] ?? ""),
      vv:         Number(r[cVV]) || 0,
      shares:     Number(r[cShares]) || 0,
      gmv:        Number(r[cGMV]) || 0,
      finishRate: pct(r[cFinish]),
      ctor:       pct(r[cCTOR]),
    }));

  // Top 10 by Finish Rate (min 1,000 views)
  const topByFinish = [...dataRows]
    .filter(r => (Number(r[cVV]) || 0) >= 1000)
    .sort((a, b) => pct(b[cFinish]) - pct(a[cFinish]))
    .slice(0, 10)
    .map(r => ({
      caption:    String(r[cCaption] ?? ""),
      vv:         Number(r[cVV]) || 0,
      gmv:        Number(r[cGMV]) || 0,
      finishRate: pct(r[cFinish]),
    }));

  // False Hooks: top 30 by VV, bottom 5 by finish rate
  const falseHooks = [...dataRows]
    .filter(r => (Number(r[cVV]) || 0) >= 5000)
    .sort((a, b) => pct(a[cFinish]) - pct(b[cFinish]))
    .slice(0, 5)
    .map(r => ({
      caption:    String(r[cCaption] ?? ""),
      vv:         Number(r[cVV]) || 0,
      finishRate: pct(r[cFinish]),
    }));

  // Save initial record
  const report = await prisma.tiktokReport.create({
    data: {
      userId:       session.id,
      fileName:     file.name,
      dateRange:    dateRange || null,
      totalVideos,
      totalVV,
      totalGMV:     Math.round(totalGMV * 100) / 100,
      avgFinishRate: Math.round(avgFinishRate * 100) / 100,
      topVideos:    JSON.stringify(topByGMV),
      status:       "ready",
    },
  });

  // Generate AI signals if OpenAI is configured
  if (process.env.OPENAI_API_KEY) {
    try {
      const client  = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const prompt  = buildSignalPrompt(dateRange, totalVideos, totalVV, totalGMV, avgFinishRate, topByGMV, topByFinish, falseHooks);
      const resp    = await client.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
      });
      const raw_text = resp.choices[0]?.message?.content ?? "";
      const signals  = extractJson(raw_text);
      if (signals) {
        await prisma.tiktokReport.update({
          where: { id: report.id },
          data: {
            signals: JSON.stringify({
              ...signals as object,
              _meta: {
                totalVV, totalGMV: Math.round(totalGMV * 100) / 100,
                totalLikes, totalShares, avgFinishRate: Math.round(avgFinishRate * 100) / 100,
              },
            }),
          },
        });
      }
    } catch { /* AI failed — report still saved with stats */ }
  } else {
    await prisma.tiktokReport.update({ where: { id: report.id }, data: { status: "no_ai" } });
  }

  const final = await prisma.tiktokReport.findUnique({ where: { id: report.id } });
  return apiOk(final, 201);
}
