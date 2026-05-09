"use client";
import { useState } from "react";
import { useData } from "@/hooks/useData";
import {
  Trophy, Medal, Store, ChevronDown, ChevronUp, Loader2,
  TrendingUp, Zap, MessageSquare, Star, Calendar, Target, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

type StaffEntry = {
  userId: string; name: string; role: string;
  outletId: string; outletName: string;
  mposScore: number; osScore: number; finalScore: number;
  breakdown: { customerInput: number; quickLog: number; content: number; review: number; campaign: number };
  rawCounts:  { customerInput: number; quickLog: number; content: number; review: number; campaign: number };
};
type StoreEntry = {
  outletId: string; outletName: string;
  mposScore: number; mposPct: number;
  avgFinalScore: number; avgOsScore: number; staffCount: number;
};
type StrategyInfo = {
  id: string; name: string; startDate: string; endDate: string;
  mposWeight: number; osWeights: string;
};
type LBData = {
  strategy: StrategyInfo | null;
  weights: { customer_input: number; content: number; review: number; campaign: number };
  staffRanking: StaffEntry[];
  storeRanking: StoreEntry[];
  strategies: { id: string; name: string; startDate: string; endDate: string; isActive: boolean }[];
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-MY", { day: "numeric", month: "short" });
}

function ScoreBar({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-[11px] text-gray-500">{icon} {label}</span>
        <span className="text-[11px] font-bold text-gray-700">{value}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-2xl">🥇</span>;
  if (rank === 2) return <span className="text-2xl">🥈</span>;
  if (rank === 3) return <span className="text-2xl">🥉</span>;
  return <span className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">#{rank}</span>;
}

export default function LeaderboardPage() {
  const [periodId, setPeriodId]   = useState<string>("");
  const [tab, setTab]             = useState<"staff" | "store">("staff");
  const [expandedId, setExpanded] = useState<string | null>(null);

  const url = `/api/leaderboard${periodId ? `?periodId=${periodId}` : ""}`;
  const { data, loading } = useData<LBData>(url, [periodId]);

  const strategy = data?.strategy;
  const weights  = data?.weights;

  return (
    <div className="p-6 space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Trophy size={20} className="text-amber-500" />
            Leaderboard
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {strategy
              ? `${strategy.name} · ${fmtDate(strategy.startDate)} – ${fmtDate(strategy.endDate)}`
              : "No active strategy"}
          </p>
        </div>

        {/* Period selector */}
        {(data?.strategies?.length ?? 0) > 0 && (
          <select
            value={periodId}
            onChange={e => setPeriodId(e.target.value)}
            className="input text-sm py-2 pr-8"
          >
            <option value="">Latest Active</option>
            {data!.strategies.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Strategy info bar */}
      {strategy && weights && (
        <div className="bg-brand-50 border border-brand-100 rounded-xl px-4 py-3 flex flex-wrap gap-4">
          <div className="flex items-center gap-1.5 text-xs">
            <Target size={12} className="text-brand-500" />
            <span className="text-gray-600">MPOS</span>
            <span className="font-bold text-brand-700">{strategy.mposWeight}%</span>
          </div>
          {(["customer_input", "content", "review", "campaign"] as const).map(k => (
            <div key={k} className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500 capitalize">{k === "customer_input" ? "Customer Log" : k.replace("_", " ")}</span>
              <span className="font-bold text-brand-700">{weights[k]}%</span>
            </div>
          ))}
        </div>
      )}

      {/* Tab switcher */}
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1 w-fit">
        <button onClick={() => setTab("staff")}
          className={cn("flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
            tab === "staff" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}>
          <Trophy size={14} /> Staff Ranking
        </button>
        <button onClick={() => setTab("store")}
          className={cn("flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
            tab === "store" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}>
          <Store size={14} /> Store Ranking
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-gray-300" /></div>
      ) : !strategy ? (
        <div className="card text-center py-14">
          <Calendar size={32} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium text-sm">No strategy configured yet</p>
          <p className="text-gray-400 text-xs mt-1">Ask your admin to create a strategy in Strategy Setup</p>
        </div>
      ) : tab === "staff" ? (
        /* ── Staff Ranking ── */
        <div className="space-y-3">
          {(data?.staffRanking ?? []).length === 0 && (
            <div className="card text-center py-10">
              <p className="text-gray-400 text-sm">No staff data for this period</p>
            </div>
          )}
          {(data?.staffRanking ?? []).map((s, i) => {
            const isOpen = expandedId === s.userId;
            return (
              <div key={s.userId} className={`card border-2 transition-all ${i < 3 ? "border-amber-100" : "border-gray-100"}`}>
                <button className="w-full flex items-center gap-3 text-left"
                  onClick={() => setExpanded(isOpen ? null : s.userId)}>
                  <div className="flex-shrink-0 flex items-center justify-center w-9">
                    <RankBadge rank={i + 1} />
                  </div>
                  <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center font-bold text-brand-600 flex-shrink-0">
                    {s.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900">{s.name}</div>
                    <div className="text-xs text-gray-400">{s.outletName} · <span className="capitalize">{s.role}</span></div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-2xl font-black text-brand-600">{s.finalScore}</div>
                    <div className="text-[10px] text-gray-400">Final Score</div>
                  </div>
                  <div className="flex-shrink-0">
                    {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                    {/* Score breakdown */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <div className="text-xl font-black text-blue-600">{s.mposScore}</div>
                        <div className="text-[10px] text-gray-400">MPOS Score</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <div className="text-xl font-black text-purple-600">{s.osScore}</div>
                        <div className="text-[10px] text-gray-400">OS Score</div>
                      </div>
                    </div>

                    {/* OS breakdown bars */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">OS Breakdown</p>
                      <ScoreBar label="Customer Log" value={s.breakdown.customerInput} color="bg-orange-400"
                        icon={<Users size={10} />} />
                      <ScoreBar label="Content" value={s.breakdown.content} color="bg-purple-400"
                        icon={<Zap size={10} />} />
                      <ScoreBar label="Review" value={s.breakdown.review} color="bg-green-400"
                        icon={<Star size={10} />} />
                      <ScoreBar label="Campaign" value={s.breakdown.campaign} color="bg-blue-400"
                        icon={<TrendingUp size={10} />} />
                    </div>

                    {/* Raw counts */}
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {[
                        { label: "Cust. Log",  val: s.rawCounts.customerInput },
                        { label: "Content",    val: s.rawCounts.content  },
                        { label: "Reviews",    val: s.rawCounts.review   },
                        { label: "Tasks",      val: s.rawCounts.campaign },
                      ].map(r => (
                        <div key={r.label} className="bg-gray-50 rounded-lg p-2">
                          <div className="text-sm font-bold text-gray-800">{r.val}</div>
                          <div className="text-[10px] text-gray-400">{r.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Store Ranking ── */
        <div className="space-y-3">
          {(data?.storeRanking ?? []).length === 0 && (
            <div className="card text-center py-10">
              <p className="text-gray-400 text-sm">No store data for this period</p>
            </div>
          )}
          {(data?.storeRanking ?? []).map((s, i) => {
            const isOpen = expandedId === s.outletId;
            return (
              <div key={s.outletId} className={`card border-2 ${i < 3 ? "border-amber-100" : "border-gray-100"}`}>
                <button className="w-full flex items-center gap-3 text-left"
                  onClick={() => setExpanded(isOpen ? null : s.outletId)}>
                  <div className="flex-shrink-0 flex items-center justify-center w-9">
                    <RankBadge rank={i + 1} />
                  </div>
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Store size={18} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900">{s.outletName}</div>
                    <div className="text-xs text-gray-400">{s.staffCount} staff</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-2xl font-black text-brand-600">{s.avgFinalScore}</div>
                    <div className="text-[10px] text-gray-400">Avg Score</div>
                  </div>
                  {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>

                {isOpen && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-gray-50 rounded-xl p-3">
                        <div className="text-xl font-black text-blue-600">{s.mposScore}</div>
                        <div className="text-[10px] text-gray-400">MPOS Score</div>
                        <div className="text-[11px] text-gray-500 mt-0.5">Achievement: {s.mposPct}%</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3">
                        <div className="text-xl font-black text-purple-600">{s.avgOsScore}</div>
                        <div className="text-[10px] text-gray-400">Avg OS Score</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3">
                        <div className="text-xl font-black text-brand-600">{s.avgFinalScore}</div>
                        <div className="text-[10px] text-gray-400">Avg Final</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
