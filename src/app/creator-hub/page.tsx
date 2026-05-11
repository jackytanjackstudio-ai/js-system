"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useLang } from "@/context/LangContext";
import type { Lang } from "@/lib/i18n";

// ─── Brand ────────────────────────────────────────────────────────────────────

const BRAND       = "#C17F24";
const BRAND_LIGHT = "#FDF3E3";
const BRAND_DARK  = "#8B5A10";

// ─── Multilingual helper ──────────────────────────────────────────────────────

type ML = Record<Lang, string>;
function pick(ml: ML, lang: Lang): string { return ml[lang] ?? ml.zh; }

// ─── Campaigns ────────────────────────────────────────────────────────────────

const CAMPAIGNS = {
  trendin: {
    id: "trendin", emoji: "♻️", name: "Old Change New", sub: "Trend In",
    color: "#C17F24", light: "#FDF3E3", dark: "#8B5A10",
    period: "01 Jul – 31 Aug 2026",
    tagline: {
      zh: "每一个旧包，都有新的故事",
      en: "Every old bag has a new story to tell",
      ms: "Setiap beg lama ada cerita baru",
    } as ML,
    hook: {
      zh: "带旧包来，换新故事。RM50 / RM100 rebate + 专属皮革纪念品，刻上你的名字。",
      en: "Bring your old bag, get a new story. RM50 / RM100 rebate + exclusive leather keepsake, engraved with your name.",
      ms: "Bawa beg lama, dapat cerita baru. Rebat RM50 / RM100 + cenderamata kulit eksklusif, diukir dengan nama anda.",
    } as ML,
  },
  packaging: {
    id: "packaging", emoji: "🎁", name: "New Packaging", sub: "Make It Yours",
    color: "#4A7C59", light: "#EDF5F0", dark: "#2D5C3E",
    period: "01 Jul onwards",
    tagline: {
      zh: "连包装都是你选的",
      en: "Even the packaging is your choice",
      ms: "Pembungkusan pun pilihan anda",
    } as ML,
    hook: {
      zh: "三款包装颜色，客户自己选。买东西还是买体验？",
      en: "Three packaging colors, customer's choice. Buying a product or buying an experience?",
      ms: "Tiga warna pembungkusan, pilihan pelanggan sendiri. Beli barang atau beli pengalaman?",
    } as ML,
  },
  mixmatch: {
    id: "mixmatch", emoji: "🎨", name: "Mix & Match", sub: "Product Personality",
    color: "#3B6CB7", light: "#EBF0FA", dark: "#2A4E8C",
    period: "01 Jul – 31 Aug 2026",
    tagline: {
      zh: "选你的颜色，选你的风格",
      en: "Choose your color, choose your style",
      ms: "Pilih warna anda, pilih gaya anda",
    } as ML,
    hook: {
      zh: "同一款包，四种颜色。你选哪个？",
      en: "Same bag, four colors. Which one is yours?",
      ms: "Beg yang sama, empat warna. Yang mana pilihan anda?",
    } as ML,
  },
} as const;

type CampKey = keyof typeof CAMPAIGNS;

// ─── Weekly calendar ──────────────────────────────────────────────────────────

