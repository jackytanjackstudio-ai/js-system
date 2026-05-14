"use client";
import { useState, useRef, useEffect } from "react";
import { useData, apiFetch } from "@/hooks/useData";
import {
  Store, Users, Activity, ShieldCheck, Database, Upload,
  CheckCircle, AlertCircle, Loader2, Target, ChevronDown, ChevronUp, Save,
} from "lucide-react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type Outlet       = { id: string; name: string; city: string; type: string; isActive: boolean };
type Staff        = { id: string; name: string; email: string; role: string; isActive: boolean };
type OutletTarget = { outlet: string; year: number; month: number; targetRm: number };
type EcommTarget  = { platform: string; year: number; month: number; targetRm: number };
type BscKpi       = { id: string; perspective: string; kpiKey: string; kpiLabel: string; targetDesc: string | null; status: string; note: string | null };

// ─── Static config ────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, string> = {
  admin:      "bg-red-900 text-red-300",
  supervisor: "bg-amber-900 text-amber-300",
  staff:      "bg-blue-900 text-blue-300",
  marketing:  "bg-pink-900 text-pink-300",
  content:    "bg-purple-900 text-purple-300",
  cs:         "bg-cyan-900 text-cyan-300",
  product:    "bg-green-900 text-green-300",
  manager:    "bg-amber-900 text-amber-300",
  sales:      "bg-blue-900 text-blue-300",
  creator:    "bg-purple-900 text-purple-300",
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const STRATEGY_PERSPECTIVES: { id: string; label: string }[] = [
  { id: "financial", label: "💰 Financial" },
  { id: "customer",  label: "🤝 Customer Focus" },
  { id: "internal",  label: "⚙️ Internal Process" },
  { id: "learning",  label: "🌱 Learning & Growth" },
];

const STATUS_OPTIONS = ["on-track", "caution", "behind"];
const STATUS_COLORS: Record<string, string> = {
  "on-track": "bg-green-400",
  "caution":  "bg-amber-400",
  "behind":   "bg-red-400",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtRm(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + "K";
  return String(Math.round(n));
}

// ─── SKU Catalog Import ───────────────────────────────────────────────────────

function SkuCatalogImport() {
  const { data: catalogInfo, refetch } = useData<{ count: number }>("/api/admin/sku-catalog");
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [result, setResult] = useState<{ imported: number; total: number } | null>(null);
  const [errMsg, setErrMsg] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("uploading");
    setResult(null);
    setErrMsg("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res  = await fetch("/api/admin/sku-catalog", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setErrMsg(data.error ?? "Import failed"); setStatus("error"); return; }
      setResult(data.data ?? data);
      setStatus("done");
      refetch();
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : "Import failed");
      setStatus("error");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const count = catalogInfo?.count ?? 0;
  return (
    <div className="bg-stone-800 border border-stone-700 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-amber-600/20 flex items-center justify-center">
          <Database size={16} className="text-amber-400" />
        </div>
        <div>
          <h2 className="text-white font-semibold text-sm">SKU Catalog</h2>
          <p className="text-stone-400 text-xs">{count > 0 ? `${count.toLocaleString()} products loaded` : "No products loaded yet"}</p>
        </div>
      </div>
      <p className="text-stone-400 text-xs leading-relaxed">
        Upload your <span className="text-white font-medium">MASTER CODE LIST.xlsx</span> to enable barcode scanning in Sales Report Quick Log.
        Re-uploading will update existing products automatically.
      </p>
      <label className={`flex items-center justify-center gap-2 w-full py-3 rounded-lg border-2 border-dashed cursor-pointer transition-all text-sm font-semibold
        ${status === "uploading" ? "border-amber-600/40 text-amber-400/50 pointer-events-none"
          : "border-amber-600/40 text-amber-400 hover:border-amber-500 hover:bg-amber-600/5"}`}>
        {status === "uploading"
          ? <><Loader2 size={16} className="animate-spin" /> Importing…</>
          : <><Upload size={15} /> Upload Master Code List (.xlsx)</>}
        <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} disabled={status === "uploading"} />
      </label>
      {status === "done" && result && (
        <div className="flex items-center gap-2 text-green-400 text-xs font-semibold">
          <CheckCircle size={14} /> {result.imported.toLocaleString()} of {result.total.toLocaleString()} products imported successfully.
        </div>
      )}
      {status === "error" && (
        <div className="flex items-center gap-2 text-red-400 text-xs font-semibold">
          <AlertCircle size={14} /> {errMsg}
        </div>
      )}
    </div>
  );
}

