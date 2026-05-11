import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";

const DEFAULTS = [
  {
    typeKey: "reaction", typeName: "REACTION", sortOrder: 1,
    dos: JSON.stringify(["Point camera at customer's face", "Natural lighting", "15–30 seconds"]),
    donts: JSON.stringify(["Don't warn them you're filming", "Don't show product more than person", "Don't over-edit"]),
    captionTemplate: "The moment a customer sees __ for the first time 🥹",
    videoUrl: null,
  },
  {
    typeKey: "process", typeName: "PROCESS", sortOrder: 2,
    dos: JSON.stringify(["Show full packing flow", "Use real items (laptop, charger)", "Slow + steady shots"]),
    donts: JSON.stringify(["Don't rush through steps", "Don't use empty bag", "Don't shaky camera"]),
    captionTemplate: "Everything I pack for a day out 💼",
    videoUrl: null,
  },
  {
    typeKey: "function_demo", typeName: "FUNCTION DEMO", sortOrder: 3,
    dos: JSON.stringify(["Zoom in on the feature", "Narrate what you're showing", "Compare size with common objects"]),
    donts: JSON.stringify(["Don't assume viewer knows the product", "Don't use bad angle", "Don't forget captions"]),
    captionTemplate: "Did you know this bag can __ ? 👀",
    videoUrl: null,
  },
  {
    typeKey: "staff_pick", typeName: "STAFF PICK", sortOrder: 4,
    dos: JSON.stringify(["Be genuine — say WHY you like it", "Hold it, try it on", "Mention one real customer story"]),
    donts: JSON.stringify(["Don't read from script", "Don't say 'good quality' without reason", "Don't hold product awkwardly"]),
    captionTemplate: "My personal pick this month and why → __",
    videoUrl: null,
  },
  {
    typeKey: "comparison", typeName: "COMPARISON", sortOrder: 5,
    dos: JSON.stringify(["Side-by-side layout", "Same background / lighting", "Clear price difference"]),
    donts: JSON.stringify(["Don't bash competitors by name", "Don't compare unequal sizes", "Don't rush the reveal"]),
    captionTemplate: "RM__ vs RM__ — which would you pick?",
    videoUrl: null,
  },
];

export async function GET() {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  const existing = await prisma.creatorHubGuide.findMany({ orderBy: { sortOrder: "asc" } });

  if (existing.length === 0) {
    // Seed defaults on first load
    await prisma.creatorHubGuide.createMany({ data: DEFAULTS });
    const seeded = await prisma.creatorHubGuide.findMany({ orderBy: { sortOrder: "asc" } });
    return apiOk(seeded);
  }

  return apiOk(existing);
}
