"use client";
import { useData } from "@/hooks/useData";
import { Trophy, Star, TrendingUp, Users, Zap, Heart, ArrowRight, Loader2, MessageSquare } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useLang } from "@/context/LangContext";

type LBEntry = { userId: string; name: string; role: string; total: number; breakdown: Record<string, number> };
type ImpactBonus = { id: string; insight: string; action: string | null; bonus: number; user: { name: string }; week: string };
type RewardsData = { leaderboard: LBEntry[]; impactBonuses: ImpactBonus[] };

const COLORS = ["#f59e0b", "#9ca3af", "#c8811f", "#6b7280", "#6b7280", "#6b7280", "#6b7280"];

export default function Rewards() {
  const { t } = useLang();
  const { data, loading } = useData<RewardsData>("/api/rewards");

  const categories = [
    { key: "customer_input", labelKey: "nav_customer_input",   icon: MessageSquare, color: "text-amber-600",  bg: "bg-amber-100",  descKey: "rw_ci_desc"      },
    { key: "sales",          labelKey: "nav_sales_report",     icon: TrendingUp,    color: "text-green-600",  bg: "bg-green-100",  descKey: "rw_sales_desc"   },
    { key: "creator",        labelKey: "nav_creator_insight",  icon: Star,          color: "text-purple-600", bg: "bg-purple-100", descKey: "rw_creator_desc" },
    { key: "product",        labelKey: "nav_product_war_room", icon: Zap,           color: "text-brand-600",  bg: "bg-brand-100",  descKey: "rw_product_desc" },
    { key: "execution",      labelKey: "nav_execution",        icon: Users,         color: "text-blue-600",   bg: "bg-blue-100",   descKey: "rw_exec_desc"    },
    { key: "culture",        labelKey: "nav_rewards",          icon: Heart,         color: "text-red-600",    bg: "bg-red-100",    descKey: "rw_culture_desc" },
  ] as const;

  const lb = data?.leaderboard ?? [];
  const top3 = lb.slice(0, 3);
  const impactBonuses = data?.impactBonuses ?? [];

  const chartData = lb.slice(0, 5).map(p => ({
    name: p.name.split(" ")[0],
    ...p.breakdown,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Trophy size={20} className="text-amber-500" />
            {t("rw_title")}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">{t("rw_subtitle")}</p>
        </div>
        <span className="badge bg-amber-100 text-amber-700 text-sm px-3 py-1">{t("rw_reset")}</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gray-300" /></div>
      ) : (
        <>
          {/* Top 3 podium */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {top3.map((p, i) => (
              <div key={p.userId} className={`card text-center relative overflow-hidden ${i === 0 ? "border-2 border-amber-400 shadow-lg" : ""}`}>
                {i === 0 && <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-yellow-300" />}
                <div className="text-3xl font-black mb-1" style={{ color: COLORS[i] }}>#{i + 1}</div>
                <div className="w-12 h-12 rounded-full bg-gray-100 mx-auto mb-2 flex items-center justify-center text-xl font-bold text-gray-600">
                  {p.name[0]}
                </div>
                <div className="font-bold text-gray-900">{p.name}</div>
                <div className="text-xs text-gray-400 mb-3 capitalize">{p.role}</div>
                <div className="text-3xl font-black text-brand-600 mb-1">{p.total}</div>
                <div className="text-xs text-gray-400">{t("rw_points")}</div>
                <div className="mt-3 space-y-1.5">
                  {categories.map((cat) => (
                    <div key={cat.key} className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400 w-14 text-right">{t(cat.labelKey)}</span>
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-400 rounded-full"
                          style={{ width: `${((p.breakdown[cat.key] ?? 0) / Math.max(p.total, 1)) * 100}%` }} />
                      </div>
                      <span className="text-[10px] text-gray-400 w-6">{p.breakdown[cat.key] ?? 0}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card">
              <h2 className="font-semibold text-gray-800 mb-3">{t("rw_full_lb")}</h2>
              <div className="space-y-2">
                {lb.map((p, i) => (
                  <div key={p.userId} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                    <span className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-black"
                      style={{ background: (COLORS[i] ?? "#6b7280") + "22", color: COLORS[i] ?? "#6b7280" }}>
                      {i + 1}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">
                      {p.name[0]}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-800">{p.name}</div>
                      <div className="text-[10px] text-gray-400 capitalize">{p.role}</div>
                    </div>
                    <span className="font-black text-brand-600">{p.total}</span>
                  </div>
                ))}
                {!lb.length && <p className="text-sm text-gray-400 text-center py-4">No reward points yet</p>}
              </div>
            </div>

            <div className="card">
              <h2 className="font-semibold text-gray-800 mb-4">{t("rw_breakdown")}</h2>
              {chartData.length > 0 && (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 20 }}>
                    <XAxis type="number" tick={{ fontSize: 10, fill: "#9ca3af" }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#374151" }} width={60} />
                    <Tooltip />
                    {categories.map((c, i) => (
                      <Bar key={c.key} dataKey={c.key} stackId="a"
                        fill={["#22c55e", "#a855f7", "#c8811f", "#3b82f6", "#ef4444"][i]}
                        name={t(c.labelKey)} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                {categories.map((c, i) => (
                  <div key={c.key} className="flex items-center gap-1 text-[10px] text-gray-500">
                    <span className="w-2 h-2 rounded-full" style={{ background: ["#22c55e","#a855f7","#c8811f","#3b82f6","#ef4444"][i] }} />
                    {t(c.labelKey)}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* How to earn */}
          <div className="card">
            <h2 className="font-semibold text-gray-800 mb-4">{t("rw_how")}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <div key={cat.key} className="rounded-xl border border-gray-100 p-3 space-y-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${cat.bg}`}>
                      <Icon size={14} className={cat.color} />
                    </div>
                    <div className="text-xs font-bold text-gray-800">{t(cat.labelKey)}</div>
                    <div className="text-[10px] text-gray-400">{t(cat.descKey)}</div>
                    <div className="text-[10px] space-y-0.5 text-gray-600">
                      {cat.key === "sales"     && <><div>+1 / RM100</div><div>Insight: +5</div><div>Hit: +20</div></>}
                      {cat.key === "creator"   && <><div>Post: +5</div><div>Viral: +20~80</div><div>Sales: +30</div></>}
                      {cat.key === "product"   && <><div>Test: +30</div><div>Cannon: +80</div><div>Top: +150</div></>}
                      {cat.key === "execution" && <><div>Done: +10</div><div>Early: +20</div><div>Init: +30</div></>}
                      {cat.key === "culture"   && <><div>Pro: +10</div><div>Acc: +10</div><div>Int: +20</div></>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Impact Bonuses */}
          {impactBonuses.length > 0 && (
            <div className="card border-2 border-amber-200 bg-amber-50/30 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-400 flex items-center justify-center">
                  <Zap size={16} className="text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">{t("sf_impact_bonus")} 🔥</h2>
                  <p className="text-xs text-gray-500">{t("sf_impact_sub")}</p>
                </div>
              </div>
              <div className="space-y-3">
                {impactBonuses.map((ib) => (
                  <div key={ib.id} className="bg-white rounded-2xl p-4 flex items-start gap-4 shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 font-black text-base flex items-center justify-center flex-shrink-0">
                      {ib.user.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-900">{ib.user.name}</span>
                        <span className="text-[10px] text-gray-400 ml-auto">{ib.week}</span>
                      </div>
                      <p className="text-sm text-gray-600 italic mb-2">"{ib.insight}"</p>
                      {ib.action && (
                        <div className="flex items-center gap-2 text-xs">
                          <ArrowRight size={12} className="text-gray-300" />
                          <span className="font-semibold text-green-700">{ib.action}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-amber-400 flex items-center justify-center shadow-md">
                      <div className="text-center">
                        <div className="text-white font-black text-lg leading-none">+{ib.bonus}</div>
                        <div className="text-amber-100 text-[9px] font-semibold">BONUS</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-amber-100 rounded-xl p-3 text-xs text-amber-800 font-semibold">
                💡 Your insight → Product hit → Automatic Impact Bonus. No approval needed.
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
