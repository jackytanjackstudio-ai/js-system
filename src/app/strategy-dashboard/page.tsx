"use client";
import { useEffect, useState } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { useLang } from "@/context/LangContext";
import { useAuth } from "@/context/AuthContext";
import type { ChannelForecast } from "@/lib/ecomm-forecast";

// ─── Types ────────────────────────────────────────────────────────────────────

type OutletTarget = { outlet: string; year: number; month: number; targetRm: number };
type EcommTarget  = { platform: string; year: number; month: number; targetRm: number };
type BscKpi       = { id: string; perspective: string; kpiKey: string; kpiLabel: string; targetDesc: string | null; status: string; note: string | null; updatedAt: string };
type SalesSignals = { customerCount: number; atv: number; reportCount: number };
type CategoryItem = { name: string; qty: number; amount: number; topProducts: { name: string; qty: number; amount: number }[] };
type OnlineSummary = {
  totalTarget: number; totalYtd: number; totalForecast: number;
  forecastVsTarget: number; totalMonthlyForecast: number[];
  totalMonthly2025: number[]; actual2025: number;
};
type OnlineResponse = { forecasts: ChannelForecast[]; summary: OnlineSummary };

type OutletForecast = {
  outlet: string; target2026: number; ytdActual: number; ytdGrowth: number;
  fullYearForecast: number; forecastVsTarget: number;
  status: "on-track" | "caution" | "behind";
  monthlyForecast: number[]; monthly2025: number[]; full2025: number;
};
type OutletForecastSummary = {
  totalTarget: number; totalYtd: number; totalForecast: number;
  forecastVsTarget: number; total2025: number;
  totalMonthlyForecast: number[]; totalMonthly2025: number[];
};
type OutletForecastResponse = { forecasts: OutletForecast[]; summary: OutletForecastSummary };

type TargetsResponse = {
  targets: OutletTarget[];
  actuals: Record<string, Record<string, number>>; // outlet → month → amount
  currentMonth: number;
  year: number;
};

type EcommResponse = {
  targets: EcommTarget[];
  year: number;
};

// ─── Static config ────────────────────────────────────────────────────────────

const BRAND       = "#C17F24";
const BRAND_LIGHT = "#FDF3E3";

const PERSPECTIVES = [
  { id: "financial", label: "Financial",        zh: "财务",     bm: "Kewangan",         emoji: "💰", color: "#C17F24" },
  { id: "customer",  label: "Customer Focus",   zh: "客户",     bm: "Fokus Pelanggan",  emoji: "🤝", color: "#3B6CB7" },
  { id: "internal",  label: "Internal Process", zh: "内部流程", bm: "Proses Dalaman",   emoji: "⚙️", color: "#4A7C59" },
  { id: "learning",  label: "Learning & Growth",zh: "学习成长", bm: "Pembelajaran",     emoji: "🌱", color: "#7B4F9E" },
] as const;

type PerspId = typeof PERSPECTIVES[number]["id"];

const MONTHS_EN    = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTHS_ZH    = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];
const MONTHS_BM    = ["Jan","Feb","Mac","Apr","Mei","Jun","Jul","Ogos","Sep","Okt","Nov","Dis"];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const STATUS_META: Record<string, { color: string; bg: string }> = {
  "on-track": { color: "#4A7C59", bg: "#EDF5F0" },
  "caution":  { color: "#D69E2E", bg: "#FEFCE8" },
  "behind":   { color: "#E53E3E", bg: "#FEF2F2" },
};

// ─── i18n labels ──────────────────────────────────────────────────────────────

type LangKey = "en" | "zh" | "ms";

