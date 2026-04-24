import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  const products = await prisma.product.findMany({
    orderBy: { updatedAt: "desc" },
    include: { validations: true, reservations: true },
  });
  return apiOk(products);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (!["admin", "product"].includes(session.role)) return apiError("Forbidden", 403);

  const body = await req.json();
  const product = await prisma.product.create({
    data: {
      name:         body.name,
      category:     body.category ?? "Other",
      status:       body.status ?? "Sourcing",
      stage:        body.stage ?? "Bullet",
      hitRate:      body.hitRate ?? 0,
      signalSource: body.signalSource ?? null,
      notes:        body.notes ?? null,
      decisionDate: body.decisionDate ?? null,
      tasks:        JSON.stringify(body.tasks ?? []),
      targetPrice:  body.targetPrice ?? null,
      cost:         body.cost ?? null,
      imageUrl:     body.imageUrl ?? null,
      useCase:      JSON.stringify(body.useCase ?? []),
      style:        body.style ?? null,
      demandScore:  body.demandScore ?? 50,
    },
    include: { validations: true, reservations: true },
  });

  return apiOk(product, 201);
}
