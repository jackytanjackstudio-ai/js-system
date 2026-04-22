import { prisma } from "@/lib/prisma";
import { apiOk, apiError } from "@/lib/auth";

// Public endpoint — used by /input/[outlet] form (no auth)
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const outlet = await prisma.outlet.findUnique({ where: { id: params.id } });
  if (!outlet) return apiError("Outlet not found", 404);

  const staff = await prisma.user.findMany({
    where: { outletId: params.id, isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return apiOk({ outlet: { id: outlet.id, name: outlet.name }, staff });
}
