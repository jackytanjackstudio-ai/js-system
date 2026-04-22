"use client";
import { useState } from "react";
import { useData, apiFetch } from "@/hooks/useData";
import { Sword, Target, TrendingUp, XCircle, Eye, CheckCircle2, PlusCircle, Star, Loader2 } from "lucide-react";
import type { TKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useLang } from "@/context/LangContext";

type Product = {
  id: string; name: string; category: string; status: string; stage: string;
  hitRate: number; signalSource: string | null; notes: string | null;
  decisionDate: string | null; tasks: string;
};
type ProductStatus = "Testing" | "Scale" | "Eliminated" | "Watchlist";

function signalWeight(source: string): number {
  const lower = source.toLowerCase();
  if (lower.includes("customer")) return 5;
  if (lower.includes("sales") || lower.includes("store")) return 4;
  if (lower.includes("creator") || lower.includes("tiktok") || lower.includes("viral")) return 3;
  return 1;
}

function SignalStars({ source, t }: { source: string; t: (k: TKey) => string }) {
  const weight = signalWeight(source);
  const label = weight >= 5 ? t("sf_w_customer") : weight >= 4 ? t("sf_w_sales") : weight >= 3 ? t("sf_w_creator") : t("sf_w_internal");
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1,2,3,4,5].map((i) => (
          <Star key={i} size={10} className={i <= weight ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"} />
        ))}
      </div>
      <span className="text-[10px] text-gray-400">{label}</span>
    </div>
  );
}

export default function ProductWarRoom() {
  const { t } = useLang();
  const { data: products, loading, refetch } = useData<Product[]>("/api/products");
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<ProductStatus | "All">("All");
  const [updating, setUpdating] = useState<string | null>(null);

  const statusConfig = {
    Testing:    { labelKey: "status_testing",    color: "text-blue-700",   bg: "bg-blue-100",   icon: Target     },
    Scale:      { labelKey: "status_scale",      color: "text-green-700",  bg: "bg-green-100",  icon: TrendingUp },
    Eliminated: { labelKey: "status_eliminated", color: "text-red-600",    bg: "bg-red-100",    icon: XCircle    },
    Watchlist:  { labelKey: "status_watchlist",  color: "text-amber-700",  bg: "bg-amber-100",  icon: Eye        },
  } as const;

  const list = products ?? [];
  const filtered = filter === "All" ? list : list.filter(p => p.status === filter);
  const sel = list.find(p => p.id === selected);

  async function updateStatus(id: string, status: ProductStatus) {
    setUpdating(id);
    try {
      await apiFetch(`/api/products/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      refetch();
    } finally {
      setUpdating(null);
    }
  }

  const statCounts = (["Testing", "Scale", "Eliminated", "Watchlist"] as ProductStatus[]).map((s) => ({
    status: s,
    count: list.filter(p => p.status === s).length,
    ...statusConfig[s],
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Sword size={20} className="text-brand-500" />
            {t("pw_title")}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">{t("pw_subtitle")}</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <PlusCircle size={14} /> {t("pw_add")}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {statCounts.map((s) => {
          const Icon = s.icon;
          return (
            <button key={s.status}
              onClick={() => setFilter(filter === s.status ? "All" : s.status)}
              className={cn("card flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow", filter === s.status && "ring-2 ring-brand-400")}>
              <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", s.bg)}>
                <Icon size={16} className={s.color} />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{loading ? "…" : s.count}</div>
                <div className="text-xs text-gray-400">{t(s.labelKey)}</div>
              </div>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gray-300" /></div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left text-xs text-gray-400 font-semibold px-5 py-3">{t("pw_product")}</th>
                <th className="text-left text-xs text-gray-400 font-semibold px-4 py-3">{t("pw_category")}</th>
                <th className="text-left text-xs text-gray-400 font-semibold px-4 py-3">{t("pw_stage")}</th>
                <th className="text-left text-xs text-gray-400 font-semibold px-4 py-3">{t("pw_signal")} / {t("sf_signal_weight")}</th>
                <th className="text-left text-xs text-gray-400 font-semibold px-4 py-3">{t("pw_hit_rate")}</th>
                <th className="text-left text-xs text-gray-400 font-semibold px-4 py-3">{t("pw_status")}</th>
                <th className="text-left text-xs text-gray-400 font-semibold px-4 py-3">{t("pw_action")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const sc = statusConfig[p.status as ProductStatus] ?? statusConfig.Watchlist;
                const StatusIcon = sc.icon;
                const tasks: string[] = (() => { try { return JSON.parse(p.tasks); } catch { return []; } })();
                return (
                  <tr key={p.id}
                    className={cn("table-row hover:bg-gray-50 cursor-pointer transition-colors", selected === p.id && "bg-brand-50")}
                    onClick={() => setSelected(selected === p.id ? null : p.id)}>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-sm text-gray-900">{p.name}</div>
                      {p.decisionDate && <div className="text-[10px] text-gray-400">{t("pw_decision")} {p.decisionDate}</div>}
                    </td>
                    <td className="px-4 py-3.5"><span className="badge bg-gray-100 text-gray-600">{p.category}</span></td>
                    <td className="px-4 py-3.5">
                      <span className={`badge ${p.stage === "Cannonball" ? "bg-green-100 text-green-700" : "bg-blue-50 text-blue-600"}`}>
                        {p.stage}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-xs text-gray-600 mb-1">{p.signalSource ?? "—"}</div>
                      {p.signalSource && <SignalStars source={p.signalSource} t={t} />}
                    </td>
                    <td className="px-4 py-3.5">
                      {p.hitRate > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${p.hitRate >= 70 ? "bg-green-500" : p.hitRate >= 40 ? "bg-amber-500" : "bg-red-400"}`}
                              style={{ width: `${p.hitRate}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-gray-700">{p.hitRate}%</span>
                        </div>
                      ) : <span className="text-xs text-gray-300">{t("pw_no_data")}</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn("status-pill flex items-center gap-1 w-fit", sc.bg, sc.color)}>
                        {updating === p.id ? <Loader2 size={11} className="animate-spin" /> : <StatusIcon size={11} />}
                        {t(sc.labelKey)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-1.5 flex-wrap">
                        {(["Testing", "Scale", "Watchlist", "Eliminated"] as ProductStatus[])
                          .filter(s => s !== p.status)
                          .map(s => (
                            <button key={s}
                              onClick={(e) => { e.stopPropagation(); updateStatus(p.id, s); }}
                              className={cn("text-[10px] font-semibold px-2 py-1 rounded-lg transition-colors", statusConfig[s].bg, statusConfig[s].color)}>
                              → {t(statusConfig[s].labelKey)}
                            </button>
                          ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {sel && (
        <div className="card space-y-4 border-2 border-brand-200">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900">{sel.name}</h2>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
          {sel.notes && <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl italic">"{sel.notes}"</p>}
          <div>
            <div className="section-title">{t("pw_tasks")}</div>
            <div className="space-y-1.5">
              {(() => { try { return JSON.parse(sel.tasks) as string[]; } catch { return [] as string[]; } })().map((task, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle2 size={14} className="text-green-500" /> {task}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
