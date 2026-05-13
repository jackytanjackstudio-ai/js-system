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

  const { perspective, kpiKey, status, note, kpiLabel, targetDesc } = await req.json();

  if (!perspective || !kpiKey) {
    return apiError("perspective and kpiKey are required");
  }

  const updateData: Record<string, string | null> = {};
  if (status)             updateData.status     = status;
  if (note !== undefined) updateData.note       = note ?? null;
  if (kpiLabel)           updateData.kpiLabel   = kpiLabel;
  if (targetDesc !== undefined) updateData.targetDesc = targetDesc ?? null;

  if (Object.keys(updateData).length === 0) {
    return apiError("At least one field to update is required");
  }

  await prisma.bscKpi.update({
    where: { perspective_kpiKey: { perspective, kpiKey } },
    data:  updateData,
  });

  return apiOk({ success: true });
}
