export type OutletStatus = "Active" | "Low" | "Inactive";

export const outlets = [
  { id: "kl-flagship",   name: "KL Flagship",       city: "Kuala Lumpur",  type: "physical", revenue: 18400, inputs: 12, lastActive: "2h ago",  status: "Active"   as OutletStatus, staff: 5 },
  { id: "pavilion",      name: "Pavilion KL",        city: "Kuala Lumpur",  type: "physical", revenue: 15200, inputs:  9, lastActive: "3h ago",  status: "Active"   as OutletStatus, staff: 4 },
  { id: "midvalley",     name: "Mid Valley",         city: "Kuala Lumpur",  type: "physical", revenue: 12800, inputs:  7, lastActive: "5h ago",  status: "Active"   as OutletStatus, staff: 3 },
  { id: "utama",         name: "1 Utama",            city: "Petaling Jaya", type: "physical", revenue: 11600, inputs:  6, lastActive: "4h ago",  status: "Active"   as OutletStatus, staff: 3 },
  { id: "sunway",        name: "Sunway Pyramid",     city: "Subang",        type: "physical", revenue: 13400, inputs:  8, lastActive: "1h ago",  status: "Active"   as OutletStatus, staff: 4 },
  { id: "ioicity",       name: "IOI City Mall",      city: "Putrajaya",     type: "physical", revenue:  9200, inputs:  4, lastActive: "6h ago",  status: "Low"      as OutletStatus, staff: 2 },
  { id: "setia-city",    name: "Setia City Mall",    city: "Shah Alam",     type: "physical", revenue:  8100, inputs:  3, lastActive: "8h ago",  status: "Low"      as OutletStatus, staff: 2 },
  { id: "da-men",        name: "Da Men Mall",        city: "USJ",           type: "physical", revenue:  7600, inputs:  2, lastActive: "1d ago",  status: "Inactive" as OutletStatus, staff: 2 },
  { id: "ipoh-parade",   name: "Ipoh Parade",        city: "Ipoh",          type: "physical", revenue: 10200, inputs:  5, lastActive: "3h ago",  status: "Active"   as OutletStatus, staff: 3 },
  { id: "penang-gurney", name: "Gurney Plaza",       city: "Penang",        type: "physical", revenue: 14100, inputs:  8, lastActive: "2h ago",  status: "Active"   as OutletStatus, staff: 4 },
  { id: "penang-e-gate", name: "E-Gate",             city: "Penang",        type: "physical", revenue:  7800, inputs:  3, lastActive: "5h ago",  status: "Low"      as OutletStatus, staff: 2 },
  { id: "jb-city-sq",    name: "JB City Square",     city: "Johor Bahru",   type: "physical", revenue: 11900, inputs:  6, lastActive: "4h ago",  status: "Active"   as OutletStatus, staff: 3 },
  { id: "jb-paradigm",   name: "Paradigm Mall JB",   city: "Johor Bahru",   type: "physical", revenue:  9400, inputs:  4, lastActive: "3h ago",  status: "Active"   as OutletStatus, staff: 2 },
  { id: "melaka-dp",     name: "Dataran Pahlawan",   city: "Melaka",        type: "physical", revenue:  8600, inputs:  3, lastActive: "7h ago",  status: "Low"      as OutletStatus, staff: 2 },
  { id: "kota-bharu",    name: "KB Mall",            city: "Kota Bharu",    type: "physical", revenue:  6200, inputs:  2, lastActive: "1d ago",  status: "Inactive" as OutletStatus, staff: 2 },
  { id: "kuantan",       name: "East Coast Mall",    city: "Kuantan",       type: "physical", revenue:  7100, inputs:  2, lastActive: "1d ago",  status: "Inactive" as OutletStatus, staff: 2 },
  { id: "seremban",      name: "Seremban 2",         city: "Seremban",      type: "physical", revenue:  6800, inputs:  3, lastActive: "6h ago",  status: "Low"      as OutletStatus, staff: 2 },
  { id: "alor-setar",    name: "Aman Central",       city: "Alor Setar",    type: "physical", revenue:  5900, inputs:  1, lastActive: "2d ago",  status: "Inactive" as OutletStatus, staff: 2 },
  { id: "pj-ss2",        name: "SS2 PJ",             city: "Petaling Jaya", type: "physical", revenue:  9800, inputs:  5, lastActive: "3h ago",  status: "Active"   as OutletStatus, staff: 3 },
  { id: "kl-sentral",    name: "KL Sentral",         city: "Kuala Lumpur",  type: "physical", revenue: 12100, inputs:  7, lastActive: "2h ago",  status: "Active"   as OutletStatus, staff: 3 },
];

