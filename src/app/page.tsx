"use client";
import { useLang } from "@/context/LangContext";
import { useData } from "@/hooks/useData";
import SystemFeedback from "@/components/SystemFeedback";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from "recharts";
import {
  TrendingUp, AlertTriangle, Users, ShoppingBag, RefreshCw,
  Target, ArrowUpRight, Loader2, Zap, Package, Brain,
} from "lucide-react";

type DashData = {
  topRequests: { item: string; count: number }[];
  topProducts: { name: string; count: number }[];
  weeklyRevenue: { week: string; revenue: number }[];
  stats: {
    totalInputs: number; pendingTasks: number; overdueTasks: number;
    activeProducts: number; watchlistProducts: number; testingProducts: number; scaleProducts: number;
  };
};

type SignalData = {
  topProducts: { name: string; qty: number; revenue: number }[];
  whyBuy: { reason: string; count: number }[];
  whyUseCase: { useCase: string; count: number }[];
  productInsights: {
    refId: string; name: string; totalSales: number;
    totalRevenue: number; totalReasons: number;
    topReasons: { reason: string; count: number }[];
  }[];
  totalUnits: number;
  totalEntries: number;
};

const REASON_COLORS = [
  "#c8811f", "#e8a43a", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444", "#06b6d4", "#f59e0b",
];

