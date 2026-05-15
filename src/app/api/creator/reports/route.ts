import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  const reports = await prisma.tikTokReport.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true, createdAt: true, dateRange: true, fileName: true,
      totalVideos: true, totalVV: true, totalGMV: true, avgFinishRate: true,
      signals: true, status: true,
    },
  });

  return apiOk(reports);
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return apiError("id required");

  await prisma.tikTokReport.delete({ where: { id } });
  return apiOk({ deleted: true });
}
