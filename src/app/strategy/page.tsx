"use client";
import { useState, useEffect } from "react";
import { useData, apiFetch } from "@/hooks/useData";
import { useAuth } from "@/context/AuthContext";
import {
  Sliders, Plus, Check, X, Loader2, AlertCircle, Calendar,
  ChevronDown, ChevronUp, Target, Save,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Strategy = {
  id: string; name: string; startDate: string; endDate: string;
  mposWeight: number; osWeights: string; createdBy: string;
  isActive: boolean; createdAt: string;
  mposScores: { outletId: string; outletName: string; achievementPercent: number; score: number }[];
};
type Outlet = { id: string; name: string };

function daysBetween(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });
}

const DEFAULT_OS = { customer_input: 20, quick_log: 20, content: 20, review: 20, campaign: 20 };

export default function StrategyPage() {
  const { user } = useAuth();
  const { data: strategies, loading, refetch } = useData<Strategy[]>("/api/strategies");
  const { data: outlets } = useData<Outlet[]>("/api/outlets");

  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded]     = useState<string | null>(null);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");

  // Create form
  const [form, setForm] = useState({
    name: "", startDate: "", endDate: "",
    mposWeight: 50,
    osWeights: { ...DEFAULT_OS },
  });

  // MPOS input form per strategy
  const [mposInput, setMposInput] = useState<Record<string, string>>({});
  const [mposSaving, setMposSaving] = useState<Record<string, boolean>>({});

  const osSum = Object.values(form.osWeights).reduce((s, n) => s + n, 0);
  const duration = form.startDate && form.endDate ? daysBetween(form.startDate, form.endDate) : 0;
  const canCreate = form.name.trim() && form.startDate && form.endDate && duration >= 7 && Math.abs(osSum - 100) < 1;

  const isAdmin = ["admin", "manager"].includes(user?.role ?? "");

  type OsKey = keyof typeof DEFAULT_OS;
  function setOsW(key: OsKey, val: number) {
    setForm(f => ({ ...f, osWeights: { ...f.osWeights, [key]: val } }));
  }

  async function handleCreate() {
    setError("");
    setSaving(true);
    try {
      await apiFetch("/api/strategies", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          startDate: form.startDate,
          endDate: form.endDate,
          mposWeight: form.mposWeight,
          osWeights: form.osWeights,
        }),
      });
      setShowCreate(false);
      setForm({ name: "", startDate: "", endDate: "", mposWeight: 50, osWeights: { ...DEFAULT_OS } });
      refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create strategy");
    } finally {
      setSaving(false);
    }
  }

  async function saveMpos(strategy: Strategy, outletId: string, outletName: string) {
    const key = `${strategy.id}-${outletId}`;
    const pct = parseFloat(mposInput[key] ?? "");
    if (isNaN(pct) || pct < 0) return;
    setMposSaving(prev => ({ ...prev, [key]: true }));
    try {
      await apiFetch("/api/mpos-scores", {
        method: "POST",
        body: JSON.stringify({ outletId, outletName, periodId: strategy.id, achievementPercent: pct }),
      });
      refetch();
    } finally {
      setMposSaving(prev => ({ ...prev, [key]: false }));
    }
  }

  const list = strategies ?? [];

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
        <AlertCircle size={32} className="text-gray-300" />
        <p className="text-gray-500 font-medium">Admin / Manager access only</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Sliders size={18} className="text-brand-500" />
            Strategy Setup
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Configure incentive weights and scoring periods</p>
        </div>
        <button onClick={() => setShowCreate(v => !v)} className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
          <Plus size={14} />
          New Strategy
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="card border-2 border-brand-200 space-y-5">
          <h2 className="font-semibold text-gray-900">Create New Strategy</h2>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-sm text-red-700">
              <AlertCircle size={14} />{error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Name</label>
            <input className="input w-full" placeholder="e.g. March Campaign Push"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>

          {/* Period */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Start Date</label>
              <input type="date" className="input w-full text-sm"
                value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">End Date</label>
              <input type="date" className="input w-full text-sm"
                value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
            </div>
          </div>
          {form.startDate && form.endDate && (
            <p className={`text-xs font-semibold ${duration >= 7 ? "text-green-600" : "text-red-500"}`}>
              Duration: {duration} days {duration < 7 ? "⚠ Minimum 7 days" : "✓"}
            </p>
          )}

          {/* MPOS Weight */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              MPOS Weight: <span className="text-brand-600">{form.mposWeight}%</span>
              <span className="ml-2 text-gray-400 font-normal">OS Weight: {100 - form.mposWeight}%</span>
            </label>
            <input type="range" min={0} max={100} step={5}
              value={form.mposWeight}
              onChange={e => setForm(f => ({ ...f, mposWeight: parseInt(e.target.value) }))}
              className="w-full accent-brand-500" />
            <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
              <span>0% MPOS</span><span>50/50</span><span>100% MPOS</span>
            </div>
          </div>

          {/* OS Weights */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              OS Weights
              <span className={`ml-2 font-bold ${Math.abs(osSum - 100) < 1 ? "text-green-600" : "text-red-500"}`}>
                (Total: {osSum}/100)
              </span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(["customer_input", "quick_log", "content", "review", "campaign"] as const).map(key => {
                const labels: Record<string, string> = {
                  customer_input: "Customer Input",
                  quick_log:      "Quick Log",
                  content:        "Content",
                  review:         "Review",
                  campaign:       "Campaign",
                };
                return (
                  <div key={key} className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-gray-700">{labels[key]}</span>
                      <span className="text-xs font-bold text-brand-600">{form.osWeights[key]}%</span>
                    </div>
                    <input type="range" min={0} max={100} step={5}
                      value={form.osWeights[key]}
                      onChange={e => setOsW(key, parseInt(e.target.value))}
                      className="w-full accent-brand-500" />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => { setShowCreate(false); setError(""); }}
              className="btn-secondary flex-1 py-2.5">Cancel</button>
            <button onClick={handleCreate} disabled={!canCreate || saving}
              className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save Strategy
            </button>
          </div>
        </div>
      )}

      {/* Strategy List */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gray-300" /></div>
      ) : list.length === 0 ? (
        <div className="card text-center py-12">
          <Sliders size={28} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 text-sm font-medium">No strategies yet</p>
          <p className="text-gray-400 text-xs mt-1">Create your first incentive strategy above</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map(s => {
            const osW: Record<string, number> = (() => { try { return JSON.parse(s.osWeights); } catch { return {}; } })();
            const days = daysBetween(s.startDate, s.endDate);
            const isOpen = expanded === s.id;
            const today = new Date().toISOString().slice(0, 10);
            const isLive = today >= s.startDate && today <= s.endDate;
            const isPast = today > s.endDate;

            return (
              <div key={s.id} className={`card border-2 ${isLive ? "border-brand-200" : "border-gray-100"}`}>
                {/* Strategy header */}
                <button className="w-full flex items-start justify-between gap-3 text-left"
                  onClick={() => setExpanded(isOpen ? null : s.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-900">{s.name}</span>
                      {isLive && <span className="badge bg-green-100 text-green-700 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Live</span>}
                      {isPast && <span className="badge bg-gray-100 text-gray-500">Ended</span>}
                      {!isLive && !isPast && <span className="badge bg-blue-50 text-blue-600">Upcoming</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Calendar size={10} /> {fmtDate(s.startDate)} → {fmtDate(s.endDate)}</span>
                      <span>{days} days</span>
                    </div>
                    <div className="flex gap-2 mt-1.5 flex-wrap">
                      <span className="badge bg-brand-50 text-brand-700">MPOS {s.mposWeight}%</span>
                      {Object.entries(osW).map(([k, v]) => (
                        <span key={k} className="badge bg-gray-100 text-gray-600">{k.replace(/_/g, " ")} {v}%</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex-shrink-0 mt-1">
                    {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                </button>

                {/* MPOS score input (expanded) */}
                {isOpen && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">MPOS Achievement Input (per outlet)</p>
                    <div className="space-y-2">
                      {(outlets ?? []).map(outlet => {
                        const key = `${s.id}-${outlet.id}`;
                        const existing = s.mposScores.find(m => m.outletId === outlet.id);
                        return (
                          <div key={outlet.id} className="flex items-center gap-3">
                            <span className="text-sm text-gray-700 w-36 flex-shrink-0 truncate">{outlet.name}</span>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <input
                                type="number" min={0} max={200} step={1}
                                placeholder="e.g. 92"
                                defaultValue={existing?.achievementPercent}
                                key={existing?.achievementPercent}
                                onChange={e => setMposInput(prev => ({ ...prev, [key]: e.target.value }))}
                                className="input w-20 text-sm text-center py-1.5"
                              />
                              <span className="text-xs text-gray-400">%</span>
                            </div>
                            <button
                              onClick={() => saveMpos(s, outlet.id, outlet.name)}
                              disabled={mposSaving[key]}
                              className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1">
                              {mposSaving[key] ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                              Save
                            </button>
                            {existing && (
                              <span className="text-xs text-gray-400 flex-shrink-0">
                                Current: {existing.achievementPercent}% → <strong className="text-brand-600">{existing.score}pts</strong>
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-gray-400">
                      Score conversion: ≥120% = 100pts · ≥100% = 80pts · ≥80% = 60pts · below = 40pts
                    </p>
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
