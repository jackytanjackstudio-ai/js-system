"use client";
import { useState } from "react";
import { useData, apiFetch } from "@/hooks/useData";
import { useAuth } from "@/context/AuthContext";
import {
  Compass, Plus, Pencil, Check, X, Loader2, Star, Zap, Sliders,
  ChevronDown, ChevronUp, Calendar, AlertCircle, Save, Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────
type Season = {
  id: string; quarter: string; theme: string; heroProduct: string;
  supportingItems: string; contentDirections: string;
  vmDirection: string; keySignal: string; backupStrategy: string;
  isActive: boolean; createdAt: string;
};

function parseArr(s: string): string[] {
  try { return JSON.parse(s) as string[]; } catch { return []; }
}

// ─── Tag Input ────────────────────────────────────────────────────────────────
function TagInput({ values, onChange, placeholder }: { values: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [draft, setDraft] = useState("");
  function add() {
    const t = draft.trim();
    if (t && !values.includes(t)) onChange([...values, t]);
    setDraft("");
  }
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {values.map(v => (
          <span key={v} className="flex items-center gap-1 bg-brand-50 text-brand-700 text-xs font-semibold px-2.5 py-1 rounded-full">
            {v}
            <button onClick={() => onChange(values.filter(x => x !== v))} className="hover:text-red-500"><X size={10} /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder ?? "Type + Enter"} className="input flex-1 text-sm py-1.5" />
        <button onClick={add} disabled={!draft.trim()} className="btn-secondary text-xs px-3 py-1.5"><Plus size={12} /></button>
      </div>
    </div>
  );
}

// ─── Form state ───────────────────────────────────────────────────────────────
const EMPTY = { quarter: "", theme: "", heroProduct: "", supportingItems: [] as string[], contentDirections: [] as string[], vmDirection: "", keySignal: "", backupStrategy: "", isActive: false };

// ─── Season Form Modal ────────────────────────────────────────────────────────
function SeasonModal({ initial, onSave, onClose }: {
  initial?: Season | null;
  onSave: (data: typeof EMPTY & { id?: string }) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState(initial ? {
    quarter: initial.quarter, theme: initial.theme, heroProduct: initial.heroProduct,
    supportingItems: parseArr(initial.supportingItems),
    contentDirections: parseArr(initial.contentDirections),
    vmDirection: initial.vmDirection, keySignal: initial.keySignal,
    backupStrategy: initial.backupStrategy, isActive: initial.isActive,
  } : { ...EMPTY });
  const [saving, setSaving] = useState(false);

  const valid = form.quarter.trim() && form.theme.trim() && form.heroProduct.trim();

  async function handleSave() {
    if (!valid) return;
    setSaving(true);
    try { await onSave({ ...form, ...(initial ? { id: initial.id } : {}) }); onClose(); }
    finally { setSaving(false); }
  }

  const inputCls = "input w-full text-sm";
  const labelCls = "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5";

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <h2 className="font-bold text-gray-900">{initial ? "Edit Strategy" : "New Seasonal Strategy"}</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-gray-600" /></button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto flex-1">

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Quarter *</label>
              <input className={inputCls} placeholder="e.g. Q2 2026"
                value={form.quarter} onChange={e => setForm(f => ({ ...f, quarter: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Theme Name *</label>
              <input className={inputCls} placeholder="e.g. Urban Carry"
                value={form.theme} onChange={e => setForm(f => ({ ...f, theme: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Hero Product *</label>
            <input className={inputCls} placeholder="e.g. Urban Carry Sling Bag"
              value={form.heroProduct} onChange={e => setForm(f => ({ ...f, heroProduct: e.target.value }))} />
          </div>

          <div>
            <label className={labelCls}>Supporting Collection</label>
            <TagInput values={form.supportingItems} onChange={v => setForm(f => ({ ...f, supportingItems: v }))} placeholder="e.g. Wallet (Enter)" />
          </div>

          <div>
            <label className={labelCls}>Content Direction</label>
            <TagInput values={form.contentDirections} onChange={v => setForm(f => ({ ...f, contentDirections: v }))} placeholder="e.g. What's in my bag (Enter)" />
          </div>

          <div>
            <label className={labelCls}>VM Direction</label>
            <input className={inputCls} placeholder="e.g. Urban café movement"
              value={form.vmDirection} onChange={e => setForm(f => ({ ...f, vmDirection: e.target.value }))} />
          </div>

          <div>
            <label className={labelCls}>Key Signal</label>
            <input className={inputCls} placeholder="e.g. Customer wants lightweight carry"
              value={form.keySignal} onChange={e => setForm(f => ({ ...f, keySignal: e.target.value }))} />
          </div>

          <div>
            <label className={labelCls}>Backup Strategy</label>
            <textarea rows={2} className={inputCls + " resize-none"} placeholder="e.g. If sling weak: push combo bundle"
              value={form.backupStrategy} onChange={e => setForm(f => ({ ...f, backupStrategy: e.target.value }))} />
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
              className="w-4 h-4 rounded accent-brand-500" />
            <span className="text-sm font-semibold text-gray-700">Set as Active Quarter</span>
          </label>
        </div>

        <div className="p-5 border-t border-gray-100 flex gap-3 shrink-0">
          <button onClick={onClose} className="btn-secondary flex-1 py-2.5">Cancel</button>
          <button onClick={handleSave} disabled={!valid || saving}
            className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {initial ? "Save Changes" : "Create Strategy"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Active Season Hero Card ──────────────────────────────────────────────────
function ActiveSeasonCard({ s, canEdit, onEdit }: { s: Season; canEdit: boolean; onEdit: () => void }) {
  const supporting = parseArr(s.supportingItems);
  const content    = parseArr(s.contentDirections);

  return (
    <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 text-white p-6 space-y-5 shadow-lg">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full">{s.quarter}</span>
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-white/70 font-semibold">ACTIVE</span>
          </div>
          <h2 className="text-3xl font-black tracking-tight">{s.theme}</h2>
        </div>
        {canEdit && (
          <button onClick={onEdit} className="flex-shrink-0 bg-white/10 hover:bg-white/20 text-white p-2 rounded-xl transition-colors">
            <Pencil size={14} />
          </button>
        )}
      </div>

      {/* Hero Product */}
      <div className="bg-white/10 rounded-xl p-4">
        <div className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1 flex items-center gap-1.5">
          <Star size={10} className="fill-amber-300 text-amber-300" /> Hero Product
        </div>
        <div className="text-xl font-black">{s.heroProduct}</div>
      </div>

      {/* Grid: 4 signal cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Supporting Collection */}
        <div className="bg-white/10 rounded-xl p-3 space-y-2">
          <div className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Supporting</div>
          <div className="flex flex-wrap gap-1.5">
            {supporting.length > 0
              ? supporting.map(item => <span key={item} className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-semibold">{item}</span>)
              : <span className="text-xs text-white/40 italic">—</span>}
          </div>
        </div>

        {/* Content Direction */}
        <div className="bg-white/10 rounded-xl p-3 space-y-1.5">
          <div className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Content Direction</div>
          {content.length > 0
            ? content.slice(0, 3).map(c => <div key={c} className="text-xs text-white/90 font-semibold flex items-center gap-1.5"><span className="w-1 h-1 bg-white/60 rounded-full flex-shrink-0" />{c}</div>)
            : <span className="text-xs text-white/40 italic">—</span>}
        </div>

        {/* VM Direction */}
        <div className="bg-white/10 rounded-xl p-3">
          <div className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">VM Direction</div>
          <div className="text-sm font-semibold text-white/90">{s.vmDirection || <span className="text-white/40 italic text-xs">—</span>}</div>
        </div>

        {/* Key Signal */}
        <div className="bg-amber-400/20 border border-amber-300/30 rounded-xl p-3">
          <div className="text-[10px] font-bold text-amber-300 uppercase tracking-widest mb-1 flex items-center gap-1"><Zap size={9} /> Key Signal</div>
          <div className="text-sm font-semibold text-white/95">{s.keySignal || <span className="text-white/40 italic text-xs">—</span>}</div>
        </div>
      </div>

      {/* Backup Strategy */}
      {s.backupStrategy && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-3">
          <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">Backup Strategy</div>
          <div className="text-sm text-white/80">{s.backupStrategy}</div>
        </div>
      )}
    </div>
  );
}

// ─── Past Season Row ──────────────────────────────────────────────────────────
function PastSeasonRow({ s, canEdit, onEdit, onDelete, onActivate }: {
  s: Season; canEdit: boolean;
  onEdit: () => void; onDelete: () => void; onActivate: () => void;
}) {
  return (
    <div className="card flex items-center gap-3 py-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-gray-400">{s.quarter}</span>
          <span className="font-semibold text-gray-800 text-sm">{s.theme}</span>
          <span className="text-xs text-gray-400">· {s.heroProduct}</span>
        </div>
      </div>
      {canEdit && (
        <div className="flex gap-1.5 flex-shrink-0">
          <button onClick={onActivate} className="text-xs px-2.5 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-lg font-semibold transition-colors">
            Set Active
          </button>
          <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            <Pencil size={12} />
          </button>
          <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-500 bg-gray-100 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Incentive Setup (existing) ───────────────────────────────────────────────
import { useEffect } from "react";

type WeightConfig = {
  id: string; name: string; startDate: string; endDate: string;
  mposWeight: number; osWeights: string; isActive: boolean;
  mposScores: { outletId: string; outletName: string; achievementPercent: number; score: number }[];
};
type Outlet = { id: string; name: string };
const DEFAULT_OS = { customer_input: 20, quick_log: 20, content: 20, review: 20, campaign: 20 };
type OsKey = keyof typeof DEFAULT_OS;

function IncentiveSetup() {
  const { user } = useAuth();
  const { data: strategies, loading, refetch } = useData<WeightConfig[]>("/api/strategies");
  const { data: outlets } = useData<Outlet[]>("/api/outlets");
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mposInput, setMposInput] = useState<Record<string, string>>({});
  const [mposSaving, setMposSaving] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState({ name: "", startDate: "", endDate: "", mposWeight: 50, osWeights: { ...DEFAULT_OS } });

  const isAdmin = ["admin", "manager"].includes(user?.role ?? "");
  if (!isAdmin) return null;

  const osSum = Object.values(form.osWeights).reduce((s, n) => s + n, 0);
  const duration = form.startDate && form.endDate
    ? Math.round((new Date(form.endDate).getTime() - new Date(form.startDate).getTime()) / 86400000) : 0;
  const canCreate = form.name.trim() && form.startDate && form.endDate && duration >= 7 && Math.abs(osSum - 100) < 1;

  async function handleCreate() {
    setSaving(true);
    try {
      await apiFetch("/api/strategies", { method: "POST", body: JSON.stringify({ name: form.name.trim(), startDate: form.startDate, endDate: form.endDate, mposWeight: form.mposWeight, osWeights: form.osWeights }) });
      setShowCreate(false);
      setForm({ name: "", startDate: "", endDate: "", mposWeight: 50, osWeights: { ...DEFAULT_OS } });
      refetch();
    } finally { setSaving(false); }
  }

  async function saveMpos(strategyId: string, outletId: string, outletName: string) {
    const key = `${strategyId}-${outletId}`;
    const pct = parseFloat(mposInput[key] ?? "");
    if (isNaN(pct)) return;
    setMposSaving(p => ({ ...p, [key]: true }));
    try {
      await apiFetch("/api/mpos-scores", { method: "POST", body: JSON.stringify({ outletId, outletName, periodId: strategyId, achievementPercent: pct }) });
      refetch();
    } finally { setMposSaving(p => ({ ...p, [key]: false })); }
  }

  return (
    <div className="card border border-gray-100">
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sliders size={15} className="text-gray-400" />
          <span className="text-sm font-bold text-gray-600">Incentive Weight Setup</span>
          <span className="text-xs text-gray-400">(Admin only)</span>
        </div>
        {open ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
      </button>

      {open && (
        <div className="mt-4 space-y-4 pt-4 border-t border-gray-100">
          <button onClick={() => setShowCreate(v => !v)} className="btn-secondary text-xs flex items-center gap-1.5 px-3 py-2">
            <Plus size={12} /> New Period
          </button>

          {showCreate && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <input className="input w-full text-sm" placeholder="Period name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              <div className="grid grid-cols-2 gap-2">
                <input type="date" className="input text-sm" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
                <input type="date" className="input text-sm" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1 text-xs py-2">Cancel</button>
                <button onClick={handleCreate} disabled={!canCreate || saving} className="btn-primary flex-1 text-xs py-2 flex items-center justify-center gap-1 disabled:opacity-50">
                  {saving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />} Save
                </button>
              </div>
            </div>
          )}

          {loading ? <div className="flex justify-center py-4"><Loader2 className="animate-spin text-gray-300" size={20} /></div> : (
            <div className="space-y-2">
              {(strategies ?? []).map(s => {
                const today = new Date().toISOString().slice(0, 10);
                const isLive = today >= s.startDate && today <= s.endDate;
                return (
                  <div key={s.id} className={`rounded-xl border p-3 text-xs ${isLive ? "border-brand-200 bg-brand-50" : "border-gray-100 bg-white"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-gray-800">{s.name}</span>
                      {isLive && <span className="badge bg-green-100 text-green-700">Live</span>}
                    </div>
                    <div className="space-y-1.5">
                      {(outlets ?? []).map(o => {
                        const key = `${s.id}-${o.id}`;
                        const ex = s.mposScores?.find(m => m.outletId === o.id);
                        return (
                          <div key={o.id} className="flex items-center gap-2">
                            <span className="w-32 truncate text-gray-600 flex-shrink-0">{o.name}</span>
                            <input type="number" min={0} max={200} placeholder="%" defaultValue={ex?.achievementPercent} key={ex?.achievementPercent}
                              onChange={e => setMposInput(p => ({ ...p, [key]: e.target.value }))}
                              className="input w-16 text-xs text-center py-1" />
                            <button onClick={() => saveMpos(s.id, o.id, o.name)} disabled={mposSaving[key]}
                              className="btn-secondary text-xs px-2 py-1 flex items-center gap-1">
                              {mposSaving[key] ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
                            </button>
                            {ex && <span className="text-gray-400">{ex.achievementPercent}% → <strong className="text-brand-600">{ex.score}pts</strong></span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function StrategyPage() {
  const { user } = useAuth();
  const { data, loading, refetch } = useData<Season[]>("/api/seasonal-strategy");
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Season | null>(null);

  const canEdit = ["admin", "manager"].includes(user?.role ?? "");
  const list = data ?? [];
  const active = list.find(s => s.isActive) ?? null;
  const past   = list.filter(s => !s.isActive);

  async function handleSave(form: typeof EMPTY & { id?: string }) {
    if (form.id) {
      await apiFetch("/api/seasonal-strategy", { method: "PATCH", body: JSON.stringify(form) });
    } else {
      await apiFetch("/api/seasonal-strategy", { method: "POST", body: JSON.stringify(form) });
    }
    refetch();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this strategy?")) return;
    await apiFetch("/api/seasonal-strategy", { method: "DELETE", body: JSON.stringify({ id }) });
    refetch();
  }

  async function handleActivate(id: string) {
    await apiFetch("/api/seasonal-strategy", { method: "PATCH", body: JSON.stringify({ id, isActive: true }) });
    refetch();
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Compass size={20} className="text-brand-500" /> Strategy Hub
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">What we are fighting for this quarter</p>
        </div>
        {canEdit && (
          <button onClick={() => { setEditTarget(null); setShowModal(true); }}
            className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
            <Plus size={14} /> New Quarter
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gray-300" size={28} /></div>
      ) : (
        <>
          {/* Active Quarter */}
          {active ? (
            <ActiveSeasonCard s={active} canEdit={canEdit} onEdit={() => { setEditTarget(active); setShowModal(true); }} />
          ) : (
            <div className="card text-center py-12 border-2 border-dashed border-gray-200">
              <Compass size={32} className="text-gray-200 mx-auto mb-3" />
              <p className="font-semibold text-gray-500">No active strategy yet</p>
              <p className="text-sm text-gray-400 mt-1">Create your first quarter strategy to unify the team.</p>
              {canEdit && (
                <button onClick={() => { setEditTarget(null); setShowModal(true); }}
                  className="btn-primary text-sm px-4 py-2 mt-4 inline-flex items-center gap-2">
                  <Plus size={14} /> Create Q Strategy
                </button>
              )}
            </div>
          )}

          {/* Past Quarters */}
          {past.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Past Quarters</p>
              {past.map(s => (
                <PastSeasonRow key={s.id} s={s} canEdit={canEdit}
                  onEdit={() => { setEditTarget(s); setShowModal(true); }}
                  onDelete={() => handleDelete(s.id)}
                  onActivate={() => handleActivate(s.id)} />
              ))}
            </div>
          )}

          {/* Incentive Setup (collapsible, admin only) */}
          <IncentiveSetup />
        </>
      )}

      {/* Modal */}
      {showModal && (
        <SeasonModal
          initial={editTarget}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
        />
      )}
    </div>
  );
}
