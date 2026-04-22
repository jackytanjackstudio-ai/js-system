import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  const { searchParams } = new URL(req.url);
  const outletId = searchParams.get("outletId");
  const limit = parseInt(searchParams.get("limit") ?? "50");

  const inputs = await prisma.customerInput.findMany({
    where: outletId ? { outletId } : undefined,
    include: { outlet: { select: { name: true } }, user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return apiOk(inputs);
}

// POST is public — used from /input/[outlet] by staff without accounts
export async function POST(req: Request) {
  const body = await req.json();
  const { outletId, staffName, lookingFor, nobuReasons, suggestions, quote } = body;

  if (!outletId || !staffName) return apiError("outletId and staffName required");

  // Find user by name + outlet (best effort; fall back to first admin)
  let user = await prisma.user.findFirst({ where: { name: staffName, outletId } });
  if (!user) user = await prisma.user.findFirst({ where: { name: staffName } });
  if (!user) user = await prisma.user.findFirst({ where: { role: "admin" } });
  if (!user) return apiError("No user found", 500);

  const week = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const [input] = await prisma.$transaction([
    prisma.customerInput.create({
      data: {
        userId: user.id,
        outletId,
        lookingFor: JSON.stringify(lookingFor ?? []),
        nobuReasons: JSON.stringify(nobuReasons ?? []),
        suggestions: JSON.stringify(suggestions ?? []),
        quote: quote ?? null,
      },
    }),
    prisma.rewardPoint.create({
      data: {
        userId: user.id,
        category: "customer_input",
        points: 5,
        reason: "Submitted customer input",
        weekRef: week,
      },
    }),
  ]);

  return apiOk(input, 201);
}
