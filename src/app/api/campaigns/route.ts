import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  const campaigns = await prisma.campaign.findMany({
    orderBy: { startDate: "asc" },
    include: { _count: { select: { tasks: true, submissions: true } } },
  });
  return apiOk(campaigns);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (!["admin", "manager", "product"].includes(session.role)) return apiError("Forbidden", 403);

  const body = await req.json();
  if (!body.name || !body.startDate || !body.endDate) {
    return apiError("name, startDate, endDate required");
  }

  const campaign = await prisma.campaign.create({
    data: {
      name:        body.name,
      type:        body.type        ?? "sales",
      startDate:   body.startDate,
      endDate:     body.endDate,
      channels:    JSON.stringify(body.channels    ?? []),
      objective:   JSON.stringify(body.objective   ?? {}),
      mechanics:   JSON.stringify(body.mechanics   ?? []),
      contentPlan: JSON.stringify(body.contentPlan ?? {}),
      salesScript: body.salesScript ?? null,
      status:      body.status      ?? "upcoming",
    },
  });

  // Auto-generate VM guide with default checklist
  await prisma.vMGuide.create({
    data: {
      campaignId: campaign.id,
      checklist: JSON.stringify([
        { id: "poster",    label: "Door / Entrance Poster",      required: true  },
        { id: "main",      label: "Main Table — 3 hero products", required: true  },
        { id: "gift",      label: "Gift / Promo Area Setup",      required: true  },
        { id: "price",     label: "Price Tags Visible",           required: true  },
        { id: "lighting",  label: "Lighting & Cleanliness",       required: false },
      ]),
    },
  });

  // Auto-generate default execution tasks
  const defaultTasks = [
    { taskName: "Setup Campaign Poster",             category: "poster",  deadline: body.startDate },
    { taskName: "Brief Staff on Campaign Mechanics", category: "staff",   deadline: body.startDate },
    { taskName: "Setup VM Display",                  category: "vm",      deadline: body.startDate },
    { taskName: "Launch Campaign Content",           category: "content", deadline: body.startDate },
  ];
  await prisma.campaignTask.createMany({
    data: defaultTasks.map(t => ({ ...t, campaignId: campaign.id })),
  });

  return apiOk(campaign, 201);
}