// ─── Monthly Target Editor ────────────────────────────────────────────────────

function MonthlyEditor({ label, editValues, onChange, onSave, onCancel, saving }: {
  label: string;
  editValues: Record<number, string>;
  onChange: (m: number, v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const annual = Array.from({ length: 12 }, (_, i) => parseFloat(editValues[i + 1] || "0")).reduce((a, b) => a + b, 0);
  return (
    <div className="border-t border-stone-700 px-5 py-4 space-y-4">
      <p className="text-xs text-stone-500 font-semibold">Annual total: RM {fmtRm(annual)}</p>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {MONTHS.map((m, i) => (
          <div key={m}>
            <label className="text-[10px] text-stone-500 font-semibold uppercase tracking-wide">{m}</label>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-stone-600 text-xs shrink-0">RM</span>
              <input
                type="number" min="0"
                value={editValues[i + 1] ?? "0"}
                onChange={e => onChange(i + 1, e.target.value)}
                className="w-full bg-stone-900 border border-stone-600 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 pt-2 border-t border-stone-700">
        <button onClick={onSave} disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-500 disabled:opacity-50 transition-all">
          <Save size={14} /> {saving ? "Saving…" : `Save ${label}`}
        </button>
        <button onClick={onCancel}
          className="px-4 py-2 rounded-lg bg-stone-700 text-stone-300 text-sm font-semibold hover:bg-stone-600 transition-all">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Strategy Settings Section ────────────────────────────────────────────────

function StrategySettings() {
  const [tab, setTab]   = useState<"targets" | "ecomm" | "bsc">("targets");
  const [year, setYear] = useState(2026);

  // Outlet Targets
  const [outlets, setOutlets]       = useState<string[]>([]);
  const [targetMap, setTargetMap]   = useState<Record<string, Record<number, number>>>({});
  const [editOutlet, setEditOutlet] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<number, string>>({});
  const [targetSaving, setTargetSaving] = useState(false);
  const [targetMsg,    setTargetMsg]    = useState("");

  useEffect(() => { loadTargets(); }, [year]);

  async function loadTargets() {
    const res = await fetch(`/api/bsc/targets?year=${year}`).then(r => r.json());
    const map: Record<string, Record<number, number>> = {};
    for (const t of (res.targets ?? []) as OutletTarget[]) {
      if (!map[t.outlet]) map[t.outlet] = {};
      map[t.outlet][t.month] = t.targetRm;
    }
    setTargetMap(map);
    setOutlets(Object.keys(map).sort());
  }

  function openEditOutlet(outlet: string) {
    setEditOutlet(outlet);
    const vals: Record<number, string> = {};
    for (let m = 1; m <= 12; m++) vals[m] = String(targetMap[outlet]?.[m] ?? 0);
    setEditValues(vals);
  }

  async function saveOutlet() {
    if (!editOutlet) return;
    setTargetSaving(true);
    await fetch("/api/bsc/targets", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targets: Array.from({ length: 12 }, (_, i) => ({
          outlet: editOutlet, year, month: i + 1,
          targetRm: parseFloat(editValues[i + 1] || "0"),
        })),
      }),
    });
    setTargetSaving(false);
    setEditOutlet(null);
    setTargetMsg("Saved ✓");
    setTimeout(() => setTargetMsg(""), 2000);
    loadTargets();
  }

  // Ecomm Targets
  const [platforms, setPlatforms]       = useState<string[]>([]);
  const [ecommMap, setEcommMap]         = useState<Record<string, Record<number, number>>>({});
  const [editPlatform, setEditPlatform] = useState<string | null>(null);
  const [ecommValues, setEcommValues]   = useState<Record<number, string>>({});
  const [ecommSaving, setEcommSaving]   = useState(false);
  const [ecommMsg,    setEcommMsg]      = useState("");
  const [newPlatform, setNewPlatform]   = useState("");

  useEffect(() => { loadEcomm(); }, [year]);

  async function loadEcomm() {
    const res = await fetch(`/api/bsc/ecomm-targets?year=${year}`).then(r => r.json());
    const map: Record<string, Record<number, number>> = {};
    for (const t of (res.targets ?? []) as EcommTarget[]) {
      if (!map[t.platform]) map[t.platform] = {};
      map[t.platform][t.month] = t.targetRm;
    }
    setEcommMap(map);
    setPlatforms(Object.keys(map).sort());
  }

  function openEditPlatform(p: string) {
    setEditPlatform(p);
    const vals: Record<number, string> = {};
    for (let m = 1; m <= 12; m++) vals[m] = String(ecommMap[p]?.[m] ?? 0);
    setEcommValues(vals);
  }

  async function saveEcomm() {
    if (!editPlatform) return;
    setEcommSaving(true);
    await fetch("/api/bsc/ecomm-targets", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targets: Array.from({ length: 12 }, (_, i) => ({
          platform: editPlatform, year, month: i + 1,
          targetRm: parseFloat(ecommValues[i + 1] || "0"),
        })),
      }),
    });
    setEcommSaving(false);
    setEditPlatform(null);
    setEcommMsg("Saved ✓");
    setTimeout(() => setEcommMsg(""), 2000);
    loadEcomm();
  }

  function addPlatform() {
    const name = newPlatform.trim();
    if (!name || platforms.includes(name)) return;
    setPlatforms(prev => [...prev, name].sort());
    setEcommMap(prev => ({ ...prev, [name]: {} }));
    setNewPlatform("");
    openEditPlatform(name);
  }

  // BSC KPIs
  const [kpis, setKpis]         = useState<BscKpi[]>([]);
  const [editKpi, setEditKpi]   = useState<string | null>(null);
  const [kpiEdits, setKpiEdits] = useState<Partial<BscKpi>>({});
  const [kpiSaving, setKpiSaving] = useState(false);
  const [kpiMsg, setKpiMsg]     = useState("");

  useEffect(() => { loadKpis(); }, []);

  async function loadKpis() {
    const res = await fetch("/api/bsc/kpis").then(r => r.json());
    setKpis(res.kpis ?? []);
  }

  async function saveKpi() {
    if (!kpiEdits.perspective || !kpiEdits.kpiKey) return;
    setKpiSaving(true);
    await fetch("/api/bsc/kpis", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(kpiEdits),
    });
    setKpiSaving(false);
    setEditKpi(null);
    setKpiMsg("Saved ✓");
    setTimeout(() => setKpiMsg(""), 2000);
    loadKpis();
  }

  return (
    <div className="bg-stone-800 border border-stone-700 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-stone-700 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-amber-600/20 flex items-center justify-center">
          <Target size={16} className="text-amber-400" />
        </div>
        <div>
          <h2 className="text-white font-semibold text-sm">Strategy Settings</h2>
          <p className="text-stone-400 text-xs">Outlet targets, e-commerce targets, BSC KPIs</p>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Tab bar */}
        <div className="flex gap-2 flex-wrap">
          {[
            { id: "targets", label: "📍 Outlet Targets" },
            { id: "ecomm",   label: "🛒 Ecomm Targets"  },
            { id: "bsc",     label: "🎯 BSC KPIs"       },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as "targets" | "ecomm" | "bsc")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === t.id ? "bg-amber-600 text-white" : "bg-stone-700 text-stone-400 hover:text-white"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Year selector */}
        {(tab === "targets" || tab === "ecomm") && (
          <div className="flex items-center gap-3">
            <label className="text-stone-400 text-sm">Year:</label>
            <select
              value={year}
              onChange={e => { setEditOutlet(null); setEditPlatform(null); setYear(Number(e.target.value)); }}
              className="bg-stone-900 border border-stone-700 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500">
              {[2025, 2026, 2027].map(y => <option key={y}>{y}</option>)}
            </select>
            {(tab === "targets" ? targetMsg : ecommMsg) && (
              <span className="text-green-400 text-sm font-semibold">
                {tab === "targets" ? targetMsg : ecommMsg}
              </span>
            )}
          </div>
        )}

        {/* ── OUTLET TARGETS ── */}
        {tab === "targets" && (
          <div className="space-y-3">
            {outlets.map(outlet => {
              const annualTotal = Array.from({ length: 12 }, (_, i) => targetMap[outlet]?.[i + 1] ?? 0).reduce((a, b) => a + b, 0);
              const isOpen = editOutlet === outlet;
              return (
                <div key={outlet} className="bg-stone-900 border border-stone-700 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4">
                    <div>
                      <p className="text-white font-semibold text-sm">{outlet}</p>
                      <p className="text-stone-500 text-xs mt-0.5">Annual: RM {fmtRm(annualTotal)}</p>
                    </div>
                    <button onClick={() => isOpen ? setEditOutlet(null) : openEditOutlet(outlet)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors">
                      {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      {isOpen ? "Close" : "Edit"}
                    </button>
                  </div>
                  {isOpen && (
                    <MonthlyEditor
                      label="Targets"
                      editValues={editValues}
                      onChange={(m, v) => setEditValues(prev => ({ ...prev, [m]: v }))}
                      onSave={saveOutlet}
                      onCancel={() => setEditOutlet(null)}
                      saving={targetSaving}
                    />
                  )}
                </div>
              );
            })}
            {outlets.length === 0 && (
              <p className="text-center py-6 text-stone-500 text-sm">No outlet targets for {year}.</p>
            )}
          </div>
        )}

        {/* ── ECOMM TARGETS ── */}
        {tab === "ecomm" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                value={newPlatform}
                onChange={e => setNewPlatform(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addPlatform()}
                placeholder="Add new platform (e.g. Shopee JS Craft)"
                className="flex-1 bg-stone-900 border border-stone-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500 placeholder-stone-600"
              />
              <button onClick={addPlatform}
                className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-500 transition-all">
                + Add
              </button>
            </div>
            <div className="space-y-3">
              {platforms.map(platform => {
                const annualTotal = Array.from({ length: 12 }, (_, i) => ecommMap[platform]?.[i + 1] ?? 0).reduce((a, b) => a + b, 0);
                const isOpen = editPlatform === platform;
                return (
                  <div key={platform} className="bg-stone-900 border border-stone-700 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4">
                      <div className="min-w-0 flex-1 pr-3">
                        <p className="text-white font-semibold text-sm truncate">{platform}</p>
                        <p className="text-stone-500 text-xs mt-0.5">Annual: RM {fmtRm(annualTotal)}</p>
                      </div>
                      <button onClick={() => isOpen ? setEditPlatform(null) : openEditPlatform(platform)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors shrink-0">
                        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        {isOpen ? "Close" : "Edit"}
                      </button>
                    </div>
                    {isOpen && (
                      <MonthlyEditor
                        label="Targets"
                        editValues={ecommValues}
                        onChange={(m, v) => setEcommValues(prev => ({ ...prev, [m]: v }))}
                        onSave={saveEcomm}
                        onCancel={() => setEditPlatform(null)}
                        saving={ecommSaving}
                      />
                    )}
                  </div>
                );
              })}
              {platforms.length === 0 && (
                <p className="text-center py-6 text-stone-500 text-sm">No ecomm platforms for {year}.</p>
              )}
            </div>
          </div>
        )}

        {/* ── BSC KPIs ── */}
        {tab === "bsc" && (
          <div className="space-y-5">
            {kpiMsg && <span className="text-green-400 text-sm font-semibold">{kpiMsg}</span>}
            {STRATEGY_PERSPECTIVES.map(persp => {
              const perspKpis = kpis.filter(k => k.perspective === persp.id);
              return (
                <div key={persp.id} className="bg-stone-900 border border-stone-700 rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-stone-700">
                    <p className="text-white font-semibold text-sm">{persp.label}</p>
                    <p className="text-stone-500 text-xs">{perspKpis.length} KPI{perspKpis.length !== 1 ? "s" : ""}</p>
                  </div>
                  <div className="divide-y divide-stone-700">
                    {perspKpis.map(k => (
                      <div key={k.kpiKey} className="px-5 py-4">
                        {editKpi !== k.kpiKey ? (
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_COLORS[k.status] ?? "bg-stone-400"}`} />
                                <p className="text-white text-sm font-semibold">{k.kpiLabel}</p>
                              </div>
                              {k.targetDesc && <p className="text-stone-400 text-xs mt-1 ml-4">{k.targetDesc}</p>}
                              {k.note       && <p className="text-stone-500 text-xs italic mt-0.5 ml-4">{k.note}</p>}
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-xs font-semibold capitalize text-stone-400">{k.status}</span>
                              <button onClick={() => { setEditKpi(k.kpiKey); setKpiEdits({ ...k }); }}
                                className="text-xs px-3 py-1 rounded-lg bg-stone-700 text-stone-300 hover:bg-stone-600 hover:text-white transition-all font-semibold">
                                Edit
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="text-[10px] text-stone-500 font-semibold uppercase tracking-wide">KPI Label</label>
                                <input value={kpiEdits.kpiLabel ?? ""}
                                  onChange={e => setKpiEdits(v => ({ ...v, kpiLabel: e.target.value }))}
                                  className="w-full mt-1 bg-stone-950 border border-stone-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
                              </div>
                              <div>
                                <label className="text-[10px] text-stone-500 font-semibold uppercase tracking-wide">Status</label>
                                <select value={kpiEdits.status ?? "on-track"}
                                  onChange={e => setKpiEdits(v => ({ ...v, status: e.target.value }))}
                                  className="w-full mt-1 bg-stone-950 border border-stone-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500">
                                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                              </div>
                            </div>
                            <div>
                              <label className="text-[10px] text-stone-500 font-semibold uppercase tracking-wide">Target Description</label>
                              <input value={kpiEdits.targetDesc ?? ""}
                                onChange={e => setKpiEdits(v => ({ ...v, targetDesc: e.target.value || null }))}
                                placeholder="e.g. 10% net margin"
                                className="w-full mt-1 bg-stone-950 border border-stone-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
                            </div>
                            <div>
                              <label className="text-[10px] text-stone-500 font-semibold uppercase tracking-wide">Note</label>
                              <input value={kpiEdits.note ?? ""}
                                onChange={e => setKpiEdits(v => ({ ...v, note: e.target.value || null }))}
                                placeholder="Add a note…"
                                className="w-full mt-1 bg-stone-950 border border-stone-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
                            </div>
                            <div className="flex gap-2 pt-1">
                              <button onClick={saveKpi} disabled={kpiSaving}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-500 disabled:opacity-50 transition-all">
                                <Save size={14} /> {kpiSaving ? "Saving…" : "Save KPI"}
                              </button>
                              <button onClick={() => setEditKpi(null)}
                                className="px-4 py-2 rounded-lg bg-stone-700 text-stone-300 text-sm font-semibold hover:bg-stone-600 transition-all">
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminOverview() {
  const { data: outlets, loading: ol } = useData<Outlet[]>("/api/outlets");
  const { data: staff,   loading: sl } = useData<Staff[]>("/api/staff");

  const physical    = (outlets ?? []).filter(o => o.type === "physical" && o.isActive);
  const online      = (outlets ?? []).filter(o => o.type === "online"   && o.isActive);
  const activeStaff = (staff ?? []).filter(s => s.isActive);

  const roleCounts = (staff ?? []).reduce<Record<string, number>>((acc, s) => {
    acc[s.role] = (acc[s.role] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Overview</h1>
        <p className="text-stone-400 text-sm mt-1">Manage outlets, staff, and strategy settings.</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-stone-800 border border-stone-700 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-brand-600/20 flex items-center justify-center">
              <Store size={16} className="text-brand-400" />
            </div>
            <span className="text-stone-400 text-sm font-medium">Outlets</span>
          </div>
          <div className="text-3xl font-bold text-white">{ol ? "…" : physical.length + online.length}</div>
          <div className="text-stone-500 text-xs mt-1">{physical.length} physical · {online.length} online</div>
        </div>

        <div className="bg-stone-800 border border-stone-700 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600/20 flex items-center justify-center">
              <Users size={16} className="text-blue-400" />
            </div>
            <span className="text-stone-400 text-sm font-medium">Active Users</span>
          </div>
          <div className="text-3xl font-bold text-white">{sl ? "…" : activeStaff.length}</div>
          <div className="text-stone-500 text-xs mt-1">{(staff ?? []).length} total accounts</div>
        </div>

        <div className="bg-stone-800 border border-stone-700 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-green-600/20 flex items-center justify-center">
              <Activity size={16} className="text-green-400" />
            </div>
            <span className="text-stone-400 text-sm font-medium">Roles</span>
          </div>
          <div className="text-3xl font-bold text-white">{Object.keys(roleCounts).length}</div>
          <div className="text-stone-500 text-xs mt-1">role types in system</div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/admin/outlets" className="bg-stone-800 border border-stone-700 hover:border-brand-600 rounded-xl p-5 group transition-all">
          <div className="flex items-center gap-3 mb-2">
            <Store size={18} className="text-brand-400" />
            <span className="text-white font-semibold group-hover:text-brand-400 transition-colors">Manage Outlets</span>
          </div>
          <p className="text-stone-500 text-sm">Add, rename, or deactivate physical stores and online channels.</p>
        </Link>

        <Link href="/admin/staff" className="bg-stone-800 border border-stone-700 hover:border-blue-600 rounded-xl p-5 group transition-all">
          <div className="flex items-center gap-3 mb-2">
            <Users size={18} className="text-blue-400" />
            <span className="text-white font-semibold group-hover:text-blue-400 transition-colors">Staff & Users</span>
          </div>
          <p className="text-stone-500 text-sm">Manage login accounts, roles, and outlet assignments.</p>
        </Link>

        <Link href="/admin/signal-tags" className="bg-stone-800 border border-stone-700 hover:border-green-600 rounded-xl p-5 group transition-all">
          <div className="flex items-center gap-3 mb-2">
            <Activity size={18} className="text-green-400" />
            <span className="text-white font-semibold group-hover:text-green-400 transition-colors">Signal Tags</span>
          </div>
          <p className="text-stone-500 text-sm">Manage dynamic market signal tags for Customer Input.</p>
        </Link>
      </div>

      {/* SKU Catalog import */}
      <SkuCatalogImport />

      {/* Role breakdown */}
      {!sl && (
        <div className="bg-stone-800 border border-stone-700 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <ShieldCheck size={15} className="text-brand-400" /> Role Breakdown
          </h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(roleCounts).map(([role, count]) => (
              <div key={role} className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize flex items-center gap-1.5 ${ROLE_COLORS[role] ?? "bg-stone-700 text-stone-300"}`}>
                <span>{role}</span>
                <span className="opacity-60">·</span>
                <span>{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strategy Settings */}
      <StrategySettings />
    </div>
  );
}