export const onlineChannels = [
  { id: "shopee",   name: "Shopee",     icon: "🛒", revenue: 31200, orders: 420, inputs: 18, lastActive: "1h ago",  status: "Active" as OutletStatus, convRate: "4.2%" },
  { id: "lazada",   name: "Lazada",     icon: "📦", revenue: 18600, orders: 248, inputs: 11, lastActive: "2h ago",  status: "Active" as OutletStatus, convRate: "3.1%" },
  { id: "tiktok",   name: "TikTok Shop",icon: "🎵", revenue: 24800, orders: 312, inputs: 22, lastActive: "30m ago", status: "Active" as OutletStatus, convRate: "5.8%" },
  { id: "website",  name: "Website",    icon: "🌐", revenue:  8400, orders:  96, inputs:  4, lastActive: "4h ago",  status: "Low"    as OutletStatus, convRate: "1.9%" },
  { id: "facebook", name: "Facebook",   icon: "📘", revenue:  6200, orders:  84, inputs:  6, lastActive: "3h ago",  status: "Low"    as OutletStatus, convRate: "2.4%" },
  { id: "ig",       name: "Instagram",  icon: "📸", revenue:  9100, orders: 118, inputs:  8, lastActive: "1h ago",  status: "Active" as OutletStatus, convRate: "3.6%" },
  { id: "rednote",  name: "Rednote",    icon: "📕", revenue:  5400, orders:  68, inputs:  5, lastActive: "5h ago",  status: "Low"    as OutletStatus, convRate: "2.8%" },
  { id: "whatsapp", name: "WhatsApp",   icon: "💬", revenue: 11200, orders: 156, inputs: 14, lastActive: "45m ago", status: "Active" as OutletStatus, convRate: "6.2%" },
];

export const staffRoster = [
  { id: "s1",  name: "Jason Lim",     role: "Sales",    outlet: "kl-flagship",   phone: "012-3456789", status: "Active" },
  { id: "s2",  name: "Amirul H.",     role: "Sales",    outlet: "pavilion",      phone: "013-2345678", status: "Active" },
  { id: "s3",  name: "Rachel Tan",    role: "Product",  outlet: "hq",            phone: "011-3456789", status: "Active" },
  { id: "s4",  name: "Store KL Mgr", role: "Manager",  outlet: "kl-flagship",   phone: "012-9876543", status: "Active" },
  { id: "s5",  name: "Ali Haikal",   role: "Creator",  outlet: "online",        phone: "019-1234567", status: "Active" },
  { id: "s6",  name: "Nurul Ain",    role: "Creator",  outlet: "online",        phone: "018-7654321", status: "Active" },
  { id: "s7",  name: "Siti Maryam", role: "Creator",  outlet: "online",        phone: "017-2345678", status: "Active" },
  { id: "s8",  name: "Hafiz Z.",     role: "Sales",    outlet: "sunway",        phone: "016-3456789", status: "Active" },
  { id: "s9",  name: "Mei Ling",     role: "Sales",    outlet: "penang-gurney", phone: "014-5678901", status: "Active" },
  { id: "s10", name: "Kumar S.",     role: "Sales",    outlet: "jb-city-sq",    phone: "012-6789012", status: "Active" },
];

export const topProducts = [
  { name: "Classic Leather Wallet (Black)",  sales: 248, revenue: 24800, trend: "+12%" },
  { name: "Slim Card Holder (Brown)",        sales: 196, revenue: 17640, trend: "+8%"  },
  { name: "Tote Bag (Caramel)",              sales: 134, revenue: 26800, trend: "+31%" },
  { name: "Travel Luggage 24\" (Navy)",      sales:  87, revenue: 52200, trend: "+5%"  },
  { name: "Belt Classic (Black)",            sales:  76, revenue:  7600, trend: "-3%"  },
];

