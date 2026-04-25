import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET env var is required in production");
}

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "jackstudio-os-dev-fallback"
);

export type JWTPayload = {
  id: string;
  email: string;
  name: string;
  role: string;
  outletId?: string | null;
};

export type Role = "admin" | "manager" | "product" | "sales" | "creator";

// Role hierarchy — higher index = more access
const ROLE_RANK: Record<string, number> = {
  sales: 1, creator: 1,
  manager: 2,
  product: 3,
  admin: 99,
};

export function hasRole(session: JWTPayload, ...allowed: Role[]): boolean {
  return (allowed as string[]).includes(session.role);
}

export function isAdmin(session: JWTPayload): boolean {
  return session.role === "admin";
}

export function requireRole(session: JWTPayload | null, ...allowed: Role[]) {
  if (!session) return apiError("Unauthorized", 401);
  if (!hasRole(session, ...allowed)) return apiError("Forbidden", 403);
  return null;
}

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
