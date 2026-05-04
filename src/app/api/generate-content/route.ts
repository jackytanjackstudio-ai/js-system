import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

type ContentType = "tiktok" | "sales" | "ecommerce" | "all";

interface ProductData {
  product_name: string;
  target_user: string | null;
  use_case: string;
  custom_selling_points: string[];
  sales_pitch: string | null;
  price: number;
  category: string;
  material: string | null;
  style: string | null;
}

function buildPrompt(product: ProductData, type: Exclude<ContentType, "all">): string {
  const base = `
产品名称：${product.product_name}
类别：${product.category}
目标用户：${product.target_user ?? "未指定"}
使用场景：${product.use_case}
核心卖点：${product.custom_selling_points.join(", ") || "未指定"}
一句话卖点：${product.sales_pitch ?? "未指定"}
价格：RM ${product.price}
材质：${product.material ?? "未指定"}
风格：${product.style ?? "未指定"}
`.trim();

  if (type === "tiktok") {
    return `你是一位TikTok带货高手，请写一个短视频脚本：

${base}

要求：
- 开头3秒要抓人眼球
- 有真实生活场景
- 强调核心卖点
- 结尾要有明确CTA（行动号召）
- 语气轻松自然，适合年轻人

请按以下格式输出：

Hook（前3秒）:
[内容]

Content（主体内容）:
[内容]

CTA（行动号召）:
[内容]`;
  }

  if (type === "sales") {
    return `你是一位专业的门店销售顾问，请写一段销售话术：

${base}

要求：
- 语气自然、有亲和力
- 突出产品价值而非价格
- 帮顾客想象使用场景
- 结尾有成交引导

请按以下格式输出：

1. 开场白:
[内容]

2. 推荐理由:
[内容]

3. 成交句:
[内容]`;
  }

  if (type === "ecommerce") {
    return `请写一份电商详情页文案：

${base}

要求：
- 标题吸引点击
- 卖点清晰有力
- 场景真实可信
- 转化文案有紧迫感

请按以下格式输出：

标题:
[内容]

核心卖点:
• [卖点1]
• [卖点2]
• [卖点3]

使用场景:
[内容]

转化文案:
[内容]`;
  }

  return base;
}

async function generateOne(product: ProductData, type: Exclude<ContentType, "all">): Promise<string> {
  const prompt = buildPrompt(product, type);
  const response = await getClient().chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 800,
  });
  return response.choices[0].message.content ?? "";
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

    const productData: ProductData = {
      product_name: product.name,
      target_user: product.targetUser,
      use_case: product.useCase,
      custom_selling_points: csp,
      sales_pitch: product.salesPitch,
      price: product.price,
      category: product.category,
      material: product.material,
      style: product.style,
    };

    const existing = (product.generatedContent ?? {}) as Record<string, string>;

    if (type === "all") {
      const [tiktok, sales, ecommerce] = await Promise.all([
        generateOne(productData, "tiktok"),
        generateOne(productData, "sales"),
        generateOne(productData, "ecommerce"),
      ]);

      const content = { ...existing, tiktok_script: tiktok, sales_script: sales, ecommerce_copy: ecommerce };
      await prisma.productMaster.update({ where: { id: product_id }, data: { generatedContent: content } });
      return apiOk({ tiktok_script: tiktok, sales_script: sales, ecommerce_copy: ecommerce });
    }

    const keyMap: Record<Exclude<ContentType, "all">, string> = {
      tiktok: "tiktok_script",
      sales: "sales_script",
      ecommerce: "ecommerce_copy",
    };

    const result = await generateOne(productData, type);
    const content = { ...existing, [keyMap[type]]: result };
    await prisma.productMaster.update({ where: { id: product_id }, data: { generatedContent: content } });

    return apiOk({ [keyMap[type]]: result });
  } catch (err) {
    console.error("Generate content error:", err);
    return apiError(err instanceof Error ? err.message : "Generation failed", 500);
  }
}
