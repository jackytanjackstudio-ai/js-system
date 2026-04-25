import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const updates = [
    { id: "kl-flagship",   name: "BERJAYA TIME SQUARE",  city: "Kuala Lumpur",  isActive: true  },
    { id: "midvalley",     name: "AEON BUKIT TINGGI",    city: "KLANG",         isActive: true  },
    { id: "utama",         name: "PARADIGM MALL",        city: "Petaling Jaya", isActive: true  },
    { id: "ioicity",       name: "ALAMANDA",             city: "Putrajaya",     isActive: true  },
    { id: "pj-ss2",        name: "AEON PERMAS JAYA",     city: "JOHOR BHARU",   isActive: true  },
    { id: "kuantan",       name: "EAST COAST MALL",      city: "Kuantan",       isActive: true  },
    { id: "jb-city-sq",    name: "AEON BUKIT INDAH",     city: "Johor Bahru",   isActive: true  },
    { id: "jb-paradigm",   name: "AEON KULAI JAYA",      city: "Johor Bahru",   isActive: true  },
    { id: "melaka-dp",     name: "AEON ALPHA ANGLE",     city: "WANGSA MAJU",   isActive: true  },
    { id: "seremban",      name: "AEON SEREMBAN 2",      city: "Seremban",      isActive: true  },
    { id: "da-men",        name: "MAIN PLACE",           city: "USJ",           isActive: true  },
    { id: "alor-setar",    name: "MAYANG MALL",          city: "TERRENGGANU",   isActive: true  },
    { id: "penang-e-gate", name: "SUNWAY CARNIVAL MALL", city: "Penang",        isActive: true  },
    { id: "pavilion",      name: "Pavilion KL",          city: "Kuala Lumpur",  isActive: false },
    { id: "sunway",        name: "Sunway Pyramid",       city: "Subang",        isActive: false },
    { id: "kl-sentral",    name: "KL Sentral",           city: "Kuala Lumpur",  isActive: false },
    { id: "ipoh-parade",   name: "Ipoh Parade",          city: "Ipoh",          isActive: false },
    { id: "penang-gurney", name: "Gurney Plaza",         city: "Penang",        isActive: false },
    { id: "kota-bharu",    name: "KB Mall",              city: "Kota Bharu",    isActive: false },
    { id: "setia-city",    name: "Setia City Mall",      city: "Shah Alam",     isActive: false },
  ];

  for (const u of updates) {
    await prisma.outlet.update({
      where: { id: u.id },
      data:  { name: u.name, city: u.city, isActive: u.isActive },
    });
  }

  const active = await prisma.outlet.findMany({ where: { isActive: true }, select: { id: true, name: true, city: true } });
  return NextResponse.json({ ok: true, activeOutlets: active });
}