const WEEKS = [
  {
    week: 1, dates: "1 – 7 Jul", focus: "trendin" as CampKey,
    type: "REACTION", typeColor: "#E53E3E",
    title: { zh: "Launch Week — 捕捉第一个反应", en: "Launch Week — Capture the First Reaction", ms: "Minggu Pelancaran — Tangkap Reaksi Pertama" } as ML,
    mission: { zh: "Trend In 正式开始。第一周最重要的任务：拍下客户拿到纪念品那一刻的真实反应。", en: "Trend In officially begins. The most important task in week one: capture the genuine reaction the moment customers receive their keepsake.", ms: "Trend In bermula secara rasmi. Tugas terpenting minggu pertama: rakam reaksi sebenar pelanggan ketika mereka menerima cenderamata." } as ML,
    shoot: [
      { zh: "客户看到纪念品刻上自己名字时的表情", en: "Customer's expression when they see their name engraved on the keepsake", ms: "Ekspresi pelanggan apabila melihat nama mereka diukir pada cenderamata" } as ML,
      { zh: "客户第一次把旧包交出来的动作", en: "The moment a customer hands over their old bag for the first time", ms: "Detik pelanggan menyerahkan beg lama mereka buat pertama kali" } as ML,
      { zh: "Staff 把成品递给客户的那一刻", en: "Staff presenting the finished product to the customer", ms: "Kakitangan menyerahkan produk siap kepada pelanggan" } as ML,
    ],
    howto: [
      { zh: "手机竖拍 9:16，不要横拍", en: "Shoot vertically 9:16, not horizontal", ms: "Rakam menegak 9:16, jangan mendatar" } as ML,
      { zh: "镜头对准客户的脸，不是产品", en: "Aim the lens at the customer's face, not the product", ms: "Halakan kamera ke muka pelanggan, bukan produk" } as ML,
      { zh: "不要提前告知客户要拍，自然最好", en: "Don't tell the customer you're filming in advance — natural is best", ms: "Jangan beritahu pelanggan lebih awal — semula jadi adalah terbaik" } as ML,
      { zh: "15 – 30 秒就够，不需要太长", en: "15–30 seconds is enough, no need for longer", ms: "15–30 saat sudah cukup, tidak perlu terlalu panjang" } as ML,
    ],
    donts: [
      { zh: "不要拍产品多过拍人", en: "Don't film the product more than the person", ms: "Jangan rakam produk lebih banyak daripada orang" } as ML,
      { zh: "不要让客户刻意摆 pose", en: "Don't ask customers to pose deliberately", ms: "Jangan minta pelanggan berpostur dengan sengaja" } as ML,
      { zh: "不要加太多字幕", en: "Don't add too many captions", ms: "Jangan tambah terlalu banyak kapsyen" } as ML,
    ],
    captions: [
      { zh: "当她看到自己名字刻在上面的那一刻 🥹 #JackStudio #TrendIn", en: "The moment she saw her name engraved on it 🥹 #JackStudio #TrendIn", ms: "Detik dia nampak nama dia diukir di atasnya 🥹 #JackStudio #TrendIn" } as ML,
      { zh: '"我没想到会这么好看" — 客户原话 ✨', en: '"I didn\'t expect it to look this good" — actual customer words ✨', ms: '"Saya tak sangka cantik macam ni" — kata sebenar pelanggan ✨' } as ML,
      { zh: "旧包的新生命。#OldChangeNew #JackStudio", en: "New life for an old bag. #OldChangeNew #JackStudio", ms: "Kehidupan baru untuk beg lama. #OldChangeNew #JackStudio" } as ML,
    ],
    target: { zh: "每店最少 2 条", en: "Min. 2 per store", ms: "Min. 2 setiap kedai" } as ML,
  },
  {
    week: 2, dates: "8 – 14 Jul", focus: "trendin" as CampKey,
    type: "PROCESS", typeColor: "#D69E2E",
    title: { zh: "Show The Craft — 过程就是故事", en: "Show The Craft — The Process Is the Story", ms: "Tunjukkan Kraf — Proses Adalah Cerita" } as ML,
    mission: { zh: "这周拍制作过程。旧包变纪念品的每一步都是内容。不需要解说，画面会说话。", en: "This week, film the making process. Every step of turning an old bag into a keepsake is content. No commentary needed — the visuals speak for themselves.", ms: "Minggu ini, rakam proses pembuatan. Setiap langkah menukar beg lama menjadi cenderamata adalah kandungan. Tiada ulasan diperlukan — visual sudah bercerita." } as ML,
    shoot: [
      { zh: "旧包皮料被剪裁的特写", en: "Close-up of the old bag leather being cut", ms: "Rakam dekat kulit beg lama dipotong" } as ML,
      { zh: "刻字机运作的过程（特写+声音）", en: "Engraving machine in action (close-up + sound)", ms: "Mesin ukiran beroperasi (rakaman dekat + bunyi)" } as ML,
      { zh: "手工缝制 / 组装纪念品", en: "Hand-stitching / assembling the keepsake", ms: "Jahitan tangan / pemasangan cenderamata" } as ML,
      { zh: "完成品 vs 旧包的对比摆放", en: "Finished product vs old bag side-by-side comparison", ms: "Perbandingan produk siap vs beg lama" } as ML,
    ],
    howto: [
      { zh: "俯拍（bird eye view）工作台，固定角度", en: "Bird's-eye view of the workbench, fixed angle", ms: "Pandangan atas meja kerja, sudut tetap" } as ML,
      { zh: "开始时拍旧包（有故事），结尾拍成品", en: "Start with the old bag (has a story), end with the finished product", ms: "Mulakan dengan beg lama (ada cerita), akhiri dengan produk siap" } as ML,
      { zh: "刻字机声音保留，是 ASMR 内容", en: "Keep the engraving machine sound — it's ASMR content", ms: "Simpan bunyi mesin ukiran — ia kandungan ASMR" } as ML,
      { zh: "整个过程剪成 30 – 45 秒", en: "Edit the whole process to 30–45 seconds", ms: "Edit keseluruhan proses kepada 30–45 saat" } as ML,
    ],
    donts: [
      { zh: "不要加太多背景音乐盖掉刻字机声音", en: "Don't add too much background music that covers the engraving sound", ms: "Jangan tambah terlalu banyak muzik latar yang menenggelamkan bunyi ukiran" } as ML,
      { zh: "不要跳过中间步骤，过程是重点", en: "Don't skip the middle steps — the process is the point", ms: "Jangan langkau langkah pertengahan — proses adalah intipatinya" } as ML,
      { zh: "不要只拍成品", en: "Don't only film the finished product", ms: "Jangan rakam produk siap sahaja" } as ML,
    ],
    captions: [
      { zh: "你的旧包，变成这个。全程 15 分钟。♻️ #TrendIn #JackStudio", en: "Your old bag, becomes this. 15 minutes from start to finish. ♻️ #TrendIn #JackStudio", ms: "Beg lama anda, jadi ini. 15 minit sahaja. ♻️ #TrendIn #JackStudio" } as ML,
      { zh: "旧的不去，新的不来。但旧的可以变成这样 ♻️", en: "Out with the old, in with the new — except the old becomes this ♻️", ms: "Lama diubah, baru datang — beg lama pun boleh jadi macam ni ♻️" } as ML,
      { zh: "从一个旧包，到一个专属纪念品 🔨✨", en: "From an old bag, to an exclusive keepsake 🔨✨", ms: "Dari beg lama, kepada cenderamata eksklusif 🔨✨" } as ML,
    ],
    target: { zh: "每店最少 2 条", en: "Min. 2 per store", ms: "Min. 2 setiap kedai" } as ML,
  },
  {
    week: 3, dates: "15 – 21 Jul", focus: "mixmatch" as CampKey,
    type: "FUNCTION DEMO", typeColor: "#3B6CB7",
    title: { zh: "Mix & Match — 让客户自己选", en: "Mix & Match — Let Customers Choose", ms: "Mix & Match — Biarkan Pelanggan Memilih" } as ML,
    mission: { zh: "这周主角换成 Mix & Match。拍客户选颜色的过程，以及 Sling Bag 的功能展示。", en: "This week the spotlight shifts to Mix & Match. Film customers choosing colors, and demonstrate the Sling Bag's functionality.", ms: "Minggu ini fokus beralih ke Mix & Match. Rakam pelanggan memilih warna, dan tunjukkan fungsi Sling Bag." } as ML,
    shoot: [
      { zh: "四色 Sling Bag 并排在自然光下", en: "Four-color Sling Bags side by side in natural light", ms: "Empat warna Sling Bag bersebelahan di bawah cahaya semula jadi" } as ML,
      { zh: "把日常物品一件一件放入包里（测试容量）", en: "Loading everyday items one by one into the bag (capacity test)", ms: "Masukkan barang harian satu persatu ke dalam beg (ujian kapasiti)" } as ML,
      { zh: "客户在 Mix & Match 区选颜色的过程", en: "Customer selecting colors at the Mix & Match display", ms: "Pelanggan memilih warna di kawasan Mix & Match" } as ML,
      { zh: "同款包不同颜色的上身对比", en: "Same bag, different colors — wear comparison", ms: "Beg yang sama, warna berbeza — perbandingan semasa dipakai" } as ML,
    ],
    howto: [
      { zh: "容量测试：慢慢放，一件一件，有节奏感", en: "Capacity test: place items slowly, one by one, with rhythm", ms: "Ujian kapasiti: letak perlahan, satu persatu, ada irama" } as ML,
      { zh: "颜色对比：白色背景 / 浅色墙，自然光", en: "Color comparison: white background / light wall, natural light", ms: "Perbandingan warna: latar putih / dinding cerah, cahaya semula jadi" } as ML,
      { zh: "选颜色时：拍客户犹豫和决定的过程", en: "During color selection: film the customer's hesitation and decision moment", ms: "Semasa pilih warna: rakam proses ragu dan keputusan pelanggan" } as ML,
      { zh: "上身对比：同一个人换不同颜色背", en: "Wear comparison: same person trying different colors", ms: "Perbandingan pakai: orang yang sama cuba warna berbeza" } as ML,
    ],
    donts: [
      { zh: "不要只拍包，要有人在画面里", en: "Don't only film the bag — there must be a person in the frame", ms: "Jangan rakam beg sahaja — mesti ada orang dalam gambar" } as ML,
      { zh: "颜色对比不要在暗处拍", en: "Don't shoot color comparisons in dim lighting", ms: "Jangan rakam perbandingan warna di tempat gelap" } as ML,
      { zh: "容量测试不要放太快", en: "Don't move too fast during the capacity test", ms: "Jangan terlalu pantas semasa ujian kapasiti" } as ML,
    ],
    captions: [
      { zh: "Black vs Navy，你会选哪个？在下面评论 👇", en: "Black vs Navy — which would you choose? Comment below 👇", ms: "Black vs Navy — mana pilihan anda? Komen di bawah 👇" } as ML,
      { zh: "我试着把这些东西全部塞进去... 结果出乎意料 😮", en: "I tried to fit all of this inside... the result was surprising 😮", ms: "Saya cuba masukkan semua ini... hasilnya mengejutkan 😮" } as ML,
      { zh: "同一个包，四种性格。你是哪一款？ #MixAndMatch", en: "Same bag, four personalities. Which one are you? #MixAndMatch", ms: "Beg yang sama, empat personaliti. Anda yang mana? #MixAndMatch" } as ML,
    ],
    target: { zh: "每店最少 2 条", en: "Min. 2 per store", ms: "Min. 2 setiap kedai" } as ML,
  },
  {
    week: 4, dates: "22 – 31 Jul", focus: "packaging" as CampKey,
    type: "REACTION", typeColor: "#4A7C59",
    title: { zh: "Packaging Surprise — 惊喜时刻", en: "Packaging Surprise — The Wow Moment", ms: "Kejutan Pembungkusan — Detik Wow" } as ML,
    mission: { zh: "这周拍 New Packaging 的客户反应。重点是客户第一次看到可以选包装颜色时的惊喜。", en: "This week, film customer reactions to New Packaging. The focus is capturing the surprise moment when customers first discover they can choose the packaging color.", ms: "Minggu ini, rakam reaksi pelanggan terhadap New Packaging. Fokus pada detik terkejut pelanggan apabila pertama kali tahu mereka boleh pilih warna pembungkusan." } as ML,
    shoot: [
      { zh: "Staff 拿出三款包装让客户选的一刻", en: "Staff presenting three packaging options for customers to choose", ms: "Kakitangan menunjukkan tiga pilihan pembungkusan kepada pelanggan" } as ML,
      { zh: "客户打开新包装的 Unboxing", en: "Customer unboxing the new packaging", ms: "Pelanggan membuka kotak pembungkusan baru" } as ML,
      { zh: "三款包装并排的产品拍摄", en: "Product shot with all three packaging options side by side", ms: "Rakam produk dengan tiga pilihan pembungkusan bersebelahan" } as ML,
      { zh: "Staff 当场包装的过程", en: "Staff packaging the item on the spot", ms: "Kakitangan membungkus barang di hadapan pelanggan" } as ML,
    ],
    howto: [
      { zh: "Unboxing：从客户视角拍（俯拍或侧拍）", en: "Unboxing: film from the customer's POV (top-down or side angle)", ms: "Unboxing: rakam dari sudut pandang pelanggan (atas atau sisi)" } as ML,
      { zh: "三款包装对比：放在柜台同一条直线", en: "Three-packaging comparison: line them up on the same counter", ms: "Perbandingan tiga pembungkusan: susun dalam satu barisan di kaunter" } as ML,
      { zh: "Staff 包装过程：侧面固定机位，不要抖", en: "Packaging process: fixed side angle, no shaking", ms: "Proses pembungkusan: sudut sisi tetap, jangan bergegar" } as ML,
      { zh: "重点：拍丝带打蝴蝶结那一刻的特写", en: "Key shot: close-up of the ribbon being tied into a bow", ms: "Rakam utama: rakaman dekat reben diikat menjadi busur" } as ML,
    ],
    donts: [
      { zh: "不要在乱的背景前拍", en: "Don't film in front of a cluttered background", ms: "Jangan rakam di hadapan latar yang bersepah" } as ML,
      { zh: "包装展示要确保灯光充足", en: "Ensure adequate lighting for the packaging showcase", ms: "Pastikan pencahayaan mencukupi untuk paparan pembungkusan" } as ML,
      { zh: "不要太快，包装过程需要有仪式感", en: "Don't rush — the packaging process should feel ceremonial", ms: "Jangan tergesa-gesa — proses pembungkusan perlu ada rasa istimewa" } as ML,
    ],
    captions: [
      { zh: '"你们的包装可以自己选颜色的吗？" 可以 😊 #JackStudio', en: '"Can I really choose my own packaging color?" Yes you can 😊 #JackStudio', ms: '"Boleh ke pilih warna pembungkusan sendiri?" Boleh 😊 #JackStudio' } as ML,
      { zh: "买东西还是买体验？我们选择两个都给你 🎁", en: "Buying a product or an experience? We choose both 🎁", ms: "Beli barang atau beli pengalaman? Kami pilih kedua-duanya 🎁" } as ML,
      { zh: "连包装都是你选的。这才叫真正的 Make It Yours ✨", en: "Even the packaging is your choice. That's what Make It Yours truly means ✨", ms: "Pembungkusan pun pilihan anda. Itulah maksud sebenar Make It Yours ✨" } as ML,
    ],
    target: { zh: "每店最少 2 条", en: "Min. 2 per store", ms: "Min. 2 setiap kedai" } as ML,
  },
];

