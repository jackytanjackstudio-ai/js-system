import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

// Seeds all essential data into production DB. Safe to call multiple times (upsert).
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
    { id: "p1", name: 'Cabin Luggage 20"', category: "Luggage",      status: "Testing",   stage: "Bullet",     hitRate: 68, signalSource: "Creator + Sales",      decisionDate: "2026-04-14", notes: "Strong demand from creator comments. Small batch ordered.",  tasks: JSON.stringify(["Creator content x3", "Shopee listing", "Store display"]) },
    { id: "p2", name: "Slim Wallet (Brown)", category: "Leather Goods", status: "Scale",   stage: "Cannonball", hitRate: 91, signalSource: "TikTok viral",          decisionDate: "2026-04-07", notes: "Exceeded test target. Push inventory x3.",                  tasks: JSON.stringify(["Increase stock", "Bundle deal", "All channels"]) },
    { id: "p3", name: "Crossbody Tote",    category: "Bags",          status: "Watchlist", stage: "Bullet",     hitRate: 0,  signalSource: "Customer Input + Creator", decisionDate: null,       notes: "Multiple signals received. Pending sourcing.",              tasks: JSON.stringify(["Find supplier", "Sample review"]) },
    { id: "p4", name: "Canvas Backpack",   category: "Bags",          status: "Eliminated", stage: "Bullet",    hitRate: 18, signalSource: "Internal idea",         decisionDate: "2026-03-21", notes: "Low traction, not on-brand. Eliminated.",                    tasks: JSON.stringify([]) },
  ];
  for (const p of products) {
    await prisma.product.upsert({ where: { id: p.id }, update: {}, create: p });
  }
  results.products = await prisma.product.count();

  return NextResponse.json({ ok: true, seeded: results });
}
