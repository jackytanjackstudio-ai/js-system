import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// One-time: seeds outlets into the production DB. Safe to call multiple times (upsert).
export async function GET() {
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
    await prisma.outlet.upsert({
      where:  { id: o.id },
      update: { isActive: true },
      create: { ...o, isActive: true },
    });
  }

  const count = await prisma.outlet.count();
  return NextResponse.json({ ok: true, outletCount: count });
}
