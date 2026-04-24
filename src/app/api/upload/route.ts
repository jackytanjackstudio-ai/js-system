import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Public route — used by unauthenticated QR form staff
export async function POST(req: Request) {
  try {
    const form = await req.formData();

    // Accept either a File or a raw base64 data URL string
    const file   = form.get("file") as File | null;
    const base64 = form.get("base64") as string | null;

    let dataUri: string;

    if (base64) {
      // Already a data URL from client-side Canvas resize
      dataUri = base64;
    } else if (file && file.size) {
      const buf = await file.arrayBuffer();
      const b64 = Buffer.from(buf).toString("base64");
      const mime = file.type || "image/jpeg";
      dataUri = `data:${mime};base64,${b64}`;
    } else {
      return Response.json({ error: "No image provided" }, { status: 400 });
    }

    const result = await cloudinary.uploader.upload(dataUri, {
      folder:         "jackstudio/inputs",
      transformation: [{ width: 800, height: 800, crop: "limit", quality: "auto:good", fetch_format: "auto" }],
    });

    return Response.json({ url: result.secure_url, publicId: result.public_id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Upload failed";
    return Response.json({ error: msg }, { status: 500 });
  }
}
