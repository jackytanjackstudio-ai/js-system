import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (!["admin", "manager"].includes(session.role)) return apiError("Forbidden", 403);

  const { id } = await params;
  const body = await req.json() as Partial<{
    weekLabel: string; task: string; description: string;
    howToShoot: string; destination: string; target: string; videoUrl: string;
  }>;

  const brief = await prisma.creatorHubWeekly.update({
    where: { id },
    data: body,
  });

  return apiOk(brief);
}
