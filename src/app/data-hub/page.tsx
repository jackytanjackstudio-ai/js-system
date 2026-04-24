"use client";
import { useState } from "react";
import { useData } from "@/hooks/useData";
import { Database, TrendingUp, AlertTriangle, Lightbulb, MessageSquare, Store, Loader2, ArrowRight, ImageIcon, X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { useLang } from "@/context/LangContext";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from "recharts";

type VisualTrend = {
  tagKey: string;
  tags: string[];
  count: number;
  imageUrls: string[];
  categories: string[];
  score: number;
  signal: string;
};

type HubData = {
  period: string;
  week: string;
  month: number;
  totalInputs: number;
  imageInputsCount: number;
  topDemands:      { label: string; count: number }[];
  topReasons:      { label: string; count: number }[];
  topSuggestions:  { label: string; count: number }[];
  weeklyTrend:     { week: string; count: number }[];
  visualTrends:    VisualTrend[];
  outletBreakdown: { outlet: string; total: number; top: { tag: string; count: number }[] }[];
  revenueTrend:    { week: string; revenue: number }[];
  creatorSignals:  { id: string; title: string; views: number; signal: string; creator: string; platform: string }[];
  products: { total: number; watchlist: number; testing: number; scale: number };
  tasks:    { pending: number; overdue: number };
};

type Period = "week" | "month" | "all";

function RankBar({ items, colorClass, empty }: {
  items: { label: string; count: number }[];
  colorClass: string;
  empty: string;
}) {
  if (!items.length) return <p className="text-sm text-gray-400 py-4 text-center">{empty}</p>;
  const max = items[0].count;
  return (
    <div className="space-y-2.5">
      {items.map((r, i) => (
        <div key={r.label} className="flex items-center gap-2">
          <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0 ${colorClass}`}>{i + 1}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-xs font-medium text-gray-700 truncate">{r.label}</span>
              <span className="text-[10px] text-gray-400 ml-2 flex-shrink-0">{r.count}×</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${(r.count / max) * 100}%`, background: "currentColor" }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

type LightboxState = { urls: string[]; index: number; trend: VisualTrend } | null;

export default function DataHub() {
  const { t } = useLang();
  const [period, setPeriod] = useState<Period>("month");
  const { data, loading } = useData<HubData>(`/api/data-hub?period=${period}`, [period]);
  const [lightbox, setLightbox] = useState<LightboxState>(null);

  const periods: { key: Period; label: string }[] = [
    { key: "week",  label: t("dh_this_week")  },
    { key: "month", label: t("dh_this_month") },
    { key: "all",   label: t("dh_all_time")   },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Database size={18} className="text-brand-600" />
            {t("dh_title")}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">{t("dh_subtitle")}</p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {periods.map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                period === p.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gray-300" size={32} /></div>
      ) : !data ? null : (
        <>
          {/* KPI strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: t("nav_customer_input"), value: data.totalInputs,       sub: t("dh_inputs"), color: "bg-amber-50 text-amber-700",  dot: "bg-amber-400"  },
              { label: t("nav_product_war_room"), value: data.products.testing, sub: "testing",      color: "bg-brand-50 text-brand-700",  dot: "bg-brand-400"  },
              { label: t("nav_execution"),       value: data.tasks.pending,     sub: "pending",      color: "bg-blue-50 text-blue-700",    dot: "bg-blue-400"   },
              { label: "Overdue",                value: data.tasks.overdue,     sub: "tasks",
                color: data.tasks.overdue > 0 ? "bg-red-50 text-red-700" : "bg-gray-50 text-gray-600",
                dot:   data.tasks.overdue > 0 ? "bg-red-400" : "bg-gray-300" },
            ].map(k => (
              <div key={k.label} className={`rounded-xl p-3 ${k.color}`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${k.dot}`} />
                  <span className="text-[10px] font-semibold uppercase tracking-wider opacity-70 leading-tight">{k.label}</span>
                </div>
                <div className="text-2xl font-black">{k.value}</div>
                <div className="text-[10px] opacity-60">{k.sub}</div>
              </div>
            ))}
          </div>

          {/* 4 signal panels */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <TrendingUp size={12} className="text-green-600" />
                </div>
                <span className="text-sm font-semibold text-gray-800">{t("dh_top_demand")}</span>
              </div>
              <div className="text-green-500">
                <RankBar items={data.topDemands.slice(0, 6)} colorClass="bg-green-100 text-green-700" empty="No inputs yet" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={12} className="text-red-500" />
                </div>
                <span className="text-sm font-semibold text-gray-800">{t("dh_top_issues")}</span>
              </div>
              <div className="text-red-400">
                <RankBar items={data.topReasons.slice(0, 6)} colorClass="bg-red-100 text-red-600" empty="No reasons logged yet" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Lightbulb size={12} className="text-blue-600" />
                </div>
                <span className="text-sm font-semibold text-gray-800">{t("dh_top_suggestions")}</span>
              </div>
              <div className="text-blue-400">
                <RankBar items={data.topSuggestions.slice(0, 6)} colorClass="bg-blue-100 text-blue-600" empty="No suggestions yet" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <MessageSquare size={12} className="text-purple-600" />
                </div>
                <span className="text-sm font-semibold text-gray-800">{t("dh_signals")}</span>
              </div>
              {!data.creatorSignals.length ? (
                <p className="text-sm text-gray-400 py-4 text-center">No creator signals yet</p>
              ) : (
                <div className="space-y-2.5">
                  {data.creatorSignals.slice(0, 5).map(s => (
                    <div key={s.id} className="border-b border-gray-50 pb-2.5 last:border-0 last:pb-0">
                      <div className="text-xs font-medium text-gray-700 truncate">{s.title}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <ArrowRight size={9} className="text-purple-400 flex-shrink-0" />
                        <span className="text-[10px] text-purple-700 font-semibold truncate">{s.signal}</span>
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{s.views.toLocaleString()} views · {s.creator}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card">
              <h2 className="font-semibold text-gray-800 mb-4 text-sm">{t("dh_demand_chart")}</h2>
              {data.topDemands.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.topDemands.slice(0, 6)} layout="vertical" margin={{ left: 0, right: 20 }}>
                    <XAxis type="number" tick={{ fontSize: 10, fill: "#9ca3af" }} />
                    <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: "#374151" }} width={90} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#c8811f" radius={[0, 4, 4, 0]} name="Count" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-gray-400 py-10 text-center">Submit customer inputs to see demand chart</p>}
            </div>

            <div className="card">
              <h2 className="font-semibold text-gray-800 mb-4 text-sm">Input Trend</h2>
              {data.weeklyTrend.length > 1 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={data.weeklyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                    <XAxis dataKey="week" tick={{ fontSize: 9, fill: "#9ca3af" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#c8811f" strokeWidth={2} dot={{ fill: "#c8811f", r: 3 }} name="Inputs" />
                  </LineChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-gray-400 py-10 text-center">Need data from multiple weeks to show trend</p>}
            </div>
          </div>

          {/* Revenue trend */}
          {data.revenueTrend.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-gray-800 mb-4 text-sm">{t("dh_revenue_trend")}</h2>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={data.revenueTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                  <XAxis dataKey="week" tick={{ fontSize: 9, fill: "#9ca3af" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickFormatter={v => `RM${(v as number / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => [`RM${v.toLocaleString()}`, "Revenue"]} />
                  <Bar dataKey="revenue" fill="#22c55e" radius={[4, 4, 0, 0]} name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Outlet breakdown */}
          {data.outletBreakdown.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Store size={15} className="text-gray-600" />
                <h2 className="font-semibold text-gray-800 text-sm">{t("dh_outlet_breakdown")}</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.outletBreakdown.map(o => (
                  <div key={o.outlet} className="rounded-xl border border-gray-100 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-gray-800 truncate">{o.outlet}</span>
                      <span className="text-[10px] text-gray-400 flex-shrink-0 ml-1">{o.total} {t("dh_inputs")}</span>
                    </div>
                    <div className="space-y-1">
                      {o.top.map(tag => (
                        <div key={tag.tag} className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-400 flex-shrink-0" />
                          <span className="text-[10px] text-gray-600 truncate flex-1">{tag.tag}</span>
                          <span className="text-[10px] text-gray-400">{tag.count}×</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Visual Demand Trends */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <ImageIcon size={14} className="text-purple-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-800 text-sm">Visual Demand Trends</h2>
                  <p className="text-[10px] text-gray-400">Based on photos customers showed your staff</p>
                </div>
              </div>
              {data.imageInputsCount > 0 && (
                <span className="text-[10px] font-semibold bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                  {data.imageInputsCount} photos
                </span>
              )}
            </div>

            {!data.visualTrends.length ? (
              <div className="text-center py-8 space-y-2">
                <div className="w-12 h-12 bg-gray-100 rounded-2xl mx-auto flex items-center justify-center">
                  <ImageIcon size={20} className="text-gray-300" />
                </div>
                <p className="text-sm font-semibold text-gray-400">No visual data yet</p>
                <p className="text-xs text-gray-400">When staff upload customer photos in Customer Input, trends appear here</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {data.visualTrends.map(trend => (
                  <div key={trend.tagKey}
                    className="rounded-2xl border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md hover:border-purple-200 transition-all group"
                    onClick={() => trend.imageUrls.length > 0 && setLightbox({ urls: trend.imageUrls, index: 0, trend })}>
                    {/* Photo grid */}
                    <div className="relative h-36 bg-gray-100 flex overflow-hidden">
                      {trend.imageUrls.length > 0 ? (
                        <>
                          {trend.imageUrls.slice(0, 3).map((url, i) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img key={i} src={url} alt="customer trend photo"
                              className="flex-1 object-cover"
                              style={{ width: `${100 / Math.min(trend.imageUrls.length, 3)}%` }} />
                          ))}
                          {/* Tap to view overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 bg-white/90 rounded-full px-3 py-1.5 flex items-center gap-1.5 text-xs font-bold text-gray-800 transition-all">
                              <ZoomIn size={12} /> Tap to view
                            </div>
                          </div>
                          {/* Count badge */}
                          {trend.imageUrls.length > 1 && (
                            <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                              {trend.imageUrls.length} photos
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex-1 flex items-center justify-center">
                          <ImageIcon size={20} className="text-gray-300" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      {/* Signal */}
                      <div className="text-[10px] font-bold text-purple-600 mb-1.5">{trend.signal}</div>

                      {/* What they want — categories (most important) */}
                      <div className="flex flex-wrap gap-1 mb-1.5">
                        {trend.categories.map(c => (
                          <span key={c} className="text-[11px] bg-brand-50 text-brand-700 px-2 py-0.5 rounded-lg font-bold">{c}</span>
                        ))}
                      </div>

                      {/* Style tags */}
                      <div className="flex flex-wrap gap-1 mb-2">
                        {trend.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded font-medium">{tag}</span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-400">{trend.count} customer{trend.count > 1 ? "s" : ""}</span>
                        <span className="text-[10px] font-black text-gray-600">{trend.score} pts</span>
                      </div>

                      {/* Score bar */}
                      <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full"
                          style={{
                            width: `${trend.score}%`,
                            background: trend.score >= 85 ? "#f59e0b" : trend.score >= 70 ? "#8b5cf6" : "#9ca3af"
                          }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── LIGHTBOX ── */}
            {lightbox && (
              <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col"
                onClick={() => setLightbox(null)}>
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
                  onClick={e => e.stopPropagation()}>
                  <div>
                    <div className="flex flex-wrap gap-1.5 mb-1">
                      {lightbox.trend.categories.map(c => (
                        <span key={c} className="text-sm font-black text-white bg-brand-500 px-3 py-1 rounded-full">{c}</span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {lightbox.trend.tags.map(t => (
                        <span key={t} className="text-xs text-purple-300 bg-purple-900/50 px-2 py-0.5 rounded-full">{t}</span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {lightbox.trend.count} customer{lightbox.trend.count > 1 ? "s" : ""} showed this · {lightbox.trend.signal}
                    </p>
                  </div>
                  <button className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 ml-4"
                    onClick={() => setLightbox(null)}>
                    <X size={18} />
                  </button>
                </div>

                {/* Main image */}
                <div className="flex-1 flex items-center justify-center relative px-12 min-h-0"
                  onClick={e => e.stopPropagation()}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={lightbox.urls[lightbox.index]}
                    alt="Customer photo"
                    className="max-h-full max-w-full object-contain rounded-xl"
                  />

                  {/* Prev */}
                  {lightbox.urls.length > 1 && lightbox.index > 0 && (
                    <button
                      className="absolute left-2 w-10 h-10 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center text-white"
                      onClick={() => setLightbox({ ...lightbox, index: lightbox.index - 1 })}>
                      <ChevronLeft size={20} />
                    </button>
                  )}

                  {/* Next */}
                  {lightbox.urls.length > 1 && lightbox.index < lightbox.urls.length - 1 && (
                    <button
                      className="absolute right-2 w-10 h-10 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center text-white"
                      onClick={() => setLightbox({ ...lightbox, index: lightbox.index + 1 })}>
                      <ChevronRight size={20} />
                    </button>
                  )}
                </div>

                {/* Thumbnail strip */}
                {lightbox.urls.length > 1 && (
                  <div className="flex gap-2 justify-center px-4 py-3 flex-shrink-0"
                    onClick={e => e.stopPropagation()}>
                    {lightbox.urls.map((url, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i} src={url} alt=""
                        onClick={() => setLightbox({ ...lightbox, index: i })}
                        className={`w-14 h-14 object-cover rounded-lg cursor-pointer transition-all ${
                          i === lightbox.index ? "ring-2 ring-brand-400 opacity-100" : "opacity-50 hover:opacity-80"
                        }`}
                      />
                    ))}
                  </div>
                )}

                <p className="text-center text-xs text-gray-600 pb-3">
                  {lightbox.index + 1} / {lightbox.urls.length} · Tap outside to close
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
