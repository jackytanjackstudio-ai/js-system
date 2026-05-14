import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk, isAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") ?? "2026");

  const targets = await prisma.ecommTarget.findMany({
    where: { year },
    orderBy: [{ platform: "asc" }, { month: "asc" }],
  });

  return apiOk({ targets, year });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (!isAdmin(session)) return apiError("Forbidden", 403);

  const { targets } = await req.json();
  if (!Array.isArray(targets) || targets.length === 0) {
    return apiError("targets array is required");
  }

  await Promise.all(
    targets.map((t: { platform: string; year: number; month: number; targetRm: number }) =>
      prisma.ecommTarget.upsert({
        where: { platform_year_month: { platform: t.platform, year: Number(t.year), month: Number(t.month) } },
        update: { targetRm: Number(t.targetRm) },
        create: { platform: t.platform, year: Number(t.year), month: Number(t.month), targetRm: Number(t.targetRm) },
      })
    )
  );

  return apiOk({ success: true });
}
