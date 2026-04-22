"use client";
import { useState } from "react";
import { useData } from "@/hooks/useData";
import { Database, TrendingUp, AlertTriangle, Lightbulb, ArrowRight, Star, CheckCircle, Loader2 } from "lucide-react";
import { useLang } from "@/context/LangContext";
import { cn } from "@/lib/utils";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import type { TKey } from "@/lib/i18n";

type CreatorItem = { id: string; title: string; views: number; productSignal: string | null; user: { name: string }; platform: string; };
type InputItem = { lookingFor: string; nobuReasons: string; };
type DashData = { topRequests: { item: string; count: number }[] };

const trend = "Travel / Functional Bags are rising. Cabin luggage 20\" requested across Sales + Creator channels. Crossbody options showing up in store feedback and TikTok comments. Core leather goods remain stable cash cow.";
const trend_zh = "旅行/功能包需求上升。20寸登机箱在销售和创作者渠道均有大量需求。斜挎包选项出现在门店反馈和TikTok评论中。核心皮具保持稳定现金牛状态。";
const trend_ms = "Beg Perjalanan sedang meningkat. Lugasi kabin 20\" diminta merentas saluran Jualan + Kreator. Pilihan crossbody muncul dalam maklum balas kedai. Barangan kulit teras kekal stabil.";

type ActionState = { product: boolean; priority: boolean };

function ActionButtons({ label, t }: { label: string; t: (k: TKey) => string }) {
  const [state, setState] = useState<ActionState>({ product: false, priority: false });
  return (
    <div className="flex gap-1.5 mt-2">
      <button onClick={() => setState(s => ({ ...s, product: !s.product }))}
        className={cn("flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg transition-all",
          state.product ? "bg-brand-500 text-white" : "bg-brand-50 text-brand-600 hover:bg-brand-100")}>
        {state.product ? <CheckCircle size={10} /> : <ArrowRight size={10} />}
        {t("sf_move_product")}
      </button>
      <button onClick={() => setState(s => ({ ...s, priority: !s.priority }))}
        className={cn("flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg transition-all",
          state.priority ? "bg-amber-400 text-white" : "bg-amber-50 text-amber-600 hover:bg-amber-100")}>
        <Star size={10} />
        {t("sf_mark_priority")}
      </button>
    </div>
  );
}

export default function DataHub() {
  const { t, lang } = useLang();
  const { data: dashData, loading: dashLoading } = useData<DashData>("/api/dashboard");
  const { data: creator, loading: creatorLoading } = useData<CreatorItem[]>("/api/creator");
  const { data: inputs, loading: inputsLoading } = useData<InputItem[]>("/api/inputs?limit=100");

  const trendText = lang === "zh" ? trend_zh : lang === "ms" ? trend_ms : trend;

  // Aggregate "why didn't buy" from inputs
  const nobCounts: Record<string, number> = {};
  for (const inp of inputs ?? []) {
    try {
      const items: string[] = JSON.parse(inp.nobuReasons ?? "[]");
      for (const item of items) nobCounts[item] = (nobCounts[item] ?? 0) + 1;
    } catch { /* skip */ }
  }
  const topIssues = Object.entries(nobCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([label, count]) => ({ label, count }));

  const topRequests = dashData?.topRequests?.slice(0, 5) ?? [];
  const loading = dashLoading || creatorLoading || inputsLoading;

  const radarData = [
    { subject: "Demand",  A: Math.min(100, (topRequests[0]?.count ?? 0) * 5) },
    { subject: "Creator", A: Math.min(100, (creator?.length ?? 0) * 30) },
    { subject: "Sales",   A: 85 },
    { subject: "Repeat",  A: 68 },
    { subject: "Margin",  A: 80 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">{t("dh_title")}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{t("dh_subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge bg-green-100 text-green-700">{t("dh_auto")}</span>
          <button className="btn-secondary text-xs">{t("dh_export")}</button>
        </div>
      </div>

      {/* Trend */}
      <div className="bg-gradient-to-r from-brand-500 to-brand-400 rounded-2xl p-5 text-white">
        <div className="flex items-start gap-3">
          <Lightbulb size={20} className="flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider opacity-80 mb-1">{t("dh_trend_label")}</div>
            <p className="text-sm leading-relaxed">{trendText}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gray-300" /></div>
      ) : (
        <>
          {/* 3-column */}
          <div className="grid grid-cols-3 gap-4">
            {/* Top Demand */}
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-green-100 flex items-center justify-center">
                  <TrendingUp size={13} className="text-green-600" />
                </div>
                <span className="text-sm font-semibold text-gray-800">{t("dh_top_demand")}</span>
              </div>
              <div className="space-y-3">
                {topRequests.length === 0 && <p className="text-sm text-gray-400">No inputs yet</p>}
                {topRequests.map((r, i) => (
                  <div key={i} className="border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-gray-700">{r.item}</div>
                        <div className="h-1 mt-1 bg-gray-100 rounded-full">
                          <div className="h-full bg-green-400 rounded-full" style={{ width: `${topRequests[0] ? (r.count / topRequests[0].count) * 100 : 0}%` }} />
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-400 flex-shrink-0">{r.count}x</span>
                    </div>
                    <ActionButtons label={r.item} t={t} />
                  </div>
                ))}
              </div>
            </div>

            {/* Creator Signals */}
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-brand-100 flex items-center justify-center">
                  <Database size={13} className="text-brand-600" />
                </div>
                <span className="text-sm font-semibold text-gray-800">{t("dh_signals")}</span>
              </div>
              <div className="space-y-3">
                {(creator ?? []).slice(0, 5).map((v, i) => (
                  <div key={v.id} className="border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-gray-700 truncate">{v.title}</div>
                        <div className="text-[10px] text-gray-400">{v.views.toLocaleString()} views · {v.user.name}</div>
                      </div>
                    </div>
                    {v.productSignal && <ActionButtons label={v.productSignal} t={t} />}
                  </div>
                ))}
                {!creator?.length && <p className="text-sm text-gray-400">No creator content yet</p>}
              </div>
            </div>

            {/* Top Issues */}
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center">
                  <AlertTriangle size={13} className="text-red-500" />
                </div>
                <span className="text-sm font-semibold text-gray-800">{t("dh_top_issues")}</span>
              </div>
              <div className="space-y-3">
                {topIssues.length === 0 && <p className="text-sm text-gray-400">No "didn&apos;t buy" data yet</p>}
                {topIssues.map((issue, i) => (
                  <div key={i} className="border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-gray-700">{issue.label}</div>
                        <div className="h-1 mt-1 bg-gray-100 rounded-full">
                          <div className="h-full bg-red-400 rounded-full" style={{ width: `${topIssues[0] ? (issue.count / topIssues[0].count) * 100 : 0}%` }} />
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-400 flex-shrink-0">{issue.count}x</span>
                    </div>
                    <ActionButtons label={issue.label} t={t} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card">
              <h2 className="font-semibold text-gray-800 mb-4">{t("dh_demand_chart")}</h2>
              {topRequests.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={topRequests.map(r => ({ label: r.item, count: r.count }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                    <XAxis dataKey="label" tick={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#c8811f" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-gray-400 py-8 text-center">Submit customer inputs to see demand chart</p>}
            </div>
            <div className="card">
              <h2 className="font-semibold text-gray-800 mb-4">{t("dh_radar")}</h2>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#f0ede8" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "#6b7280" }} />
                  <Radar dataKey="A" stroke="#c8811f" fill="#c8811f" fillOpacity={0.2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
