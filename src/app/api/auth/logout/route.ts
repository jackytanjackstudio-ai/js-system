import { cookies } from "next/headers";
import { apiOk } from "@/lib/auth";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("js_token");
  return apiOk({ ok: true });
}
