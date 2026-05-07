"use client";
import { useState, useRef } from "react";
import { useData, apiFetch } from "@/hooks/useData";
import { useAuth } from "@/context/AuthContext";
import {
  MapPin, Plus, Pencil, Trash2, X, Loader2, Camera, FileText,
  Users, BarChart3, Check, ChevronDown, ChevronUp, Upload, Star,
  TrendingUp, Package, Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
type PM = { topCategory?: string; weakCategory?: string; bestSeller?: string; trafficObservation?: string; customerBehavior?: string; competitorObservation?: string; partnerPerformance?: string };
type Partner = { brandName: string; category?: string; attractionPower?: string; salesContribution?: number; trafficEffect?: string; repeatWorthy?: boolean };
type Roadshow = {
  id: string; mallName: string; startDate: string; endDate: string;
  sqFt: number | null; mission: string; status: string; pic: string | null;
  expectedSales: number | null; actualSales: number | null;
  floorPlanUrls: string; photoUrls: string; notes: string | null;
  postMortem: string | null; partners: string; createdAt: string;
};

function parseJ<T>(s: string, fallback: T): T { try { return JSON.parse(s) as T; } catch { return fallback; } }
function fmt(d: string) { return new Date(d).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" }); }
function daysDiff(a: string, b: string) { return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000) + 1; }

const MISSION_CONFIG = {
  branding:   { label: "Branding",   color: "bg-purple-100 text-purple-700", dot: "bg-purple-400" },
  conversion: { label: "Conversion", color: "bg-green-100 text-green-700",   dot: "bg-green-400"  },
  clearance:  { label: "Clearance",  color: "bg-orange-100 text-orange-700", dot: "bg-orange-400" },
};
const STATUS_CONFIG = {
  pending:   { label: "Pending",   color: "bg-gray-100 text-gray-500"     },
  confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-700"     },
  completed: { label: "Completed", color: "bg-green-100 text-green-700"   },
};

// ─── Cloudinary Upload ────────────────────────────────────────────────────────
async function uploadToCloudinary(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", "jackstudio_upload");
  const r = await fetch("https://api.cloudinary.com/v1_1/ds0ka66z1/image/upload", { method: "POST", body: fd });
  if (!r.ok) throw new Error("Upload failed");
  return (await r.json()).secure_url as string;
}

async function uploadRawFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", "jackstudio_upload");
  fd.append("resource_type", "auto");
  const r = await fetch("https://api.cloudinary.com/v1_1/ds0ka66z1/auto/upload", { method: "POST", body: fd });
  if (!r.ok) throw new Error("Upload failed");
  return (await r.json()).secure_url as string;
}

// ─── Form default ─────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  mallName: "", startDate: "", endDate: "", sqFt: "", mission: "conversion",
  status: "pending", pic: "", expectedSales: "", actualSales: "", notes: "",
};

