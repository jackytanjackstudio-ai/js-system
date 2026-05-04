import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

type ContentType = "tiktok" | "sales" | "ecommerce" | "all";

interface ProductData {
  product_name: string;
  price: number;
  category: string;
  material: string | null;
  use_case: string;
  selling_points: string[];
  target_audience: string | null;
  sales_pitch: string | null;
  style: string | null;
}

const PROMPT_TEMPLATE = `
You are a top-tier retail content strategist specializing in fashion accessories.

Your task is to generate HIGH-CONVERTING content for 3 channels:
1. TikTok short video script (attention-grabbing, emotional)
2. Retail sales script (in-store conversion focused)
3. E-commerce product copy (clear, persuasive, structured)

IMPORTANT RULES:
- DO NOT use generic words like "high quality", "luxury", "perfect"
- ALWAYS translate features into REAL USER BENEFITS
- Focus on DAILY USAGE scenarios
- Use NATURAL spoken language (not corporate)
- Make it feel like real human selling, not AI
- Write in the same language as the product data (Chinese if data is Chinese, English if English)

OUTPUT FORMAT (STRICT — do not add extra headers or commentary):

[TIKTOK_SCRIPT]
Hook:
<first 3 seconds — one punchy line or visual action>

Body:
<main content — relatable scenario, key benefits woven in naturally>

Closing:
<strong CTA with price and urgency>

[SALES_SCRIPT]
Opening Question:
<question that makes customer think about their problem>

Recommendation:
<guide them to try/see the product, benefits in their words>

Objection Handling:
<one line that preempts price or hesitation>

Closing:
<natural close that feels like helping, not selling>

[ECOMMERCE]
Title:
<clickable title, specific benefit + product name>

Key Selling Points:
• <benefit 1 — concrete, not vague>
• <benefit 2 — concrete, not vague>
• <benefit 3 — concrete, not vague>

Usage Scenario:
<1–2 sentences painting a vivid daily-life picture>

Conversion CTA:
<urgency-driven closing line with price>
`.trim();

function buildPrompt(data: ProductData): string {
  const sp = data.selling_points.length > 0 ? data.selling_points.join(", ") : "Not specified";
  return `PRODUCT DATA:
Name: ${data.product_name}
Price: RM ${data.price}
Category: ${data.category}
Material: ${data.material ?? "Not specified"}
Style: ${data.style ?? "Not specified"}
Use Case: ${data.use_case}
Selling Points: ${sp}
Sales Pitch: ${data.sales_pitch ?? "Not specified"}
Target Audience: ${data.target_audience ?? "Not specified"}
Brand: JackStudio

${PROMPT_TEMPLATE}

Now generate the output.`;
}

function parseSection(text: string, tag: string): string {
  const regex = new RegExp(`\\[${tag}\\]([\\s\\S]*?)(?=\\[|$)`, "i");
  const match = text.match(regex);
  return match ? match[1].trim() : "";
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (!["admin", "manager", "product"].includes(session.role)) return apiError("Forbidden", 403);

  if (!process.env.OPENAI_API_KEY) {
    return apiError("OPENAI_API_KEY is not configured", 500);
  }

  try {
    const body = await req.json();
    const { product_id, type } = body as { product_id: string; type: ContentType };

    if (!product_id) return apiError("product_id is required");
    if (!["tiktok", "sales", "ecommerce", "all"].includes(type)) return apiError("invalid type");

    const product = await prisma.productMaster.findUnique({ where: { id: product_id } });
    if (!product) return apiError("Product not found", 404);

    const csp: string[] = (() => { try { return JSON.parse(product.customSellingPoints); } catch { return []; } })();
    const sp: string[]  = (() => { try { return JSON.parse(product.sellingPoints); } catch { return []; } })();

    const productData: ProductData = {
      product_name:    product.name,
      price:           product.price,
      category:        product.category,
      material:        product.material,
      style:           product.style,
      use_case:        product.useCase,
      selling_points:  [...csp, ...sp].filter(Boolean),
      sales_pitch:     product.salesPitch ?? product.shortPitch,
      target_audience: product.targetUser,
    };

    const prompt = buildPrompt(productData);

    const response = await getClient().responses.create({
      model: "gpt-4o",
      input: prompt,
    });

    const fullText = response.output_text;

    const tiktok    = parseSection(fullText, "TIKTOK_SCRIPT");
    const sales     = parseSection(fullText, "SALES_SCRIPT");
    const ecommerce = parseSection(fullText, "ECOMMERCE");

    const existing = (product.generatedContent ?? {}) as Record<string, string>;

    if (type === "all") {
      const content = { ...existing, tiktok_script: tiktok, sales_script: sales, ecommerce_copy: ecommerce };
      await prisma.productMaster.update({ where: { id: product_id }, data: { generatedContent: content } });
      return apiOk({ tiktok_script: tiktok, sales_script: sales, ecommerce_copy: ecommerce });
    }

    const keyMap: Record<Exclude<ContentType, "all">, string> = {
      tiktok:    "tiktok_script",
      sales:     "sales_script",
      ecommerce: "ecommerce_copy",
    };
    const sectionMap: Record<Exclude<ContentType, "all">, string> = {
      tiktok:    tiktok,
      sales:     sales,
      ecommerce: ecommerce,
    };

    const result = sectionMap[type as Exclude<ContentType, "all">];
    const content = { ...existing, [keyMap[type as Exclude<ContentType, "all">]]: result };
    await prisma.productMaster.update({ where: { id: product_id }, data: { generatedContent: content } });

    return apiOk({ [keyMap[type as Exclude<ContentType, "all">]]: result });
  } catch (err) {
    console.error("Generate content error:", err);
    return apiError(err instanceof Error ? err.message : "Generation failed", 500);
  }
}
