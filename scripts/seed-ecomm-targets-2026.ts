import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// 2026 Ecomm monthly targets (from spreadsheet — Jack can adjust via Admin > Strategy > Ecomm Targets)
const TARGETS: { platform: string; months: number[] }[] = [
  {
    platform: "Shopee JS Craft Store",
    months: [33600, 37800, 37800, 29400, 29400, 29400, 29400, 33600, 37800, 37800, 42000, 42000],
  },
  {
    platform: "Shopee Lancaster Polo Men's",
    months: [72000, 81000, 81000, 63000, 63000, 63000, 63000, 72000, 81000, 81000, 90000, 90000],
  },
  {
    platform: "Shopee Lancaster Polo MY",
    months: [9600, 10800, 10800, 8400, 8400, 8400, 8400, 9600, 10800, 10800, 12000, 12000],
  },
  {
    platform: "Shopee EuroPolo Backpack",
    months: [8000, 8000, 8000, 8000, 8400, 8400, 6000, 6000, 8000, 8000, 12000, 12000],
  },
  {
    platform: "Lazada Jack Studio",
    months: [2400, 2700, 2700, 2100, 2100, 2100, 2100, 2400, 2700, 2700, 3000, 3000],
  },
  {
    platform: "Lazada Euro Polo",
    months: [12000, 13500, 13500, 10500, 10500, 10500, 10500, 12000, 13500, 13500, 15000, 15000],
  },
  {
    platform: "TikTok @jackstudio_official",
    months: [498000, 504000, 504000, 442000, 442000, 442000, 440000, 448000, 454000, 484000, 530000, 590000],
  },
  {
    platform: "TikTok Lancaster Polo",
    months: [8000, 9000, 9000, 7000, 7000, 7000, 7000, 8000, 9000, 9000, 10000, 10000],
  },
  {
    platform: "jackstudio.com.my",
    months: [8000, 9000, 9000, 7000, 7000, 7000, 7000, 8000, 9000, 9000, 10000, 10000],
  },
  {
    platform: "Zarola",
    months: [24000, 27000, 27000, 21000, 21000, 21000, 21000, 24000, 27000, 27000, 30000, 30000],
  },
];

async function main() {
  let count = 0;
  for (const { platform, months } of TARGETS) {
    for (let i = 0; i < 12; i++) {
      await prisma.ecommTarget.upsert({
        where: { platform_year_month: { platform, year: 2026, month: i + 1 } },
        update: { targetRm: months[i] },
        create: { platform, year: 2026, month: i + 1, targetRm: months[i] },
      });
      count++;
    }
    const annual = months.reduce((a, b) => a + b, 0);
    console.log(`✅ ${platform} — RM ${annual.toLocaleString()} annual`);
  }

  const grandTotal = TARGETS.reduce((s, t) => s + t.months.reduce((a, b) => a + b, 0), 0);
  console.log(`\n🎯 Done — ${count} records seeded.`);
  console.log(`📊 Total 2026 Ecomm Target: RM ${grandTotal.toLocaleString()}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
