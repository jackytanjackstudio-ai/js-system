"use client";
import { useState } from "react";
import { useData, apiFetch } from "@/hooks/useData";
import { useAuth } from "@/context/AuthContext";
import {
  Compass, Plus, Pencil, Check, X, Loader2, Star, Zap, Sliders,
  ChevronDown, ChevronUp, Calendar, AlertCircle, Save, Trash2,
  Camera, Film, Link2, Upload, Play,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────
type Season = {
  id: string; quarter: string; theme: string; heroProduct: string;
  supportingItems: string; contentDirections: string;
  vmDirection: string; keySignal: string; backupStrategy: string;
  startDate: string; endDate: string; campaignType: string;
  coverImage: string; moodboard: string; videoLinks: string;
  isActive: boolean; createdAt: string;
};

function strategyStatus(s: Season): "active" | "upcoming" | "archived" {
  const today = new Date().toISOString().slice(0, 10);
  if (s.startDate && s.endDate) {
    if (today >= s.startDate && today <= s.endDate) return "active";
    if (s.startDate > today) return "upcoming";
    if (s.endDate < today) return "archived";
  }
  return s.isActive ? "active" : "archived";
}

const STATUS_CFG = {
  active:   { label: "Active",    cls: "bg-green-100 text-green-700"  },
  upcoming: { label: "Upcoming",  cls: "bg-blue-100 text-blue-700"    },
  archived: { label: "Archived",  cls: "bg-gray-100 text-gray-500"    },
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

// ─── Cloudinary upload ────────────────────────────────────────────────────────
async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", "jackstudio_upload");
  const r = await fetch("https://api.cloudinary.com/v1_1/ds0ka66z1/image/upload", { method: "POST", body: fd });
  if (!r.ok) throw new Error("Upload failed");
  return (await r.json()).secure_url as string;
}

function detectVideoPlatform(url: string): string {
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "YouTube";
  if (url.includes("tiktok.com")) return "TikTok";
  if (url.includes("instagram.com") || url.includes("ig.me")) return "Instagram";
  return "Video";
}

// ─── Form state ───────────────────────────────────────────────────────────────
const EMPTY = { quarter: "", theme: "", heroProduct: "", supportingItems: [] as string[], contentDirections: [] as string[], vmDirection: "", keySignal: "", backupStrategy: "", startDate: "", endDate: "", campaignType: "", coverImage: "", moodboard: [] as string[], videoLinks: [] as string[], isActive: false };

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
    backupStrategy: initial.backupStrategy,
    startDate: initial.startDate ?? "", endDate: initial.endDate ?? "", campaignType: initial.campaignType ?? "",
    coverImage: initial.coverImage ?? "",
    moodboard: parseArr(initial.moodboard),
    videoLinks: parseArr(initial.videoLinks),
    isActive: initial.isActive,
  } : { ...EMPTY });
  const [saving, setSaving]       = useState(false);
  const [uploading, setUploading] = useState(false);
  const [videoInput, setVideoInput] = useState("");

  const valid = form.quarter.trim() && form.theme.trim() && form.heroProduct.trim();

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try { setForm(f => ({ ...f, coverImage: "" })); const url = await uploadImage(file); setForm(f => ({ ...f, coverImage: url })); }
    finally { setUploading(false); }
  }

  async function handleMoodboardUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(files.slice(0, 6).map(uploadImage));
      setForm(f => ({ ...f, moodboard: [...f.moodboard, ...urls].slice(0, 9) }));
    } finally { setUploading(false); }
  }

  function addVideoLink() {
    const url = videoInput.trim();
    if (!url || form.videoLinks.includes(url)) return;
    setForm(f => ({ ...f, videoLinks: [...f.videoLinks, url] }));
    setVideoInput("");
  }

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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Start Date</label>
              <input type="date" className={inputCls}
                value={form.startDate}
                onChange={e => {
                  const date = e.target.value;
                  setForm(f => ({
                    ...f,
                    startDate: date,
                    campaignType: date && !f.campaignType ? "Branding" : f.campaignType,
                  }));
                }} />
            </div>
            <div>
              <label className={labelCls}>End Date</label>
              <input type="date" className={inputCls}
                value={form.endDate}
                onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Campaign Type</label>
            <input className={inputCls} placeholder="e.g. Branding"
              value={form.campaignType}
              onChange={e => setForm(f => ({ ...f, campaignType: e.target.value }))} />
          </div>

          {/* ── Visual / Media ── */}
          <div className="space-y-3 pt-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5"><Camera size={11} /> Visual Direction</p>

            {/* Cover Image */}
            <div>
              <label className={labelCls}>Cover Image</label>
              <label className="cursor-pointer block">
                {form.coverImage ? (
                  <div className="relative rounded-xl overflow-hidden h-36 bg-gray-100 group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.coverImage} alt="cover" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="text-white text-xs font-semibold flex items-center gap-1"><Upload size={12} /> Change</span>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-200 rounded-xl h-24 flex flex-col items-center justify-center gap-1.5 hover:border-brand-300 transition-colors">
                    <Camera size={18} className="text-gray-300" />
                    <span className="text-xs text-gray-400">Upload cover image</span>
                  </div>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
              </label>
            </div>

            {/* Moodboard */}
            <div>
              <label className={labelCls}>Moodboard (up to 9 images)</label>
              <div className="grid grid-cols-3 gap-1.5">
                {form.moodboard.map((url, i) => (
                  <div key={i} className="relative rounded-lg overflow-hidden aspect-square bg-gray-100 group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setForm(f => ({ ...f, moodboard: f.moodboard.filter((_, j) => j !== i) }))}
                      className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <X size={10} />
                    </button>
                  </div>
                ))}
                {form.moodboard.length < 9 && (
                  <label className="cursor-pointer aspect-square rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center hover:border-brand-300 transition-colors">
                    <Plus size={16} className="text-gray-300" />
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleMoodboardUpload} />
                  </label>
                )}
              </div>
            </div>

            {/* Video Links */}
            <div>
              <label className={labelCls}>Video / Reference Links</label>
              <div className="flex gap-2">
                <input className={inputCls + " flex-1"} placeholder="Paste YouTube / TikTok / Instagram URL"
                  value={videoInput} onChange={e => setVideoInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addVideoLink(); } }} />
                <button type="button" onClick={addVideoLink} disabled={!videoInput.trim()}
                  className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40"><Plus size={12} /></button>
              </div>
              {form.videoLinks.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {form.videoLinks.map((url, i) => (
                    <div key={i} className="flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-1 text-xs">
                      <Play size={9} className="text-gray-500" />
                      <span className="font-semibold text-gray-600">{detectVideoPlatform(url)}</span>
                      <a href={url} target="_blank" rel="noreferrer" className="text-brand-500 hover:underline truncate max-w-[120px]">{url.replace(/https?:\/\/(www\.)?/, "")}</a>
                      <button onClick={() => setForm(f => ({ ...f, videoLinks: f.videoLinks.filter((_, j) => j !== i) }))}
                        className="text-gray-400 hover:text-red-500 ml-0.5"><X size={9} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {uploading && (
              <div className="flex items-center gap-2 text-xs text-brand-500">
                <Loader2 size={11} className="animate-spin" /> Uploading...
              </div>
            )}
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
  const status     = strategyStatus(s);
  const stCfg      = STATUS_CFG[status];
  const supporting = parseArr(s.supportingItems);
  const content    = parseArr(s.contentDirections);
  const moodboard  = parseArr(s.moodboard);
  const videoLinks = parseArr(s.videoLinks);

  return (
    <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-lg">
      {/* Cover Image */}
      {s.coverImage && (
        <div className="relative h-48 w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={s.coverImage} alt="cover" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-900/80 via-brand-900/20 to-transparent" />
        </div>
      )}
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full">{s.quarter}</span>
            {status === "active" && <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />}
            <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", stCfg.cls)}>{stCfg.label.toUpperCase()}</span>
            {s.startDate && s.endDate && (
              <span className="text-xs text-white/50">{s.startDate} → {s.endDate}</span>
            )}
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

      {/* Moodboard */}
      {moodboard.length > 0 && (
        <div>
          <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2 flex items-center gap-1">
            <Camera size={9} /> Moodboard
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {moodboard.slice(0, 9).map((url, i) => (
              <div key={i} className="rounded-lg overflow-hidden aspect-square bg-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Video Links */}
      {videoLinks.length > 0 && (
        <div>
          <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2 flex items-center gap-1">
            <Film size={9} /> Reference Videos
          </div>
          <div className="flex flex-wrap gap-2">
            {videoLinks.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors">
                <Play size={10} className="text-white/70" />
                {detectVideoPlatform(url)}
                <span className="text-white/50 text-[10px] max-w-[100px] truncate">{url.replace(/https?:\/\/(www\.)?/, "")}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
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
          {(() => { const st = strategyStatus(s); const cfg = STATUS_CFG[st]; return <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full", cfg.cls)}>{cfg.label}</span>; })()}
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

// ─── Incentive Setup ──────────────────────────────────────────────────────────
import { useEffect } from "react";

type WeightConfig = { id: string; osWeights: string; startDate: string; endDate: string; isActive: boolean };

const WEIGHT_FIELDS = [
  { key: "customer_input" as const, label: "Customer Input"  },
  { key: "quick_log"      as const, label: "Quick Log"        },
  { key: "content"        as const, label: "Creator Insight"  },
  { key: "review"         as const, label: "Review"           },
  { key: "campaign"       as const, label: "Campaign"         },
];

function IncentiveSetup() {
  const { user } = useAuth();
  const { data: configs, loading, refetch } = useData<WeightConfig[]>("/api/strategies");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [weights, setWeights] = useState({ customer_input: 20, quick_log: 20, content: 20, review: 20, campaign: 20 });
  const [startDate, setStartDate] = useState("");
  const [endDate,   setEndDate]   = useState("");

  const isAdmin = ["admin", "manager"].includes(user?.role ?? "");

  useEffect(() => {
    if (!configs?.length) return;
    const active = configs.find(c => c.isActive) ?? configs[0];
    if (!active) return;
    try {
      const w = JSON.parse(active.osWeights);
      setWeights({
        customer_input: w.customer_input ?? 20,
        quick_log:      w.quick_log      ?? 20,
        content:        w.content        ?? 20,
        review:         w.review         ?? 20,
        campaign:       w.campaign       ?? 20,
      });
    } catch {}
    setStartDate(active.startDate ?? "");
    setEndDate(active.endDate ?? "");
  }, [configs]);

  if (!isAdmin) return null;

  const total = weights.customer_input + weights.quick_log + weights.content + weights.review + weights.campaign;
  const ok = Math.abs(total - 100) < 0.1;

  async function handleSave() {
    setSaving(true);
    try {
      await apiFetch("/api/strategies", {
        method: "PATCH",
        body: JSON.stringify({
          startDate,
          endDate,
          osWeights: { customer_input: weights.customer_input, quick_log: weights.quick_log, content: weights.content, review: weights.review, campaign: weights.campaign },
        }),
      });
      refetch();
    } finally { setSaving(false); }
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
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
          {loading ? (
            <div className="flex justify-center py-3"><Loader2 className="animate-spin text-gray-300" size={18} /></div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Start Date</label>
                  <input type="date" className="input w-full text-sm py-1.5"
                    value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">End Date</label>
                  <input type="date" className="input w-full text-sm py-1.5"
                    value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
              </div>
              {WEIGHT_FIELDS.map(({ key, label }) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-36 flex-shrink-0">{label}</span>
                  <input type="number" min={0} max={100}
                    value={weights[key]}
                    onChange={e => setWeights(w => ({ ...w, [key]: Number(e.target.value) }))}
                    className="input w-20 text-sm text-center py-1.5" />
                  <span className="text-sm text-gray-400">%</span>
                </div>
              ))}
              <div className={cn("text-xs font-semibold", ok ? "text-green-600" : "text-red-500")}>
                Total: {total}%{!ok && " — must equal 100%"}
              </div>
              <button onClick={handleSave} disabled={!ok || saving}
                className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 disabled:opacity-50">
                {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />} Save Weights
              </button>
            </>
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