export const topRequests = [
  { label: "Bigger wallet capacity",   count: 47, category: "Design" },
  { label: "More colour options",      count: 38, category: "Design" },
  { label: "Luggage lock included",    count: 31, category: "Feature" },
  { label: "Crossbody strap option",   count: 24, category: "Feature" },
  { label: "Personalization / Emboss", count: 18, category: "Upsell" },
];

export const topIssues = [
  { label: "Price too high",      count: 52, type: "Objection" },
  { label: "Size not available",  count: 34, type: "Availability" },
  { label: "Colour out of stock", count: 21, type: "Availability" },
  { label: "Warranty concern",    count: 14, type: "Trust" },
];

export const weeklyRevenue = [
  { week: "W14", revenue: 68000,  target: 70000 },
  { week: "W15", revenue: 71000,  target: 70000 },
  { week: "W16", revenue: 65000,  target: 70000 },
  { week: "W17", revenue: 78000,  target: 75000 },
  { week: "W18", revenue: 82000,  target: 75000 },
  { week: "W19", revenue: 74000,  target: 75000 },
  { week: "W20", revenue: 88000,  target: 80000 },
];

export const creatorVideos = [
  {
    id: "v1",
    title: "Classic Wallet Unboxing",
    creator: "Ali Haikal",
    platform: "TikTok",
    views: 420000,
    likes: 18200,
    comments: 1340,
    sales_linked: 62,
    top_comment: "Can this come in brown? 🔥",
    product_signal: "Slim Wallet (Brown)",
  },
  {
    id: "v2",
    title: "Travel Series EP1 – Luggage Review",
    creator: "Nurul Ain",
    platform: "TikTok",
    views: 280000,
    likes: 12500,
    comments: 980,
    sales_linked: 34,
    top_comment: "Does it fit cabin size? Need 20\"",
    product_signal: "Cabin Luggage 20\"",
  },
  {
    id: "v3",
    title: "JackStudio Tote – Everyday Look",
    creator: "Siti Maryam",
    platform: "Instagram",
    views: 95000,
    likes: 7800,
    comments: 420,
    sales_linked: 28,
    top_comment: "Love this! Got crossbody version?",
    product_signal: "Crossbody Tote",
  },
];

export type ProductStatus = "Testing" | "Scale" | "Eliminated" | "Watchlist";

export const products = [
  {
    id: "p1",
    name: "Cabin Luggage 20\"",
    category: "Luggage",
    status: "Testing" as ProductStatus,
    stage: "Bullet",
    hit_rate: 68,
    signal_source: "Creator + Sales",
    decision_date: "2026-04-14",
    notes: "Strong demand from creator comments. Small batch ordered.",
    tasks: ["Creator content x3", "Shopee listing", "Store display"],
  },
  {
    id: "p2",
    name: "Slim Wallet (Brown)",
    category: "Leather Goods",
    status: "Scale" as ProductStatus,
    stage: "Cannonball",
    hit_rate: 91,
    signal_source: "TikTok viral",
    decision_date: "2026-04-07",
    notes: "Exceeded test target. Push inventory x3.",
    tasks: ["Increase stock", "Bundle deal", "All channels"],
  },
  {
    id: "p3",
    name: "Crossbody Tote",
    category: "Bags",
    status: "Watchlist" as ProductStatus,
    stage: "Bullet",
    hit_rate: 0,
    signal_source: "Customer Input + Creator",
    decision_date: null,
    notes: "Multiple signals received. Pending sourcing.",
    tasks: ["Find supplier", "Sample review"],
  },
  {
    id: "p4",
    name: "Canvas Backpack",
    category: "Bags",
    status: "Eliminated" as ProductStatus,
    stage: "Bullet",
    hit_rate: 18,
    signal_source: "Internal idea",
    decision_date: "2026-03-21",
    notes: "Low traction, not on-brand. Eliminated.",
    tasks: [],
  },
];

