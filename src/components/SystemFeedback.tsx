"use client";
import { useData } from "@/hooks/useData";
import { useLang } from "@/context/LangContext";
import { Zap, ArrowRight, Star, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type FbItem = {
  id: string; week: string; outlet: string | null; insight: string; action: string | null;
  status: string; bonus: number; user: { name: string };
};

const statusStyle: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  shipped:     { label: "sf_shipped",    bg: "bg-green-100",  text: "text-green-700",  dot: "bg-green-500"  },
  in_progress: { label: "sf_inprogress", bg: "bg-blue-100",   text: "text-blue-700",   dot: "bg-blue-500"   },
  pending:     { label: "sf_pending",    bg: "bg-amber-100",  text: "text-amber-700",  dot: "bg-amber-400"  },
};

export default function SystemFeedback() {
  const { t } = useLang();
  const { data: items, loading } = useData<FbItem[]>("/api/feedback");

  const bonuses = items?.filter(f => f.bonus > 0) ?? [];

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-2 mb-1">
          <Zap size={16} className="text-amber-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">{t("sf_title")}</span>
        </div>
        <p className="text-sm text-gray-300">{t("sf_subtitle")}</p>
        <p className="text-xs text-gray-500 mt-1">{t("sf_adopted")}</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-gray-300" />
        </div>
      )}

      {!loading && (
        <div className="space-y-2">
          {(items ?? []).map((fb) => {
            const sc = statusStyle[fb.status] ?? statusStyle.pending;
            return (
              <div key={fb.id} className="card flex gap-4 items-start hover:shadow-md transition-shadow">
                <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 text-sm font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {fb.user.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-sm text-gray-900">{fb.user.name}</span>
                    {fb.outlet && <span className="badge bg-gray-100 text-gray-500 text-[10px]">{fb.outlet}</span>}
                    <span className="text-[10px] text-gray-300 ml-auto flex-shrink-0">{fb.week}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="flex-1 bg-blue-50 rounded-xl px-3 py-2">
                      <div className="text-[10px] text-blue-400 font-semibold mb-0.5">{t("sf_insight")}</div>
                      <p className="text-sm text-blue-900 italic">"{fb.insight}"</p>
                    </div>
                    {fb.action && (
                      <>
                        <ArrowRight size={14} className="text-gray-300 flex-shrink-0 mt-3" />
                        <div className="flex-1 bg-green-50 rounded-xl px-3 py-2">
                          <div className="text-[10px] text-green-500 font-semibold mb-0.5">{t("sf_action")}</div>
                          <p className="text-sm text-green-900 font-medium">{fb.action}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <span className={cn("status-pill flex-shrink-0 flex items-center gap-1 mt-0.5", sc.bg, sc.text)}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", sc.dot)} />
                  {t(sc.label as Parameters<typeof t>[0])}
                </span>
              </div>
            );
          })}
          {!items?.length && <p className="text-sm text-gray-400 text-center py-4">No feedback yet</p>}
        </div>
      )}

      {bonuses.length > 0 && (
        <div className="card border-l-4 border-amber-400 space-y-3">
          <div className="flex items-center gap-2">
            <Star size={15} className="text-amber-500" />
            <h3 className="font-semibold text-gray-800">{t("sf_impact_bonus")}</h3>
            <span className="text-xs text-gray-400">— {t("sf_impact_sub")}</span>
          </div>
          <div className="space-y-2">
            {bonuses.map((fb) => (
              <div key={fb.id} className="flex items-center gap-3 bg-amber-50 rounded-xl px-4 py-2.5">
                <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {fb.user.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-sm text-gray-900">{fb.user.name}</span>
                  <p className="text-xs text-gray-500 truncate">"{fb.insight}"</p>
                </div>
                {fb.action && (
                  <>
                    <ArrowRight size={12} className="text-gray-300 flex-shrink-0" />
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-semibold text-gray-700">{fb.action}</div>
                    </div>
                  </>
                )}
                <div className="flex-shrink-0 bg-amber-400 text-white text-xs font-black px-2.5 py-1 rounded-lg">
                  +{fb.bonus}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