const L: Record<LangKey, Record<string, string>> = {
  en: {
    pageTitle:     "Strategy Dashboard",
    pageSubtitle:  "Balanced Scorecard 2026",
    tab_overview:  "Overview",
    tab_outlets:   "Outlets",
    tab_ecomm:     "Ecomm",
    tab_bsc:       "BSC",
    annualTarget:  "2026 Annual Target",
    ytdProgress:   "YTD Progress",
    monthProgress: "Month Progress",
    monthlyChart:  "Monthly Target vs Actual",
    target:        "Target",
    actual:        "Actual",
    aboveTarget:   "Above Target",
    outletRank:    "13 Outlets — Achievement Ranking",
    ecommTitle:    "E-Commerce — Platform Targets",
    ecommYtd:      "YTD Target",
    ecommAnnual:   "Annual Target",
    onTrack:       "On Track",
    caution:       "Caution",
    behind:        "Behind",
    statusGuide:   "Status Guide",
    onTrackDesc:   "Progressing as planned",
    cautionDesc:   "Needs attention",
    behindDesc:    "Requires immediate action",
    ofTarget:      "of target",
    loading:       "Loading…",
    noData:        "No data yet",
    edit:          "Edit",
    save:          "Save",
    cancel:        "Cancel",
    saved:         "Saved ✓",
    note:          "Note",
    status:        "Status",
    ytdActual:     "YTD Actual",
    annualFull:    "Annual Target",
    perspective:   "Perspective",
    monthActual:   "Month Actual",
    customers:     "Customers",
    atv:           "Avg Transaction",
    salesSignals:  "Sales Signals",
    topByCategory: "Top by Category 2",
    noSignals:     "No sales data yet",
    tab_online:    "Online Sales",
    onlineTitle:   "Online Sales Forecast 2026",
    forecastFull:  "Forecast Full Year",
    vs2025:        "2025 Actual",
    growth:        "Growth vs 2025",
    ytdGrowth:     "YTD Growth",
    fullForecast:  "Full Year Forecast",
    needAttention: "Need Attention",
    updateActuals: "Update Actuals",
    forecastBasis:    "Forecast based on YTD trend vs 2025 seasonality · dotted = forecast",
    channel:          "Channel",
    month:            "Month",
    amount:           "Amount (RM)",
    outletForecast:   "Outlet Sales Forecast 2026",
    totalBusiness:    "Total Business 2026",
    outletSales:      "Outlet Sales",
    onlineSales:      "Online Sales",
    combinedTarget:   "Combined Target",
    outletActual2025: "2025 Outlet Actual",
    forecastFullYear: "Forecast Full Year",
  },
  zh: {
    pageTitle:     "策略仪表板",
    pageSubtitle:  "平衡计分卡 2026",
    tab_overview:  "总览",
    tab_outlets:   "门店",
    tab_ecomm:     "电商",
    tab_bsc:       "计分卡",
    annualTarget:  "2026 年度目标",
    ytdProgress:   "年度进度",
    monthProgress: "本月进度",
    monthlyChart:  "月度目标 vs 实际",
    target:        "目标",
    actual:        "实际",
    aboveTarget:   "超标",
    outletRank:    "13 间门店 — 达成率排名",
    ecommTitle:    "电商 — 平台目标",
    ecommYtd:      "年度目标进度",
    ecommAnnual:   "全年目标",
    onTrack:       "达标",
    caution:       "需关注",
    behind:        "落后",
    statusGuide:   "状态说明",
    onTrackDesc:   "按计划推进",
    cautionDesc:   "需要关注",
    behindDesc:    "需要立刻行动",
    ofTarget:      "/ 目标",
    loading:       "加载中…",
    noData:        "暂无数据",
    edit:          "编辑",
    save:          "保存",
    cancel:        "取消",
    saved:         "已保存 ✓",
    note:          "备注",
    status:        "状态",
    ytdActual:     "年度实际",
    annualFull:    "年度目标",
    perspective:   "维度",
    monthActual:   "本月实际",
    customers:     "客户数",
    atv:           "平均客单价",
    salesSignals:  "销售信号",
    topByCategory: "Category 2 排行",
    noSignals:     "暂无销售数据",
    tab_online:    "线上销售",
    onlineTitle:   "2026 线上销售预测",
    forecastFull:  "全年预测",
    vs2025:        "2025 实际",
    growth:        "vs 2025 成长",
    ytdGrowth:     "YTD 增长",
    fullForecast:  "全年预测",
    needAttention: "需要关注",
    updateActuals: "更新实际数据",
    forecastBasis:    "预测基于 YTD 趋势对比 2025 季节性 · 虚线 = 预测",
    channel:          "平台",
    month:            "月份",
    amount:           "金额 (RM)",
    outletForecast:   "2026 门店销售预测",
    totalBusiness:    "2026 全渠道业务",
    outletSales:      "门店销售",
    onlineSales:      "线上销售",
    combinedTarget:   "综合目标",
    outletActual2025: "2025 门店实际",
    forecastFullYear: "全年预测",
  },
  ms: {
    pageTitle:     "Papan Pemuka Strategi",
    pageSubtitle:  "Kad Skor Seimbang 2026",
    tab_overview:  "Gambaran",
    tab_outlets:   "Cawangan",
    tab_ecomm:     "E-Comm",
    tab_bsc:       "BSC",
    annualTarget:  "Sasaran Tahunan 2026",
    ytdProgress:   "Kemajuan YTD",
    monthProgress: "Kemajuan Bulan",
    monthlyChart:  "Sasaran vs Sebenar Bulanan",
    target:        "Sasaran",
    actual:        "Sebenar",
    aboveTarget:   "Melebihi Sasaran",
    outletRank:    "13 Cawangan — Ranking Pencapaian",
    ecommTitle:    "E-Commerce — Sasaran Platform",
    ecommYtd:      "Sasaran YTD",
    ecommAnnual:   "Sasaran Tahunan",
    onTrack:       "Pada Landasan",
    caution:       "Berhati-hati",
    behind:        "Ketinggalan",
    statusGuide:   "Panduan Status",
    onTrackDesc:   "Berjalan mengikut rancangan",
    cautionDesc:   "Perlu perhatian",
    behindDesc:    "Perlu tindakan segera",
    ofTarget:      "daripada sasaran",
    loading:       "Memuatkan…",
    noData:        "Tiada data lagi",
    edit:          "Edit",
    save:          "Simpan",
    cancel:        "Batal",
    saved:         "Disimpan ✓",
    note:          "Nota",
    status:        "Status",
    ytdActual:     "Sebenar YTD",
    annualFull:    "Sasaran Tahunan",
    perspective:   "Perspektif",
    monthActual:   "Sebenar Bulan",
    customers:     "Pelanggan",
    atv:           "Purata Transaksi",
    salesSignals:  "Isyarat Jualan",
    topByCategory: "Teratas by Kategori 2",
    noSignals:     "Tiada data jualan lagi",
    tab_online:    "Jualan Online",
    onlineTitle:   "Ramalan Jualan Online 2026",
    forecastFull:  "Ramalan Setahun Penuh",
    vs2025:        "Sebenar 2025",
    growth:        "Pertumbuhan vs 2025",
    ytdGrowth:     "Pertumbuhan YTD",
    fullForecast:  "Ramalan Setahun",
    needAttention: "Perlu Perhatian",
    updateActuals: "Kemaskini Sebenar",
    forecastBasis:    "Ramalan berdasarkan trend YTD berbanding 2025 · garis putus = ramalan",
    channel:          "Platform",
    month:            "Bulan",
    amount:           "Jumlah (RM)",
    outletForecast:   "Ramalan Jualan Cawangan 2026",
    totalBusiness:    "Jumlah Perniagaan 2026",
    outletSales:      "Jualan Cawangan",
    onlineSales:      "Jualan Online",
    combinedTarget:   "Sasaran Gabungan",
    outletActual2025: "Sebenar Cawangan 2025",
    forecastFullYear: "Ramalan Setahun Penuh",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1_000_000) return "RM " + (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000)     return "RM " + (n / 1_000).toFixed(0) + "K";
  return "RM " + n.toFixed(0);
}

function pct(actual: number, target: number): number {
  if (!target) return 0;
  return Math.round((actual / target) * 100);
}

