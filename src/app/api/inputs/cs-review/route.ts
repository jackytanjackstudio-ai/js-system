import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";

// PATCH — CS submits a review on a lead
export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (!["admin", "product"].includes(session.role)) return apiError("Forbidden", 403);

  const body = await req.json();
  const { leadId, csActionType, csComment, notifyStaff } = body;

  if (!leadId || !csActionType || !csComment) {
    return apiError("leadId, csActionType, and csComment are required");
  }

  await prisma.customerInput.update({
    where: { id: leadId },
    data: {
      csStatus:      notifyStaff ? "staff_notified" : "cs_reviewed",
      csActionType,
      csComment,
      csReviewer:    session.name,
      csReviewedAt:  new Date(),
      staffNotified: notifyStaff ?? false,
    },
  });

  return apiOk({ success: true });
}

// PUT — Staff marks a lead as followed up
export async function PUT(req: Request) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  const body = await req.json();
  const { leadId, followUpNote, outcome } = body;

  if (!leadId || !outcome) return apiError("leadId and outcome are required");

  await prisma.customerInput.update({
    where: { id: leadId },
    data: {
      staffFollowedUp: true,
      followUpNote:    followUpNote ?? null,
      followUpAt:      new Date(),
      csStatus:        "followed_up",
      csOutcome:       outcome,
    },
  });

  return apiOk({ success: true });
}
