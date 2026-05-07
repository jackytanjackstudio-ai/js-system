import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (!["admin", "manager"].includes(session.role)) return apiError("Forbidden", 403);

  const staff = await prisma.user.findMany({
    select: {
      id: true, name: true, email: true, role: true,
      outletId: true, isActive: true, createdAt: true,
      outlet: { select: { name: true } },
    },
    orderBy: { name: "asc" },
  });

  return apiOk(staff);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (session.role !== "admin") return apiError("Forbidden", 403);

  const body = await req.json();
  if (!body.name || !body.email || !body.role) return apiError("name, email, role required");

  const pw = await bcrypt.hash(body.password ?? "jackstudio2026", 10);

  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      password: pw,
      role: body.role,
      outletId: body.outletId ?? null,
      phone: body.phone ?? null,
    },
    select: { id: true, name: true, email: true, role: true, outletId: true, isActive: true },
  });

  return apiOk(user, 201);
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (session.role !== "admin") return apiError("Forbidden", 403);

  const { id } = await req.json();
  if (!id) return apiError("id required");
  if (id === session.id) return apiError("Cannot delete your own account", 400);

  await prisma.user.delete({ where: { id } });
  return apiOk({ deleted: id });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (session.role !== "admin") return apiError("Forbidden", 403);

  const body = await req.json();
  if (!body.id) return apiError("id required");

  const pwHash = body.password ? await bcrypt.hash(body.password, 10) : undefined;

  const user = await prisma.user.update({
    where: { id: body.id },
    data: {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.role !== undefined ? { role: body.role } : {}),
      ...(body.outletId !== undefined ? { outletId: body.outletId } : {}),
      ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
      ...(pwHash ? { password: pwHash } : {}),
    },
    select: { id: true, name: true, email: true, role: true, outletId: true, isActive: true },
  });

  return apiOk(user);
}
