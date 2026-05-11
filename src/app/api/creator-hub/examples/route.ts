import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  const examples = await prisma.creatorHubExample.findMany({
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
  });

  // Also auto-pull high-performers from Creator Insight not already in examples
  const existingIds = new Set(examples.map((e) => e.fromCreatorId).filter(Boolean));

  const highPerf = await prisma.creatorContent.findMany({
    where: { performanceLevel: "high", NOT: { id: { in: Array.from(existingIds) as string[] } } },
    orderBy: { signalScore: "desc" },
    take: 10,
    include: { user: { select: { name: true } } },
  });

  const autoExamples = highPerf.map((c) => ({
    id: `auto_${c.id}`,
    title: c.title,
    videoUrl: c.contentUrl,
    views: c.views,
    shares: c.shares,
    completionRate: 0,
    outletName: null,
    staffName: c.user.name,
    monthLabel: c.week ?? "",
    isFeatured: false,
    fromCreatorId: c.id,
    createdAt: c.createdAt,
    _auto: true,
  }));

  return apiOk([...examples, ...autoExamples]);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (!["admin", "manager"].includes(session.role)) return apiError("Forbidden", 403);

  const body = await req.json() as {
    title: string; videoUrl?: string; views?: number; shares?: number;
    completionRate?: number; outletName?: string; staffName?: string;
    monthLabel?: string; isFeatured?: boolean; fromCreatorId?: string;
  };

  if (!body.title) return apiError("title required");

  const example = await prisma.creatorHubExample.create({
    data: {
      title:          body.title,
      videoUrl:       body.videoUrl ?? null,
      views:          body.views ?? 0,
      shares:         body.shares ?? 0,
      completionRate: body.completionRate ?? 0,
      outletName:     body.outletName ?? null,
      staffName:      body.staffName ?? null,
      monthLabel:     body.monthLabel ?? "",
      isFeatured:     body.isFeatured ?? false,
      fromCreatorId:  body.fromCreatorId ?? null,
    },
  });

  return apiOk(example, 201);
}
