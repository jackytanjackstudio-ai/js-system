"use client";
import { useState, useRef, useCallback } from "react";
import { useData, apiFetch } from "@/hooks/useData";
import StrategyBar from "@/components/StrategyBar";
import {
  Link2, Eye, Heart, MessageCircle, ShoppingBag, Zap,
  Loader2, X, ArrowUpRight, Plus, Check,
  Upload, Trash2, AlertTriangle, TrendingUp, ChevronDown, ChevronUp,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Content = {
  id: string; title: string; platform: string; contentUrl: string | null;
  views: number; likes: number; comments: number; saves: number; shares: number;
  linkedSales: number; topComment: string | null; signalScore: number;
  performanceLevel: string; objective: string; detectedKeywords: string;
  aiSignals: string; pushedToWarRoom: boolean; productId: string | null;
  user: { name: string };
};

type TikTokReport = {
  id: string; createdAt: string; dateRange: string | null; fileName: string;
  totalVideos: number; totalVV: number; totalGMV: number; avgFinishRate: number;
  signals: string | null; status: string;
};

type Recommendation = { action: string; content: string; reason: string };

type SignalData = {
  hookSignals: string[];
  themeSignals: string[];
  audienceEmotions: string[];
  alerts: string[];
  recommendations: Recommendation[];
  topPatterns: { hooks: string[]; themes: string[]; styles: string[] };
  _meta?: { totalVV: number; totalGMV: number; totalLikes: number; totalShares: number; avgFinishRate: number };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtK(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}
function fmtRM(n: number) {
  return `RM ${n.toLocaleString("en-MY", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });
}
function detectPlatform(url: string): "tiktok" | "instagram" {
  if (url.includes("instagram.com") || url.includes("ig.me")) return "instagram";
  return "tiktok";
}
function parseSignals(raw: string | null): SignalData | null {
  if (!raw) return null;
  try { return JSON.parse(raw) as SignalData; }
  catch { return null; }
}

// ─── Signal Dashboard ─────────────────────────────────────────────────────────

function SignalDashboard({ report }: { report: TikTokReport }) {
  const signals = parseSignals(report.signals);
  const [patternsOpen, setPatternsOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="bg-gradient-to-r from-brand-500 to-brand-600 rounded-2xl p-4 text-white">
        <p className="text-xs font-bold opacity-70 uppercase tracking-wider mb-1">
          {report.dateRange ?? fmtDate(report.createdAt)}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
          {[
            { label: "Videos", value: report.totalVideos.toLocaleString() },
            { label: "Total Views", value: fmtK(report.totalVV) },
            { label: "GMV",  value: fmtRM(report.totalGMV) },
            { label: "Avg Finish", value: `${report.avgFinishRate.toFixed(2)}%` },
          ].map(s => (
            <div key={s.label} className="bg-white/10 rounded-xl px-3 py-2">
              <div className="text-lg font-black">{s.value}</div>
              <div className="text-[11px] opacity-70">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {signals ? (
        <>
          {/* Signals + Emotions */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Zap size={11} className="text-orange-500" /> CREATOR SIGNALS
              </p>
              <div className="space-y-2">
                {[...(signals.hookSignals ?? []), ...(signals.themeSignals ?? [])].map((s, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-orange-500 mt-0.5 flex-shrink-0">🔥</span>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Heart size={11} className="text-green-500" /> AUDIENCE EMOTION
              </p>
              <div className="space-y-2">
                {(signals.audienceEmotions ?? []).map((e, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-500 mt-0.5 flex-shrink-0">✔</span>
                    <span>{e}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Alerts */}
          {(signals.alerts ?? []).length > 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
              <p className="text-[11px] font-black text-amber-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <AlertTriangle size={11} /> CONTENT ALERT
              </p>
              <div className="space-y-2">
                {signals.alerts.map((a, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-amber-800">
                    <span className="flex-shrink-0 mt-0.5">⚠</span>
                    <span>{a}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {(signals.recommendations ?? []).length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <TrendingUp size={11} className="text-brand-500" /> AI RECOMMENDATIONS
              </p>
              <div className="space-y-3">
                {signals.recommendations.map((r, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className={`text-xs font-black px-2 py-1 rounded-lg flex-shrink-0 mt-0.5 ${
                      r.action === "Push"    ? "bg-brand-100 text-brand-700" :
                      r.action === "Create" ? "bg-purple-100 text-purple-700" :
                      "bg-green-100 text-green-700"
                    }`}>{r.action}</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">👉 {r.content}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{r.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Patterns (collapsible) */}
          {signals.topPatterns && (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <button
                onClick={() => setPatternsOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-3"
              >
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye size={11} /> TOP PATTERNS
                </p>
                {patternsOpen ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
              </button>
              {patternsOpen && (
                <div className="px-4 pb-4 grid sm:grid-cols-3 gap-3">
                  {[
                    { label: "Hooks",  items: signals.topPatterns.hooks  },
                    { label: "Themes", items: signals.topPatterns.themes },
                    { label: "Styles", items: signals.topPatterns.styles },
                  ].map(g => (
                    <div key={g.label}>
                      <p className="text-[10px] font-bold text-gray-400 mb-1.5">{g.label.toUpperCase()}</p>
                      {(g.items ?? []).map((it, i) => (
                        <div key={i} className="flex items-center gap-1.5 mb-1">
                          <span className="text-[11px] font-black text-brand-500">{["🥇","🥈","🥉"][i] ?? "·"}</span>
                          <span className="text-xs text-gray-700">{it}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center">
          <Zap size={28} className="text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-gray-500">
            {report.status === "no_ai" ? "Stats imported · Add OPENAI_API_KEY to enable AI signals" : "No AI signals generated"}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Upload Tab ───────────────────────────────────────────────────────────────

function UploadTab({
  reports,
  onUploaded,
}: {
  reports: TikTokReport[] | null;
  onUploaded: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging]     = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [uploadMsg, setUploadMsg]   = useState("");
  const [error, setError]           = useState<string | null>(null);

  const handleFile = useCallback(async (f: File) => {
    setUploading(true); setError(null);
    setUploadMsg("Parsing Excel data…");
    try {
      const fd = new FormData();
      fd.append("file", f);
      setUploadMsg("AI analyzing patterns… (this takes ~20s)");
      const res = await fetch("/api/creator/upload-report", { method: "POST", body: fd });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? `Upload failed (${res.status})`);
        return;
      }
      setUploadMsg("Signals generated!");
      onUploaded();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      setUploadMsg("");
      if (fileRef.current) fileRef.current.value = "";
    }
  }, [onUploaded]);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this report?")) return;
    await fetch(`/api/creator/reports?id=${id}`, { method: "DELETE" });
    onUploaded();
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-2xl transition-all cursor-pointer ${
          dragging ? "border-brand-400 bg-brand-50" : "border-gray-200 bg-white hover:bg-gray-50"
        }`}
        onClick={() => !uploading && fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onFileChange} disabled={uploading} />
        <div className="flex flex-col items-center gap-3 py-10 px-4 text-center">
          {uploading ? (
            <>
              <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center">
                <Loader2 size={24} className="text-brand-500 animate-spin" />
              </div>
              <div>
                <p className="font-bold text-gray-800">{uploadMsg}</p>
                <p className="text-xs text-gray-400 mt-1">Don&apos;t close this tab</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center">
                <Upload size={22} className="text-green-600" />
              </div>
              <div>
                <p className="font-bold text-gray-800">Upload TikTok Report</p>
                <p className="text-xs text-gray-400 mt-1">
                  Excel (.xlsx) · TikTok Shop Creator Report<br />
                  Drop here or click to choose
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">
          <AlertTriangle size={15} className="flex-shrink-0" /> {error}
          <button onClick={() => setError(null)} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      {/* Past reports */}
      {(reports ?? []).length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Report History</p>
          <div className="space-y-2">
            {(reports ?? []).map(r => (
              <div key={r.id} className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{r.fileName}</p>
                  <p className="text-xs text-gray-400">{r.dateRange ?? fmtDate(r.createdAt)} · {r.totalVideos.toLocaleString()} videos · {fmtRM(r.totalGMV)}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${
                  r.signals ? "bg-green-100 text-green-700" :
                  r.status === "no_ai" ? "bg-amber-100 text-amber-700" :
                  "bg-gray-100 text-gray-500"
                }`}>
                  {r.signals ? "✓ AI" : r.status === "no_ai" ? "Stats only" : "—"}
                </span>
                <button onClick={() => handleDelete(r.id)} className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Video Feed (existing) ────────────────────────────────────────────────────

function PerfBadge({ level, score }: { level: string; score: number }) {
  if (level === "high")   return <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-200">🔥 HIGH · {score}</span>;
  if (level === "medium") return <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200">👍 MED · {score}</span>;
  return <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-50 text-gray-500 border border-gray-200">⚠️ LOW · {score}</span>;
}

function ContentCard({ item }: { item: Content }) {
  const keywords: string[] = (() => {
    try {
      const dk = JSON.parse(item.detectedKeywords);
      if (Array.isArray(dk) && dk.length > 0) return dk;
      return JSON.parse(item.aiSignals);
    } catch { return []; }
  })();

  return (
    <div className="card space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="badge bg-gray-100 text-gray-600">{item.platform === "TikTok" ? "🎵" : "📷"} {item.platform}</span>
            {item.pushedToWarRoom && <span className="badge bg-red-50 text-red-500 flex items-center gap-0.5"><ArrowUpRight size={10} />WAR ROOM</span>}
          </div>
          {item.contentUrl
            ? <a href={item.contentUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-gray-900 hover:text-brand-600 mt-1 block truncate">{item.title}</a>
            : <p className="text-sm font-semibold text-gray-900 mt-1 truncate">{item.title}</p>
          }
        </div>
        <PerfBadge level={item.performanceLevel} score={Math.round(item.signalScore)} />
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {[
          { val: fmtK(item.views), label: "Views", emoji: "👁" },
          { val: fmtK(item.likes), label: "Likes", emoji: "❤️" },
          { val: fmtK(item.comments), label: "Comments", emoji: "💬" },
          { val: String(item.linkedSales), label: "Sales", emoji: "💰" },
        ].map(({ val, label, emoji }) => (
          <div key={label} className="bg-gray-50 rounded-xl p-2 text-center">
            <div className="text-xs font-bold text-gray-800">{emoji} {val}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">{label}</div>
          </div>
        ))}
      </div>
      {item.topComment && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
          <p className="text-[10px] text-blue-400 font-bold mb-1">TOP COMMENT</p>
          <p className="text-xs text-blue-800 italic leading-relaxed">&ldquo;{item.topComment}&rdquo;</p>
        </div>
      )}
      {keywords.length > 0 && (
        <div>
          <p className="text-[10px] text-gray-400 font-bold mb-1.5 flex items-center gap-1"><Zap size={9} /> KEYWORDS</p>
          <div className="flex flex-wrap gap-1">
            {keywords.map((k, i) => (
              <span key={i} className="text-xs bg-brand-50 border border-brand-100 text-brand-700 px-2 py-0.5 rounded-full">{k}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

type FormState = { views: string; likes: string; comments: string; saves: string; sales: string; topComment: string; objective: "traffic"|"trust"|"conversion" };
const EMPTY_FORM: FormState = { views: "", likes: "", comments: "", saves: "", sales: "", topComment: "", objective: "traffic" };
const OBJECTIVES = [
  { value: "traffic" as const,    label: "Traffic",    desc: "Views & reach" },
  { value: "trust" as const,      label: "Trust",      desc: "Education & review" },
  { value: "conversion" as const, label: "Conversion", desc: "Direct sales" },
];

function QuickModal({ url, platform, onClose, onSaved }: { url: string; platform: string; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const num = (v: string) => parseInt(v.replace(/[^0-9]/g, "") || "0");

  async function handleSave() {
    setSaving(true);
    try {
      await apiFetch("/api/creator", {
        method: "POST",
        body: JSON.stringify({
          platform: platform === "instagram" ? "Instagram" : "TikTok",
          title: url, contentUrl: url,
          views: num(form.views), likes: num(form.likes),
          comments: num(form.comments), saves: num(form.saves),
          linkedSales: num(form.sales),
          topComment: form.topComment || null,
          objective: form.objective,
        }),
      });
      onSaved(); onClose();
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900 text-sm">Quick Content Input</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">{platform === "instagram" ? "📷 Instagram" : "🎵 TikTok"} · 10 seconds</p>
          </div>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-2.5">
            {([{ key: "views", label: "👁 Views" }, { key: "likes", label: "❤️ Likes" }, { key: "comments", label: "💬 Comments" }, { key: "sales", label: "💰 Sales" }] as const).map(({ key, label }) => (
              <div key={key}>
                <label className="text-[11px] font-semibold text-gray-400 mb-1 block">{label}</label>
                <input type="text" inputMode="numeric" value={form[key as keyof typeof form]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder="0" className="input w-full text-sm text-center py-2" />
              </div>
            ))}
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-400 mb-1 block">Top Comment</label>
            <textarea value={form.topComment} onChange={e => setForm(f => ({ ...f, topComment: e.target.value }))} placeholder='"Does it fit cabin size?"' rows={2} className="input w-full text-sm resize-none" />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-400 mb-1.5 block">Objective</label>
            <div className="grid grid-cols-3 gap-1.5">
              {OBJECTIVES.map(o => (
                <button key={o.value} type="button" onClick={() => setForm(f => ({ ...f, objective: o.value }))}
                  className={`rounded-xl border p-2 text-center transition-all ${form.objective === o.value ? "bg-brand-500 border-brand-500 text-white" : "border-gray-200 text-gray-600 hover:border-brand-300"}`}>
                  <div className="text-xs font-bold">{o.label}</div>
                  <div className={`text-[10px] mt-0.5 ${form.objective === o.value ? "text-white/70" : "text-gray-400"}`}>{o.desc}</div>
                </button>
              ))}
            </div>
          </div>
          <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-2">
            {saving ? <><Loader2 size={14} className="animate-spin" />Saving…</> : <><Check size={14} />Save</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = "signals" | "upload" | "feed";

export default function CreatorInsight() {
  const [tab, setTab] = useState<Tab>("signals");

  const { data: reports, refetch: refetchReports } = useData<TikTokReport[]>("/api/creator/reports");
  const { data: feed, loading: feedLoading, refetch: refetchFeed } = useData<Content[]>("/api/creator");

  const [urlInput, setUrlInput] = useState("");
  const [modal, setModal] = useState<{ url: string; platform: string } | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const latestReport = reports?.[0] ?? null;

  function handleUrlChange(val: string) {
    setUrlInput(val);
    if (val.includes("tiktok.com/") || val.includes("instagram.com/") || val.includes("vm.tiktok.com/") || val.includes("ig.me/")) {
      setModal({ url: val, platform: detectPlatform(val) });
    }
  }
  function handleSaved() {
    setJustSaved(true); setUrlInput(""); refetchFeed();
    setTimeout(() => setJustSaved(false), 2000);
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: "signals", label: "⚡ Signals" },
    { id: "upload",  label: "📥 Upload" },
    { id: "feed",    label: "🎵 Feed" },
  ];

  return (
    <div className="p-6 space-y-5 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Creator Intelligence</h1>
        <p className="text-sm text-gray-500 mt-0.5">Attention Intelligence Center · Signal → Strategy</p>
      </div>

      <StrategyBar show="content" />

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${tab === t.id ? "bg-white shadow-sm text-gray-800" : "text-gray-500 hover:text-gray-700"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Signals Tab ───────────────────────────────────────── */}
      {tab === "signals" && (
        latestReport ? (
          <SignalDashboard report={latestReport} />
        ) : (
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
            <Zap size={36} className="text-gray-200 mx-auto mb-3" />
            <p className="font-bold text-gray-600">No reports yet</p>
            <p className="text-sm text-gray-400 mt-1 mb-4">Upload your TikTok report to generate AI signals</p>
            <button onClick={() => setTab("upload")} className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2 mx-auto">
              <Upload size={14} /> Upload Report
            </button>
          </div>
        )
      )}

      {/* ── Upload Tab ────────────────────────────────────────── */}
      {tab === "upload" && (
        <UploadTab
          reports={reports ?? null}
          onUploaded={() => { refetchReports(); setTab("signals"); }}
        />
      )}

      {/* ── Feed Tab ──────────────────────────────────────────── */}
      {tab === "feed" && (
        <div className="space-y-5">
          {/* URL paste */}
          <div className="card border-2 border-dashed border-brand-200 bg-brand-50/40">
            <p className="text-xs font-semibold text-brand-600 mb-2 flex items-center gap-1.5">
              <Link2 size={12} /> Paste TikTok / Instagram link to log content
            </p>
            <div className="flex gap-2">
              <input value={urlInput} onChange={e => handleUrlChange(e.target.value)}
                placeholder="https://www.tiktok.com/@creator/video/..."
                className="input flex-1 text-sm font-mono" />
              <button onClick={() => { if (urlInput.trim()) setModal({ url: urlInput.trim(), platform: detectPlatform(urlInput) }); }}
                className="btn-primary px-4 text-sm flex items-center gap-1.5">
                <Plus size={14} /> Log
              </button>
            </div>
            {justSaved && <p className="text-xs text-green-600 font-semibold mt-2 flex items-center gap-1"><Check size={12} />Saved!</p>}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { count: feed?.filter(c => c.performanceLevel === "high").length ?? 0,   label: "🔥 High",   color: "text-red-500"   },
              { count: feed?.filter(c => c.performanceLevel === "medium").length ?? 0, label: "👍 Medium", color: "text-amber-500" },
              { count: feed?.filter(c => c.performanceLevel === "low").length ?? 0,    label: "⚠️ Low",    color: "text-gray-400"  },
            ].map(s => (
              <div key={s.label} className="card text-center">
                <div className={`text-2xl font-bold ${s.color}`}>{s.count}</div>
                <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Feed */}
          <div>
            <h2 className="font-semibold text-gray-800 text-sm mb-3">Signal Feed · {feed?.length ?? 0} entries</h2>
            {feedLoading ? (
              <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-gray-300" /></div>
            ) : !feed?.length ? (
              <div className="card text-center py-12">
                <Zap size={32} className="text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 font-medium text-sm">No content logged yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {feed.map(item => <ContentCard key={item.id} item={item} />)}
              </div>
            )}
          </div>
        </div>
      )}

      {modal && (
        <QuickModal url={modal.url} platform={modal.platform}
          onClose={() => { setModal(null); setUrlInput(""); }}
          onSaved={handleSaved} />
      )}
    </div>
  );
}
