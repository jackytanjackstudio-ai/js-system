import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword || !newPassword) return apiError("currentPassword and newPassword required");
  if (newPassword.length < 6) return apiError("New password must be at least 6 characters");

  const user = await prisma.user.findUnique({ where: { id: session.id }, select: { password: true } });
  if (!user) return apiError("User not found", 404);

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) return apiError("Current password is incorrect", 400);

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: session.id }, data: { password: hashed } });

  return apiOk({ message: "Password changed successfully" });
}