// ─── Content types ────────────────────────────────────────────────────────────

const CONTENT_TYPES = [
  {
    id: "reaction", name: "REACTION", emoji: "😮", color: "#E53E3E",
    desc:  { zh: "最强、最容易病毒的内容类型", en: "The strongest and most viral content type", ms: "Jenis kandungan paling kuat dan paling viral" } as ML,
    rule:  { zh: "拍脸，不是拍包", en: "Film the face, not the bag", ms: "Rakam muka, bukan beg" } as ML,
    steps: [
      { zh: "找到一个真实时刻（纪念品递交 / 包装惊喜 / 颜色决定）", en: "Find a genuine moment (keepsake handover / packaging surprise / color decision)", ms: "Cari detik sebenar (serahkan cenderamata / kejutan pembungkusan / keputusan warna)" } as ML,
      { zh: "手机竖拍，镜头对准客户脸部", en: "Shoot vertically, aim at the customer's face", ms: "Rakam menegak, halakan ke muka pelanggan" } as ML,
      { zh: "不要事先说『我要拍你』，自然最好", en: "Don't say 'I'm going to film you' beforehand — natural is best", ms: "Jangan beritahu lebih awal — semula jadi adalah terbaik" } as ML,
      { zh: "15 – 30 秒，发给内容团队群", en: "15–30 seconds, send to the content team group", ms: "15–30 saat, hantar ke kumpulan pasukan kandungan" } as ML,
    ],
    hook: { zh: "当客户看到___的那一刻", en: "The moment the customer sees ___", ms: "Detik pelanggan melihat ___" } as ML,
    campaigns: ["trendin", "packaging"] as CampKey[],
  },
  {
    id: "process", name: "PROCESS", emoji: "🔨", color: "#D69E2E",
    desc:  { zh: "过程就是故事，别人没有的独家内容", en: "The process is the story — exclusive content no one else has", ms: "Proses adalah cerita — kandungan eksklusif yang tiada orang lain ada" } as ML,
    rule:  { zh: "开头有旧，结尾有新", en: "Start with old, end with new", ms: "Mula dengan lama, akhiri dengan baru" } as ML,
    steps: [
      { zh: "固定手机在工作台上方俯拍", en: "Fix the phone above the workbench for a top-down shot", ms: "Tetapkan telefon di atas meja kerja untuk rakaman dari atas" } as ML,
      { zh: "开始前：放一下旧包在画面里", en: "Before starting: show the old bag in the frame", ms: "Sebelum mula: tunjukkan beg lama dalam bingkai" } as ML,
      { zh: "剪裁 → 制作 → 刻字 → 完成，不跳过", en: "Cut → Craft → Engrave → Finish — don't skip steps", ms: "Potong → Buat → Ukir → Siap — jangan langkau langkah" } as ML,
      { zh: "刻字机声音保留（ASMR 效果）", en: "Keep the engraving machine sound (ASMR effect)", ms: "Simpan bunyi mesin ukiran (kesan ASMR)" } as ML,
    ],
    hook: { zh: "从一个旧包，到这个", en: "From an old bag, to this", ms: "Dari beg lama, kepada ini" } as ML,
    campaigns: ["trendin"] as CampKey[],
  },
  {
    id: "function", name: "FUNCTION DEMO", emoji: "🧪", color: "#3B6CB7",
    desc:  { zh: "诚实测试，比广告更有说服力", en: "Honest testing — more persuasive than any ad", ms: "Ujian jujur — lebih meyakinkan dari iklan mana pun" } as ML,
    rule:  { zh: "测试要真实，失败也要拍出来", en: "Keep the test honest — film even when it fails", ms: "Ujian mesti jujur — rakam walaupun gagal" } as ML,
    steps: [
      { zh: "先说一个客户常问的问题作为开场", en: "Open with a question customers frequently ask", ms: "Mulakan dengan soalan yang pelanggan kerap tanya" } as ML,
      { zh: "一件一件把物品放进包里", en: "Place items into the bag one by one", ms: "Masukkan barang ke dalam beg satu persatu" } as ML,
      { zh: "放不下的也要说，诚实反而增加信任", en: "Mention what doesn't fit too — honesty builds trust", ms: "Sebutkan juga apa yang tak muat — kejujuran membina kepercayaan" } as ML,
      { zh: "结尾：这个包适合什么人", en: "Ending: who is this bag best suited for?", ms: "Penutup: siapa yang paling sesuai dengan beg ini?" } as ML,
    ],
    hook: { zh: "我试着把这些东西全部放进去...", en: "I tried to fit all of this inside...", ms: "Saya cuba masukkan semua ini..." } as ML,
    campaigns: ["mixmatch"] as CampKey[],
  },
  {
    id: "staff", name: "STAFF PICK", emoji: "⭐", color: "#6B46C1",
    desc:  { zh: "真人推荐，建立信任", en: "Real person recommendation — builds trust", ms: "Cadangan orang sebenar — membina kepercayaan" } as ML,
    rule:  { zh: "说真心话，不要背稿", en: "Speak from the heart, don't read from a script", ms: "Cakap dari hati, jangan hafal skrip" } as ML,
    steps: [
      { zh: "Staff 对着镜头，店内自然光", en: "Staff faces the camera, natural light inside the store", ms: "Kakitangan hadap kamera, cahaya semula jadi dalam kedai" } as ML,
      { zh: "一句话开场：'我在 Jack Studio X年...'", en: "Opening line: 'I've been at Jack Studio for X years...'", ms: "Ayat pembuka: 'Saya dah kerja di Jack Studio X tahun...'" } as ML,
      { zh: "说自己真的会买这款的原因（1-2个就够）", en: "Share 1-2 genuine reasons why you'd buy this yourself", ms: "Kongsi 1-2 sebab sebenar kenapa anda sendiri akan beli ini" } as ML,
      { zh: "结尾：'你要来看看吗？'", en: "Ending: 'Want to come check it out?'", ms: "Penutup: 'Nak datang tengok tak?'" } as ML,
    ],
    hook: { zh: "如果是我自己买，我会选这款", en: "If I were buying for myself, I'd choose this one", ms: "Kalau saya beli untuk diri sendiri, saya akan pilih yang ini" } as ML,
    campaigns: ["trendin", "mixmatch", "packaging"] as CampKey[],
  },
  {
    id: "comparison", name: "COMPARISON", emoji: "⚖️", color: "#2D7D9A",
    desc:  { zh: "帮客户做决定，减少购买摩擦", en: "Help customers decide — reduce purchase friction", ms: "Bantu pelanggan membuat keputusan — kurangkan halangan pembelian" } as ML,
    rule:  { zh: "让观众评论，增加互动", en: "Let the audience comment — drive engagement", ms: "Biarkan penonton komen — tingkatkan interaksi" } as ML,
    steps: [
      { zh: "两个选项放在同一画面", en: "Put both options in the same frame", ms: "Letakkan kedua-dua pilihan dalam bingkai yang sama" } as ML,
      { zh: "快速说明两者的核心差别（各10秒）", en: "Briefly explain the key difference between each (10 seconds each)", ms: "Terangkan perbezaan utama antara setiap pilihan (10 saat setiap satu)" } as ML,
      { zh: "不要说哪个更好，让观众选", en: "Don't say which is better — let the audience decide", ms: "Jangan kata yang mana lebih baik — biarkan penonton memilih" } as ML,
      { zh: "Caption 问观众：你选哪个？", en: "Caption: ask the audience 'Which do you choose?'", ms: "Kapsyen: tanya penonton 'Yang mana pilihan anda?'" } as ML,
    ],
    hook: { zh: "A vs B，你会选哪个？", en: "A vs B — which would you choose?", ms: "A lwn B — yang mana pilihan anda?" } as ML,
    campaigns: ["mixmatch", "packaging"] as CampKey[],
  },
];

