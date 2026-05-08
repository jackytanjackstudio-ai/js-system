import { prisma } from "@/lib/prisma";
import { apiOk } from "@/lib/auth";

export async function GET() {
  const now     = new Date();
  const d7ago   = new Date(now.getTime() - 7  * 86400000);
  const d14ago  = new Date(now.getTime() - 14 * 86400000);

  const [thisWeekInputs, lastWeekInputs, allTags] = await Promise.all([
    prisma.customerInput.findMany({
      where: { createdAt: { gte: d7ago } },
      select: { signalTags: true },
    }),
    prisma.customerInput.findMany({
      where: { createdAt: { gte: d14ago, lt: d7ago } },
      select: { signalTags: true },
    }),
    prisma.signalTag.findMany({ where: { isActive: true }, select: { name: true, category: true, emoji: true } }),
  ]);

  function countTags(inputs: { signalTags: string }[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const row of inputs) {
      try {
        const tags = JSON.parse(row.signalTags) as string[];
        for (const t of tags) counts[t] = (counts[t] ?? 0) + 1;
      } catch { /* skip */ }
    }
    return counts;
  }

  const thisWeek = countTags(thisWeekInputs);
  const lastWeek = countTags(lastWeekInputs);

  const tagMeta = Object.fromEntries(allTags.map(t => [t.name, { category: t.category, emoji: t.emoji }]));

  const signals = Object.entries(thisWeek)
    .map(([tag, count]) => ({
      tag,
      count,
      category: tagMeta[tag]?.category ?? "product",
      emoji:    tagMeta[tag]?.emoji    ?? "",
      prev:     lastWeek[tag] ?? 0,
      delta:    count - (lastWeek[tag] ?? 0),
    }))
    .sort((a, b) => b.count - a.count);

  const totalThisWeek = thisWeekInputs.length;

  return apiOk({ signals, totalThisWeek });
}