export const executionTasks = [
  {
    id: "t1",
    title: "Ali Haikal – Cabin Luggage video",
    type: "Creator",
    assignee: "Ali Haikal",
    due: "2026-04-25",
    status: "In Progress",
    result: null,
  },
  {
    id: "t2",
    title: "Store display – Slim Wallet (Brown)",
    type: "Store",
    assignee: "Store Manager KL",
    due: "2026-04-22",
    status: "Completed",
    result: "+24 units in 3 days",
  },
  {
    id: "t3",
    title: "Shopee campaign – Raya Bundle",
    type: "Campaign",
    assignee: "Ecom Team",
    due: "2026-04-28",
    status: "Not Started",
    result: null,
  },
  {
    id: "t4",
    title: "Nurul Ain – Travel Series EP2",
    type: "Creator",
    assignee: "Nurul Ain",
    due: "2026-04-23",
    status: "In Progress",
    result: null,
  },
];

export const rewardLeaderboard = [
  { rank: 1, name: "Ali Haikal",   role: "Creator",       pts: 340, breakdown: { sales: 80,  creator: 200, product: 30, execution: 20, culture: 10 } },
  { rank: 2, name: "Jason Lim",    role: "Sales",         pts: 295, breakdown: { sales: 210, creator: 0,   product: 50, execution: 25, culture: 10 } },
  { rank: 3, name: "Siti Maryam",  role: "Creator",       pts: 260, breakdown: { sales: 30,  creator: 170, product: 30, execution: 20, culture: 10 } },
  { rank: 4, name: "Nurul Ain",    role: "Creator",       pts: 230, breakdown: { sales: 20,  creator: 150, product: 30, execution: 20, culture: 10 } },
  { rank: 5, name: "Amirul H.",    role: "Sales",         pts: 185, breakdown: { sales: 140, creator: 0,   product: 20, execution: 15, culture: 10 } },
  { rank: 6, name: "Rachel Tan",   role: "Product",       pts: 170, breakdown: { sales: 0,   creator: 20,  product: 110,execution: 30, culture: 10 } },
  { rank: 7, name: "Store KL Mgr", role: "Store Manager", pts: 140, breakdown: { sales: 90,  creator: 0,   product: 10, execution: 30, culture: 10 } },
];

export const impactBonuses = [
  {
    id: "ib1",
    person:  "Jason Lim",
    role:    "Sales",
    insight: "Customer wants bigger wallet with coin pocket",
    product: "Slim Wallet (Brown)",
    outcome: "Cannonball — 91% hit rate",
    bonus:   100,
    date:    "2026-04-07",
  },
  {
    id: "ib2",
    person:  "Ali Haikal",
    role:    "Creator",
    insight: "TikTok comments asking for cabin luggage 20\"",
    product: 'Cabin Luggage 20"',
    outcome: "Now in testing — batch ordered",
    bonus:   50,
    date:    "2026-04-14",
  },
  {
    id: "ib3",
    person:  "Siti Maryam",
    role:    "Creator",
    insight: "Multiple comments asking for crossbody strap",
    product: "Crossbody Tote",
    outcome: "Added to Product Watchlist",
    bonus:   30,
    date:    "2026-04-18",
  },
];

export const systemFeedback = [
  {
    id:      "sf1",
    week:    "W20",
    person:  "Jason Lim",
    role:    "Sales",
    outlet:  "KL Flagship",
    insight: "Customer wants bigger wallet with coin pocket",
    action:  "Slim Wallet (Brown) → Now Cannonball 🔥",
    status:  "shipped" as const,
  },
  {
    id:      "sf2",
    week:    "W20",
    person:  "Ali Haikal",
    role:    "Creator",
    outlet:  "TikTok",
    insight: 'Comments asking for cabin luggage 20"',
    action:  "Cabin Luggage → Testing batch ordered",
    status:  "in_progress" as const,
  },
  {
    id:      "sf3",
    week:    "W19",
    person:  "Store KL Mgr",
    role:    "Store Manager",
    outlet:  "KL Flagship",
    insight: "3 customers asked for crossbody strap option",
    action:  "Crossbody Tote → Added to Watchlist",
    status:  "in_progress" as const,
  },
  {
    id:      "sf4",
    week:    "W19",
    person:  "Amirul H.",
    role:    "Sales",
    outlet:  "1Utama",
    insight: "Budget customers asking for RM300 entry luggage",
    action:  "Pricing review scheduled for W21",
    status:  "pending" as const,
  },
];
