import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

// Seeds ALL demo data into production DB. Safe to call multiple times (upsert).
export async function GET() {
  const results: Record<string, number> = {};

  // ── Outlets ──────────────────────────────────────────────────────────
  const outlets = [
    { id: "kl-flagship",   name: "KL Flagship",       city: "Kuala Lumpur",  type: "physical" },
    { id: "pavilion",      name: "Pavilion KL",        city: "Kuala Lumpur",  type: "physical" },
    { id: "midvalley",     name: "Mid Valley",         city: "Kuala Lumpur",  type: "physical" },
    { id: "utama",         name: "1 Utama",            city: "Petaling Jaya", type: "physical" },
    { id: "sunway",        name: "Sunway Pyramid",     city: "Subang",        type: "physical" },
    { id: "ioicity",       name: "IOI City Mall",      city: "Putrajaya",     type: "physical" },
    { id: "pj-ss2",        name: "SS2 PJ",             city: "Petaling Jaya", type: "physical" },
    { id: "kl-sentral",    name: "KL Sentral",         city: "Kuala Lumpur",  type: "physical" },
    { id: "ipoh-parade",   name: "Ipoh Parade",        city: "Ipoh",          type: "physical" },
    { id: "penang-gurney", name: "Gurney Plaza",       city: "Penang",        type: "physical" },
    { id: "penang-e-gate", name: "E-Gate",             city: "Penang",        type: "physical" },
    { id: "jb-city-sq",    name: "JB City Square",     city: "Johor Bahru",   type: "physical" },
    { id: "jb-paradigm",   name: "Paradigm Mall JB",   city: "Johor Bahru",   type: "physical" },
    { id: "melaka-dp",     name: "Dataran Pahlawan",   city: "Melaka",        type: "physical" },
    { id: "kota-bharu",    name: "KB Mall",            city: "Kota Bharu",    type: "physical" },
    { id: "kuantan",       name: "East Coast Mall",    city: "Kuantan",       type: "physical" },
    { id: "seremban",      name: "Seremban 2",         city: "Seremban",      type: "physical" },
    { id: "alor-setar",    name: "Aman Central",       city: "Alor Setar",    type: "physical" },
    { id: "da-men",        name: "Da Men Mall",        city: "USJ",           type: "physical" },
    { id: "setia-city",    name: "Setia City Mall",    city: "Shah Alam",     type: "physical" },
    { id: "shopee",   name: "Shopee",      city: "Online", type: "online", channelKey: "shopee"   },
    { id: "lazada",   name: "Lazada",      city: "Online", type: "online", channelKey: "lazada"   },
    { id: "tiktok",   name: "TikTok Shop", city: "Online", type: "online", channelKey: "tiktok"   },
    { id: "website",  name: "Website",     city: "Online", type: "online", channelKey: "website"  },
    { id: "facebook", name: "Facebook",    city: "Online", type: "online", channelKey: "facebook" },
    { id: "ig",       name: "Instagram",   city: "Online", type: "online", channelKey: "ig"       },
    { id: "rednote",  name: "Rednote",     city: "Online", type: "online", channelKey: "rednote"  },
    { id: "whatsapp", name: "WhatsApp",    city: "Online", type: "online", channelKey: "whatsapp" },
  ];
  for (const o of outlets) {
    await prisma.outlet.upsert({ where: { id: o.id }, update: { isActive: true }, create: { ...o, isActive: true } });
  }
  results.outlets = await prisma.outlet.count();

  // ── Users ─────────────────────────────────────────────────────────────
  const pw = await bcrypt.hash("jackstudio2026", 10);
  const users = [
    { id: "u-jack",    name: "Jack",          email: "jack@jackstudio.my",    role: "admin",   outletId: null,            phone: "0163341288" },
    { id: "u-jason",   name: "Jason Lim",     email: "jason@jackstudio.my",   role: "sales",   outletId: "kl-flagship",   phone: null },
    { id: "u-amirul",  name: "Amirul H.",     email: "amirul@jackstudio.my",  role: "sales",   outletId: "pavilion",      phone: null },
    { id: "u-ali",     name: "Ali Haikal",    email: "ali@jackstudio.my",     role: "creator", outletId: "tiktok",        phone: null },
    { id: "u-nurul",   name: "Nurul Ain",     email: "nurul@jackstudio.my",   role: "creator", outletId: "tiktok",        phone: null },
    { id: "u-siti",    name: "Siti Maryam",   email: "siti@jackstudio.my",    role: "creator", outletId: "ig",            phone: null },
    { id: "u-rachel",  name: "Rachel Tan",    email: "rachel@jackstudio.my",  role: "product", outletId: null,            phone: null },
    { id: "u-hafiz",   name: "Hafiz Z.",      email: "hafiz@jackstudio.my",   role: "sales",   outletId: "sunway",        phone: null },
    { id: "u-meiling", name: "Mei Ling",      email: "meiling@jackstudio.my", role: "sales",   outletId: "penang-gurney", phone: null },
    { id: "u-kumar",   name: "Kumar S.",      email: "kumar@jackstudio.my",   role: "sales",   outletId: "jb-city-sq",    phone: null },
    { id: "u-klmgr",   name: "Store KL Mgr", email: "klmgr@jackstudio.my",   role: "manager", outletId: "kl-flagship",   phone: null },
  ];
  for (const u of users) {
    await prisma.user.upsert({
      where:  { id: u.id },
      update: { isActive: true, phone: u.phone },
      create: { ...u, password: pw, isActive: true },
    });
  }
  results.users = await prisma.user.count();

  // ── Products ─────────────────────────────────────────────────────────
  const products = [
    { id: "p1", name: 'Cabin Luggage 20"',  category: "Luggage",       status: "Testing",   stage: "Bullet",     hitRate: 68, signalSource: "Creator + Sales",         decisionDate: "2026-04-14", notes: "Strong demand from creator comments. Small batch ordered.", tasks: JSON.stringify(["Creator content x3", "Shopee listing", "Store display"]) },
    { id: "p2", name: "Slim Wallet (Brown)", category: "Leather Goods", status: "Scale",     stage: "Cannonball", hitRate: 91, signalSource: "TikTok viral",             decisionDate: "2026-04-07", notes: "Exceeded test target. Push inventory x3.",                 tasks: JSON.stringify(["Increase stock", "Bundle deal", "All channels"]) },
    { id: "p3", name: "Crossbody Tote",     category: "Bags",          status: "Watchlist", stage: "Bullet",     hitRate: 0,  signalSource: "Customer Input + Creator", decisionDate: null,         notes: "Multiple signals received. Pending sourcing.",             tasks: JSON.stringify(["Find supplier", "Sample review"]) },
    { id: "p4", name: "Canvas Backpack",    category: "Bags",          status: "Eliminated", stage: "Bullet",    hitRate: 18, signalSource: "Internal idea",            decisionDate: "2026-03-21", notes: "Low traction, not on-brand. Eliminated.",                  tasks: JSON.stringify([]) },
  ];
  for (const p of products) {
    await prisma.product.upsert({ where: { id: p.id }, update: {}, create: p });
  }
  results.products = await prisma.product.count();

  // ── Execution Tasks ───────────────────────────────────────────────────
  const tasks = [
    { id: "t1", title: "Ali Haikal – Cabin Luggage video",    type: "Creator",  assignee: "Ali Haikal",       due: "2026-04-25", status: "In Progress", result: null },
    { id: "t2", title: "Store display – Slim Wallet (Brown)", type: "Store",    assignee: "Store Manager KL", due: "2026-04-22", status: "Completed",   result: "+24 units in 3 days" },
    { id: "t3", title: "Shopee campaign – Raya Bundle",       type: "Campaign", assignee: "Ecom Team",        due: "2026-04-28", status: "Not Started", result: null },
    { id: "t4", title: "Nurul Ain – Travel Series EP2",       type: "Creator",  assignee: "Nurul Ain",        due: "2026-04-23", status: "In Progress", result: null },
    { id: "t5", title: "KB Mall – restock Slim Wallet",       type: "Store",    assignee: "KB Mall Mgr",      due: "2026-04-20", status: "Not Started", result: null },
  ];
  for (const t of tasks) {
    await prisma.executionTask.upsert({ where: { id: t.id }, update: {}, create: t });
  }
  results.tasks = await prisma.executionTask.count();

  // ── Reward Points ─────────────────────────────────────────────────────
  const points = [
    { id: "rp1",  userId: "u-ali",    category: "creator",   points: 200, reason: "TikTok viral – 420K views",             weekRef: "W20" },
    { id: "rp2",  userId: "u-ali",    category: "sales",     points: 80,  reason: "Linked sales from content",             weekRef: "W20" },
    { id: "rp3",  userId: "u-ali",    category: "product",   points: 30,  reason: "Signal led to Cabin Luggage test",      weekRef: "W20" },
    { id: "rp4",  userId: "u-ali",    category: "execution", points: 20,  reason: "Content delivered on time",             weekRef: "W20" },
    { id: "rp5",  userId: "u-ali",    category: "culture",   points: 10,  reason: "Proactive collaboration",               weekRef: "W20" },
    { id: "rp6",  userId: "u-jason",  category: "sales",     points: 210, reason: "Top sales KL Flagship",                 weekRef: "W20" },
    { id: "rp7",  userId: "u-jason",  category: "product",   points: 50,  reason: "Insight: Slim Wallet (Brown) → Cannon", weekRef: "W20" },
    { id: "rp8",  userId: "u-jason",  category: "execution", points: 25,  reason: "All tasks on time",                     weekRef: "W20" },
    { id: "rp9",  userId: "u-jason",  category: "culture",   points: 10,  reason: "Good team communication",               weekRef: "W20" },
    { id: "rp10", userId: "u-siti",   category: "creator",   points: 170, reason: "Instagram engagement top performer",    weekRef: "W20" },
    { id: "rp11", userId: "u-siti",   category: "product",   points: 30,  reason: "Crossbody signal from IG comments",     weekRef: "W20" },
    { id: "rp12", userId: "u-siti",   category: "execution", points: 20,  reason: "2 posts delivered",                     weekRef: "W20" },
    { id: "rp13", userId: "u-siti",   category: "culture",   points: 10,  reason: "Team spirit",                           weekRef: "W20" },
    { id: "rp14", userId: "u-rachel", category: "product",   points: 110, reason: "Product testing coordination",          weekRef: "W20" },
    { id: "rp15", userId: "u-rachel", category: "execution", points: 30,  reason: "Process optimized",                     weekRef: "W20" },
    { id: "rp16", userId: "u-rachel", category: "creator",   points: 20,  reason: "Supported creator brief",               weekRef: "W20" },
    { id: "rp17", userId: "u-rachel", category: "culture",   points: 10,  reason: "Documentation excellent",               weekRef: "W20" },
  ];
  for (const p of points) {
    await prisma.rewardPoint.upsert({ where: { id: p.id }, update: {}, create: p });
  }
  results.rewardPoints = await prisma.rewardPoint.count();

  // ── System Feedback ───────────────────────────────────────────────────
  const feedback = [
    { id: "sf1", userId: "u-jason",  week: "W20", outlet: "KL Flagship", insight: "Customer wants bigger wallet with coin pocket",   action: "Slim Wallet (Brown) → Now Cannonball 🔥", status: "shipped",     bonus: 100 },
    { id: "sf2", userId: "u-ali",    week: "W20", outlet: "TikTok",      insight: 'Comments asking for cabin luggage 20"',           action: "Cabin Luggage → Testing batch ordered",   status: "in_progress", bonus: 50  },
    { id: "sf3", userId: "u-klmgr",  week: "W19", outlet: "KL Flagship", insight: "3 customers asked for crossbody strap option",    action: "Crossbody Tote → Added to Watchlist",     status: "in_progress", bonus: 30  },
    { id: "sf4", userId: "u-amirul", week: "W19", outlet: "1Utama",      insight: "Budget customers asking for RM300 entry luggage", action: "Pricing review scheduled for W21",        status: "pending",     bonus: 0   },
  ];
  for (const f of feedback) {
    await prisma.systemFeedback.upsert({ where: { id: f.id }, update: {}, create: f });
  }
  results.feedback = await prisma.systemFeedback.count();

  // ── Creator Content ───────────────────────────────────────────────────
  const content = [
    { id: "cc1", userId: "u-ali",   platform: "TikTok",    title: "Classic Wallet Unboxing",     views: 420000, likes: 18200, comments: 1340, linkedSales: 62, topComment: "Can this come in brown? 🔥",        productSignal: "Slim Wallet (Brown)" },
    { id: "cc2", userId: "u-nurul", platform: "TikTok",    title: "Travel Series EP1 – Luggage", views: 280000, likes: 12500, comments: 980,  linkedSales: 34, topComment: 'Does it fit cabin size? Need 20"', productSignal: 'Cabin Luggage 20"'   },
    { id: "cc3", userId: "u-siti",  platform: "Instagram", title: "JackStudio Tote – Everyday",  views:  95000, likes:  7800, comments: 420,  linkedSales: 28, topComment: "Love this! Got crossbody version?", productSignal: "Crossbody Tote"      },
  ];
  for (const c of content) {
    await prisma.creatorContent.upsert({ where: { id: c.id }, update: {}, create: c });
  }
  results.creatorContent = await prisma.creatorContent.count();

  return NextResponse.json({ ok: true, seeded: results });
}
