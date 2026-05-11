import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (!["admin", "manager"].includes(session.role)) return apiError("Forbidden", 403);

  const { id } = await params;
  const body = await req.json() as Partial<{
    dos: string[]; donts: string[]; captionTemplate: string; videoUrl: string;
  }>;

  const guide = await prisma.creatorHubGuide.update({
    where: { id },
    data: {
      ...(body.dos             ? { dos: JSON.stringify(body.dos) }     : {}),
      ...(body.donts           ? { donts: JSON.stringify(body.donts) } : {}),
      ...(body.captionTemplate !== undefined ? { captionTemplate: body.captionTemplate } : {}),
      ...(body.videoUrl        !== undefined ? { videoUrl: body.videoUrl || null }       : {}),
    },
  });

  return apiOk(guide);
}
