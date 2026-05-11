import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding BSC outlet targets and KPIs...");

  // ── Outlet targets 2026 ────────────────────────────────────────────────────
  const targets = [
    // AEON BUKIT TINGGI
    { outlet: "AEON BUKIT TINGGI", year: 2026, month: 1,  targetRm: 50000 },
    { outlet: "AEON BUKIT TINGGI", year: 2026, month: 2,  targetRm: 41000 },
    { outlet: "AEON BUKIT TINGGI", year: 2026, month: 3,  targetRm: 50000 },
    { outlet: "AEON BUKIT TINGGI", year: 2026, month: 4,  targetRm: 40000 },
    { outlet: "AEON BUKIT TINGGI", year: 2026, month: 5,  targetRm: 43000 },
    { outlet: "AEON BUKIT TINGGI", year: 2026, month: 6,  targetRm: 41000 },
    { outlet: "AEON BUKIT TINGGI", year: 2026, month: 7,  targetRm: 40000 },
    { outlet: "AEON BUKIT TINGGI", year: 2026, month: 8,  targetRm: 45000 },
    { outlet: "AEON BUKIT TINGGI", year: 2026, month: 9,  targetRm: 41000 },
    { outlet: "AEON BUKIT TINGGI", year: 2026, month: 10, targetRm: 40000 },
    { outlet: "AEON BUKIT TINGGI", year: 2026, month: 11, targetRm: 45000 },
    { outlet: "AEON BUKIT TINGGI", year: 2026, month: 12, targetRm: 60000 },
    // MAIN PLACE
    { outlet: "MAIN PLACE", year: 2026, month: 1,  targetRm: 25998.92 },
    { outlet: "MAIN PLACE", year: 2026, month: 2,  targetRm: 22198.73 },
    { outlet: "MAIN PLACE", year: 2026, month: 3,  targetRm: 25245.38 },
    { outlet: "MAIN PLACE", year: 2026, month: 4,  targetRm: 21249.20 },
    { outlet: "MAIN PLACE", year: 2026, month: 5,  targetRm: 23529.55 },
    { outlet: "MAIN PLACE", year: 2026, month: 6,  targetRm: 22654.43 },
    { outlet: "MAIN PLACE", year: 2026, month: 7,  targetRm: 21581.24 },
    { outlet: "MAIN PLACE", year: 2026, month: 8,  targetRm: 23342.60 },
    { outlet: "MAIN PLACE", year: 2026, month: 9,  targetRm: 22688.84 },
    { outlet: "MAIN PLACE", year: 2026, month: 10, targetRm: 21202.74 },
    { outlet: "MAIN PLACE", year: 2026, month: 11, targetRm: 25000.00 },
    { outlet: "MAIN PLACE", year: 2026, month: 12, targetRm: 25000.00 },
    // PARADIGM MALL
    { outlet: "PARADIGM MALL", year: 2026, month: 1,  targetRm: 40000 },
    { outlet: "PARADIGM MALL", year: 2026, month: 2,  targetRm: 35000 },
    { outlet: "PARADIGM MALL", year: 2026, month: 3,  targetRm: 37500 },
    { outlet: "PARADIGM MALL", year: 2026, month: 4,  targetRm: 35000 },
    { outlet: "PARADIGM MALL", year: 2026, month: 5,  targetRm: 37500 },
    { outlet: "PARADIGM MALL", year: 2026, month: 6,  targetRm: 35000 },
    { outlet: "PARADIGM MALL", year: 2026, month: 7,  targetRm: 35000 },
    { outlet: "PARADIGM MALL", year: 2026, month: 8,  targetRm: 35000 },
    { outlet: "PARADIGM MALL", year: 2026, month: 9,  targetRm: 35000 },
    { outlet: "PARADIGM MALL", year: 2026, month: 10, targetRm: 35000 },
    { outlet: "PARADIGM MALL", year: 2026, month: 11, targetRm: 35000 },
    { outlet: "PARADIGM MALL", year: 2026, month: 12, targetRm: 55000 },
    // EAST COAST MALL
    { outlet: "EAST COAST MALL", year: 2026, month: 1,  targetRm: 70000 },
    { outlet: "EAST COAST MALL", year: 2026, month: 2,  targetRm: 60000 },
    { outlet: "EAST COAST MALL", year: 2026, month: 3,  targetRm: 80000 },
    { outlet: "EAST COAST MALL", year: 2026, month: 4,  targetRm: 65000 },
    { outlet: "EAST COAST MALL", year: 2026, month: 5,  targetRm: 75000 },
    { outlet: "EAST COAST MALL", year: 2026, month: 6,  targetRm: 65000 },
    { outlet: "EAST COAST MALL", year: 2026, month: 7,  targetRm: 65000 },
    { outlet: "EAST COAST MALL", year: 2026, month: 8,  targetRm: 80000 },
    { outlet: "EAST COAST MALL", year: 2026, month: 9,  targetRm: 75000 },
    { outlet: "EAST COAST MALL", year: 2026, month: 10, targetRm: 65000 },
    { outlet: "EAST COAST MALL", year: 2026, month: 11, targetRm: 70000 },
    { outlet: "EAST COAST MALL", year: 2026, month: 12, targetRm: 80000 },
    // AEON PERMAS JAYA
    { outlet: "AEON PERMAS JAYA", year: 2026, month: 1,  targetRm: 37141.31 },
    { outlet: "AEON PERMAS JAYA", year: 2026, month: 2,  targetRm: 33000 },
    { outlet: "AEON PERMAS JAYA", year: 2026, month: 3,  targetRm: 36064.82 },
    { outlet: "AEON PERMAS JAYA", year: 2026, month: 4,  targetRm: 30000 },
    { outlet: "AEON PERMAS JAYA", year: 2026, month: 5,  targetRm: 35000 },
    { outlet: "AEON PERMAS JAYA", year: 2026, month: 6,  targetRm: 32363.47 },
    { outlet: "AEON PERMAS JAYA", year: 2026, month: 7,  targetRm: 30000 },
    { outlet: "AEON PERMAS JAYA", year: 2026, month: 8,  targetRm: 33346.57 },
    { outlet: "AEON PERMAS JAYA", year: 2026, month: 9,  targetRm: 32412.63 },
    { outlet: "AEON PERMAS JAYA", year: 2026, month: 10, targetRm: 30000 },
    { outlet: "AEON PERMAS JAYA", year: 2026, month: 11, targetRm: 35000 },
    { outlet: "AEON PERMAS JAYA", year: 2026, month: 12, targetRm: 37000 },
    // AEON BUKIT INDAH
    { outlet: "AEON BUKIT INDAH", year: 2026, month: 1,  targetRm: 80000 },
    { outlet: "AEON BUKIT INDAH", year: 2026, month: 2,  targetRm: 70000 },
    { outlet: "AEON BUKIT INDAH", year: 2026, month: 3,  targetRm: 77000 },
    { outlet: "AEON BUKIT INDAH", year: 2026, month: 4,  targetRm: 65000 },
    { outlet: "AEON BUKIT INDAH", year: 2026, month: 5,  targetRm: 72000 },
    { outlet: "AEON BUKIT INDAH", year: 2026, month: 6,  targetRm: 68000 },
    { outlet: "AEON BUKIT INDAH", year: 2026, month: 7,  targetRm: 65000 },
    { outlet: "AEON BUKIT INDAH", year: 2026, month: 8,  targetRm: 68000 },
    { outlet: "AEON BUKIT INDAH", year: 2026, month: 9,  targetRm: 68000 },
    { outlet: "AEON BUKIT INDAH", year: 2026, month: 10, targetRm: 65000 },
    { outlet: "AEON BUKIT INDAH", year: 2026, month: 11, targetRm: 72000 },
    { outlet: "AEON BUKIT INDAH", year: 2026, month: 12, targetRm: 90000 },
    // AEON SEREMBAN
    { outlet: "AEON SEREMBAN", year: 2026, month: 1,  targetRm: 80000 },
    { outlet: "AEON SEREMBAN", year: 2026, month: 2,  targetRm: 70000 },
    { outlet: "AEON SEREMBAN", year: 2026, month: 3,  targetRm: 80000 },
    { outlet: "AEON SEREMBAN", year: 2026, month: 4,  targetRm: 66000 },
    { outlet: "AEON SEREMBAN", year: 2026, month: 5,  targetRm: 72000 },
    { outlet: "AEON SEREMBAN", year: 2026, month: 6,  targetRm: 68000 },
    { outlet: "AEON SEREMBAN", year: 2026, month: 7,  targetRm: 66000 },
    { outlet: "AEON SEREMBAN", year: 2026, month: 8,  targetRm: 68000 },
    { outlet: "AEON SEREMBAN", year: 2026, month: 9,  targetRm: 68000 },
    { outlet: "AEON SEREMBAN", year: 2026, month: 10, targetRm: 65000 },
    { outlet: "AEON SEREMBAN", year: 2026, month: 11, targetRm: 72000 },
    { outlet: "AEON SEREMBAN", year: 2026, month: 12, targetRm: 85000 },
    // AEON WANGSA MAJU
    { outlet: "AEON WANGSA MAJU", year: 2026, month: 1,  targetRm: 28000 },
    { outlet: "AEON WANGSA MAJU", year: 2026, month: 2,  targetRm: 25000 },
    { outlet: "AEON WANGSA MAJU", year: 2026, month: 3,  targetRm: 28000 },
    { outlet: "AEON WANGSA MAJU", year: 2026, month: 4,  targetRm: 25000 },
    { outlet: "AEON WANGSA MAJU", year: 2026, month: 5,  targetRm: 25210.23 },
    { outlet: "AEON WANGSA MAJU", year: 2026, month: 6,  targetRm: 25000 },
    { outlet: "AEON WANGSA MAJU", year: 2026, month: 7,  targetRm: 25000 },
    { outlet: "AEON WANGSA MAJU", year: 2026, month: 8,  targetRm: 25000 },
    { outlet: "AEON WANGSA MAJU", year: 2026, month: 9,  targetRm: 25000 },
    { outlet: "AEON WANGSA MAJU", year: 2026, month: 10, targetRm: 25000 },
    { outlet: "AEON WANGSA MAJU", year: 2026, month: 11, targetRm: 25000 },
    { outlet: "AEON WANGSA MAJU", year: 2026, month: 12, targetRm: 28000 },
    // ALAMANDA
    { outlet: "ALAMANDA", year: 2026, month: 1,  targetRm: 43000 },
    { outlet: "ALAMANDA", year: 2026, month: 2,  targetRm: 38000 },
    { outlet: "ALAMANDA", year: 2026, month: 3,  targetRm: 45000 },
    { outlet: "ALAMANDA", year: 2026, month: 4,  targetRm: 35000 },
    { outlet: "ALAMANDA", year: 2026, month: 5,  targetRm: 38000 },
    { outlet: "ALAMANDA", year: 2026, month: 6,  targetRm: 50000 },
    { outlet: "ALAMANDA", year: 2026, month: 7,  targetRm: 34684.13 },
    { outlet: "ALAMANDA", year: 2026, month: 8,  targetRm: 37514.89 },
    { outlet: "ALAMANDA", year: 2026, month: 9,  targetRm: 36464.21 },
    { outlet: "ALAMANDA", year: 2026, month: 10, targetRm: 34075.84 },
    { outlet: "ALAMANDA", year: 2026, month: 11, targetRm: 37014.43 },
    { outlet: "ALAMANDA", year: 2026, month: 12, targetRm: 43838.34 },
    // BERJAYA TIMES SQ
    { outlet: "BERJAYA TIMES SQ", year: 2026, month: 1,  targetRm: 85000 },
    { outlet: "BERJAYA TIMES SQ", year: 2026, month: 2,  targetRm: 80000 },
    { outlet: "BERJAYA TIMES SQ", year: 2026, month: 3,  targetRm: 80000 },
    { outlet: "BERJAYA TIMES SQ", year: 2026, month: 4,  targetRm: 75000 },
    { outlet: "BERJAYA TIMES SQ", year: 2026, month: 5,  targetRm: 85000 },
    { outlet: "BERJAYA TIMES SQ", year: 2026, month: 6,  targetRm: 80908.68 },
    { outlet: "BERJAYA TIMES SQ", year: 2026, month: 7,  targetRm: 85000 },
    { outlet: "BERJAYA TIMES SQ", year: 2026, month: 8,  targetRm: 100000 },
    { outlet: "BERJAYA TIMES SQ", year: 2026, month: 9,  targetRm: 81031.57 },
    { outlet: "BERJAYA TIMES SQ", year: 2026, month: 10, targetRm: 75000 },
    { outlet: "BERJAYA TIMES SQ", year: 2026, month: 11, targetRm: 80000 },
    { outlet: "BERJAYA TIMES SQ", year: 2026, month: 12, targetRm: 97418.52 },
    // AEON KULAIJAYA
    { outlet: "AEON KULAIJAYA", year: 2026, month: 1,  targetRm: 45000 },
    { outlet: "AEON KULAIJAYA", year: 2026, month: 2,  targetRm: 35000 },
    { outlet: "AEON KULAIJAYA", year: 2026, month: 3,  targetRm: 45000 },
    { outlet: "AEON KULAIJAYA", year: 2026, month: 4,  targetRm: 35000 },
    { outlet: "AEON KULAIJAYA", year: 2026, month: 5,  targetRm: 38000 },
    { outlet: "AEON KULAIJAYA", year: 2026, month: 6,  targetRm: 35000 },
    { outlet: "AEON KULAIJAYA", year: 2026, month: 7,  targetRm: 35000 },
    { outlet: "AEON KULAIJAYA", year: 2026, month: 8,  targetRm: 35000 },
    { outlet: "AEON KULAIJAYA", year: 2026, month: 9,  targetRm: 35000 },
    { outlet: "AEON KULAIJAYA", year: 2026, month: 10, targetRm: 35000 },
    { outlet: "AEON KULAIJAYA", year: 2026, month: 11, targetRm: 38000 },
    { outlet: "AEON KULAIJAYA", year: 2026, month: 12, targetRm: 40000 },
    // SUNWAY CARNIVAL
    { outlet: "SUNWAY CARNIVAL", year: 2026, month: 1,  targetRm: 75000 },
    { outlet: "SUNWAY CARNIVAL", year: 2026, month: 2,  targetRm: 55000 },
    { outlet: "SUNWAY CARNIVAL", year: 2026, month: 3,  targetRm: 60000 },
    { outlet: "SUNWAY CARNIVAL", year: 2026, month: 4,  targetRm: 50000 },
    { outlet: "SUNWAY CARNIVAL", year: 2026, month: 5,  targetRm: 55000 },
    { outlet: "SUNWAY CARNIVAL", year: 2026, month: 6,  targetRm: 52590.64 },
    { outlet: "SUNWAY CARNIVAL", year: 2026, month: 7,  targetRm: 50000 },
    { outlet: "SUNWAY CARNIVAL", year: 2026, month: 8,  targetRm: 54188.17 },
    { outlet: "SUNWAY CARNIVAL", year: 2026, month: 9,  targetRm: 52670.52 },
    { outlet: "SUNWAY CARNIVAL", year: 2026, month: 10, targetRm: 50000 },
    { outlet: "SUNWAY CARNIVAL", year: 2026, month: 11, targetRm: 55000 },
    { outlet: "SUNWAY CARNIVAL", year: 2026, month: 12, targetRm: 65000 },
    // MAYANG MALL
    { outlet: "MAYANG MALL", year: 2026, month: 1,  targetRm: 92853.28 },
    { outlet: "MAYANG MALL", year: 2026, month: 2,  targetRm: 80000 },
    { outlet: "MAYANG MALL", year: 2026, month: 3,  targetRm: 90162.06 },
    { outlet: "MAYANG MALL", year: 2026, month: 4,  targetRm: 75000 },
    { outlet: "MAYANG MALL", year: 2026, month: 5,  targetRm: 85000 },
    { outlet: "MAYANG MALL", year: 2026, month: 6,  targetRm: 85000 },
    { outlet: "MAYANG MALL", year: 2026, month: 7,  targetRm: 75000 },
    { outlet: "MAYANG MALL", year: 2026, month: 8,  targetRm: 83366.42 },
    { outlet: "MAYANG MALL", year: 2026, month: 9,  targetRm: 90000 },
    { outlet: "MAYANG MALL", year: 2026, month: 10, targetRm: 75000 },
    { outlet: "MAYANG MALL", year: 2026, month: 11, targetRm: 80000 },
    { outlet: "MAYANG MALL", year: 2026, month: 12, targetRm: 90000 },
  ];

  for (const t of targets) {
    await prisma.outletTarget.upsert({
      where:  { outlet_year_month: { outlet: t.outlet, year: t.year, month: t.month } },
      create: t,
      update: { targetRm: t.targetRm },
    });
  }
  console.log(`✓ Seeded ${targets.length} outlet targets`);

  // ── BSC KPIs ───────────────────────────────────────────────────────────────
  const kpis = [
    { perspective: "financial", kpiKey: "revenue_growth",  kpiLabel: "Revenue Growth",     targetDesc: "RM 8.14M (12% growth)", status: "on-track", note: "YTD tracking against monthly targets" },
    { perspective: "financial", kpiKey: "market_share",    kpiLabel: "Market Share",        targetDesc: "Expand new customers",  status: "on-track", note: "Trend In driving new customer acquisition" },
    { perspective: "financial", kpiKey: "net_profit",      kpiLabel: "Net Profit 10%",      targetDesc: "10% net margin",        status: "caution",  note: "Monitor cost vs revenue balance" },
    { perspective: "customer",  kpiKey: "sales_activities",kpiLabel: "Sales Activities",    targetDesc: "3 major campaigns/qtr", status: "on-track", note: "Trend In + Mix&Match + New Packaging live" },
    { perspective: "customer",  kpiKey: "digital_brand",   kpiLabel: "Digital & Branding",  targetDesc: "10M monthly views",     status: "caution",  note: "Creator Hub launched, content system building" },
    { perspective: "customer",  kpiKey: "vm_personalize",  kpiLabel: "VM & Personalization", targetDesc: "Standardized all outlets", status: "on-track", note: "Mix & Match display + packaging experience" },
    { perspective: "internal",  kpiKey: "sales_process",   kpiLabel: "Sales Process",       targetDesc: "100% OS adoption",      status: "caution",  note: "OS launched 15/05, adoption in progress" },
    { perspective: "internal",  kpiKey: "stock_accuracy",  kpiLabel: "Stock Accuracy",      targetDesc: "95%+ accuracy",         status: "on-track", note: "MPOS system tracking" },
    { perspective: "internal",  kpiKey: "product_planning",kpiLabel: "Product Planning",    targetDesc: "Quarterly review",      status: "on-track", note: "Product War Room module active" },
    { perspective: "learning",  kpiKey: "talent_dev",      kpiLabel: "Talent Development",  targetDesc: "All 13 outlets trained", status: "caution",  note: "Training rollout in progress" },
    { perspective: "learning",  kpiKey: "system_os",       kpiLabel: "JackStudio OS",       targetDesc: "Full adoption all staff", status: "on-track", note: "Direction B deployed, Creator Hub live" },
    { perspective: "learning",  kpiKey: "smac_culture",    kpiLabel: "SMaC Culture",        targetDesc: "Proactive execution",   status: "on-track", note: "Flywheel momentum building across teams" },
  ];

  for (const k of kpis) {
    await prisma.bscKpi.upsert({
      where:  { perspective_kpiKey: { perspective: k.perspective, kpiKey: k.kpiKey } },
      create: k,
      update: { kpiLabel: k.kpiLabel, targetDesc: k.targetDesc, status: k.status, note: k.note },
    });
  }
  console.log(`✓ Seeded ${kpis.length} BSC KPIs`);
}

main()
  .then(() => { console.log("Done!"); process.exit(0); })
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
