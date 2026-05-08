import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";

export async function GET() {
  const tags = await prisma.signalTag.findMany({
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return apiOk(tags);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (!["admin", "manager"].includes(session.role)) return apiError("Forbidden", 403);

  const { name, category, emoji } = await req.json();
  if (!name?.trim() || !category) return apiError("name and category required");

  const tag = await prisma.signalTag.create({
    data: { name: name.trim(), category, emoji: emoji ?? "" },
  });
  return apiOk(tag, 201);
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (!["admin", "manager"].includes(session.role)) return apiError("Forbidden", 403);

  const { id, name, emoji, isActive } = await req.json();
  if (!id) return apiError("id required");

  const tag = await prisma.signalTag.update({
    where: { id },
    data: {
      ...(name      !== undefined && { name }),
      ...(emoji     !== undefined && { emoji }),
      ...(isActive  !== undefined && { isActive }),
    },
  });
  return apiOk(tag);
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (!["admin", "manager"].includes(session.role)) return apiError("Forbidden", 403);

  const { id } = await req.json();
  if (!id) return apiError("id required");
  await prisma.signalTag.delete({ where: { id } });
  return apiOk({ deleted: id });
}
