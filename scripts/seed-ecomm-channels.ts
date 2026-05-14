import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const CHANNELS = [
  { channelKey: "tiktok_js",    channelName: "TikTok JS",          brand: "JS",    platform: "tiktok",   target2026: 5780000, sortOrder: 1 },
  { channelKey: "shopee_lp",    channelName: "Shopee LP",          brand: "LP",    platform: "shopee",   target2026:  900000, sortOrder: 2 },
  { channelKey: "shopee_js",    channelName: "Shopee JS",          brand: "JS",    platform: "shopee",   target2026:  420000, sortOrder: 3 },
  { channelKey: "zalora_js",    channelName: "Zalora JS",          brand: "JS",    platform: "zalora",   target2026:  300000, sortOrder: 4 },
  { channelKey: "lazada_lp_ep", channelName: "Lazada LP & EP",     brand: "MIXED", platform: "lazada",   target2026:  150000, sortOrder: 5 },
  { channelKey: "shopee_lp_new",channelName: "Shopee LP (New)",    brand: "LP",    platform: "shopee",   target2026:  120000, sortOrder: 6 },
  { channelKey: "tiktok_lp",    channelName: "TikTok LP",          brand: "LP",    platform: "tiktok",   target2026:  100000, sortOrder: 7 },
  { channelKey: "shopify_js",   channelName: "Shopify JS",         brand: "JS",    platform: "shopify",  target2026:  100000, sortOrder: 8 },
  { channelKey: "shopee_ep_bp", channelName: "Shopee EP Backpack", brand: "EP",    platform: "shopee",   target2026:  100000, sortOrder: 9 },
  { channelKey: "lazada_js",    channelName: "Lazada JS",          brand: "JS",    platform: "lazada",   target2026:   30000, sortOrder: 10 },
];

type Row = { channelKey: string; year: number; month: number; amount: number };

const ACTUALS_2026: Row[] = [
  { channelKey:"tiktok_js",    year:2026, month:1,  amount:453670.78 },
  { channelKey:"tiktok_js",    year:2026, month:2,  amount:357901.58 },
  { channelKey:"tiktok_js",    year:2026, month:3,  amount:437165.35 },
  { channelKey:"tiktok_js",    year:2026, month:4,  amount:368418.54 },
  { channelKey:"shopee_lp",    year:2026, month:1,  amount:102600.70 },
  { channelKey:"shopee_lp",    year:2026, month:2,  amount:106069.08 },
  { channelKey:"shopee_lp",    year:2026, month:3,  amount:97053.36  },
  { channelKey:"shopee_lp",    year:2026, month:4,  amount:105917.21 },
  { channelKey:"shopee_js",    year:2026, month:1,  amount:40173.02  },
  { channelKey:"shopee_js",    year:2026, month:2,  amount:43694.35  },
  { channelKey:"shopee_js",    year:2026, month:3,  amount:51050.06  },
  { channelKey:"shopee_js",    year:2026, month:4,  amount:38263.30  },
  { channelKey:"zalora_js",    year:2026, month:1,  amount:25820.00  },
  { channelKey:"zalora_js",    year:2026, month:2,  amount:18295.00  },
  { channelKey:"zalora_js",    year:2026, month:3,  amount:13940.00  },
  { channelKey:"zalora_js",    year:2026, month:4,  amount:13127.00  },
  { channelKey:"lazada_lp_ep", year:2026, month:1,  amount:10268.34  },
  { channelKey:"lazada_lp_ep", year:2026, month:2,  amount:9152.58   },
  { channelKey:"lazada_lp_ep", year:2026, month:3,  amount:6915.45   },
  { channelKey:"lazada_lp_ep", year:2026, month:4,  amount:6987.88   },
  { channelKey:"shopee_lp_new",year:2026, month:1,  amount:4968.35   },
  { channelKey:"shopee_lp_new",year:2026, month:2,  amount:4913.75   },
  { channelKey:"shopee_lp_new",year:2026, month:3,  amount:5399.68   },
  { channelKey:"shopee_lp_new",year:2026, month:4,  amount:4915.77   },
  { channelKey:"tiktok_lp",    year:2026, month:1,  amount:5889.10   },
  { channelKey:"tiktok_lp",    year:2026, month:2,  amount:7153.84   },
  { channelKey:"tiktok_lp",    year:2026, month:3,  amount:5656.99   },
  { channelKey:"tiktok_lp",    year:2026, month:4,  amount:5774.25   },
  { channelKey:"shopify_js",   year:2026, month:1,  amount:8638.00   },
  { channelKey:"shopify_js",   year:2026, month:2,  amount:0         },
  { channelKey:"shopify_js",   year:2026, month:3,  amount:18060.00  },
  { channelKey:"shopify_js",   year:2026, month:4,  amount:0         },
  { channelKey:"shopee_ep_bp", year:2026, month:1,  amount:14620.36  },
  { channelKey:"shopee_ep_bp", year:2026, month:2,  amount:5423.09   },
  { channelKey:"shopee_ep_bp", year:2026, month:3,  amount:4433.30   },
  { channelKey:"shopee_ep_bp", year:2026, month:4,  amount:10398.51  },
  { channelKey:"lazada_js",    year:2026, month:1,  amount:2605.88   },
  { channelKey:"lazada_js",    year:2026, month:2,  amount:4545.67   },
  { channelKey:"lazada_js",    year:2026, month:3,  amount:3114.83   },
  { channelKey:"lazada_js",    year:2026, month:4,  amount:1996.52   },
];