// ─── Hashtags ─────────────────────────────────────────────────────────────────

const HASHTAGS = {
  brand:     { label: { zh: "Brand (必须加)", en: "Brand (Required)", ms: "Brand (Wajib)" } as ML,      color: BRAND,                    tags: ["#JackStudio", "#JackStudioMY", "#EuroPolo", "#LeatherGoods", "#MalaysiaFashion"] },
  trendin:   { label: { zh: "Trend In Campaign", en: "Trend In Campaign", ms: "Kempen Trend In" } as ML, color: CAMPAIGNS.trendin.color,  tags: ["#TrendIn", "#OldChangeNew", "#以旧换新", "#LeatherCraft", "#PersonalizedGift"] },
  packaging: { label: { zh: "New Packaging Campaign", en: "New Packaging Campaign", ms: "Kempen New Packaging" } as ML, color: CAMPAIGNS.packaging.color, tags: ["#MakeItYours", "#NewPackaging", "#UnboxingExperience", "#GiftWrapping"] },
  mixmatch:  { label: { zh: "Mix & Match Campaign", en: "Mix & Match Campaign", ms: "Kempen Mix & Match" } as ML,    color: CAMPAIGNS.mixmatch.color,  tags: ["#MixAndMatch", "#PersonalStyle", "#ChooseYourColor", "#CustomBag"] },
  general:   { label: { zh: "General (加分项)", en: "General (Bonus)", ms: "Umum (Bonus)" } as ML,      color: "#888",                   tags: ["#KLFashion", "#ShopLocal", "#MalaysiaOOTD", "#LeatherBag"] },
};

// ─── Caption data ─────────────────────────────────────────────────────────────

const CAPTION_DATA = {
  trendin: {
    reaction: [
      { lang: "中文", text: "当她看到自己名字刻在上面的那一刻 🥹 你的旧包也可以变成这样。#JackStudio #TrendIn" },
      { lang: "EN",   text: '"I didn\'t expect it to look this good" — actual customer words ✨ #OldChangeNew #JackStudio' },
      { lang: "BM",   text: "Beg lama jadi kenangan baru 🥹 Bawa beg lama, dapat rebate RM50 + hadiah unik! #JackStudio" },
    ],
    process: [
      { lang: "中文", text: "从一个旧包，到这个专属纪念品。全程 15 分钟，刻上你的名字。♻️ #TrendIn #JackStudio" },
      { lang: "EN",   text: "Your old bag has a story. We just gave it a new chapter. 🔨 #LeatherCraft #JackStudio" },
      { lang: "BM",   text: "Beg lama → hadiah eksklusif dalam 15 minit. Nama kau pun ada! #JackStudio #TrendIn" },
    ],
    staff: [
      { lang: "中文", text: "我在 Jack Studio X 年了。这个活动是我见过最有心意的。你的旧包真的可以变成这样。#JackStudio" },
      { lang: "EN",   text: "Honest review from a JS staff: Trend In is the most meaningful thing we've ever done. #JackStudio" },
      { lang: "BM",   text: "Jujur cakap, program Trend In ni memang special. Beg lama jadi memori baru. #JackStudio" },
    ],
  },
  packaging: {
    reaction: [
      { lang: "中文", text: '"你们的包装可以自己选颜色？" 可以 😊 三款选你最爱的。#JackStudio #NewPackaging' },
      { lang: "EN",   text: "The packaging is yours to choose. Because the unboxing is part of the experience. 🎁 #JackStudio" },
      { lang: "BM",   text: "Pembungkusan pun boleh pilih sendiri! 3 warna untuk dipilih 🎁 #JackStudio #MakeItYours" },
    ],
    unboxing: [
      { lang: "中文", text: "买东西还是买体验？我们选择两个都给你 ✨ #JackStudio #Unboxing" },
      { lang: "EN",   text: "This is what it feels like when you open a Jack Studio box 🤍 #JackStudio #Unboxing" },
      { lang: "BM",   text: "Kotak pun cantik sampai tak sanggup nak buka 🥺 #JackStudio #Unboxing" },
    ],
  },
  mixmatch: {
    comparison: [
      { lang: "中文", text: "Black vs Navy，你会选哪个？评论告诉我 👇 #JackStudio #MixAndMatch" },
      { lang: "EN",   text: "Same bag. 4 colors. Which one is you? Comment below 👇 #JackStudio #ChooseYourColor" },
      { lang: "BM",   text: "Warna mana pilihan kau? Comment di bawah! #JackStudio #MixAndMatch" },
    ],
    function: [
      { lang: "中文", text: "我试着把这些东西全部塞进去... 结果出乎意料 😮 #JackStudio #BagReview" },
      { lang: "EN",   text: "Can it really fit everything? I tested it. Results were surprising. #JackStudio #FunctionDemo" },
      { lang: "BM",   text: "Beg kecil tapi muat banyak? Kita test sama-sama! #JackStudio #Review" },
    ],
  },
} as const;

