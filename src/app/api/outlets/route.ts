import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  const outlets = await prisma.outlet.findMany({
    orderBy: [{ type: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { inputs: true, salesReports: true } },
    },
  });

  return apiOk(outlets);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (session.role !== "admin") return apiError("Forbidden", 403);

  const body = await req.json();
  if (!body.name || !body.city) return apiError("name and city required");

  const outlet = await prisma.outlet.create({
    data: {
      id: body.id ?? undefined,
      name: body.name,
      city: body.city,
      type: body.type ?? "physical",
      channelKey: body.channelKey ?? null,
    },
  });

  return apiOk(outlet, 201);
}