// ─── KPI Bar ──────────────────────────────────────────────────────────────────
function KpiBar({ list }: { list: Roadshow[] }) {
  const completed = list.filter(r => r.status === "completed");
  const totalSales = completed.reduce((s, r) => s + (r.actualSales ?? 0), 0);
  const upcoming = list.filter(r => r.status !== "completed").length;

  const bestVenue = completed.length > 0
    ? completed.reduce((best, r) => ((r.actualSales ?? 0) > (best.actualSales ?? 0) ? r : best), completed[0])
    : null;

  const missionCount = { branding: 0, conversion: 0, clearance: 0 };
  list.forEach(r => { if (r.mission in missionCount) missionCount[r.mission as keyof typeof missionCount]++; });
  const topMission = Object.entries(missionCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  const kpis = [
    { label: "Total Roadshows", value: list.length, sub: `${upcoming} upcoming`, icon: <MapPin size={16} className="text-brand-500" /> },
    { label: "Completed Sales", value: totalSales > 0 ? `RM${(totalSales / 1000).toFixed(0)}k` : "—", sub: `${completed.length} shows`, icon: <TrendingUp size={16} className="text-green-500" /> },
    { label: "Best Venue", value: bestVenue?.mallName ?? "—", sub: bestVenue ? `RM${((bestVenue.actualSales ?? 0) / 1000).toFixed(0)}k` : "no data", icon: <Star size={16} className="text-amber-500" /> },
    { label: "Top Mission", value: MISSION_CONFIG[topMission as keyof typeof MISSION_CONFIG]?.label ?? "—", sub: `${missionCount[topMission as keyof typeof missionCount]} shows`, icon: <BarChart3 size={16} className="text-purple-500" /> },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {kpis.map((k, i) => (
        <div key={i} className="card flex items-center gap-3 py-3">
          <div className="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">{k.icon}</div>
          <div className="min-w-0">
            <div className="font-bold text-gray-900 text-sm truncate">{k.value}</div>
            <div className="text-[10px] text-gray-400">{k.label}</div>
            <div className="text-[10px] text-gray-300">{k.sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Roadshow Card ────────────────────────────────────────────────────────────
function RoadshowCard({ r, canEdit, onEdit, onDelete }: { r: Roadshow; canEdit: boolean; onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const mission = MISSION_CONFIG[r.mission as keyof typeof MISSION_CONFIG] ?? MISSION_CONFIG.conversion;
  const status  = STATUS_CONFIG[r.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
  const photos  = parseJ<string[]>(r.photoUrls, []);
  const plans   = parseJ<string[]>(r.floorPlanUrls, []);
  const partners = parseJ<Partner[]>(r.partners, []);
  const pm      = r.postMortem ? parseJ<PM>(r.postMortem, {}) : null;
  const days    = daysDiff(r.startDate, r.endDate);
  const today   = new Date().toISOString().slice(0, 10);
  const isLive  = today >= r.startDate && today <= r.endDate;

  return (
    <div className={cn("card space-y-3", isLive && "border-2 border-brand-300")}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {isLive && <span className="flex items-center gap-1 text-[10px] font-bold text-brand-600"><span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse" />LIVE</span>}
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", mission.color)}>{mission.label}</span>
            <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", status.color)}>{status.label}</span>
          </div>
          <div className="font-bold text-gray-900 mt-1">{r.mallName}</div>
          <div className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
            <Calendar size={10} />
            {fmt(r.startDate)} – {fmt(r.endDate)} · {days}d
            {r.sqFt && <span>· {r.sqFt.toLocaleString()} sq ft</span>}
            {r.pic && <span>· {r.pic}</span>}
          </div>
        </div>
        {canEdit && (
          <div className="flex gap-1 flex-shrink-0">
            <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"><Pencil size={12} /></button>
            <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={12} /></button>
          </div>
        )}
      </div>

      {/* Sales row */}
      {(r.expectedSales || r.actualSales) && (
        <div className="flex gap-3 text-xs">
          {r.expectedSales && <span className="text-gray-400">Target: <strong className="text-gray-700">RM{r.expectedSales.toLocaleString()}</strong></span>}
          {r.actualSales && <span className="text-gray-400">Actual: <strong className="text-green-600">RM{r.actualSales.toLocaleString()}</strong></span>}
          {r.expectedSales && r.actualSales && (
            <span className={cn("font-bold", r.actualSales >= r.expectedSales ? "text-green-600" : "text-red-500")}>
              {Math.round(r.actualSales / r.expectedSales * 100)}%
            </span>
          )}
        </div>
      )}

      {/* Indicator chips */}
      <div className="flex flex-wrap gap-1.5">
        {photos.length > 0 && <span className="flex items-center gap-1 text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-semibold"><Camera size={9} />{photos.length} photos</span>}
        {plans.length > 0 && <span className="flex items-center gap-1 text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-semibold"><FileText size={9} />{plans.length} floor plan{plans.length > 1 ? "s" : ""}</span>}
        {partners.length > 0 && <span className="flex items-center gap-1 text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-semibold"><Users size={9} />{partners.length} partner{partners.length > 1 ? "s" : ""}</span>}
        {pm && <span className="flex items-center gap-1 text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-semibold"><Check size={9} />Post Mortem</span>}
      </div>

      {/* Expand button */}
      <button onClick={() => setOpen(v => !v)} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors">
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {open ? "Hide details" : "View details"}
      </button>

      {/* Expanded */}
      {open && (
        <div className="pt-3 border-t border-gray-100 space-y-4">
          {/* Photo gallery */}
          {photos.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Gallery</p>
              <div className="flex gap-2 flex-wrap">
                {photos.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-20 h-20 object-cover rounded-xl border border-gray-100 hover:opacity-80 transition-opacity" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Floor plans */}
          {plans.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Floor Plans</p>
              <div className="flex flex-col gap-1.5">
                {plans.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-brand-600 hover:text-brand-700 bg-brand-50 px-3 py-2 rounded-lg transition-colors">
                    <FileText size={12} /> Floor Plan {i + 1}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Partners */}
          {partners.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Partners</p>
              <div className="space-y-1.5">
                {partners.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 text-xs">
                    <span className="font-bold text-gray-800 min-w-[80px]">{p.brandName}</span>
                    {p.category && <span className="text-gray-400">{p.category}</span>}
                    {p.attractionPower && <span className={cn("px-2 py-0.5 rounded-full font-semibold text-[10px]",
                      p.attractionPower === "high" ? "bg-green-100 text-green-700" : p.attractionPower === "medium" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"
                    )}>{p.attractionPower}</span>}
                    {p.repeatWorthy && <span className="text-green-500 font-bold text-[10px]">✓ Repeat</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Post Mortem */}
          {pm && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Post Mortem</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ["Top Category", pm.topCategory], ["Weak Category", pm.weakCategory],
                  ["Best Seller", pm.bestSeller], ["Traffic", pm.trafficObservation],
                  ["Customer Behavior", pm.customerBehavior], ["Competitor", pm.competitorObservation],
                ].filter(([, v]) => v).map(([k, v]) => (
                  <div key={k as string} className="bg-gray-50 rounded-xl p-2.5">
                    <div className="text-[10px] text-gray-400 font-semibold mb-0.5">{k as string}</div>
                    <div className="text-xs text-gray-800 font-semibold">{v as string}</div>
                  </div>
                ))}
                {pm.partnerPerformance && (
                  <div className="col-span-2 bg-gray-50 rounded-xl p-2.5">
                    <div className="text-[10px] text-gray-400 font-semibold mb-0.5">Partner Performance</div>
                    <div className="text-xs text-gray-800">{pm.partnerPerformance}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {r.notes && (
            <div className="bg-amber-50 rounded-xl p-3">
              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1">Notes</p>
              <p className="text-xs text-gray-700">{r.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Create / Edit Modal ──────────────────────────────────────────────────────
function RoadshowModal({ initial, onSave, onClose }: {
  initial?: Roadshow | null;
  onSave: (data: object) => Promise<void>;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"basic" | "gallery" | "partners" | "postmortem">("basic");
  const [form, setForm] = useState(initial ? {
    mallName: initial.mallName, startDate: initial.startDate, endDate: initial.endDate,
    sqFt: initial.sqFt?.toString() ?? "", mission: initial.mission, status: initial.status,
    pic: initial.pic ?? "", expectedSales: initial.expectedSales?.toString() ?? "",
    actualSales: initial.actualSales?.toString() ?? "", notes: initial.notes ?? "",
  } : { ...EMPTY_FORM });

  const [photos, setPhotos] = useState<string[]>(initial ? parseJ<string[]>(initial.photoUrls, []) : []);
  const [plans, setPlans]   = useState<string[]>(initial ? parseJ<string[]>(initial.floorPlanUrls, []) : []);
  const [partners, setPartners] = useState<Partner[]>(initial ? parseJ<Partner[]>(initial.partners, []) : []);
  const [pm, setPm] = useState<PM>(initial?.postMortem ? parseJ<PM>(initial.postMortem, {}) : {});
  const [newPartner, setNewPartner] = useState<Partner>({ brandName: "", category: "", attractionPower: "medium", repeatWorthy: false });

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);
  const planRef  = useRef<HTMLInputElement>(null);

  const valid = form.mallName.trim() && form.startDate && form.endDate;

  async function handleSave() {
    if (!valid) return;
    setSaving(true);
    try {
      await onSave({
        ...(initial ? { id: initial.id } : {}),
        mallName: form.mallName.trim(),
        startDate: form.startDate, endDate: form.endDate,
        sqFt: form.sqFt ? parseInt(form.sqFt) : null,
        mission: form.mission, status: form.status,
        pic: form.pic.trim() || null,
        expectedSales: form.expectedSales ? parseFloat(form.expectedSales) : null,
        actualSales: form.actualSales ? parseFloat(form.actualSales) : null,
        notes: form.notes.trim() || null,
        photoUrls: photos, floorPlanUrls: plans, partners,
        postMortem: Object.values(pm).some(v => v) ? pm : null,
      });
      onClose();
    } finally { setSaving(false); }
  }

  async function handlePhotoUpload(files: FileList | null) {
    if (!files) return;
    setUploading(true);
    try {
      const urls = await Promise.all(Array.from(files).map(f => uploadToCloudinary(f)));
      setPhotos(p => [...p, ...urls]);
    } finally { setUploading(false); }
  }

  async function handlePlanUpload(files: FileList | null) {
    if (!files) return;
    setUploading(true);
    try {
      const urls = await Promise.all(Array.from(files).map(f => uploadRawFile(f)));
      setPlans(p => [...p, ...urls]);
    } finally { setUploading(false); }
  }

  function addPartner() {
    if (!newPartner.brandName.trim()) return;
    setPartners(p => [...p, { ...newPartner }]);
    setNewPartner({ brandName: "", category: "", attractionPower: "medium", repeatWorthy: false });
  }

  const inputCls = "input w-full text-sm";
  const labelCls = "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5";
  const tabs = [
    { key: "basic",      label: "Basic" },
    { key: "gallery",    label: "Gallery" },
    { key: "partners",   label: "Partners" },
    { key: "postmortem", label: "Post Mortem" },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <h2 className="font-bold text-gray-900">{initial ? "Edit Roadshow" : "New Roadshow"}</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-gray-600" /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 shrink-0 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={cn("flex-1 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors",
                tab === t.key ? "text-brand-600 border-b-2 border-brand-500" : "text-gray-400 hover:text-gray-600")}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">

          {/* ── Basic ── */}
          {tab === "basic" && (
            <>
              <div>
                <label className={labelCls}>Mall / Venue *</label>
                <input className={inputCls} placeholder="e.g. Paradigm Mall" value={form.mallName} onChange={e => setForm(f => ({ ...f, mallName: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Start Date *</label>
                  <input type="date" className={inputCls} value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>End Date *</label>
                  <input type="date" className={inputCls} value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Mission</label>
                  <select className={inputCls} value={form.mission} onChange={e => setForm(f => ({ ...f, mission: e.target.value }))}>
                    <option value="branding">Branding</option>
                    <option value="conversion">Conversion</option>
                    <option value="clearance">Clearance</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Status</label>
                  <select className={inputCls} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Sq Ft</label>
                  <input type="number" className={inputCls} placeholder="e.g. 3200" value={form.sqFt} onChange={e => setForm(f => ({ ...f, sqFt: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>PIC</label>
                  <input className={inputCls} placeholder="Person in charge" value={form.pic} onChange={e => setForm(f => ({ ...f, pic: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Expected Sales (RM)</label>
                  <input type="number" className={inputCls} placeholder="optional" value={form.expectedSales} onChange={e => setForm(f => ({ ...f, expectedSales: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Actual Sales (RM)</label>
                  <input type="number" className={inputCls} placeholder="fill after event" value={form.actualSales} onChange={e => setForm(f => ({ ...f, actualSales: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Notes</label>
                <textarea rows={2} className={inputCls + " resize-none"} placeholder="Any notes…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </>
          )}

          {/* ── Gallery ── */}
          {tab === "gallery" && (
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Event Photos</label>
                <input ref={photoRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handlePhotoUpload(e.target.files)} />
                <button onClick={() => photoRef.current?.click()} disabled={uploading}
                  className="btn-secondary w-full py-3 flex items-center justify-center gap-2 text-sm">
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                  {uploading ? "Uploading…" : "Upload Photos"}
                </button>
                {photos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {photos.map((url, i) => (
                      <div key={i} className="relative group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="w-full h-24 object-cover rounded-xl" />
                        <button onClick={() => setPhotos(p => p.filter((_, j) => j !== i))}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className={labelCls}>Floor Plans (PDF / Image)</label>
                <input ref={planRef} type="file" accept="image/*,.pdf" multiple className="hidden" onChange={e => handlePlanUpload(e.target.files)} />
                <button onClick={() => planRef.current?.click()} disabled={uploading}
                  className="btn-secondary w-full py-3 flex items-center justify-center gap-2 text-sm">
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  {uploading ? "Uploading…" : "Upload Floor Plan"}
                </button>
                {plans.map((url, i) => (
                  <div key={i} className="flex items-center gap-2 mt-2 bg-gray-50 rounded-xl px-3 py-2">
                    <FileText size={12} className="text-gray-400" />
                    <span className="text-xs text-gray-600 flex-1 truncate">Floor Plan {i + 1}</span>
                    <button onClick={() => setPlans(p => p.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600"><X size={12} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Partners ── */}
          {tab === "partners" && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Add Partner</p>
                <input className={inputCls} placeholder="Brand name *" value={newPartner.brandName} onChange={e => setNewPartner(p => ({ ...p, brandName: e.target.value }))} />
                <div className="grid grid-cols-2 gap-2">
                  <input className={inputCls} placeholder="Category (Shoes…)" value={newPartner.category} onChange={e => setNewPartner(p => ({ ...p, category: e.target.value }))} />
                  <select className={inputCls} value={newPartner.attractionPower} onChange={e => setNewPartner(p => ({ ...p, attractionPower: e.target.value }))}>
                    <option value="high">High Attraction</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={newPartner.repeatWorthy} onChange={e => setNewPartner(p => ({ ...p, repeatWorthy: e.target.checked }))} className="accent-brand-500" />
                  Repeat Worthy
                </label>
                <button onClick={addPartner} disabled={!newPartner.brandName.trim()} className="btn-primary text-xs px-3 py-2 flex items-center gap-1.5 disabled:opacity-50">
                  <Plus size={12} /> Add Partner
                </button>
              </div>
              {partners.length > 0 && (
                <div className="space-y-2">
                  {partners.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-3 py-2.5 text-xs">
                      <span className="font-bold text-gray-800 flex-1">{p.brandName}</span>
                      {p.category && <span className="text-gray-400">{p.category}</span>}
                      {p.attractionPower && <span className={cn("px-2 py-0.5 rounded-full font-semibold text-[10px]",
                        p.attractionPower === "high" ? "bg-green-100 text-green-700" : p.attractionPower === "medium" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"
                      )}>{p.attractionPower}</span>}
                      {p.repeatWorthy && <span className="text-green-500 font-bold">✓</span>}
                      <button onClick={() => setPartners(ps => ps.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 ml-1"><X size={11} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Post Mortem ── */}
          {tab === "postmortem" && (
            <div className="space-y-3">
              <div className="bg-amber-50 rounded-xl px-3 py-2.5 text-xs text-amber-700 font-semibold">Fill after the roadshow ends — this becomes your intelligence archive.</div>
              {([
                ["topCategory",           "Top Category",            "e.g. Belt"],
                ["weakCategory",          "Weak Category",           "e.g. Luggage"],
                ["bestSeller",            "Best Seller SKU",         "e.g. Auto Card Holder Black"],
                ["trafficObservation",    "Traffic Observation",     "e.g. Peak hours 3–6pm"],
                ["customerBehavior",      "Customer Behavior",       "e.g. Touch and feel before buying"],
                ["competitorObservation", "Competitor Observation",  "e.g. Braun Buffel busy on weekends"],
                ["partnerPerformance",    "Partner Performance",     "e.g. Hush Puppies drove traffic"],
              ] as [keyof PM, string, string][]).map(([key, label, ph]) => (
                <div key={key}>
                  <label className={labelCls}>{label}</label>
                  <input className={inputCls} placeholder={ph} value={pm[key] ?? ""}
                    onChange={e => setPm(p => ({ ...p, [key]: e.target.value }))} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 flex gap-3 shrink-0">
          <button onClick={onClose} className="btn-secondary flex-1 py-2.5">Cancel</button>
          <button onClick={handleSave} disabled={!valid || saving}
            className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {initial ? "Save Changes" : "Create Roadshow"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Calendar View ────────────────────────────────────────────────────────────
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MISSION_DOT: Record<string, string> = {
  branding:   "bg-purple-400",
  conversion: "bg-green-400",
  clearance:  "bg-orange-400",
};

function CalendarView({ list }: { list: Roadshow[] }) {
  const [year, setYear]   = useState(2026);
  const [month, setMonth] = useState(new Date().getMonth()); // 0-indexed

  function prevMonth() { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }
  function nextMonth() { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }

  // Days in month grid
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Shift so Monday=0
  const startOffset = (firstDay + 6) % 7;

  // Get roadshows active on a given day
  function activeOn(day: number): Roadshow[] {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return list.filter(r => r.startDate <= dateStr && r.endDate >= dateStr);
  }

  // Month summary: all roadshows that overlap this month
  const monthStart = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const monthEnd   = `${year}-${String(month + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;
  const monthShows = list.filter(r => r.startDate <= monthEnd && r.endDate >= monthStart);

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors text-gray-600 font-bold">‹</button>
        <div className="text-center">
          <div className="font-black text-gray-900 text-lg">{MONTHS[month]} {year}</div>
          <div className="text-xs text-gray-400">{monthShows.length} roadshow{monthShows.length !== 1 ? "s" : ""} this month</div>
        </div>
        <button onClick={nextMonth} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors text-gray-600 font-bold">›</button>
      </div>

      {/* Day grid */}
      <div className="card p-0 overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => (
            <div key={d} className="text-center text-[10px] font-bold text-gray-400 py-2">{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {/* Empty cells before start */}
          {Array.from({ length: startOffset }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[80px] border-b border-r border-gray-50 bg-gray-50/50" />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const shows = activeOn(day);
            const isToday = dateStr === todayStr;
            const col = (startOffset + i) % 7;
            const isWeekend = col >= 5;

            return (
              <div key={day} className={cn(
                "min-h-[80px] border-b border-r border-gray-100 p-1.5 transition-colors",
                isWeekend ? "bg-gray-50/40" : "bg-white",
                shows.length > 0 && "bg-brand-50/20"
              )}>
                <div className={cn(
                  "text-xs font-bold mb-1 w-6 h-6 flex items-center justify-center rounded-full",
                  isToday ? "bg-brand-500 text-white" : "text-gray-600"
                )}>{day}</div>
                <div className="space-y-0.5">
                  {shows.slice(0, 3).map(r => (
                    <div key={r.id} className={cn(
                      "text-[9px] font-semibold px-1 py-0.5 rounded text-white truncate",
                      r.mission === "branding" ? "bg-purple-400" : r.mission === "clearance" ? "bg-orange-400" : "bg-green-500"
                    )} title={r.mallName}>
                      {r.mallName.replace(" Mall","").replace(" University","U.").split(" ").slice(0,2).join(" ")}
                    </div>
                  ))}
                  {shows.length > 3 && (
                    <div className="text-[9px] text-gray-400 font-semibold">+{shows.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Month roadshow list */}
      {monthShows.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{MONTHS[month]} Roadshows</p>
          {[...monthShows].sort((a, b) => a.startDate.localeCompare(b.startDate)).map(r => {
            const mission = MISSION_CONFIG[r.mission as keyof typeof MISSION_CONFIG] ?? MISSION_CONFIG.conversion;
            const status  = STATUS_CONFIG[r.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
            return (
              <div key={r.id} className="card py-2.5 flex items-center gap-3">
                <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", MISSION_DOT[r.mission] ?? "bg-gray-300")} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-900 text-sm">{r.mallName}</span>
                    <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", mission.color)}>{mission.label}</span>
                    <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", status.color)}>{status.label}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {fmt(r.startDate)} – {fmt(r.endDate)}
                    {r.notes && <span> · {r.notes}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="font-semibold">Legend:</span>
        {[["conversion","bg-green-500","Conversion"],["branding","bg-purple-400","Branding"],["clearance","bg-orange-400","Clearance"]].map(([,bg,label])=>(
          <span key={label} className="flex items-center gap-1.5"><span className={cn("w-3 h-3 rounded-sm",bg)} />{label}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function RoadshowHubPage() {
  const { user } = useAuth();
  const { data, loading, refetch } = useData<Roadshow[]>("/api/roadshows");
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Roadshow | null>(null);
  const [tab, setTab] = useState<"all" | "upcoming" | "completed" | "calendar">("all");

  const canEdit = ["admin", "manager"].includes(user?.role ?? "");
  const list = data ?? [];
  const today = new Date().toISOString().slice(0, 10);

  const filtered = list.filter(r => {
    if (tab === "upcoming")  return r.status !== "completed" && r.endDate >= today;
    if (tab === "completed") return r.status === "completed" || r.endDate < today;
    return true;
  });

  async function handleSave(form: object & { id?: string }) {
    if ((form as { id?: string }).id) {
      const { id, ...rest } = form as { id: string };
      await apiFetch(`/api/roadshows/${id}`, { method: "PATCH", body: JSON.stringify(rest) });
    } else {
      await apiFetch("/api/roadshows", { method: "POST", body: JSON.stringify(form) });
    }
    refetch();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this roadshow?")) return;
    await apiFetch(`/api/roadshows/${id}`, { method: "DELETE", body: JSON.stringify({}) });
    refetch();
  }

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <MapPin size={20} className="text-brand-500" /> Roadshow Hub
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Offline traffic · Retail intelligence · Post mortem archive</p>
        </div>
        {canEdit && (
          <button onClick={() => { setEditTarget(null); setShowModal(true); }}
            className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
            <Plus size={14} /> New Roadshow
          </button>
        )}
      </div>

      {/* KPI */}
      {list.length > 0 && <KpiBar list={list} />}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {([
          { key: "all",       label: `All (${list.length})` },
          { key: "upcoming",  label: `Upcoming (${list.filter(r => r.status !== "completed" && r.endDate >= today).length})` },
          { key: "completed", label: `Completed (${list.filter(r => r.status === "completed" || r.endDate < today).length})` },
          { key: "calendar",  label: "📅 Calendar" },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn("flex-1 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap",
              tab === t.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Calendar View */}
      {tab === "calendar" && <CalendarView list={list} />}

      {/* Cards */}
      {tab !== "calendar" && loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gray-300" size={28} /></div>
      ) : tab !== "calendar" && filtered.length === 0 ? (
        <div className="card text-center py-14 border-2 border-dashed border-gray-200">
          <MapPin size={32} className="text-gray-200 mx-auto mb-3" />
          <p className="font-semibold text-gray-500">No roadshows yet</p>
          <p className="text-sm text-gray-400 mt-1">Start building your roadshow intelligence archive.</p>
          {canEdit && (
            <button onClick={() => { setEditTarget(null); setShowModal(true); }}
              className="btn-primary text-sm px-4 py-2 mt-4 inline-flex items-center gap-2">
              <Plus size={14} /> Create First Roadshow
            </button>
          )}
        </div>
      ) : tab !== "calendar" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(r => (
            <RoadshowCard key={r.id} r={r} canEdit={canEdit}
              onEdit={() => { setEditTarget(r); setShowModal(true); }}
              onDelete={() => handleDelete(r.id)} />
          ))}
        </div>
      ) : null}

      {showModal && (
        <RoadshowModal
          initial={editTarget}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
        />
      )}
    </div>
  );
}