function achieveColor(p: number): string {
  if (p >= 100) return "#4A7C59";
  if (p >= 80)  return BRAND;
  if (p >= 60)  return "#D69E2E";
  return "#E53E3E";
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ h = "h-4", w = "w-full", className = "" }: { h?: string; w?: string; className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded-lg ${h} ${w} ${className}`} />;
}

function SkeletonOverview() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-5 bg-gray-800 space-y-3">
        <Skeleton h="h-3" w="w-32" />
        <Skeleton h="h-8" w="w-48" />
        <Skeleton h="h-2" />
      </div>
      {[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl p-5 shadow-sm space-y-3"><Skeleton h="h-4" w="w-40" /><Skeleton h="h-24" /></div>)}
    </div>
  );
}

function SkeletonOutlets() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 13 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl p-4 shadow-sm flex gap-3 items-center">
          <Skeleton h="h-6" w="w-6" />
          <div className="flex-1 space-y-2"><Skeleton h="h-3" w="w-40" /><Skeleton h="h-2" /></div>
          <Skeleton h="h-4" w="w-16" />
        </div>
      ))}
    </div>
  );
}

// ─── Tab: Overview ────────────────────────────────────────────────────────────

function TabOverview({ data, kpis, lk, signals, categories, outletForecast, onlineData }: {
  data: TargetsResponse;
  kpis: BscKpi[];
  lk: Record<string,string>;
  signals: SalesSignals | null;
  categories: CategoryItem[];
  outletForecast: OutletForecastResponse | null;
  onlineData: OnlineResponse | null;
}) {
  const { lang } = useLang();
  const monthLabels = lang === "zh" ? MONTHS_ZH : lang === "ms" ? MONTHS_BM : MONTHS_EN;

  // Combined totals (outlet forecast + online forecast)
  const outletS  = outletForecast?.summary;
  const onlineS  = onlineData?.summary;
  const combinedTarget   = (outletS?.totalTarget   ?? 0) + (onlineS?.totalTarget   ?? 0);
  const combinedForecast = (outletS?.totalForecast  ?? 0) + (onlineS?.totalForecast  ?? 0);
  const combinedYtd      = (outletS?.totalYtd       ?? 0) + (onlineS?.totalYtd       ?? 0);
  const combined2025     = 7149483.75 + 5914458.69;
  const combinedVsTarget = combinedTarget > 0 ? (combinedForecast / combinedTarget) * 100 : 0;

  // Combined monthly arrays for chart
  const combinedMonthly2025 = Array(12).fill(0).map((_, i) =>
    (outletS?.totalMonthly2025[i] ?? 0) + (onlineS?.totalMonthly2025[i] ?? 0)
  );
  const combinedMonthlyForecast = Array(12).fill(0).map((_, i) =>
    (outletS?.totalMonthlyForecast[i] ?? 0) + (onlineS?.totalMonthlyForecast[i] ?? 0)
  );

  const combinedGrowth = combined2025 > 0
    ? ((combinedForecast - combined2025) / combined2025) * 100 : 0;

  const chartData = MONTHS_SHORT.map((m, i) => ({
    name:     monthLabels[i],
    outlet:   Math.round(outletS?.totalMonthlyForecast[i] ?? 0),
    online:   Math.round(onlineS?.totalMonthlyForecast[i] ?? 0),
    prev2025: Math.round(combinedMonthly2025[i]),
  }));

  // Perspective mini-cards
  const perspSummary = PERSPECTIVES.map(p => {
    const pKpis = kpis.filter(k => k.perspective === p.id);
    const onTrack = pKpis.filter(k => k.status === "on-track").length;
    return { ...p, kpis: pKpis, onTrack };
  });

  return (
    <div className="space-y-4">
      {/* TOTAL BUSINESS combined card */}
      <div className="rounded-2xl p-5" style={{ background: "#1A1A1A" }}>
        <p className="text-[10px] font-black tracking-widest mb-1" style={{ color: "#888" }}>
          {lk.totalBusiness?.toUpperCase()}
        </p>
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-2xl font-black text-white">{fmtRM(combinedForecast)}</p>
            <p className="text-xs mt-0.5" style={{ color: "#888" }}>{lk.forecastFullYear}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black" style={{
              color: combinedVsTarget >= 95 ? "#4A7C59" : combinedVsTarget >= 70 ? BRAND : "#E53E3E"
            }}>
              {combinedVsTarget.toFixed(1)}%
            </p>
            <p className="text-[10px]" style={{ color: "#666" }}>{lk.ofTarget}</p>
          </div>
        </div>
        <div className="h-2 rounded-full mb-3" style={{ background: "#333" }}>
          <div className="h-2 rounded-full transition-all"
            style={{
              width: `${Math.min(combinedVsTarget, 100)}%`,
              background: combinedVsTarget >= 95 ? "#4A7C59" : combinedVsTarget >= 70 ? BRAND : "#E53E3E",
            }} />
        </div>
        <div className="flex items-center justify-between text-[11px]" style={{ color: "#888" }}>
          <span>{lk.combinedTarget}: {fmtRM(combinedTarget)}</span>
          <span>2025: {fmtRM(combined2025)} · {combinedGrowth >= 0 ? "+" : ""}{combinedGrowth.toFixed(1)}%</span>
        </div>
      </div>

      {/* Outlet + Online sub-cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-black tracking-widest mb-2" style={{ color: "#888" }}>
            🏪 {lk.outletSales?.toUpperCase()}
          </p>
          <p className="text-lg font-black" style={{ color: "#1A1A1A" }}>
            {fmtRM(outletS?.totalForecast ?? 0)}
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: "#888" }}>
            {outletS ? ((outletS.totalForecast / outletS.totalTarget) * 100).toFixed(1) : "—"}% {lk.ofTarget}
          </p>
          <p className="text-[10px] mt-1" style={{ color: "#bbb" }}>
            {lk.annualTarget}: {fmtRM(outletS?.totalTarget ?? 0)}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-black tracking-widest mb-2" style={{ color: "#888" }}>
            🌐 {lk.onlineSales?.toUpperCase()}
          </p>
          <p className="text-lg font-black" style={{ color: "#1A1A1A" }}>
            {fmtRM(onlineS?.totalForecast ?? 0)}
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: "#888" }}>
            {onlineS ? ((onlineS.totalForecast / onlineS.totalTarget) * 100).toFixed(1) : "—"}% {lk.ofTarget}
          </p>
          <p className="text-[10px] mt-1" style={{ color: "#bbb" }}>
            {lk.annualTarget}: {fmtRM(onlineS?.totalTarget ?? 0)}
          </p>
        </div>
      </div>

      {/* Combined monthly chart */}
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <p className="text-xs font-black mb-1" style={{ color: "#1A1A1A" }}>2025 vs 2026 Forecast</p>
        <p className="text-[10px] mb-3" style={{ color: "#bbb" }}>{lk.outletSales} + {lk.onlineSales}</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} barCategoryGap="25%" barGap={1}>
            <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#999" }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip
              formatter={(v: number, n: string) => [fmtRM(v), n === "outlet" ? lk.outletSales : n === "online" ? lk.onlineSales : "2025"]}
              contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #eee" }}
            />
            <Bar dataKey="prev2025" fill="#E5E1DB" radius={[3,3,0,0]} />
            <Bar dataKey="outlet"   fill="#3B6CB7" radius={[3,3,0,0]} stackId="a" />
            <Bar dataKey="online"   fill={BRAND}   radius={[3,3,0,0]} stackId="a" />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 justify-center flex-wrap">
          {[["#E5E1DB","2025"], ["#3B6CB7", lk.outletSales], [BRAND, lk.onlineSales]].map(([c, lb]) => (
            <div key={lb} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ background: c }} />
              <span className="text-[10px]" style={{ color: "#888" }}>{lb}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sales Signals — Customer Count + ATV */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-black tracking-widest mb-2" style={{ color: "#888" }}>{lk.customers?.toUpperCase()}</p>
          <p className="text-2xl font-black" style={{ color: "#1A1A1A" }}>
            {signals ? signals.customerCount.toLocaleString() : "—"}
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: "#bbb" }}>{lk.salesSignals} · YTD</p>
        </div>
        <div className="rounded-2xl p-4 shadow-sm" style={{ background: BRAND }}>
          <p className="text-[10px] font-black tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.6)" }}>{lk.atv?.toUpperCase()}</p>
          <p className="text-2xl font-black text-white">
            {signals ? fmt(signals.atv) : "—"}
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>{lk.salesSignals} · YTD</p>
        </div>
      </div>

      {/* Perspective mini-cards 2×2 */}
      <div className="grid grid-cols-2 gap-3">
        {perspSummary.map(p => (
          <div key={p.id} className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">{p.emoji}</span>
              <p className="text-xs font-black leading-tight" style={{ color: "#1A1A1A" }}>
                {lang === "zh" ? p.zh : lang === "ms" ? p.bm : p.label}
              </p>
            </div>
            <div className="space-y-1.5 mb-2">
              {p.kpis.map(k => (
                <div key={k.kpiKey} className="h-1.5 rounded-full" style={{ background: STATUS_META[k.status]?.bg ?? "#eee" }}>
                  <div className="h-1.5 rounded-full w-full" style={{ background: STATUS_META[k.status]?.color ?? "#999" }} />
                </div>
              ))}
            </div>
            <p className="text-[10px] font-bold" style={{ color: p.color }}>{p.onTrack}/{p.kpis.length} {lk.onTrack}</p>
          </div>
        ))}
      </div>

      {/* Top by Category 2 */}
      {categories.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-black mb-4" style={{ color: "#1A1A1A" }}>{lk.topByCategory}</p>
          <div className="space-y-3">
            {categories.map((cat, i) => {
              const maxAmt = categories[0]?.amount || 1;
              const barW   = Math.round((cat.amount / maxAmt) * 100);
              return (
                <div key={cat.name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black w-4" style={{ color: i === 0 ? BRAND : "#bbb" }}>{i + 1}</span>
                      <span className="text-xs font-bold" style={{ color: "#1A1A1A" }}>{cat.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black" style={{ color: BRAND }}>{fmt(cat.amount)}</span>
                      <span className="text-[10px] ml-1.5" style={{ color: "#bbb" }}>{cat.qty} pcs</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full mb-1.5" style={{ background: "#F0EDE8" }}>
                    <div className="h-1.5 rounded-full transition-all" style={{ width: `${barW}%`, background: i === 0 ? BRAND : "#D4C9B8" }} />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.topProducts.map(p => (
                      <span key={p.name} className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{ background: BRAND_LIGHT, color: BRAND }}>
                        {p.name}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Outlets ─────────────────────────────────────────────────────────────

function TabOutlets({ data, lk, outletForecast }: {
  data: TargetsResponse;
  lk: Record<string,string>;
  outletForecast: OutletForecastResponse | null;
}) {
  const { lang } = useLang();
  const monthLabels = lang === "zh" ? MONTHS_ZH : lang === "ms" ? MONTHS_BM : MONTHS_EN;

  const allOutlets = Array.from(new Set(data.targets.map(t => t.outlet)));

  const rows = allOutlets.map(outlet => {
    const annualTarget  = data.targets.filter(t => t.outlet === outlet).reduce((s, t) => s + t.targetRm, 0);
    const ytdTarget     = data.targets.filter(t => t.outlet === outlet && t.month <= data.currentMonth).reduce((s, t) => s + t.targetRm, 0);
    const outletActuals = data.actuals[outlet] ?? {};
    const ytdActual     = Object.entries(outletActuals)
      .filter(([m]) => parseInt(m) <= data.currentMonth)
      .reduce((s, [, v]) => s + v, 0);
    const p = pct(ytdActual, ytdTarget);
    return { outlet, annualTarget, ytdTarget, ytdActual, pct: p };
  }).sort((a, b) => b.pct - a.pct);

  const summary = outletForecast?.summary;
  const forecasts = outletForecast?.forecasts ?? [];

  const fvt = summary?.forecastVsTarget ?? 0;
  const growth2025 = summary && summary.total2025 > 0
    ? ((summary.totalForecast - summary.total2025) / summary.total2025) * 100 : 0;

  const chartData = MONTHS_SHORT.map((m, i) => ({
    name:       monthLabels[i],
    forecast26: Math.round(summary?.totalMonthlyForecast[i] ?? 0),
    actual25:   Math.round(summary?.totalMonthly2025[i] ?? 0),
  }));

  return (
    <div className="space-y-4">
      {/* Existing YTD achievement ranking */}
      <p className="text-xs font-black px-1" style={{ color: "#888" }}>{lk.outletRank.toUpperCase()}</p>
      <div className="space-y-3">
        {rows.map((row, i) => {
          const color  = achieveColor(row.pct);
          const isTop3 = i < 3;
          return (
            <div key={row.outlet} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="min-w-[28px] h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0"
                  style={{ background: isTop3 ? BRAND_LIGHT : "#F8F7F4", color: isTop3 ? BRAND : "#999" }}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black truncate" style={{ color: "#1A1A1A" }}>{row.outlet}</p>
                  <p className="text-[11px]" style={{ color: "#999" }}>
                    {fmt(row.ytdActual)} / {fmt(row.ytdTarget)} {lk.target}
                  </p>
                </div>
                <p className="text-base font-black shrink-0" style={{ color }}>{row.pct}%</p>
              </div>
              <div className="h-2 rounded-full" style={{ background: "#F0EDE8" }}>
                <div className="h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(row.pct, 100)}%`, background: color }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Forecast section ── */}
      {summary && (
        <>
          {/* Forecast summary card */}
          <div className="rounded-2xl p-5" style={{ background: "#1A1A1A" }}>
            <p className="text-[10px] font-black tracking-widest mb-1" style={{ color: "#888" }}>
              {lk.outletForecast?.toUpperCase()}
            </p>
            <div className="flex items-end justify-between mb-3">
              <div>
                <p className="text-2xl font-black text-white">{fmtRM(summary.totalForecast)}</p>
                <p className="text-xs mt-0.5" style={{ color: "#888" }}>{lk.forecastFullYear}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black" style={{
                  color: fvt >= 95 ? "#4A7C59" : fvt >= 70 ? BRAND : "#E53E3E"
                }}>
                  {fvt.toFixed(1)}%
                </p>
                <p className="text-[10px]" style={{ color: "#666" }}>{lk.ofTarget}</p>
              </div>
            </div>
            <div className="h-2 rounded-full mb-3" style={{ background: "#333" }}>
              <div className="h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min(fvt, 100)}%`,
                  background: fvt >= 95 ? "#4A7C59" : fvt >= 70 ? BRAND : "#E53E3E",
                }} />
            </div>
            <div className="flex items-center justify-between text-[11px]" style={{ color: "#888" }}>
              <span>{lk.annualTarget}: {fmtRM(summary.totalTarget)}</span>
              <span>{lk.outletActual2025}: {fmtRM(summary.total2025)} · {growth2025 >= 0 ? "+" : ""}{growth2025.toFixed(1)}%</span>
            </div>
          </div>

          {/* 2025 vs 2026 trend chart */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-black mb-1" style={{ color: "#1A1A1A" }}>2025 vs 2026 Forecast</p>
            <p className="text-[10px] mb-3" style={{ color: "#bbb" }}>{lk.forecastBasis}</p>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#999" }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  formatter={(v: number, n: string) => [fmtRM(v), n === "forecast26" ? "2026" : "2025"]}
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #eee" }}
                />
                <Line type="monotone" dataKey="actual25"   stroke="#94A3B8" strokeWidth={2}   dot={false} />
                <Line type="monotone" dataKey="forecast26" stroke={BRAND}    strokeWidth={2.5} dot={false} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-1 justify-center">
              {[["#94A3B8","2025"], [BRAND,"2026 Forecast"]].map(([c, lb]) => (
                <div key={lb} className="flex items-center gap-1.5">
                  <div className="w-8 h-0.5 rounded" style={{ background: c }} />
                  <span className="text-[10px]" style={{ color: "#888" }}>{lb}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Per-outlet forecast cards */}
          <p className="text-xs font-black px-1" style={{ color: "#888" }}>
            {forecasts.length} OUTLETS — FORECAST VS TARGET
          </p>
          <div className="space-y-3">
            {forecasts.map(f => {
              const sc   = STATUS_COLOR_ONLINE[f.status];
              const barW = f.target2026 > 0 ? Math.min((f.fullYearForecast / f.target2026) * 100, 130) : 0;
              return (
                <div key={f.outlet} className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🏪</span>
                      <p className="text-sm font-black" style={{ color: "#1A1A1A" }}>{f.outlet}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black" style={{ color: sc }}>
                        {f.forecastVsTarget.toFixed(1)}%
                      </span>
                      <span className="w-2 h-2 rounded-full" style={{ background: sc }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="text-[11px]" style={{ color: "#888" }}>
                      YTD: <b style={{ color: "#1A1A1A" }}>{fmtRM(f.ytdActual)}</b>
                    </span>
                    <span className="text-[11px]" style={{ color: "#888" }}>
                      {lk.ytdGrowth}: <b style={{ color: f.ytdGrowth >= 0 ? "#4A7C59" : "#E53E3E" }}>
                        {f.ytdGrowth >= 0 ? "+" : ""}{f.ytdGrowth.toFixed(1)}%
                      </b>
                    </span>
                    <span className="text-[11px]" style={{ color: "#888" }}>
                      {lk.forecastFullYear}: <b style={{ color: "#1A1A1A" }}>{fmtRM(f.fullYearForecast)}</b>
                    </span>
                  </div>
                  <div className="h-2 rounded-full mb-1" style={{ background: "#F0EDE8" }}>
                    <div className="h-2 rounded-full transition-all"
                      style={{ width: `${barW}%`, background: sc }} />
                  </div>
                  <div className="flex justify-between text-[10px]" style={{ color: "#bbb" }}>
                    <span>{lk.annualTarget}: {fmtRM(f.target2026)}</span>
                    <span>Gap: {fmtRM(f.fullYearForecast - f.target2026)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Tab: Ecomm ───────────────────────────────────────────────────────────────

function TabEcomm({ ecomm, currentMonth, lk }: { ecomm: EcommResponse; currentMonth: number; lk: Record<string,string> }) {
  const allPlatforms = Array.from(new Set(ecomm.targets.map(t => t.platform)));

  const rows = allPlatforms.map(platform => {
    const annualTarget = ecomm.targets.filter(t => t.platform === platform).reduce((s, t) => s + t.targetRm, 0);
    const ytdTarget    = ecomm.targets.filter(t => t.platform === platform && t.month <= currentMonth).reduce((s, t) => s + t.targetRm, 0);
    return { platform, annualTarget, ytdTarget };
  }).sort((a, b) => b.annualTarget - a.annualTarget);

  const grandTotal    = rows.reduce((s, r) => s + r.annualTarget, 0);
  const grandYtd      = rows.reduce((s, r) => s + r.ytdTarget, 0);

  return (
    <div className="space-y-3">
      {/* Summary card */}
      <div className="rounded-2xl p-5" style={{ background: "#1A1A1A" }}>
        <p className="text-[10px] font-black tracking-widest mb-2" style={{ color: "#888" }}>{lk.ecommTitle?.toUpperCase()}</p>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-black text-white">{fmt(grandTotal)}</p>
            <p className="text-xs mt-0.5" style={{ color: "#888" }}>{lk.ecommAnnual}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-black" style={{ color: BRAND }}>{fmt(grandYtd)}</p>
            <p className="text-[10px]" style={{ color: "#666" }}>{lk.ecommYtd}</p>
          </div>
        </div>
      </div>

      <p className="text-xs font-black px-1" style={{ color: "#888" }}>
        {allPlatforms.length} PLATFORMS
      </p>

      {rows.map((row, i) => {
        const barPct = grandTotal > 0 ? (row.annualTarget / grandTotal) * 100 : 0;
        const isTop = i === 0;
        return (
          <div key={row.platform} className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-start gap-3 mb-2">
              <div className="min-w-[28px] h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 mt-0.5"
                style={{ background: isTop ? BRAND_LIGHT : "#F8F7F4", color: isTop ? BRAND : "#999" }}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black leading-tight" style={{ color: "#1A1A1A" }}>{row.platform}</p>
                <p className="text-[11px] mt-0.5" style={{ color: "#999" }}>
                  {fmt(row.ytdTarget)} YTD target · {fmt(row.annualTarget)} annual
                </p>
              </div>
              <p className="text-sm font-black shrink-0" style={{ color: BRAND }}>
                {fmt(row.annualTarget)}
              </p>
            </div>
            {/* Share-of-total bar */}
            <div className="h-1.5 rounded-full" style={{ background: "#F0EDE8" }}>
              <div className="h-1.5 rounded-full transition-all"
                style={{ width: `${Math.min(barPct, 100)}%`, background: BRAND }} />
            </div>
            <p className="text-[10px] mt-1" style={{ color: "#bbb" }}>
              {Math.round(barPct)}% of total ecomm target
            </p>
          </div>
        );
      })}

      {rows.length === 0 && (
        <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
          <p className="text-sm" style={{ color: "#aaa" }}>No ecomm targets set for 2026.</p>
          <p className="text-xs mt-1" style={{ color: "#ccc" }}>Go to Admin → Strategy → Ecomm Targets to add them.</p>
        </div>
      )}
    </div>
  );
}

// ─── Tab: BSC ─────────────────────────────────────────────────────────────────

function TabBSC({ kpis, onUpdate, lk }: {
  kpis: BscKpi[];
  onUpdate: (perspective: string, kpiKey: string, status: string, note: string) => Promise<void>;
  lk: Record<string, string>;
}) {
  const { user } = useAuth();
  const { lang } = useLang();
  const [active, setActive] = useState<PerspId>("financial");
  const [editing, setEditing] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editNote, setEditNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedKey, setSavedKey] = useState<string | null>(null);

  const canEdit = user?.role === "admin" || user?.role === "manager";
  const activePersp = PERSPECTIVES.find(p => p.id === active)!;
  const perspKpis = kpis.filter(k => k.perspective === active);

  function startEdit(k: BscKpi) {
    setEditing(k.kpiKey);
    setEditStatus(k.status);
    setEditNote(k.note ?? "");
  }

  async function handleSave(k: BscKpi) {
    setSaving(true);
    await onUpdate(k.perspective, k.kpiKey, editStatus, editNote);
    setSaving(false);
    setEditing(null);
    setSavedKey(k.kpiKey);
    setTimeout(() => setSavedKey(null), 2000);
  }

  const statusOptions: { value: string; label: string }[] = [
    { value: "on-track", label: lk.onTrack },
    { value: "caution",  label: lk.caution },
    { value: "behind",   label: lk.behind  },
  ];

  return (
    <div className="space-y-4">
      {/* Perspective selector 2×2 */}
      <div className="grid grid-cols-2 gap-2">
        {PERSPECTIVES.map(p => (
          <button key={p.id} onClick={() => setActive(p.id)}
            className="rounded-2xl p-3 text-left border-2 transition-all"
            style={{
              borderColor: active === p.id ? p.color : "#E5E1DB",
              background:  active === p.id ? p.color + "12" : "#fff",
            }}>
            <span className="text-xl">{p.emoji}</span>
            <p className="text-xs font-black mt-1 leading-tight" style={{ color: active === p.id ? p.color : "#1A1A1A" }}>
              {lang === "zh" ? p.zh : lang === "ms" ? p.bm : p.label}
            </p>
          </button>
        ))}
      </div>

      {/* KPI cards */}
      <div className="space-y-3">
        {perspKpis.map(k => {
          const meta = STATUS_META[k.status] ?? STATUS_META["on-track"];
          const isEditingThis = editing === k.kpiKey;
          return (
            <div key={k.kpiKey} className="bg-white rounded-2xl p-5 shadow-sm"
              style={{ borderLeft: `4px solid ${activePersp.color}` }}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: meta.color }} />
                  <p className="text-sm font-black" style={{ color: "#1A1A1A" }}>{k.kpiLabel}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {savedKey === k.kpiKey && (
                    <span className="text-[10px] font-bold" style={{ color: "#4A7C59" }}>{lk.saved}</span>
                  )}
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black"
                    style={{ background: meta.bg, color: meta.color }}>
                    {statusOptions.find(o => o.value === k.status)?.label ?? k.status}
                  </span>
                  {canEdit && !isEditingThis && (
                    <button onClick={() => startEdit(k)}
                      className="text-[10px] px-2 py-0.5 rounded-full border font-bold transition-colors"
                      style={{ borderColor: "#E5E1DB", color: "#888" }}>
                      ✏️ {lk.edit}
                    </button>
                  )}
                </div>
              </div>

              {k.targetDesc && (
                <p className="text-xs mb-1" style={{ color: "#888" }}>{k.targetDesc}</p>
              )}
              {k.note && !isEditingThis && (
                <p className="text-xs italic" style={{ color: "#aaa" }}>{k.note}</p>
              )}

              {/* Inline editor */}
              {isEditingThis && (
                <div className="mt-3 space-y-2 pt-3 border-t" style={{ borderColor: "#F0EDE8" }}>
                  <div>
                    <p className="text-[10px] font-black mb-1" style={{ color: "#888" }}>{lk.status.toUpperCase()}</p>
                    <div className="flex gap-1.5">
                      {statusOptions.map(o => (
                        <button key={o.value} onClick={() => setEditStatus(o.value)}
                          className="flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all border"
                          style={{
                            borderColor: editStatus === o.value ? STATUS_META[o.value].color : "#E5E1DB",
                            background:  editStatus === o.value ? STATUS_META[o.value].bg : "#fff",
                            color:       editStatus === o.value ? STATUS_META[o.value].color : "#888",
                          }}>
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black mb-1" style={{ color: "#888" }}>{lk.note.toUpperCase()}</p>
                    <input
                      value={editNote}
                      onChange={e => setEditNote(e.target.value)}
                      placeholder="Add a note…"
                      className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
                      style={{ borderColor: "#E5E1DB" }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleSave(k)} disabled={saving}
                      className="flex-1 py-2 rounded-xl text-sm font-bold text-white transition-all"
                      style={{ background: activePersp.color }}>
                      {saving ? "…" : lk.save}
                    </button>
                    <button onClick={() => setEditing(null)}
                      className="px-4 py-2 rounded-xl text-sm font-bold border"
                      style={{ borderColor: "#E5E1DB", color: "#888" }}>
                      {lk.cancel}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Status legend */}
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <p className="text-[10px] font-black tracking-widest mb-3" style={{ color: "#aaa" }}>{lk.statusGuide.toUpperCase()}</p>
        {[
          { status: "on-track", label: lk.onTrack, desc: lk.onTrackDesc },
          { status: "caution",  label: lk.caution,  desc: lk.cautionDesc  },
          { status: "behind",   label: lk.behind,   desc: lk.behindDesc   },
        ].map((s, i, arr) => {
          const meta = STATUS_META[s.status];
          return (
            <div key={s.status} className="flex gap-3 items-start py-2.5"
              style={{ borderBottom: i < arr.length - 1 ? "1px solid #F0EDE8" : "none" }}>
              <div className="w-3 h-3 rounded-full shrink-0 mt-0.5" style={{ background: meta.color }} />
              <div>
                <p className="text-sm font-black" style={{ color: "#1A1A1A" }}>{s.label}</p>
                <p className="text-xs" style={{ color: "#888" }}>{s.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tab: Online Sales ────────────────────────────────────────────────────────

const PLATFORM_ICON: Record<string, string> = {
  shopee: "🛍️", lazada: "🟠", tiktok: "🎵", shopify: "🏪", zalora: "👗",
};

const STATUS_COLOR_ONLINE: Record<string, string> = {
  "on-track": "#4A7C59", caution: "#C17F24", behind: "#E53E3E",
};

function fmtRM(n: number): string {
  if (n >= 1_000_000) return "RM " + (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000)     return "RM " + (n / 1_000).toFixed(0) + "K";
  return "RM " + n.toFixed(0);
}

function TabOnline({ data, lk }: { data: OnlineResponse; lk: Record<string, string> }) {
  const { user } = useAuth();
  const { summary, forecasts } = data;
  const canEdit = ["admin", "manager", "supervisor"].includes(user?.role ?? "");
  const [modal, setModal] = useState(false);
  const [mChannel, setMChannel] = useState(forecasts[0]?.channelKey ?? "");
  const [mMonth, setMMonth] = useState(5);
  const [mAmount, setMAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const fvt = summary.forecastVsTarget;
  const growth = summary.actual2025 > 0
    ? ((summary.totalForecast - summary.actual2025) / summary.actual2025 * 100)
    : 0;

  async function handleSave() {
    setSaving(true);
    await fetch("/api/bsc/ecomm", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channelKey: mChannel, year: 2026, month: mMonth, amount: parseFloat(mAmount) || 0 }),
    });
    setSaving(false);
    setModal(false);
    window.location.reload();
  }

  const chartData = MONTHS_SHORT.map((m, i) => ({
    name: m,
    forecast2026: summary.totalMonthlyForecast[i] || 0,
    actual2025:   summary.totalMonthly2025[i]     || 0,
  }));

  const behind = forecasts.filter(f => f.status === "behind");

  return (
    <div className="space-y-4">
      {/* Summary card */}
      <div className="rounded-2xl p-5" style={{ background: "#1A1A1A" }}>
        <p className="text-[10px] font-black tracking-widest mb-1" style={{ color: "#888" }}>
          {lk.onlineTitle?.toUpperCase()}
        </p>
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-2xl font-black text-white">{fmtRM(summary.totalForecast)}</p>
            <p className="text-xs mt-0.5" style={{ color: "#888" }}>{lk.forecastFull}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black" style={{ color: fvt >= 95 ? "#4A7C59" : fvt >= 70 ? BRAND : "#E53E3E" }}>
              {fvt.toFixed(1)}%
            </p>
            <p className="text-[10px]" style={{ color: "#666" }}>{lk.ofTarget}</p>
          </div>
        </div>
        <div className="h-2 rounded-full mb-3" style={{ background: "#333" }}>
          <div className="h-2 rounded-full transition-all"
            style={{ width: `${Math.min(fvt, 100)}%`, background: fvt >= 95 ? "#4A7C59" : fvt >= 70 ? BRAND : "#E53E3E" }} />
        </div>
        <div className="flex items-center justify-between text-[11px]" style={{ color: "#888" }}>
          <span>{lk.annualTarget}: {fmtRM(summary.totalTarget)}</span>
          <span>{lk.vs2025}: {fmtRM(summary.actual2025)} · {growth >= 0 ? "+" : ""}{growth.toFixed(1)}%</span>
        </div>
      </div>

      {/* Trend chart — 2025 vs 2026 forecast */}
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <p className="text-xs font-black mb-1" style={{ color: "#1A1A1A" }}>2025 vs 2026 Forecast</p>
        <p className="text-[10px] mb-3" style={{ color: "#bbb" }}>{lk.forecastBasis}</p>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={chartData}>
            <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#999" }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip
              formatter={(v: number, n: string) => [fmtRM(v), n === "forecast2026" ? "2026" : "2025"]}
              contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #eee" }}
            />
            <Line type="monotone" dataKey="actual2025"   stroke="#94A3B8" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="forecast2026" stroke={BRAND}    strokeWidth={2.5} dot={false} strokeDasharray="4 2" />
            <ReferenceLine y={summary.totalTarget / 12} stroke="#E5E1DB" strokeDasharray="3 3" />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-1 justify-center">
          {[["#94A3B8","2025"], [BRAND,"2026 Forecast"]].map(([c, lb]) => (
            <div key={lb} className="flex items-center gap-1.5">
              <div className="w-8 h-0.5 rounded" style={{ background: c }} />
              <span className="text-[10px]" style={{ color: "#888" }}>{lb}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Need attention */}
      {behind.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
          <p className="text-xs font-black mb-2" style={{ color: "#E53E3E" }}>🔴 {lk.needAttention}</p>
          <div className="space-y-1.5">
            {behind.map(f => (
              <div key={f.channelKey} className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-800">
                  {PLATFORM_ICON[f.platform]} {f.channelName}
                </span>
                <span className="text-xs" style={{ color: "#E53E3E" }}>
                  {fmtRM(f.fullYearForecast)} / {fmtRM(f.target2026)} ({f.forecastVsTarget.toFixed(0)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Platform breakdown */}
      <div className="space-y-3">
        {[...forecasts].sort((a, b) => b.fullYearForecast - a.fullYearForecast).map(f => {
          const barW = f.target2026 > 0 ? Math.min((f.fullYearForecast / f.target2026) * 100, 130) : 0;
          const sc   = STATUS_COLOR_ONLINE[f.status];
          return (
            <div key={f.channelKey} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-base">{PLATFORM_ICON[f.platform]}</span>
                  <p className="text-sm font-black" style={{ color: "#1A1A1A" }}>{f.channelName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black" style={{ color: sc }}>
                    {f.forecastVsTarget.toFixed(1)}%
                  </span>
                  <span className="w-2 h-2 rounded-full" style={{ background: sc }} />
                </div>
              </div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <span className="text-[11px]" style={{ color: "#888" }}>
                  YTD: <b style={{ color: "#1A1A1A" }}>{fmtRM(f.ytdActual)}</b>
                </span>
                <span className="text-[11px]" style={{ color: "#888" }}>
                  {lk.ytdGrowth}: <b style={{ color: f.ytdGrowth >= 0 ? "#4A7C59" : "#E53E3E" }}>
                    {f.ytdGrowth >= 0 ? "+" : ""}{f.ytdGrowth.toFixed(1)}%
                  </b>
                </span>
                <span className="text-[11px]" style={{ color: "#888" }}>
                  {lk.fullForecast}: <b style={{ color: "#1A1A1A" }}>{fmtRM(f.fullYearForecast)}</b>
                </span>
              </div>
              <div className="h-2 rounded-full mb-1" style={{ background: "#F0EDE8" }}>
                <div className="h-2 rounded-full transition-all"
                  style={{ width: `${barW}%`, background: sc }} />
              </div>
              <div className="flex justify-between text-[10px]" style={{ color: "#bbb" }}>
                <span>{lk.annualTarget}: {fmtRM(f.target2026)}</span>
                <span>Gap: {fmtRM(f.fullYearForecast - f.target2026)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Admin: Update Actuals button */}
      {canEdit && (
        <button onClick={() => setModal(true)}
          className="w-full py-3 rounded-2xl text-sm font-bold border-2 transition-colors"
          style={{ borderColor: BRAND, color: BRAND, background: BRAND_LIGHT }}>
          ✏️ {lk.updateActuals}
        </button>
      )}

      {/* Update Actuals Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <p className="font-black text-gray-800 text-base mb-4">{lk.updateActuals}</p>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">{lk.channel}</label>
                <select className="select text-sm w-full" value={mChannel} onChange={e => setMChannel(e.target.value)}>
                  {forecasts.map(f => <option key={f.channelKey} value={f.channelKey}>{f.channelName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">{lk.month}</label>
                <select className="select text-sm w-full" value={mMonth} onChange={e => setMMonth(Number(e.target.value))}>
                  {MONTHS_SHORT.map((m, i) => <option key={i} value={i + 1}>{m} 2026</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">{lk.amount}</label>
                <input type="number" className="input text-sm w-full" value={mAmount}
                  onChange={e => setMAmount(e.target.value)} placeholder="0.00" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-colors"
                style={{ background: BRAND }}>
                {saving ? "…" : lk.save}
              </button>
              <button onClick={() => setModal(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-bold border"
                style={{ borderColor: "#E5E1DB", color: "#888" }}>
                {lk.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS = ["overview", "outlets", "bsc", "online"] as const;
type TabId = typeof TABS[number];

export default function StrategyDashboard() {
  const { lang } = useLang();
  const lk = L[lang as LangKey] ?? L.en;

  const [tab, setTab]             = useState<TabId>("overview");
  const [data, setData]           = useState<TargetsResponse | null>(null);
  const [onlineData, setOnlineData]         = useState<OnlineResponse | null>(null);
  const [outletForecast, setOutletForecast] = useState<OutletForecastResponse | null>(null);
  const [kpis, setKpis]           = useState<BscKpi[]>([]);
  const [signals, setSignals]     = useState<SalesSignals | null>(null);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading]     = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [tRes, kRes, oRes, sRes, cRes, ofRes] = await Promise.all([
        fetch("/api/bsc/targets?year=2026").then(r => r.json()),
        fetch("/api/bsc/kpis").then(r => r.json()),
        fetch("/api/bsc/ecomm").then(r => r.json()),
        fetch("/api/sales-report/metrics").then(r => r.json()),
        fetch("/api/sales-report/category-breakdown").then(r => r.json()),
        fetch("/api/bsc/outlet-forecast").then(r => r.json()),
      ]);
      setData(tRes);
      setKpis(kRes.kpis ?? []);
      setOnlineData(oRes.forecasts ? oRes : null);
      setOutletForecast(ofRes.forecasts ? ofRes : null);
      setSignals(sRes.reportCount > 0 ? sRes : null);
      setCategories(cRes.categories ?? []);
    } catch (err) {
      console.error("[load] failed:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleKpiUpdate(perspective: string, kpiKey: string, status: string, note: string) {
    await fetch("/api/bsc/kpis", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ perspective, kpiKey, status, note }),
    });
    // Refresh KPIs
    const kRes = await fetch("/api/bsc/kpis").then(r => r.json());
    setKpis(kRes.kpis ?? []);
  }

  const tabLabels: Record<TabId, string> = {
    overview: lk.tab_overview,
    outlets:  lk.tab_outlets,
    bsc:      lk.tab_bsc,
    online:   lk.tab_online,
  };

  const tabEmojis: Record<TabId, string> = {
    overview: "📊",
    outlets:  "🏪",
    bsc:      "🎯",
    online:   "🌐",
  };

  return (
    <div className="min-h-screen" style={{ background: "#F8F7F4", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 pt-4 pb-0">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
                style={{ background: BRAND }}>📊</div>
              <div>
                <p className="text-sm font-black" style={{ color: "#1A1A1A" }}>{lk.pageTitle}</p>
                <p className="text-[11px]" style={{ color: "#999" }}>{lk.pageSubtitle}</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold"
              style={{ background: "#ECFDF5", color: "#065F46" }}>
              🟢 2026
            </span>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 pb-3">
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all"
                style={{
                  background: tab === t ? BRAND : "transparent",
                  color:      tab === t ? "#fff" : "#888",
                }}>
                <span>{tabEmojis[t]}</span>
                <span>{tabLabels[t]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-xl mx-auto px-4 py-5 pb-16">
        {loading || !data ? (
          tab === "outlets" ? <SkeletonOutlets /> : <SkeletonOverview />
        ) : (
          <>
            {tab === "overview" && <TabOverview data={data} kpis={kpis} lk={lk} signals={signals} categories={categories} outletForecast={outletForecast} onlineData={onlineData} />}
            {tab === "outlets"  && <TabOutlets  data={data} lk={lk} outletForecast={outletForecast} />}
            {tab === "bsc"      && <TabBSC kpis={kpis} onUpdate={handleKpiUpdate} lk={lk} />}
            {tab === "online"   && onlineData && <TabOnline data={onlineData} lk={lk} />}
            {tab === "online"   && !onlineData && (
              <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
                <p className="text-sm" style={{ color: "#aaa" }}>No online sales data yet.</p>
                <p className="text-xs mt-1" style={{ color: "#ccc" }}>Run the ecomm seed script to load channel data.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
