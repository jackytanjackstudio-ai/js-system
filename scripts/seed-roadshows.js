// Run: node scripts/seed-roadshows.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const roadshows = [
  // ─── JANUARY (6) ───────────────────────────────────────────────────────────
  { mallName: "KSL City Mall",        startDate: "2026-01-12", endDate: "2026-01-25", notes: "B4 (27216)",                 status: "confirmed", mission: "conversion" },
  { mallName: "KLIA 2",               startDate: "2026-01-15", endDate: "2026-02-28", notes: "4 Lots",                     status: "confirmed", mission: "conversion" },
  { mallName: "Alamanda Putrajaya",   startDate: "2026-01-28", endDate: "2026-02-08", notes: "PS 4 & 10 (11820)",          status: "confirmed", mission: "conversion" },
  { mallName: "Aeon Taman University",startDate: "2026-01-27", endDate: "2026-02-08", notes: "2 Lot (5200)",               status: "confirmed", mission: "conversion" },
  { mallName: "Paradigm Mall",        startDate: "2026-01-26", endDate: "2026-02-15", sqFt: 800,                           status: "confirmed", mission: "branding"    },
  { mallName: "Atria",                startDate: "2026-01-23", endDate: "2026-02-08", sqFt: 1000,                          status: "confirmed", mission: "conversion" },

  // ─── MARCH (6) ─────────────────────────────────────────────────────────────
  { mallName: "KLIA 2",               startDate: "2026-03-06", endDate: "2026-04-19", notes: "4 Lots",                     status: "confirmed", mission: "conversion" },
  { mallName: "Wetex Parade",         startDate: "2026-03-03", endDate: "2026-03-26", notes: "4 Lot (24x26)",              status: "confirmed", mission: "conversion" },
  { mallName: "Alamanda Putrajaya",   startDate: "2026-03-11", endDate: "2026-03-22", notes: "OS 7 (Unido) 22.5x14.5",    status: "confirmed", mission: "conversion" },
  { mallName: "KSL City Mall",        startDate: "2026-03-16", endDate: "2026-03-29", notes: "B4 (33264)",                 status: "confirmed", mission: "conversion" },
  { mallName: "Main Place",           startDate: "2026-03-07", endDate: "2026-03-27", notes: "46x22",                     status: "confirmed", mission: "conversion" },
  { mallName: "Paradigm Mall",        startDate: "2026-03-19", endDate: "2026-03-29", sqFt: 3200,                          status: "confirmed", mission: "branding"    },

  // ─── APRIL (3) ─────────────────────────────────────────────────────────────
  { mallName: "Asia City KK",         startDate: "2026-04-17", endDate: "2026-06-14", notes: "Center Court",               status: "confirmed", mission: "branding"    },
  { mallName: "Alamanda Putrajaya",   startDate: "2026-04-29", endDate: "2026-05-10", notes: "PS 4 & 10 (11820)",          status: "confirmed", mission: "conversion" },
  { mallName: "East Coast Mall",      startDate: "2026-04-22", endDate: "2026-05-03", notes: "Zone 1",                     status: "confirmed", mission: "conversion" },

  // ─── MAY (5) ───────────────────────────────────────────────────────────────
  { mallName: "KLIA 2",               startDate: "2026-05-15", endDate: "2026-06-30", notes: "4 Lots",                     status: "confirmed", mission: "conversion" },
  { mallName: "East Coast Mall",      startDate: "2026-05-22", endDate: "2026-06-03", notes: "Zone 1",                     status: "confirmed", mission: "conversion" },
  { mallName: "KSL City Mall",        startDate: "2026-05-25", endDate: "2026-06-07", notes: "B4 (33264)",                 status: "confirmed", mission: "conversion" },
  { mallName: "Wetex Parade",         startDate: "2026-05-27", endDate: "2026-06-07", notes: "4 Lot (8800)",               status: "confirmed", mission: "conversion" },
  { mallName: "Alamanda Putrajaya",   startDate: "2026-05-27", endDate: "2026-06-07", notes: "PS 4 & 10 (11820)",          status: "confirmed", mission: "conversion" },

  // ─── JULY (2) ──────────────────────────────────────────────────────────────
  { mallName: "East Coast Mall",      startDate: "2026-07-23", endDate: "2026-08-02", notes: "Zone 1",                     status: "confirmed", mission: "conversion" },
  { mallName: "Aeon Taman University",startDate: "2026-07-28", endDate: "2026-08-09", notes: "2 Lot (5200)",               status: "confirmed", mission: "conversion" },

  // ─── AUGUST (5) ────────────────────────────────────────────────────────────
  { mallName: "KSL City Mall",        startDate: "2026-08-17", endDate: "2026-08-30", notes: "B4 (31752)",                 status: "confirmed", mission: "conversion" },
  { mallName: "Aeon Taman University",startDate: "2026-08-25", endDate: "2026-09-06", notes: "2 Lot (5200)",               status: "confirmed", mission: "conversion" },
  { mallName: "Alamanda Putrajaya",   startDate: "2026-08-26", endDate: "2026-09-06", notes: "PS 4 & 10 (11820)",          status: "confirmed", mission: "conversion" },
  { mallName: "Wetex Parade",         startDate: "2026-08-26", endDate: "2026-09-06", notes: "4 Lot (8800)",               status: "confirmed", mission: "conversion" },
  { mallName: "Paradigm Mall",        startDate: "2026-08-27", endDate: "2026-09-06", sqFt: 3200,                          status: "confirmed", mission: "branding"    },

  // ─── SEPTEMBER (1) ─────────────────────────────────────────────────────────
  { mallName: "Mayang Mall",          startDate: "2026-09-24", endDate: "2026-10-11", notes: "Center Court",               status: "confirmed", mission: "conversion" },

  // ─── OCTOBER (4) ───────────────────────────────────────────────────────────
  { mallName: "Alamanda Putrajaya",   startDate: "2026-10-21", endDate: "2026-11-01", notes: "PS 4 & 10 (11820)",          status: "confirmed", mission: "conversion" },
  { mallName: "KSL City Mall",        startDate: "2026-10-20", endDate: "2026-11-08", notes: "B4 (28728)",                 status: "confirmed", mission: "conversion" },
  { mallName: "Aeon Taman University",startDate: "2026-10-27", endDate: "2026-11-08", notes: "2 Lot (5200)",               status: "confirmed", mission: "conversion" },
  { mallName: "Wetex Parade",         startDate: "2026-10-28", endDate: "2026-11-08", notes: "4 Lot (8800)",               status: "confirmed", mission: "conversion" },

  // ─── NOVEMBER (2) ──────────────────────────────────────────────────────────
  { mallName: "Asia City KK",         startDate: "2026-11-13", endDate: "2026-12-06", notes: "Center Court",               status: "confirmed", mission: "branding"    },
  { mallName: "KSL City Mall",        startDate: "2026-11-21", endDate: "2026-12-06", notes: "B4 (33264)",                 status: "confirmed", mission: "conversion" },

  // ─── DECEMBER (4) ──────────────────────────────────────────────────────────
  { mallName: "KSL City Mall",        startDate: "2026-12-21", endDate: "2027-01-03", notes: "B4 (33264)",                 status: "confirmed", mission: "conversion" },
  { mallName: "Aeon Taman University",startDate: "2026-12-22", endDate: "2027-01-03", notes: "2 Lot (5200)",               status: "confirmed", mission: "conversion" },
  { mallName: "Wetex Parade",         startDate: "2026-12-23", endDate: "2027-01-03", notes: "4 Lot (8800)",               status: "confirmed", mission: "conversion" },
  { mallName: "East Coast Mall",      startDate: "2026-12-23", endDate: "2027-01-03", notes: "Zone 1",                     status: "confirmed", mission: "conversion" },
];

async function main() {
  console.log(`Seeding ${roadshows.length} roadshows...`);
  let count = 0;
  for (const r of roadshows) {
    await prisma.roadshow.create({
      data: {
        mallName:      r.mallName,
        startDate:     r.startDate,
        endDate:       r.endDate,
        sqFt:          r.sqFt ?? null,
        mission:       r.mission,
        status:        r.status,
        notes:         r.notes ?? null,
        floorPlanUrls: "[]",
        photoUrls:     "[]",
        partners:      "[]",
      },
    });
    count++;
    console.log(`  ✓ ${r.mallName} (${r.startDate})`);
  }
  console.log(`\nDone. ${count} roadshows created.`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
