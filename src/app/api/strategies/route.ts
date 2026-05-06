import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  const strategies = await prisma.weightConfig.findMany({
    orderBy: { createdAt: "desc" },
    include: { mposScores: true },
  });

  return apiOk(strategies);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (!["admin", "manager"].includes(session.role)) return apiError("Forbidden", 403);

  const body = await req.json() as {
    name: string;
    startDate: string;
    endDate: string;
    mposWeight: number;
    osWeights: { customer_input: number; quick_log: number; content: number; review: number; campaign: number };
  };

  const { name, startDate, endDate, mposWeight, osWeights } = body;

  if (!name?.trim())   return apiError("name required");
  if (!startDate || !endDate) return apiError("startDate and endDate required");

  // Duration >= 7 days
  const start = new Date(startDate);
  const end   = new Date(endDate);
  const days  = Math.round((end.getTime() - start.getTime()) / 86400000);
  if (days < 7) return apiError("Period must be at least 7 days");

  // OS weights must sum to 100
  const osSum = (osWeights.quick_log ?? 0) + (osWeights.content ?? 0)
              + (osWeights.review ?? 0) + (osWeights.campaign ?? 0);
  if (Math.abs(osSum - 100) > 0.01) return apiError(`OS weights must sum to 100 (got ${osSum})`);

  // mposWeight must be 0–100
  if (mposWeight < 0 || mposWeight > 100) return apiError("mposWeight must be 0–100");

  const strategy = await prisma.weightConfig.create({
    data: {
      name: name.trim(),
      startDate,
      endDate,
      mposWeight,
      osWeights: JSON.stringify(osWeights),
      createdBy: session.name ?? session.id,
    },
  });

  return apiOk(strategy, 201);
}
