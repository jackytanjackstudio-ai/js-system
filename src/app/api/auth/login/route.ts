import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { identifier, email: legacyEmail, password } = await req.json();
    const login = (identifier ?? legacyEmail ?? "").trim();
    if (!login || !password) {
      return NextResponse.json({ error: "Email / phone and password required" }, { status: 400 });
    }

    const isPhone = /^[0-9+\s\-()]{7,15}$/.test(login);
    const user = isPhone
      ? await prisma.user.findFirst({ where: { phone: login } })
      : await prisma.user.findUnique({ where: { email: login } });
    if (!user || !user.isActive) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await signToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      outletId: user.outletId ?? null,
    });

    const res = NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      outletId: user.outletId,
    });

    res.cookies.set("js_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return res;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
