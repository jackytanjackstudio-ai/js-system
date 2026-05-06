import OpenAI from "openai";
import { getSession, apiError, apiOk } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  if (!process.env.OPENAI_API_KEY) return apiError("OPENAI_API_KEY not configured", 500);

  const { comment } = await req.json() as { comment: string };
  if (!comment?.trim()) return apiError("comment is required");

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const res = await client.responses.create({
      model: "gpt-4o",
      input: `From this customer comment:\n"${comment}"\n\nExtract 3–5 short keywords that represent what customers care about.\n\nReturn JSON array only.\n\nExample:\n["size", "lightweight", "travel friendly"]`,
    });
    const arr = JSON.parse(res.output_text.trim());
    const keywords = Array.isArray(arr) ? (arr as string[]).slice(0, 5) : [];
    return apiOk({ keywords });
  } catch (err) {
    return apiError(err instanceof Error ? err.message : "Extraction failed", 500);
  }
}
