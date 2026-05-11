import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  const brief = await prisma.creatorHubWeekly.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  return apiOk(brief);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (!["admin", "manager"].includes(session.role)) return apiError("Forbidden", 403);

  const body = await req.json() as {
    weekLabel: string; task: string; description: string;
    howToShoot: string; destination: string; target: string; videoUrl?: string;
  };

  // Deactivate previous briefs
  await prisma.creatorHubWeekly.updateMany({ where: { isActive: true }, data: { isActive: false } });

  const brief = await prisma.creatorHubWeekly.create({
    data: {
      weekLabel:   body.weekLabel ?? "",
      task:        body.task ?? "",
      description: body.description ?? "",
      howToShoot:  body.howToShoot ?? "",
      destination: body.destination ?? "",
      target:      body.target ?? "",
      videoUrl:    body.videoUrl ?? null,
      isActive:    true,
    },
  });

  return apiOk(brief, 201);
}