// ─── Sub-components ───────────────────────────────────────────────────────────

function CampBadge({ id, small = false }: { id: CampKey; small?: boolean }) {
  const c = CAMPAIGNS[id];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full font-bold", small ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs")}
      style={{ background: c.light, color: c.dark }}>
      {c.emoji} {c.sub}
    </span>
  );
}

function TypeBadge({ type, color }: { type: string; color: string }) {
  return (
    <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wide"
      style={{ background: color + "20", color }}>
      {type}
    </span>
  );
}

// ─── Tab: Overview ────────────────────────────────────────────────────────────

function TabOverview() {
  const { lang } = useLang();

  const heroSubtitle: ML = {
    zh: "三个 Campaign，一个故事：",
    en: "Three Campaigns, One Story:",
    ms: "Tiga Kempen, Satu Cerita:",
  };
  const heroFlow: ML = {
    zh: "带旧包来 → 换新款 → 选颜色 → 选包装 → 刻名字",
    en: "Bring Old Bag → New Style → Choose Color → Choose Packaging → Engrave Name",
    ms: "Bawa Beg Lama → Gaya Baru → Pilih Warna → Pilih Pembungkusan → Ukir Nama",
  };
  const pilotTitle: ML = {
    zh: "🎯 第一颗子弹 — Pilot 规则",
    en: "🎯 First Bullet — Pilot Rules",
    ms: "🎯 Peluru Pertama — Peraturan Perintis",
  };
  const pilotRows: [ML, ML][] = [
    [
      { zh: "参与门店", en: "Pilot Stores", ms: "Kedai Perintis" },
      { zh: "3 间（有直播设备的门店）", en: "3 stores (equipped with livestream setup)", ms: "3 kedai (dilengkapi peralatan livestream)" },
    ],
    [
      { zh: "测试期", en: "Test Period", ms: "Tempoh Ujian" },
      { zh: "July 2026（4周）", en: "July 2026 (4 weeks)", ms: "Julai 2026 (4 minggu)" },
    ],
    [
      { zh: "每周目标", en: "Weekly Target", ms: "Sasaran Mingguan" },
      { zh: "每店最少 2 条内容", en: "Min. 2 pieces of content per store", ms: "Min. 2 kandungan setiap kedai" },
    ],
    [
      { zh: "总目标", en: "Total Target", ms: "Sasaran Keseluruhan" },
      { zh: "24 条内容 / 月", en: "24 pieces of content / month", ms: "24 kandungan / bulan" },
    ],
    [
      { zh: "评估日", en: "Evaluation Date", ms: "Tarikh Penilaian" },
      { zh: "31 July — 数据复盘", en: "31 July — Data Review", ms: "31 Julai — Semakan Data" },
    ],
  ];

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div className="rounded-2xl p-5" style={{ background: "#1A1A1A" }}>
        <p className="text-[10px] font-black tracking-widest mb-1" style={{ color: "#888" }}>Q3 2026 · FIRST BULLET</p>
        <h2 className="text-xl font-black text-white mb-2 leading-tight">Make It Yours 🎯</h2>
        <p className="text-sm mb-4 leading-relaxed" style={{ color: "#ccc" }}>
          {pick(heroSubtitle, lang)}<br />
          <strong className="text-white">{pick(heroFlow, lang)}</strong>
        </p>
        <div className="flex gap-2 flex-wrap">
          {Object.values(CAMPAIGNS).map(c => (
            <span key={c.id} className="px-3 py-1 rounded-full text-xs font-bold"
              style={{ background: c.color + "30", color: c.color }}>
              {c.emoji} {c.name}
            </span>
          ))}
        </div>
      </div>

      {/* Campaign cards */}
      {Object.values(CAMPAIGNS).map(c => (
        <div key={c.id} className="bg-white rounded-2xl p-5 shadow-sm" style={{ borderLeft: `4px solid ${c.color}` }}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-lg font-black" style={{ color: "#1A1A1A" }}>{c.emoji} {c.name}</p>
              <p className="text-xs mt-0.5" style={{ color: "#888" }}>{c.period}</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold"
              style={{ background: c.light, color: c.dark }}>{c.sub}</span>
          </div>
          <div className="rounded-xl px-4 py-3 mb-3 text-sm italic"
            style={{ background: c.light, color: c.dark }}>
            &ldquo;{pick(c.tagline, lang)}&rdquo;
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "#555" }}>{pick(c.hook, lang)}</p>
        </div>
      ))}

      {/* Pilot rules */}
      <div className="rounded-2xl p-5 border-2 border-dashed" style={{ background: BRAND_LIGHT, borderColor: BRAND }}>
        <p className="text-sm font-black mb-3" style={{ color: BRAND_DARK }}>{pick(pilotTitle, lang)}</p>
        {pilotRows.map(([k, v], i, arr) => (
          <div key={i} className="flex justify-between py-2 text-sm"
            style={{ borderBottom: i < arr.length - 1 ? "1px solid #f0e8d8" : "none" }}>
            <span className="font-semibold" style={{ color: "#888" }}>{pick(k, lang)}</span>
            <span className="font-bold" style={{ color: "#1A1A1A" }}>{pick(v, lang)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Weekly Calendar ─────────────────────────────────────────────────────

function TabCalendar() {
  const [active, setActive] = useState(0);
  const { lang } = useLang();
  const week = WEEKS[active];
  const camp = CAMPAIGNS[week.focus];

  const labels = {
    whatToShoot: { zh: "这周要拍什么", en: "What to shoot this week", ms: "Apa yang perlu dirakam minggu ini" } as ML,
    howTo:       { zh: "怎么拍",        en: "How to shoot",           ms: "Cara merakam" } as ML,
    donts:       { zh: "不要做",        en: "Don'ts",                 ms: "Jangan buat" } as ML,
    captions:    { zh: "Caption 参考（选一个）", en: "Caption Reference (pick one)", ms: "Rujukan Kapsyen (pilih satu)" } as ML,
    target:      { zh: "本周目标",      en: "Weekly Target",          ms: "Sasaran Mingguan" } as ML,
  };

  return (
    <div className="space-y-4">
      {/* Week selector */}
      <div className="grid grid-cols-4 gap-1.5">
        {WEEKS.map((w, i) => (
          <button key={i} onClick={() => setActive(i)}
            className="rounded-xl py-2.5 px-1 text-center border-2 transition-all"
            style={{
              borderColor: active === i ? BRAND : "#E5E1DB",
              background: active === i ? BRAND_LIGHT : "#fff",
            }}>
            <p className="text-[10px] font-black tracking-wide" style={{ color: active === i ? BRAND_DARK : "#999" }}>
              WEEK {w.week}
            </p>
            <p className="text-[10px] font-semibold mt-0.5" style={{ color: active === i ? BRAND_DARK : "#666" }}>
              {w.dates}
            </p>
          </button>
        ))}
      </div>

      {/* Week detail */}
      <div className="bg-white rounded-2xl p-5 shadow-sm" style={{ borderTop: `4px solid ${camp.color}` }}>
        <div className="flex gap-2 mb-3 flex-wrap items-center">
          <CampBadge id={week.focus} />
          <TypeBadge type={week.type} color={week.typeColor} />
        </div>
        <h3 className="text-base font-black mb-2" style={{ color: "#1A1A1A" }}>{pick(week.title, lang)}</h3>
        <p className="text-sm leading-relaxed mb-5" style={{ color: "#666" }}>{pick(week.mission, lang)}</p>

        <p className="text-[10px] font-black tracking-widest mb-2" style={{ color: "#aaa" }}>{pick(labels.whatToShoot, lang).toUpperCase()}</p>
        <div className="space-y-2 mb-5">
          {week.shoot.map((s, i) => (
            <div key={i} className="flex items-start gap-3 px-3 py-2.5 rounded-xl" style={{ background: "#F8F7F4" }}>
              <span className="min-w-[22px] h-[22px] rounded-full flex items-center justify-center text-[11px] font-black text-white shrink-0"
                style={{ background: camp.color }}>{i + 1}</span>
              <span className="text-sm leading-snug" style={{ color: "#1A1A1A" }}>{pick(s, lang)}</span>
            </div>
          ))}
        </div>

        <p className="text-[10px] font-black tracking-widest mb-2" style={{ color: "#aaa" }}>{pick(labels.howTo, lang).toUpperCase()}</p>
        <div className="space-y-1.5 mb-5">
          {week.howto.map((h, i) => (
            <div key={i} className="flex gap-2 text-sm py-1" style={{ color: "#444" }}>
              <span className="font-black shrink-0" style={{ color: "#4A7C59" }}>✓</span>{pick(h, lang)}
            </div>
          ))}
        </div>

        <p className="text-[10px] font-black tracking-widest mb-2" style={{ color: "#aaa" }}>{pick(labels.donts, lang).toUpperCase()}</p>
        <div className="space-y-1.5 mb-5">
          {week.donts.map((d, i) => (
            <div key={i} className="flex gap-2 text-sm py-1" style={{ color: "#888" }}>
              <span className="font-black shrink-0" style={{ color: "#E53E3E" }}>✗</span>{pick(d, lang)}
            </div>
          ))}
        </div>

        <p className="text-[10px] font-black tracking-widest mb-2" style={{ color: "#aaa" }}>{pick(labels.captions, lang).toUpperCase()}</p>
        <div className="space-y-2 mb-5">
          {week.captions.map((c, i) => (
            <div key={i} className="px-4 py-3 rounded-xl text-sm leading-relaxed"
              style={{ background: camp.light, color: camp.dark, borderLeft: `3px solid ${camp.color}` }}>
              {pick(c, lang)}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between px-4 py-3 rounded-xl"
          style={{ background: BRAND_LIGHT }}>
          <span className="text-sm font-bold" style={{ color: BRAND_DARK }}>{pick(labels.target, lang)}</span>
          <span className="text-base font-black" style={{ color: BRAND }}>{pick(week.target, lang)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: How To Shoot ────────────────────────────────────────────────────────

function TabShootGuide() {
  const [active, setActive] = useState(0);
  const { lang } = useLang();
  const type = CONTENT_TYPES[active];

  const labels = {
    appliesTo:    { zh: "适用 Campaign",    en: "Applies To",                          ms: "Terpakai Untuk" } as ML,
    steps:        { zh: "拍摄步骤",          en: "Shooting Steps",                       ms: "Langkah Merakam" } as ML,
    hookFormula:  { zh: "开场 Hook 公式",    en: "Opening Hook Formula",                 ms: "Formula Hook Pembuka" } as ML,
    hookSay:      { zh: "开场 3 秒说：",     en: "Say in the first 3 seconds:",          ms: "Cakap dalam 3 saat pertama:" } as ML,
    hookNote:     { zh: "* 把 ___ 换成具体内容。3 秒内必须有钩子，不然观众会滑走。", en: "* Replace ___ with specific content. You need a hook within 3 seconds, or viewers will scroll away.", ms: "* Gantikan ___ dengan kandungan spesifik. Anda perlu daya tarikan dalam 3 saat, atau penonton akan menatal pergi." } as ML,
    universal:    { zh: "全类型通用铁则",    en: "Universal Rules for All Content Types", ms: "Peraturan Sejagat untuk Semua Jenis Kandungan" } as ML,
  };

  const universalRules: [ML, ML][] = [
    [
      { zh: "开场 3 秒必须有钩子", en: "The first 3 seconds must have a hook", ms: "3 saat pertama mesti ada daya tarikan" },
      { zh: "不要从'大家好'开始。直接进入问题或动作。", en: "Don't start with 'Hi everyone'. Go straight into the question or action.", ms: "Jangan mulakan dengan 'Hi semua'. Terus masuk ke soalan atau tindakan." },
    ],
    [
      { zh: "拍脸比拍产品更重要", en: "Filming faces is more important than filming products", ms: "Merakam muka lebih penting dari merakam produk" },
      { zh: "客户的反应 > 产品的画面。永远对准人。", en: "Customer reactions > product shots. Always aim at people.", ms: "Reaksi pelanggan > rakaman produk. Sentiasa halakan ke orang." },
    ],
    [
      { zh: "加文字字幕", en: "Add text captions", ms: "Tambah kapsyen teks" },
      { zh: "70% 的人看视频不开声。重点必须有字出现。", en: "70% of viewers watch without sound. Key points must appear as text.", ms: "70% penonton menonton tanpa bunyi. Perkara penting mesti muncul sebagai teks." },
    ],
  ];

  return (
    <div className="space-y-4">
      {/* Type list */}
      <div className="space-y-2">
        {CONTENT_TYPES.map((t, i) => (
          <button key={i} onClick={() => setActive(i)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border-2 text-left transition-all"
            style={{
              borderColor: active === i ? t.color : "#E5E1DB",
              background: active === i ? t.color + "12" : "#fff",
            }}>
            <div className="flex items-center gap-3">
              <span className="text-xl">{t.emoji}</span>
              <div>
                <p className="text-sm font-black" style={{ color: active === i ? t.color : "#1A1A1A" }}>{t.name}</p>
                <p className="text-[11px]" style={{ color: "#888" }}>{pick(t.desc, lang)}</p>
              </div>
            </div>
            {active === i && <span style={{ color: t.color }}>▶</span>}
          </button>
        ))}
      </div>

      {/* Type detail */}
      <div className="bg-white rounded-2xl p-5 shadow-sm" style={{ borderTop: `4px solid ${type.color}` }}>
        <div className="rounded-xl px-4 py-3 mb-5" style={{ background: type.color + "15" }}>
          <p className="text-[10px] font-black tracking-widest mb-1" style={{ color: type.color }}>GOLDEN RULE</p>
          <p className="text-base font-black" style={{ color: "#1A1A1A" }}>{pick(type.rule, lang)}</p>
        </div>

        <p className="text-[10px] font-black tracking-widest mb-2" style={{ color: "#aaa" }}>{pick(labels.appliesTo, lang).toUpperCase()}</p>
        <div className="flex gap-2 flex-wrap mb-5">
          {type.campaigns.map(c => <CampBadge key={c} id={c} small />)}
        </div>

        <p className="text-[10px] font-black tracking-widest mb-2" style={{ color: "#aaa" }}>{pick(labels.steps, lang).toUpperCase()}</p>
        <div className="space-y-2 mb-5">
          {type.steps.map((s, i) => (
            <div key={i} className="flex gap-3 items-start px-4 py-3 rounded-xl" style={{ background: "#F8F7F4" }}>
              <div className="min-w-[24px] h-6 rounded-full flex items-center justify-center text-[11px] font-black text-white shrink-0"
                style={{ background: type.color }}>{i + 1}</div>
              <p className="text-sm leading-snug" style={{ color: "#1A1A1A" }}>{pick(s, lang)}</p>
            </div>
          ))}
        </div>

        <p className="text-[10px] font-black tracking-widest mb-2" style={{ color: "#aaa" }}>{pick(labels.hookFormula, lang).toUpperCase()}</p>
        <div className="rounded-xl px-4 py-4 mb-1.5" style={{ background: "#1A1A1A" }}>
          <p className="text-[11px] mb-1" style={{ color: "#888" }}>{pick(labels.hookSay, lang)}</p>
          <p className="text-base font-bold text-white">&ldquo;{pick(type.hook, lang)}&rdquo;</p>
        </div>
        <p className="text-xs pl-1" style={{ color: "#888" }}>{pick(labels.hookNote, lang)}</p>
      </div>

      {/* Universal rules */}
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <p className="text-[10px] font-black tracking-widest mb-3" style={{ color: "#aaa" }}>{pick(labels.universal, lang).toUpperCase()}</p>
        {universalRules.map(([title, desc], i, arr) => (
          <div key={i} className="flex gap-3 py-3" style={{ borderBottom: i < arr.length - 1 ? "1px solid #F0EDE8" : "none" }}>
            <div className="min-w-[28px] h-7 rounded-lg flex items-center justify-center text-sm font-black shrink-0"
              style={{ background: BRAND_LIGHT, color: BRAND }}>{i + 1}</div>
            <div>
              <p className="text-sm font-black mb-0.5" style={{ color: "#1A1A1A" }}>{pick(title, lang)}</p>
              <p className="text-xs leading-relaxed" style={{ color: "#888" }}>{pick(desc, lang)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Captions ────────────────────────────────────────────────────────────

function TabCaptions() {
  const [activeCamp, setActiveCamp] = useState<CampKey>("trendin");
  const camp = CAMPAIGNS[activeCamp];
  const data = CAPTION_DATA[activeCamp];

  return (
    <div className="space-y-4">
      {/* Campaign selector */}
      <div className="flex gap-2">
        {(Object.values(CAMPAIGNS) as typeof CAMPAIGNS[CampKey][]).map(c => (
          <button key={c.id} onClick={() => setActiveCamp(c.id as CampKey)}
            className="flex-1 py-2.5 rounded-xl border-2 text-center transition-all"
            style={{
              borderColor: activeCamp === c.id ? c.color : "#E5E1DB",
              background: activeCamp === c.id ? c.light : "#fff",
            }}>
            <p className="text-lg">{c.emoji}</p>
            <p className="text-[10px] font-bold mt-1" style={{ color: activeCamp === c.id ? c.dark : "#888" }}>{c.sub}</p>
          </button>
        ))}
      </div>

      {/* Caption groups */}
      {(Object.entries(data) as [string, { lang: string; text: string }[]][]).map(([type, caps]) => (
        <div key={type} className="bg-white rounded-2xl p-5 shadow-sm">
          <TypeBadge type={type.toUpperCase().replace("_", " ")} color={camp.color} />
          <div className="space-y-3 mt-3">
            {caps.map((c, i) => (
              <div key={i} className="px-4 py-3 rounded-xl" style={{ background: "#F8F7F4", borderLeft: `3px solid ${camp.color}` }}>
                <p className="text-[10px] font-black tracking-widest mb-1.5" style={{ color: camp.color }}>{c.lang}</p>
                <p className="text-sm leading-relaxed" style={{ color: "#1A1A1A" }}>{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Tab: Hashtags ────────────────────────────────────────────────────────────

function TabHashtags() {
  const [copied, setCopied] = useState<string | null>(null);
  const { lang } = useLang();

  const hashtagTitle: ML = { zh: "📌 Hashtag 使用规则", en: "📌 Hashtag Usage Rules", ms: "📌 Peraturan Penggunaan Hashtag" };
  const rules: ML[] = [
    { zh: "每条内容最少加 Brand hashtag + Campaign hashtag", en: "Every piece of content must include Brand hashtag + Campaign hashtag", ms: "Setiap kandungan mesti ada Brand hashtag + Campaign hashtag" },
    { zh: "不要超过 8 个 hashtag（TikTok 推荐 3-5 个）", en: "No more than 8 hashtags (TikTok recommends 3-5)", ms: "Tidak lebih 8 hashtag (TikTok cadangkan 3-5)" },
    { zh: "点击每组下面的按钮一键复制", en: "Click the button below each group to copy all at once", ms: "Klik butang di bawah setiap kumpulan untuk salin sekaligus" },
  ];

  function copy(tags: string[], key: string) {
    navigator.clipboard?.writeText(tags.join(" ")).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-5" style={{ background: "#1A1A1A" }}>
        <p className="text-sm font-black text-white mb-3">{pick(hashtagTitle, lang)}</p>
        {rules.map((r, i) => (
          <div key={i} className="flex gap-2 text-sm py-1" style={{ color: "#ccc" }}>
            <span style={{ color: BRAND }}>→</span> {pick(r, lang)}
          </div>
        ))}
      </div>

      {(Object.entries(HASHTAGS) as [string, { label: ML; color: string; tags: string[] }][]).map(([key, s]) => (
        <div key={key} className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-black" style={{ color: "#1A1A1A" }}>{pick(s.label, lang)}</p>
            <button
              onClick={() => copy(s.tags, key)}
              className="px-3 py-1 rounded-full text-[11px] font-bold transition-all"
              style={{
                border: `1.5px solid ${s.color}`,
                background: copied === key ? s.color : "transparent",
                color: copied === key ? "#fff" : s.color,
              }}>
              {copied === key ? "Copied!" : "Copy"}
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {s.tags.map(t => (
              <span key={t} className="px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: s.color + "15", color: s.color }}>
                {t}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Tab: Results / Metrics ───────────────────────────────────────────────────

function TabMetrics() {
  const { lang } = useLang();

  const heroTitle: ML  = { zh: "📊 31 July — Pilot 复盘指标", en: "📊 31 July — Pilot Review Metrics", ms: "📊 31 Julai — Metrik Semakan Perintis" };
  const heroSub: ML    = { zh: "4周后看这3个数字，决定是否 Cannonball 全面扩张。", en: "After 4 weeks, these 3 numbers decide whether to Cannonball to full expansion.", ms: "Selepas 4 minggu, 3 nombor ini menentukan sama ada untuk Cannonball ke pengembangan penuh." };
  const lblHow: ML     = { zh: "怎么看：", en: "How to check:", ms: "Cara semak:" };
  const lblPass: ML    = { zh: "✅ 通过", en: "✅ Pass", ms: "✅ Lulus" };
  const lblFail: ML    = { zh: "⚠️ 需改进", en: "⚠️ Needs Work", ms: "⚠️ Perlu Perbaikan" };
  const lblMiss: ML    = { zh: "如果不达标：", en: "If target missed:", ms: "Jika sasaran tidak dicapai:" };
  const lblTarget: ML  = { zh: "目标：", en: "Target:", ms: "Sasaran:" };
  const frameTitle: ML = { zh: "31 JULY 决策框架", en: "31 JULY DECISION FRAMEWORK", ms: "RANGKA KEPUTUSAN 31 JULAI" };
  const lblIf: ML      = { zh: "如果...", en: "If...", ms: "Jika..." };

  const metrics = [
    {
      metric:  { zh: "平均观看完成率", en: "Average Watch Completion Rate", ms: "Kadar Tayangan Selesai Purata" } as ML,
      target:  "> 60%",
      how:     { zh: "TikTok 后台 → 视频数据 → 完播率", en: "TikTok Backend → Video Analytics → Completion Rate", ms: "TikTok Backend → Data Video → Kadar Selesai" } as ML,
      pass:    "60%+", fail: "< 40%",
      action:  { zh: "检查开场 3 秒是否有钩子", en: "Check if the first 3 seconds have a hook", ms: "Semak sama ada 3 saat pertama ada daya tarikan" } as ML,
      color:   "#E53E3E",
    },
    {
      metric:  { zh: "分享 / 保存数", en: "Shares / Saves", ms: "Kongsi / Simpan" } as ML,
      target:  { zh: "每条 > 50", en: "> 50 per post", ms: "> 50 setiap pos" } as ML,
      how:     { zh: "TikTok 后台 → 每条视频的 Share + Save 数", en: "TikTok Backend → Share + Save count per video", ms: "TikTok Backend → Kiraan Share + Save setiap video" } as ML,
      pass:    "50+", fail: "< 20",
      action:  { zh: "增加实用信息，减少纯展示内容", en: "Add more practical information, reduce pure showcase content", ms: "Tambah maklumat praktikal, kurangkan kandungan pameran semata" } as ML,
      color:   "#D69E2E",
    },
    {
      metric:  { zh: "来自 TikTok 的门店客流", en: "Store Traffic from TikTok", ms: "Trafik Kedai dari TikTok" } as ML,
      target:  { zh: "每店每周 5+ 人", en: "5+ per store per week", ms: "5+ setiap kedai setiap minggu" } as ML,
      how:     { zh: "Customer Log → 来源选 TikTok", en: "Customer Log → Source: TikTok", ms: "Log Pelanggan → Sumber: TikTok" } as ML,
      pass:    "5+/week", fail: "< 2/week",
      action:  { zh: "检查是否有清晰的 CTA（来店、地址）", en: "Check if there's a clear CTA (visit store, address)", ms: "Semak sama ada ada CTA yang jelas (lawat kedai, alamat)" } as ML,
      color:   "#4A7C59",
    },
  ];

  const decisions = [
    { condition: { zh: "3 个指标全达标", en: "All 3 metrics hit", ms: "Semua 3 metrik dicapai" } as ML, action: { zh: "🚀 Cannonball：扩展到全部 13 间门店", en: "🚀 Cannonball: expand to all 13 stores", ms: "🚀 Cannonball: kembangkan ke semua 13 kedai" } as ML, color: "#4A7C59" },
    { condition: { zh: "2 个指标达标", en: "2 metrics hit", ms: "2 metrik dicapai" } as ML, action: { zh: "🔧 Adjust：找出不达标的原因，再测一个月", en: "🔧 Adjust: find the cause, test for one more month", ms: "🔧 Adjust: cari sebabnya, uji satu bulan lagi" } as ML, color: BRAND },
    { condition: { zh: "少于 2 个达标", en: "Fewer than 2 metrics hit", ms: "Kurang dari 2 metrik dicapai" } as ML, action: { zh: "🔍 Re-examine：回到内容类型，找根本原因", en: "🔍 Re-examine: go back to content types, find the root cause", ms: "🔍 Re-examine: kembali ke jenis kandungan, cari punca asal" } as ML, color: "#E53E3E" },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-5" style={{ background: "#1A1A1A" }}>
        <p className="text-sm font-black text-white mb-1.5">{pick(heroTitle, lang)}</p>
        <p className="text-sm leading-relaxed" style={{ color: "#aaa" }}>{pick(heroSub, lang)}</p>
      </div>

      {metrics.map((m, i) => {
        const targetStr = typeof m.target === "string" ? m.target : pick(m.target as ML, lang);
        return (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-sm" style={{ borderLeft: `4px solid ${m.color}` }}>
            <p className="text-base font-black mb-2" style={{ color: "#1A1A1A" }}>{pick(m.metric, lang)}</p>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-3"
              style={{ background: m.color + "20", color: m.color }}>{pick(lblTarget, lang)}{targetStr}</span>
            <p className="text-sm mb-3" style={{ color: "#666" }}><strong>{pick(lblHow, lang)}</strong> {pick(m.how, lang)}</p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="px-3 py-2 rounded-xl" style={{ background: "#F0FFF4" }}>
                <p className="text-[10px] font-black mb-1" style={{ color: "#4A7C59" }}>{pick(lblPass, lang)}</p>
                <p className="text-sm font-bold" style={{ color: "#2D5C3E" }}>{m.pass}</p>
              </div>
              <div className="px-3 py-2 rounded-xl" style={{ background: "#FFF5F5" }}>
                <p className="text-[10px] font-black mb-1" style={{ color: "#E53E3E" }}>{pick(lblFail, lang)}</p>
                <p className="text-sm font-bold" style={{ color: "#9B2C2C" }}>{m.fail}</p>
              </div>
            </div>
            <div className="px-3 py-2 rounded-xl text-xs" style={{ background: BRAND_LIGHT, color: BRAND_DARK }}>
              <strong>{pick(lblMiss, lang)}</strong> {pick(m.action, lang)}
            </div>
          </div>
        );
      })}

      {/* Decision tree */}
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <p className="text-[10px] font-black tracking-widest mb-3" style={{ color: "#aaa" }}>{pick(frameTitle, lang)}</p>
        {decisions.map((d, i) => (
          <div key={i} className="px-4 py-3 rounded-xl mb-2" style={{ background: d.color + "12", borderLeft: `3px solid ${d.color}` }}>
            <p className="text-xs mb-0.5" style={{ color: "#888" }}>{pick(lblIf, lang)}</p>
            <p className="text-sm font-bold mb-1" style={{ color: "#1A1A1A" }}>{pick(d.condition, lang)}</p>
            <p className="text-sm font-semibold" style={{ color: d.color }}>{pick(d.action, lang)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS = [
  { id: "overview", label: "Overview", emoji: "🗺️" },
  { id: "calendar", label: "Weekly",   emoji: "📅" },
  { id: "guide",    label: "How To",   emoji: "🎬" },
  { id: "captions", label: "Captions", emoji: "✍️" },
  { id: "hashtags", label: "Hashtags", emoji: "#" },
  { id: "metrics",  label: "Results",  emoji: "📊" },
] as const;

type TabId = typeof TABS[number]["id"];

export default function CreatorHub() {
  const [tab, setTab] = useState<TabId>("overview");

  return (
    <div className="min-h-screen" style={{ background: "#F8F7F4", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 pt-4 pb-0 lg:top-0">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
                style={{ background: BRAND }}>⚡</div>
              <div>
                <p className="text-sm font-black" style={{ color: "#1A1A1A" }}>Creator Hub</p>
                <p className="text-[11px]" style={{ color: "#999" }}>Q3 2026 · Make It Yours</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ background: "#ECFDF5", color: "#065F46" }}>
              🟢 Jul – Aug Active
            </span>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 overflow-x-auto pb-3 no-scrollbar">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border-0 transition-all"
                style={{
                  background: tab === t.id ? BRAND : "transparent",
                  color: tab === t.id ? "#fff" : "#888",
                }}>
                <span>{t.emoji}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-xl mx-auto px-4 py-5 pb-16">
        {tab === "overview" && <TabOverview />}
        {tab === "calendar" && <TabCalendar />}
        {tab === "guide"    && <TabShootGuide />}
        {tab === "captions" && <TabCaptions />}
        {tab === "hashtags" && <TabHashtags />}
        {tab === "metrics"  && <TabMetrics />}
      </div>

      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>
    </div>
  );
}
