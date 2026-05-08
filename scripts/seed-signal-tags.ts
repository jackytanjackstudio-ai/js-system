import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const tags = [
  // Product Signal
  { name: "RFID",            category: "product",  emoji: "📡" },
  { name: "Lightweight",     category: "product",  emoji: "🪶" },
  { name: "Water Resistant", category: "product",  emoji: "💧" },
  { name: "Large Capacity",  category: "product",  emoji: "📦" },
  { name: "Slim Design",     category: "product",  emoji: "📐" },
  { name: "Premium Leather", category: "product",  emoji: "✨" },
  { name: "Anti-Theft",      category: "product",  emoji: "🔒" },
  { name: "USB Charging",    category: "product",  emoji: "🔋" },

  // Customer Signal
  { name: "Looking for Gift",   category: "customer", emoji: "🎁" },
  { name: "Budget Conscious",   category: "customer", emoji: "💰" },
  { name: "Just Browsing",      category: "customer", emoji: "👀" },
  { name: "Comparing Brands",   category: "customer", emoji: "🔍" },
  { name: "Need Bigger Size",   category: "customer", emoji: "📏" },
  { name: "Need Smaller Size",  category: "customer", emoji: "📐" },
  { name: "Repeat Customer",    category: "customer", emoji: "🔄" },
  { name: "Bought Immediately", category: "customer", emoji: "⚡" },
  { name: "Corporate / Bulk",   category: "customer", emoji: "🏢" },
  { name: "Brought Friend",     category: "customer", emoji: "👫" },

  // Trend Signal
  { name: "Travel Demand",    category: "trend", emoji: "✈️" },
  { name: "Office Commuter",  category: "trend", emoji: "💼" },
  { name: "Minimalist Style", category: "trend", emoji: "🎯" },
  { name: "Crossbody Trend",  category: "trend", emoji: "👜" },
  { name: "TikTok Influence", category: "trend", emoji: "📱" },
  { name: "Festive Gifting",  category: "trend", emoji: "🎄" },
  { name: "Father's Day",     category: "trend", emoji: "👔" },
  { name: "Premium Feel",     category: "trend", emoji: "✨" },
  { name: "Couple Purchase",  category: "trend", emoji: "💑" },
  { name: "Color Request",    category: "trend", emoji: "🎨" },
];

async function main() {
  let created = 0;
  let skipped = 0;
  for (const [i, tag] of tags.entries()) {
    const exists = await prisma.signalTag.findFirst({ where: { name: tag.name, category: tag.category } });
    if (exists) { skipped++; continue; }
    await prisma.signalTag.create({ data: { ...tag, sortOrder: i } });
    created++;
  }
  console.log(`Done — ${created} created, ${skipped} skipped (already exist)`);
}

main().finally(() => prisma.$disconnect());