export default function Dashboard() {
  const { t } = useLang();
  const { data, loading }           = useData<DashData>("/api/dashboard");
  const { data: signal, loading: sl } = useData<SignalData>("/api/data-hub/signal");

  const stats = data?.stats;

  const kpis = [
    { labelKey: "dash_weekly_rev",      value: `${data?.weeklyRevenue?.reduce((s, r) => s + r.revenue, 0)?.toLocaleString("en-MY", { style: "currency", currency: "MYR", maximumFractionDigits: 0 }) ?? "–"}`, icon: TrendingUp  },
    { labelKey: "dash_testing",         value: stats ? `${stats.testingProducts}` : "–",  icon: ShoppingBag },
    { labelKey: "nav_product_war_room", value: stats ? `${stats.scaleProducts} Scale` : "–", icon: Target },
    { labelKey: "dash_active_cust",     value: stats ? `${stats.totalInputs} inputs` : "–", icon: Users },
    { labelKey: "nav_execution",        value: stats ? `${stats.pendingTasks} pending` : "–", icon: RefreshCw },
  ];

  const maxBuy = signal?.whyBuy?.[0]?.count ?? 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">{t("dash_title")}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{t("dash_subtitle")}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          {t("dash_live")}
        </span>
      </div>

      {(stats?.overdueTasks ?? 0) > 0 && (
        <div className="alert-warning">
          <AlertTriangle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-gray-700">
            {stats?.overdueTasks} overdue task{(stats?.overdueTasks ?? 0) > 1 ? "s" : ""} — check Execution board
          </span>
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
        {kpis.map((k) => (
          <div key={k.labelKey} className="stat-card">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400">{t(k.labelKey as Parameters<typeof t>[0])}</span>
              <k.icon size={14} className="text-gray-300" />
            </div>
            {loading
              ? <Loader2 size={20} className="animate-spin text-gray-300 my-1" />
              : <div className="text-xl font-bold text-gray-900">{k.value}</div>
            }
            <div className="flex items-center gap-1 text-xs font-medium text-green-600">
              <ArrowUpRight size={12} />
              Live data
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">{t("dash_rev_chart")}</h2>
            <span className="text-xs text-gray-400">{t("dash_last_7")}</span>
          </div>
          {loading ? (
            <div className="h-[200px] flex items-center justify-center">
              <Loader2 className="animate-spin text-gray-300" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data?.weeklyRevenue ?? []} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c8811f" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#c8811f" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <YAxis tickFormatter={(v) => `${v / 1000}K`} tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <Tooltip formatter={(v: number) => `RM ${v.toLocaleString()}`} />
                <Area type="monotone" dataKey="revenue" stroke="#c8811f" strokeWidth={2} fill="url(#rev)" name="Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">{t("dash_top_products")}</h2>
          {loading ? (
            <div className="flex items-center justify-center h-32"><Loader2 className="animate-spin text-gray-300" /></div>
          ) : (
            <div className="space-y-3">
              {(data?.topProducts ?? []).slice(0, 5).map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{p.name}</div>
                    <div className="text-xs text-gray-400">{p.count}× in reports</div>
                  </div>
                </div>
              ))}
              {!data?.topProducts?.length && <p className="text-sm text-gray-400">No sales reports yet</p>}
            </div>
          )}
        </div>
      </div>

      {/* Top requests bar chart */}
      {(data?.topRequests?.length ?? 0) > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">{t("dash_top_requests")}</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data!.topRequests.map(r => ({ label: r.item, count: r.count }))} layout="vertical" margin={{ left: 0, right: 30, top: 0, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 10, fill: "#9ca3af" }} />
              <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: "#374151" }} width={155} />
              <Tooltip />
              <Bar dataKey="count" fill="#c8811f" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── DATA HUB SIGNAL LAYER ────────────────────────────────────────────── */}

      {(signal?.totalEntries ?? 0) > 0 && (
        <>
          {/* Signal Header */}
          <div className="flex items-center gap-2 pt-2">
            <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-sm">Data Hub Signal</h2>
              <p className="text-xs text-gray-400">
                {signal!.totalUnits.toLocaleString()} units tracked · {signal!.totalEntries} data points
              </p>
            </div>
          </div>

          {/* Row: Top Products + Why People Buy */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* 🔥 Top Products (Quick Log) */}
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Package size={15} className="text-brand-500" />
                <h3 className="font-semibold text-gray-800 text-sm">Top Products</h3>
                <span className="ml-auto text-[10px] text-gray-400 font-semibold uppercase tracking-wider">by units sold</span>
              </div>
              {sl ? (
                <div className="flex justify-center py-6"><Loader2 className="animate-spin text-gray-300" /></div>
              ) : (signal?.topProducts ?? []).length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Log sales via Quick Log to see data</p>
              ) : (
                <div className="space-y-2.5">
                  {(signal!.topProducts).slice(0, 8).map((p, i) => {
                    const maxQty = signal!.topProducts[0].qty;
                    const pct = Math.round((p.qty / maxQty) * 100);
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-700 truncate max-w-[180px]">{p.name}</span>
                          <span className="text-xs font-bold text-brand-600 flex-shrink-0 ml-2">{p.qty} units</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-400 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 🔥 Why People Buy */}
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Brain size={15} className="text-purple-500" />
                <h3 className="font-semibold text-gray-800 text-sm">Why People Buy</h3>
                <span className="ml-auto text-[10px] text-gray-400 font-semibold uppercase tracking-wider">buying triggers</span>
              </div>
              {sl ? (
                <div className="flex justify-center py-6"><Loader2 className="animate-spin text-gray-300" /></div>
              ) : (signal?.whyBuy ?? []).length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Log sales via Quick Log to see triggers</p>
              ) : (
                <div className="space-y-2.5">
                  {(signal!.whyBuy).map((r, i) => {
                    const pct = Math.round((r.count / maxBuy) * 100);
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-700">{r.reason}</span>
                          <span className="text-xs font-bold text-purple-600">{r.count}×</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, backgroundColor: REASON_COLORS[i % REASON_COLORS.length] }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 🔥 Product Insights */}
          {(signal?.productInsights ?? []).length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Zap size={15} className="text-amber-500" />
                <h3 className="font-semibold text-gray-800 text-sm">Product Insights</h3>
                <span className="text-[10px] text-gray-400 ml-auto font-semibold uppercase tracking-wider">sales + top reasons</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(signal!.productInsights).slice(0, 6).map((p) => (
                  <div key={p.refId} className="bg-gray-50 rounded-xl p-3 space-y-2">
                    <div className="font-semibold text-gray-800 text-xs truncate">{p.name}</div>
                    <div className="flex gap-2">
                      <div className="text-center">
                        <div className="text-base font-black text-brand-600">{p.totalSales}</div>
                        <div className="text-[10px] text-gray-400">units</div>
                      </div>
                      {p.totalRevenue > 0 && (
                        <div className="text-center">
                          <div className="text-base font-black text-green-600">
                            RM{p.totalRevenue >= 1000 ? `${(p.totalRevenue / 1000).toFixed(1)}K` : p.totalRevenue.toFixed(0)}
                          </div>
                          <div className="text-[10px] text-gray-400">revenue</div>
                        </div>
                      )}
                    </div>
                    {p.topReasons.length > 0 && (
                      <div className="space-y-0.5">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Top reasons</div>
                        {p.topReasons.map((r, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-[11px] text-gray-600">{r.reason}</span>
                            <span className="text-[10px] font-bold text-gray-500">{r.count}×</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Use Case Breakdown */}
          {(signal?.whyUseCase ?? []).length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-800 text-sm mb-3">Use Case Breakdown</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart
                  data={signal!.whyUseCase.map(u => ({ label: u.useCase, count: u.count }))}
                  margin={{ top: 0, right: 10, bottom: 0, left: -10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#374151" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Logs">
                    {signal!.whyUseCase.map((_, i) => (
                      <Cell key={i} fill={REASON_COLORS[i % REASON_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      {/* System Feedback */}
      <SystemFeedback />
    </div>
  );
}