const ACTUALS_2025: Row[] = [
  {channelKey:"tiktok_js",year:2025,month:1,amount:249852},{channelKey:"tiktok_js",year:2025,month:2,amount:281825},
  {channelKey:"tiktok_js",year:2025,month:3,amount:237100},{channelKey:"tiktok_js",year:2025,month:4,amount:244963},
  {channelKey:"tiktok_js",year:2025,month:5,amount:277319},{channelKey:"tiktok_js",year:2025,month:6,amount:266256},
  {channelKey:"tiktok_js",year:2025,month:7,amount:292328},{channelKey:"tiktok_js",year:2025,month:8,amount:288601},
  {channelKey:"tiktok_js",year:2025,month:9,amount:300344},{channelKey:"tiktok_js",year:2025,month:10,amount:337119},
  {channelKey:"tiktok_js",year:2025,month:11,amount:487404},{channelKey:"tiktok_js",year:2025,month:12,amount:714957},
  {channelKey:"shopee_lp",year:2025,month:1,amount:106557},{channelKey:"shopee_lp",year:2025,month:2,amount:80585},
  {channelKey:"shopee_lp",year:2025,month:3,amount:78786},{channelKey:"shopee_lp",year:2025,month:4,amount:64957},
  {channelKey:"shopee_lp",year:2025,month:5,amount:77015},{channelKey:"shopee_lp",year:2025,month:6,amount:62989},
  {channelKey:"shopee_lp",year:2025,month:7,amount:56366},{channelKey:"shopee_lp",year:2025,month:8,amount:54117},
  {channelKey:"shopee_lp",year:2025,month:9,amount:61682},{channelKey:"shopee_lp",year:2025,month:10,amount:73642},
  {channelKey:"shopee_lp",year:2025,month:11,amount:94018},{channelKey:"shopee_lp",year:2025,month:12,amount:113317},
  {channelKey:"shopee_js",year:2025,month:1,amount:39477},{channelKey:"shopee_js",year:2025,month:2,amount:34046},
  {channelKey:"shopee_js",year:2025,month:3,amount:23407},{channelKey:"shopee_js",year:2025,month:4,amount:25386},
  {channelKey:"shopee_js",year:2025,month:5,amount:26236},{channelKey:"shopee_js",year:2025,month:6,amount:27071},
  {channelKey:"shopee_js",year:2025,month:7,amount:29521},{channelKey:"shopee_js",year:2025,month:8,amount:45146},
  {channelKey:"shopee_js",year:2025,month:9,amount:35193},{channelKey:"shopee_js",year:2025,month:10,amount:37268},
  {channelKey:"shopee_js",year:2025,month:11,amount:36291},{channelKey:"shopee_js",year:2025,month:12,amount:40088},
  {channelKey:"zalora_js",year:2025,month:1,amount:26585},{channelKey:"zalora_js",year:2025,month:2,amount:29823},
  {channelKey:"zalora_js",year:2025,month:3,amount:25249},{channelKey:"zalora_js",year:2025,month:4,amount:17044},
  {channelKey:"zalora_js",year:2025,month:5,amount:17109},{channelKey:"zalora_js",year:2025,month:6,amount:20987},
  {channelKey:"zalora_js",year:2025,month:7,amount:17534},{channelKey:"zalora_js",year:2025,month:8,amount:15155},
  {channelKey:"zalora_js",year:2025,month:9,amount:15735},{channelKey:"zalora_js",year:2025,month:10,amount:10339},
  {channelKey:"zalora_js",year:2025,month:11,amount:21194},{channelKey:"zalora_js",year:2025,month:12,amount:32167},
  {channelKey:"lazada_lp_ep",year:2025,month:1,amount:13682},{channelKey:"lazada_lp_ep",year:2025,month:2,amount:10565},
  {channelKey:"lazada_lp_ep",year:2025,month:3,amount:12378},{channelKey:"lazada_lp_ep",year:2025,month:4,amount:7049},
  {channelKey:"lazada_lp_ep",year:2025,month:5,amount:8368},{channelKey:"lazada_lp_ep",year:2025,month:6,amount:8441},
  {channelKey:"lazada_lp_ep",year:2025,month:7,amount:5261},{channelKey:"lazada_lp_ep",year:2025,month:8,amount:5833},
  {channelKey:"lazada_lp_ep",year:2025,month:9,amount:6736},{channelKey:"lazada_lp_ep",year:2025,month:10,amount:11550},
  {channelKey:"lazada_lp_ep",year:2025,month:11,amount:9816},{channelKey:"lazada_lp_ep",year:2025,month:12,amount:7704},
  {channelKey:"shopee_lp_new",year:2025,month:1,amount:11640},{channelKey:"shopee_lp_new",year:2025,month:2,amount:10350},
  {channelKey:"shopee_lp_new",year:2025,month:3,amount:15045},{channelKey:"shopee_lp_new",year:2025,month:4,amount:10944},
  {channelKey:"shopee_lp_new",year:2025,month:5,amount:10188},{channelKey:"shopee_lp_new",year:2025,month:6,amount:8867},
  {channelKey:"shopee_lp_new",year:2025,month:7,amount:6487},{channelKey:"shopee_lp_new",year:2025,month:8,amount:5613},
  {channelKey:"shopee_lp_new",year:2025,month:9,amount:7370},{channelKey:"shopee_lp_new",year:2025,month:10,amount:6582},
  {channelKey:"shopee_lp_new",year:2025,month:11,amount:5589},{channelKey:"shopee_lp_new",year:2025,month:12,amount:7397},
  {channelKey:"tiktok_lp",year:2025,month:1,amount:8873},{channelKey:"tiktok_lp",year:2025,month:2,amount:4289},
  {channelKey:"tiktok_lp",year:2025,month:3,amount:4447},{channelKey:"tiktok_lp",year:2025,month:4,amount:4372},
  {channelKey:"tiktok_lp",year:2025,month:5,amount:6236},{channelKey:"tiktok_lp",year:2025,month:6,amount:7127},
  {channelKey:"tiktok_lp",year:2025,month:7,amount:5836},{channelKey:"tiktok_lp",year:2025,month:8,amount:5875},
  {channelKey:"tiktok_lp",year:2025,month:9,amount:6302},{channelKey:"tiktok_lp",year:2025,month:10,amount:6081},
  {channelKey:"tiktok_lp",year:2025,month:11,amount:7121},{channelKey:"tiktok_lp",year:2025,month:12,amount:5621},
  {channelKey:"shopify_js",year:2025,month:1,amount:1217},{channelKey:"shopify_js",year:2025,month:2,amount:7122},
  {channelKey:"shopify_js",year:2025,month:3,amount:2633},{channelKey:"shopify_js",year:2025,month:4,amount:12928},
  {channelKey:"shopify_js",year:2025,month:5,amount:12181},{channelKey:"shopify_js",year:2025,month:6,amount:1215},
  {channelKey:"shopify_js",year:2025,month:7,amount:2231},{channelKey:"shopify_js",year:2025,month:8,amount:0},
  {channelKey:"shopify_js",year:2025,month:9,amount:0},{channelKey:"shopify_js",year:2025,month:10,amount:0},
  {channelKey:"shopify_js",year:2025,month:11,amount:0},{channelKey:"shopify_js",year:2025,month:12,amount:950},
  {channelKey:"shopee_ep_bp",year:2025,month:5,amount:616},{channelKey:"shopee_ep_bp",year:2025,month:6,amount:6594},
  {channelKey:"shopee_ep_bp",year:2025,month:7,amount:5742},{channelKey:"shopee_ep_bp",year:2025,month:8,amount:4185},
  {channelKey:"shopee_ep_bp",year:2025,month:9,amount:4146},{channelKey:"shopee_ep_bp",year:2025,month:10,amount:8159},
  {channelKey:"shopee_ep_bp",year:2025,month:11,amount:4949},{channelKey:"shopee_ep_bp",year:2025,month:12,amount:14438},
  {channelKey:"lazada_js",year:2025,month:1,amount:2462},{channelKey:"lazada_js",year:2025,month:2,amount:3380},
  {channelKey:"lazada_js",year:2025,month:3,amount:1904},{channelKey:"lazada_js",year:2025,month:4,amount:2441},
  {channelKey:"lazada_js",year:2025,month:5,amount:1547},{channelKey:"lazada_js",year:2025,month:6,amount:1618},
  {channelKey:"lazada_js",year:2025,month:7,amount:2305},{channelKey:"lazada_js",year:2025,month:8,amount:2343},
  {channelKey:"lazada_js",year:2025,month:9,amount:1467},{channelKey:"lazada_js",year:2025,month:10,amount:3018},
  {channelKey:"lazada_js",year:2025,month:11,amount:2926},{channelKey:"lazada_js",year:2025,month:12,amount:3485},
];

async function main() {
  console.log("Seeding ecomm channels...");
  for (const ch of CHANNELS) {
    await prisma.ecommChannel.upsert({
      where:  { channelKey: ch.channelKey },
      update: ch,
      create: ch,
    });
  }

  console.log("Seeding ecomm actuals...");
  const all = [...ACTUALS_2025, ...ACTUALS_2026];
  for (const row of all) {
    await prisma.ecommActual.upsert({
      where:  { channelKey_year_month: { channelKey: row.channelKey, year: row.year, month: row.month } },
      update: { amount: row.amount },
      create: row,
    });
  }
  console.log(`Done. ${all.length} rows seeded.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
