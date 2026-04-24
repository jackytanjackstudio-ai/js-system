import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { name, email, password, outletId, phone } = await req.json();

    if (!name?.trim())     return NextResponse.json({ error: "Name is required" },     { status: 400 });
    if (!email?.trim())    return NextResponse.json({ error: "Email is required" },    { status: 400 });
    if (!password)         return NextResponse.json({ error: "Password is required" }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existing) return NextResponse.json({ error: "This email is already registered" }, { status: 409 });

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name:     name.trim(),
        email:    email.toLowerCase().trim(),
        password: hashed,
        role:     "sales",
        outletId: outletId || null,
        phone:    phone?.trim() || null,
        isActive: true,
      },
    });

    // Auto sign-in after register
    const token = await signToken({ id: user.id, email: user.email, name: user.name, role: user.role });

    const res = NextResponse.json({
      id: user.id, name: user.name, email: user.email, role: user.role,
    }, { status: 201 });

    res.cookies.set("js_token", token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge:   60 * 60 * 24 * 7,
      path:     "/",
    });

    return res;
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
