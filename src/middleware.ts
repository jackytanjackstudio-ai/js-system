import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_PATHS = ["/login", "/register", "/api/auth/login", "/api/auth/register", "/api/inputs", "/api/outlets/"];

function isPublic(pathname: string) {
  return (
    PUBLIC_PATHS.some(p => pathname.startsWith(p)) ||
    pathname.startsWith("/input/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon")
  );
}

function isApiRoute(pathname: string) {
  return pathname.startsWith("/api/");
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  const token = req.cookies.get("js_token")?.value;

  if (!token) {
    // API routes: return 401 JSON (don't redirect — clients handle it)
    if (isApiRoute(pathname)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? "jackstudio-os-secret-fallback");
    await jwtVerify(token, SECRET);
    return NextResponse.next();
  } catch {
    if (isApiRoute(pathname)) {
      const res = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      res.cookies.delete("js_token");
      return res;
    }
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete("js_token");
    return res;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
