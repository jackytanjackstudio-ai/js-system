import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function parseSection(text: string, tag: string): string {
  const regex = new RegExp(`\\[${tag}\\]([\\s\\S]*?)(?=\\[|$)`, "i");
  const match = text.match(regex);
  return match ? match[1].trim() : "";
}

function buildPrompt(store: string, rating: number, reviewText: string, productTag: string): string {
  const stars = "★".repeat(rating) + "☆".repeat(5 - rating);
  return `You are a top-tier retail content strategist for JackStudio, a fashion accessories brand.

A real customer left this review:
Store: ${store}
Rating: ${stars} (${rating}/5)
Product: ${productTag}
Review: "${reviewText}"

Your task: Transform this real customer review into HIGH-CONVERTING content for 3 channels.

IMPORTANT RULES:
- Use the customer's exact sentiments and words as proof points
- DO NOT use generic words like "high quality", "luxury", "perfect"
- ALWAYS translate features into REAL USER BENEFITS
- Make the customer's voice the hero — this is social proof
- Use NATURAL spoken language (not corporate)
- Keep it authentic to what the customer actually experienced

OUTPUT FORMAT (STRICT — do not add extra headers or commentary):

[TIKTOK_SCRIPT]
Hook:
<first 3 seconds — use a hook that references what the customer said>

Body:
<main content — weave in the customer review as social proof, relatable scenario>

Closing:
<strong CTA with product tag and urgency>

[SALES_SCRIPT]
Opening Question:
<question that surfaces the same need this customer had>

Recommendation:
<guide them to try/see the product, using what the review mentioned>

Objection Handling:
<one line using the customer rating as social proof>

Closing:
<natural close that feels like helping, not selling>

[ECOMMERCE]
Title:
<clickable title, specific benefit + product tag>

Key Selling Points:
• <benefit 1 — drawn from the review, concrete>
• <benefit 2 — concrete, not vague>
• <benefit 3 — concrete, not vague>

Customer Proof:
${stars} "${reviewText.slice(0, 100)}${reviewText.length > 100 ? "…" : ""}" — ${store}

Conversion CTA:
<urgency-driven closing line>

Now generate the output.`;
}

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (!["admin", "manager", "product"].includes(session.role)) return apiError("Forbidden", 403);

  if (!process.env.OPENAI_API_KEY) return apiError("OPENAI_API_KEY is not configured", 500);

  const review = await prisma.review.findUnique({ where: { id: params.id } });
  if (!review) return apiError("Review not found", 404);

  try {
    const prompt = buildPrompt(review.store, review.rating, review.reviewText, review.productTag);

    const response = await getClient().responses.create({
      model: "gpt-4o",
      input: prompt,
    });

    const fullText = response.output_text;
    const tiktok = parseSection(fullText, "TIKTOK_SCRIPT");
    const sales = parseSection(fullText, "SALES_SCRIPT");
    const ecommerce = parseSection(fullText, "ECOMMERCE");

    await prisma.review.update({
      where: { id: params.id },
      data: { usedForContent: true },
    });

    return apiOk({ tiktok_script: tiktok, sales_script: sales, ecommerce_copy: ecommerce });
  } catch (err) {
    console.error("Review generate error:", err);
    return apiError(err instanceof Error ? err.message : "Generation failed", 500);
  }
}
