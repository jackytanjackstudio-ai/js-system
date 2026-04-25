import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "jackstudio-os-secret-fallback"
);

export type JWTPayload = {
  id: string;
  email: string;
  name: string;
  role: string;
  outletId?: string | null;
};

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("js_token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function apiError(msg: string, status = 400) {
  return Response.json({ error: msg }, { status });
}

export function apiOk(data: unknown, status = 200) {
  return Response.json(data, { status });
}
