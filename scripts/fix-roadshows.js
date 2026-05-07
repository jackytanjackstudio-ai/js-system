const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // 1. DELETE wrong East Coast Mall April entry
  const del = await prisma.roadshow.deleteMany({
    where: { mallName: "East Coast Mall", startDate: "2026-04-22" }
  });
  console.log(`Deleted ${del.count} wrong East Coast Mall (Apr 22) entry`);

  // 2. FIX Alamanda Putrajaya March — "Unido" → "Uniqlo"
  const fix1 = await prisma.roadshow.updateMany({
    where: { mallName: "Alamanda Putrajaya", startDate: "2026-03-11" },
    data: { notes: "OS 7 (Uniqlo) 22.5 x 14.5" }
  });
  console.log(`Fixed Uniqlo spelling: ${fix1.count}`);

  // 3. FIX KSL City Mall October — startDate 20→26
  const fix2 = await prisma.roadshow.updateMany({
    where: { mallName: "KSL City Mall", startDate: "2026-10-20" },
    data: { startDate: "2026-10-26" }
  });
  console.log(`Fixed KSL Oct startDate: ${fix2.count}`);

  // 4. FIX Asia City KK November — endDate Dec 6 → Jan 3 2027
  const fix3 = await prisma.roadshow.updateMany({
    where: { mallName: "Asia City KK", startDate: "2026-11-13" },
    data: { endDate: "2027-01-03" }
  });
  console.log(`Fixed Asia City KK Nov endDate: ${fix3.count}`);

  // 5. FIX KSL City Mall November — startDate 21→23
  const fix4 = await prisma.roadshow.updateMany({
    where: { mallName: "KSL City Mall", startDate: "2026-11-21" },
    data: { startDate: "2026-11-23" }
  });
  console.log(`Fixed KSL Nov startDate: ${fix4.count}`);

  // 6. ADD missing: Alamanda Putrajaya July
  await prisma.roadshow.create({ data: {
    mallName: "Alamanda Putrajaya", startDate: "2026-07-29", endDate: "2026-08-09",
    notes: "PS 4 & 10 (11820)", status: "confirmed", mission: "conversion",
    floorPlanUrls: "[]", photoUrls: "[]", partners: "[]"
  }});
  console.log("Added Alamanda Putrajaya Jul 29");

  // 7. ADD missing: Times Square August
  await prisma.roadshow.create({ data: {
    mallName: "Times Square", startDate: "2026-08-28", endDate: "2026-09-10",
    notes: "Ground West", status: "confirmed", mission: "branding",
    floorPlanUrls: "[]", photoUrls: "[]", partners: "[]"
  }});
  console.log("Added Times Square Aug 28");

  // 8. ADD missing: Main Place October
  await prisma.roadshow.create({ data: {
    mallName: "Main Place", startDate: "2026-10-29", endDate: "2026-11-15",
    notes: "Center Court", status: "confirmed", mission: "conversion",
    floorPlanUrls: "[]", photoUrls: "[]", partners: "[]"
  }});
  console.log("Added Main Place Oct 29");

  // 9. ADD missing: Alamanda Putrajaya December (TBC)
  await prisma.roadshow.create({ data: {
    mallName: "Alamanda Putrajaya", startDate: "2026-12-23", endDate: "2027-01-03",
    notes: "PS 4 & 10 (11820)", status: "pending", mission: "conversion",
    floorPlanUrls: "[]", photoUrls: "[]", partners: "[]"
  }});
  console.log("Added Alamanda Putrajaya Dec 23 (TBC/pending)");

  const total = await prisma.roadshow.count();
  console.log(`\nTotal roadshows in DB: ${total}`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
