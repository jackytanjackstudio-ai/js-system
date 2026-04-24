import { prisma } from "@/lib/prisma";
import { apiOk } from "@/lib/auth";

// Public — used by registration page (no auth required)
export async function GET() {
  const outlets = await prisma.outlet.findMany({
    where:   { isActive: true },
    select:  { id: true, name: true, city: true },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });
  return apiOk(outlets);
}
