import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // ── 1. Q3 2026 Seasonal Strategy ─────────────────────────────────────────────
  await prisma.seasonalStrategy.updateMany({ data: { isActive: false } });

  const strategy = await prisma.seasonalStrategy.create({
    data: {
      quarter:    "Q3 2026",
      startDate:  "2026-07-01",
      endDate:    "2026-08-31",
      theme:      "Make It Yours",
      isActive:   true,
      campaignType: "Activation",

      heroProduct: "Smart Daily Carry Sling Bag — 4 Colors (Black / Brown / Navy / Gray) · 3+ Compartments + Tablet Slot · \"Organized. Light. Goes Everywhere.\"",

      supportingItems: JSON.stringify([
        "Slim Wallet (RFID & NFC) — 买包顺便买钱包",
        "Luggage Mix & Match — Trend In RM100 主攻",
        "Leather Belt — Add-on 配件",
      ]),

      contentDirections: JSON.stringify([
        "Laptop 留在公司，这个包装下你需要的一切",
        "旧包换新包 — 你的故事继续 (Trend In)",
        "选你的颜色，选你的背带 (Mix & Match)",
        "连包装都是你选的 (Packaging)",
        "3个格子，每样东西有自己的位置",
      ]),

      vmDirection: `门店分三区：

区域 1 — TREND IN CORNER
旧包收取台 + 纪念品样品展示
"带旧包来，换新故事"

区域 2 — MIX & MATCH WALL
4色 Sling Bag 陈列 · 背带颜色选板 · Luggage + 轮子颜色展示

区域 3 — PACKAGING STATION
3款包装颜色展示（Cream / Brown / Sage Green）
丝带 + Sticker 选色板 · 刻字机展示位`,

      keySignal: "Customers want organization + personalization. Top complaint: not enough compartments, design not matching. This bag solves both — 3 compartments + you choose the color.",

      backupStrategy: `如果 Sling Bag 走慢：
→ Bundle：Sling Bag + Slim Wallet 套餐价

如果 Trend In 参与少：
→ 降门槛：凭任何旧皮具收据享 RM30 rebate

如果 Mix & Match 讲不清楚：
→ 3个固定套餐：
  Urban Set（Black bag + Black strap）
  Travel Set（Navy bag + Gray strap）
  Premium Set（Brown bag + Brown strap）`,
    },
  });
  console.log("✅ Q3 2026 Strategy created:", strategy.id);

  // ── 2. Campaign 1: Trend In ───────────────────────────────────────────────────
  const c1 = await prisma.campaign.create({
    data: {
      name:      "Trend In — Old Change New",
      type:      "activation",
      startDate: "2026-07-01",
      endDate:   "2026-08-31",
      status:    "upcoming",
      scopeType: "all",
      owner:     "hq",
      channels:  JSON.stringify(["Offline", "TikTok", "Instagram"]),

      objective: JSON.stringify({
        headline: "Turn old bags into new stories — RM50/RM100 rebate + personalised keepsake",
        target:   "All outlets · July–August 2026",
      }),

      mechanics: JSON.stringify([
        "Customer brings any brand old bag or luggage to store",
        "Buy any new bag → RM50 Cash Rebate | Buy any new luggage → RM100 Cash Rebate",
        "Staff makes old bag into leather keepsake on the spot: Mini Bag / Keychain / Luggage Tag (customer chooses)",
        "Keepsake engraved with customer's initials + year (e.g. A.R · 2026)",
        "Completed within 15 minutes, taken home same day",
        "Conditions: 1x per customer · Any bag condition accepted · Rebate not stackable",
      ]),

      salesScript: `开场白：
"你现在有没有一个旧包在家里不用了？我们有个活动，你带过来可以换 RM50 买新包。而且我们会把你的旧包做成一个小纪念品，刻上你的名字，这个世界只有你一个。"

处理价格异议：
"其实算起来 Rebate 之后这款包只是 RMXX，比你现在那个旧包当年买的还便宜，但功能完全不一样了 — 你看它有三个格子，平板也可以放。"

Push to close：
"你想纪念品做哪款？钥匙扣还是迷你包？我帮你登记，15分钟你可以拿到。"`,

      contentPlan: JSON.stringify({
        prelaunch: "拍摄'Trend In 准备中'预热 TikTok 视频",
        weekly:    "每店至少 1 条 Trend In TikTok · 上传本周最佳纪念品照 · 更新 Before & After 照片墙",
      }),
    },
  });

  await prisma.vMGuide.create({
    data: {
      campaignId: c1.id,
      checklist: JSON.stringify([
        { id: "signage",     label: "Trend In 立牌到位 (门口)",                       required: true  },
        { id: "corner",      label: "Trend In Corner 布置完成 (纪念品样品 + 刻字机)",  required: true  },
        { id: "before_after",label: "Before & After 照片墙准备好",                    required: true  },
        { id: "materials",   label: "纪念品模具备齐 (迷你包 / 钥匙扣 / 行李牌)",      required: true  },
        { id: "training",    label: "全员 Trend In 操作培训完成",                     required: true  },
        { id: "engraver",    label: "刻字机测试正常",                                 required: true  },
        { id: "log_form",    label: "旧包收取记录表格建好",                           required: false },
      ]),
    },
  });

  await prisma.campaignTask.createMany({
    data: [
      { campaignId: c1.id, taskName: "刻字机测试，确认运作正常",                    category: "setup",   deadline: "2026-06-25" },
      { campaignId: c1.id, taskName: "纪念品模具备齐 (迷你包/钥匙扣/行李牌)",       category: "setup",   deadline: "2026-06-25" },
      { campaignId: c1.id, taskName: "全员 Trend In 操作培训完成",                  category: "staff",   deadline: "2026-06-28" },
      { campaignId: c1.id, taskName: "Trend In 立牌 + 宣传物料到位",                category: "vm",      deadline: "2026-06-30" },
      { campaignId: c1.id, taskName: "拍摄预热 TikTok 视频",                        category: "content", deadline: "2026-06-30" },
      { campaignId: c1.id, taskName: "统计本周 Trend In 参与人数 (每周)",            category: "general", deadline: "2026-07-07" },
      { campaignId: c1.id, taskName: "每店拍 1 条 Trend In TikTok (每周)",          category: "content", deadline: "2026-07-07" },
    ],
  });
  console.log("✅ Campaign 1 (Trend In) created:", c1.id);

  // ── 3. Campaign 2: Mix & Match ────────────────────────────────────────────────
  const c2 = await prisma.campaign.create({
    data: {
      name:      "Make It Yours — Mix & Match",
      type:      "product_launch",
      startDate: "2026-07-01",
      endDate:   "2026-08-31",
      status:    "upcoming",
      scopeType: "all",
      owner:     "hq",
      channels:  JSON.stringify(["Offline", "TikTok", "Shopee", "Instagram"]),

      objective: JSON.stringify({
        headline: "Personalise your bag — choose your colour, choose your strap",
        products: "Sling Bag (4 colors) · Luggage (wheel color) · Wallet (leather color) · Belt (buckle)",
      }),

      mechanics: JSON.stringify([
        "Sling Bag: choose bag color (Black/Brown/Navy/Gray) + strap color (matching or contrast)",
        "Luggage: choose wheel color + handle color (if applicable)",
        "Wallet: choose leather color (Black/Green/Brown/Gray)",
        "Belt: choose buckle style",
        "Personalisation included in product price — no extra charge",
        "Special/limited colors: optional RM10–20 premium",
      ]),

      salesScript: `开场白：
"这款包我们有四个颜色，你日常比较常穿什么颜色的衣服？我帮你配一个最适合你的。"

介绍功能：
"它有三个主要格子 — 这个放平板或文件，这个放钱包钥匙，前面这个放你随时要拿的东西。轻便，但什么都装得下。"

Color close：
"你比较喜欢 Navy 还是 Black？Navy 比较年轻，Black 百搭一些。或者你有特别喜欢的颜色我看看有没有？"`,

      contentPlan: JSON.stringify({
        prelaunch: "拍摄 4色对比产品照 (Shopee / TikTok)",
        weekly:    "记录每周最受欢迎颜色 · 收集客户选配照片 (获同意后发 TikTok)",
        biweekly:  "检查库存，热销色及时补货",
      }),
    },
  });

  await prisma.vMGuide.create({
    data: {
      campaignId: c2.id,
      checklist: JSON.stringify([
        { id: "step1",   label: "Step 1 显示牌: SELECT YOUR BAG (4色 Sling Bag 并排)", required: true  },
        { id: "step2",   label: "Step 2 显示牌: CHOOSE YOUR STRAP (背带颜色样板)",      required: true  },
        { id: "step3",   label: "Step 3 显示牌: MAKE IT YOURS (配色成品照)",            required: true  },
        { id: "card",    label: "搭配指南小卡摆放在柜台",                               required: true  },
        { id: "stock",   label: "所有颜色库存确认到位",                                 required: true  },
        { id: "training",label: "Staff 熟悉所有配色组合",                               required: true  },
      ]),
    },
  });

  await prisma.campaignTask.createMany({
    data: [
      { campaignId: c2.id, taskName: "所有颜色库存确认到位",                     category: "setup",   deadline: "2026-06-28" },
      { campaignId: c2.id, taskName: "Mix & Match 展示区搭建完成",               category: "vm",      deadline: "2026-06-30" },
      { campaignId: c2.id, taskName: "颜色搭配指南印刷好 (Classic/Urban/Premium/Bold)", category: "setup", deadline: "2026-06-28" },
      { campaignId: c2.id, taskName: "拍摄 4色对比产品照",                       category: "content", deadline: "2026-06-30" },
      { campaignId: c2.id, taskName: "记录每周最受欢迎颜色 (每周)",              category: "general", deadline: "2026-07-07" },
      { campaignId: c2.id, taskName: "检查库存，热销色补货 (每两周)",            category: "general", deadline: "2026-07-14" },
    ],
  });
  console.log("✅ Campaign 2 (Mix & Match) created:", c2.id);

  // ── 4. Campaign 3: New Packaging ─────────────────────────────────────────────
  const c3 = await prisma.campaign.create({
    data: {
      name:      "Jack Studio — New Packaging Experience",
      type:      "branding",
      startDate: "2026-07-01",
      endDate:   "2026-12-31",
      status:    "upcoming",
      scopeType: "all",
      owner:     "hq",
      channels:  JSON.stringify(["Offline", "TikTok", "Instagram"]),

      objective: JSON.stringify({
        headline: "Every purchase becomes a personalised gift experience",
        packaging: "3 colors: Cream / Deep Brown / Sage Green + ribbon + wish card + engraving",
      }),

      mechanics: JSON.stringify([
        "Step 1: Staff asks customer to choose packaging color (Cream / Brown / Sage Green)",
        "Step 2: Customer selects matching ribbon color",
        "Step 3: Gift option — add Wish Card with handwritten or engraved message",
        "Standard packaging: FREE (included)",
        "Gift packaging + Wish Card: RM5–10 (optional add-on)",
        "Invite customer to photograph — share as TikTok/Instagram content",
      ]),

      salesScript: `结账时：
"我们刚换了新包装，有三个颜色，你要选哪个？Cream 比较 Classic，Sage Green 比较特别，Deep Brown 比较高档感。"

礼品场景：
"这个是送人的吗？我帮你用礼品方式包装，还可以写一张 Wish Card，要不要刻上他的名字？"

引导分享：
"包装做好你可以拍一下，很好看的。我们 TikTok 也会分享客户的 unboxing，你介意我们拍一下吗？"`,

      contentPlan: JSON.stringify({
        prelaunch: "拍摄三款包装展示照",
        weekly:    "收集客户 Unboxing 照片/视频 · 统计各款包装使用比例",
        monthly:   "评估哪款最受欢迎，调整备货比例",
      }),
    },
  });

  await prisma.vMGuide.create({
    data: {
      campaignId: c3.id,
      checklist: JSON.stringify([
        { id: "display",  label: "三款包装盒样品展示台 (含产品在里面)",        required: true  },
        { id: "ribbon",   label: "丝带颜色选板摆好",                           required: true  },
        { id: "sticker",  label: "Sticker 款式展示",                           required: true  },
        { id: "signage",  label: "墙面: 'Your Packaging, Your Choice' 标语",   required: true  },
        { id: "photos",   label: "三款包装精美照片上墙",                       required: true  },
        { id: "stock",    label: "三款包装库存备齐",                           required: true  },
        { id: "training", label: "全员包装操作培训完成",                       required: true  },
        { id: "prompt",   label: "流程提示卡放置在收银台 (给 Staff 参考)",     required: false },
      ]),
    },
  });

  await prisma.campaignTask.createMany({
    data: [
      { campaignId: c3.id, taskName: "三款包装库存备齐 (按预计销量)",          category: "setup",   deadline: "2026-06-28" },
      { campaignId: c3.id, taskName: "Packaging Station 布置完成",             category: "vm",      deadline: "2026-06-30" },
      { campaignId: c3.id, taskName: "全员包装操作培训完成",                   category: "staff",   deadline: "2026-06-28" },
      { campaignId: c3.id, taskName: "拍摄三款包装展示照",                     category: "content", deadline: "2026-06-30" },
      { campaignId: c3.id, taskName: "统计各款包装使用比例 (每周)",            category: "general", deadline: "2026-07-07" },
      { campaignId: c3.id, taskName: "收集客户 Unboxing 照片/视频 (每周)",     category: "content", deadline: "2026-07-07" },
      { campaignId: c3.id, taskName: "监控包装库存，及时补货 (每月)",          category: "general", deadline: "2026-07-31" },
    ],
  });
  console.log("✅ Campaign 3 (New Packaging) created:", c3.id);

  console.log("\n🎯 All done — Q3 2026 strategy + 3 campaigns seeded.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
