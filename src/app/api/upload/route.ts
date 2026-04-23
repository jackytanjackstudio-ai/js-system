import { put } from "@vercel/blob";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];
const MAX_BYTES     = 8 * 1024 * 1024; // 8MB

// Public route — used by unauthenticated QR form staff
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file || !file.size) return Response.json({ error: "No file provided" }, { status: 400 });
    if (!ALLOWED_TYPES.includes(file.type)) return Response.json({ error: "Only JPEG, PNG, WebP, HEIC allowed" }, { status: 400 });
    if (file.size > MAX_BYTES) return Response.json({ error: "File too large (max 8MB)" }, { status: 400 });

    const ext  = file.name.split(".").pop() ?? "jpg";
    const name = `inputs/${Date.now()}.${ext}`;

    const blob = await put(name, file, { access: "public" });
    return Response.json({ url: blob.url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Upload failed";
    return Response.json({ error: msg }, { status: 500 });
  }
}
