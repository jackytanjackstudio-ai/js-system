import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

// One-time endpoint to seed the admin user in production.
// Protected by INIT_SECRET env var — delete this file after first use.
export async function GET(req: Request) {
  const secret = new URL(req.url).searchParams.get("secret");
  if (!process.env.INIT_SECRET || secret !== process.env.INIT_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pw = await bcrypt.hash("jackstudio2026", 10);

  const outlets = [
    { id: "kl-flagship",   name: "KL Flagship",     city: "Kuala Lumpur",  type: "physical" },
    { id: "pavilion",      name: "Pavilion KL",      city: "Kuala Lumpur",  type: "physical" },
    { id: "midvalley",     name: "Mid Valley",       city: "Kuala Lumpur",  type: "physical" },
    { id: "utama",         name: "1 Utama",          city: "Petaling Jaya", type: "physical" },
    { id: "sunway",        name: "Sunway Pyramid",   city: "Subang",        type: "physical" },
    { id: "ioicity",       name: "IOI City Mall",    city: "Putrajaya",     type: "physical" },
    { id: "pj-ss2",        name: "SS2 PJ",           city: "Petaling Jaya", type: "physical" },
    { id: "kl-sentral",    name: "KL Sentral",       city: "Kuala Lumpur",  type: "physical" },
    { id: "ipoh-parade",   name: "Ipoh Parade",      city: "Ipoh",          type: "physical" },
    { id: "penang-gurney", name: "Gurney Plaza",     city: "Penang",        type: "physical" },
    { id: "penang-e-gate", name: "E-Gate",           city: "Penang",        type: "physical" },
    { id: "jb-city-sq",    name: "JB City Square",   city: "Johor Bahru",   type: "physical" },
    { id: "jb-paradigm",   name: "Paradigm Mall JB", city: "Johor Bahru",   type: "physical" },
    { id: "melaka-dp",     name: "Dataran Pahlawan", city: "Melaka",        type: "physical" },
    { id: "kota-bharu",    name: "KB Mall",          city: "Kota Bharu",    type: "physical" },
    { id: "kuantan",       name: "East Coast Mall",  city: "Kuantan",       type: "physical" },
    { id: "seremban",      name: "Seremban 2",       city: "Seremban",      type: "physical" },
    { id: "alor-setar",    name: "Aman Central",     city: "Alor Setar",    type: "physical" },
    { id: "da-men",        name: "Da Men Mall",      city: "USJ",           type: "physical" },
    { id: "setia-city",    name: "Setia City Mall",  city: "Shah Alam",     type: "physical" },
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
    await prisma.outlet.upsert({ where: { id: o.id }, update: {}, create: o });
  }

  const users = [
    { id: "u-jack",    name: "Jack",         email: "jack@jackstudio.my",    password: pw, role: "admin",   outletId: null,          phone: "0163341288" },
    { id: "u-jason",   name: "Jason Lim",    email: "jason@jackstudio.my",   password: pw, role: "sales",   outletId: "kl-flagship", phone: null },
    { id: "u-amirul",  name: "Amirul H.",    email: "amirul@jackstudio.my",  password: pw, role: "sales",   outletId: "pavilion",    phone: null },
    { id: "u-ali",     name: "Ali Haikal",   email: "ali@jackstudio.my",     password: pw, role: "creator", outletId: "tiktok",      phone: null },
    { id: "u-nurul",   name: "Nurul Ain",    email: "nurul@jackstudio.my",   password: pw, role: "creator", outletId: "tiktok",      phone: null },
    { id: "u-siti",    name: "Siti Maryam",  email: "siti@jackstudio.my",    password: pw, role: "creator", outletId: "ig",          phone: null },
    { id: "u-rachel",  name: "Rachel Tan",   email: "rachel@jackstudio.my",  password: pw, role: "product", outletId: null,          phone: null },
    { id: "u-hafiz",   name: "Hafiz Z.",     email: "hafiz@jackstudio.my",   password: pw, role: "sales",   outletId: "sunway",      phone: null },
    { id: "u-meiling", name: "Mei Ling",     email: "meiling@jackstudio.my", password: pw, role: "sales",   outletId: "penang-gurney", phone: null },
    { id: "u-kumar",   name: "Kumar S.",     email: "kumar@jackstudio.my",   password: pw, role: "sales",   outletId: "jb-city-sq",  phone: null },
    { id: "u-klmgr",   name: "Store KL Mgr",email: "klmgr@jackstudio.my",   password: pw, role: "manager", outletId: "kl-flagship", phone: null },
  ];

  const created: string[] = [];
  for (const u of users) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: { password: pw, isActive: true, phone: u.phone },
      create: { ...u, isActive: true },
    });
    created.push(u.email);
  }

  return NextResponse.json({
    ok: true,
    message: "Database seeded successfully",
    users: created,
    password: "jackstudio2026",
  });
}
