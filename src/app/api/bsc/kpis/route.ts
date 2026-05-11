import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk, isAdmin } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  const kpis = await prisma.bscKpi.findMany({
    orderBy: [{ perspective: "asc" }, { kpiKey: "asc" }],
  });

  return apiOk({ kpis });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (!isAdmin(session)) return apiError("Forbidden", 403);

  const { perspective, kpiKey, status, note } = await req.json();

  if (!perspective || !kpiKey || !status) {
    return apiError("perspective, kpiKey, and status are required");
  }

  await prisma.bscKpi.update({
    where: { perspective_kpiKey: { perspective, kpiKey } },
    data:  { status, note: note ?? null },
  });

  return apiOk({ success: true });
}
