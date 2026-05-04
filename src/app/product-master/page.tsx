"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { useData, apiFetch } from "@/hooks/useData";
import {
  Search, Plus, X, ChevronDown, ChevronUp, Loader2, Package,
  Camera, ExternalLink, CheckCircle2, Archive, Pencil, Trash2, BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────
type ProductMedia = { id: string; type: string; url: string; isPrimary: boolean; sortOrder: number };
type PM = {
  id: string; sku: string; name: string; category: string; useCase: string;
  series: string; price: number; status: string; barcode: string | null;
  mainImageUrl: string | null; mediaFolderUrl: string | null;
  sellingPoints: string; shortPitch: string | null;
  warRoomId: string | null; createdAt: string; updatedAt: string;
  media: ProductMedia[];
};

// ─── Constants ───────────────────────────────────────────────────────────────
const CATEGORIES = ["bag", "belt", "wallet", "travel", "accessory"];
const USE_CASES  = ["work", "travel", "daily", "gift"];
const SERIES     = ["daily", "core", "pro"];
const STATUSES   = ["selling", "archive"];

const CAT_LABEL: Record<string, string> = {
  bag: "Bag", belt: "Belt", wallet: "Wallet", travel: "Travel", accessory: "Accessory",
};
const UC_LABEL: Record<string, string> = {
  work: "Work", travel: "Travel", daily: "Daily", gift: "Gift",
};
const SERIES_COLOR: Record<string, string> = {
  daily: "bg-blue-50 text-blue-600",
  core:  "bg-amber-50 text-amber-600",
  pro:   "bg-purple-50 text-purple-600",
};
const STATUS_COLOR: Record<string, string> = {
  selling: "bg-green-100 text-green-700",
  archive: "bg-gray-100 text-gray-500",
};

const SELLING_POINTS_OPTIONS = [
  "Lightweight", "Slim", "Large Capacity", "Multi Compartment",
  "Premium Look", "Durable", "Waterproof", "Easy Access",
  "Versatile", "Stylish",
];

// ─── Cloudinary upload ───────────────────────────────────────────────────────
async function uploadImage(file: File): Promise<string> {
  const img   = new Image();
  const blobUrl = URL.createObjectURL(file);
  await new Promise<void>(res => { img.onload = () => res(); img.src = blobUrl; });
  const MAX = 800;
  const scale = Math.min(MAX / img.width, MAX / img.height, 1);
  const canvas = document.createElement("canvas");
  canvas.width  = Math.round(img.width  * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(blobUrl);
  const blob = await new Promise<Blob>(res => canvas.toBlob(b => res(b!), "image/jpeg", 0.82));
  const fd = new FormData();
  fd.append("file", blob, "photo.jpg");
  fd.append("upload_preset", "jackstudio_upload");
  const r = await fetch("https://api.cloudinary.com/v1_1/ds0ka66z1/image/upload", { method: "POST", body: fd });
  if (!r.ok) throw new Error("Image upload failed");
  return (await r.json()).secure_url as string;
}

// ─── Empty State ─────────────────────────────────────────────────────────────
function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="text-center py-20">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl mx-auto flex items-center justify-center mb-4">
        <Package size={28} className="text-gray-300" />
      </div>
      <p className="font-semibold text-gray-500">
        {filtered ? "No products match your filters" : "Product Master is empty"}
      </p>
      <p className="text-sm text-gray-400 mt-1">
        {filtered ? "Try a different search or filter" : "Add your first product or promote from War Room"}
      </p>
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({ p, onEdit, onArchive, onDelete, canEdit }: {
  p: PM;
  onEdit: (p: PM) => void;
  onArchive: (p: PM) => void;
  onDelete: (id: string) => void;
  canEdit: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const sp: string[] = (() => { try { return JSON.parse(p.sellingPoints); } catch { return []; } })();
  const thumb = p.mainImageUrl ?? p.media.find(m => m.isPrimary)?.url ?? p.media[0]?.url ?? null;

  return (
    <div className={cn("card space-y-3 cursor-pointer hover:shadow-md transition-all",
      p.status === "archive" && "opacity-60")}>
      {/* Image */}
      <div onClick={() => setExpanded(e => !e)}>
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt={p.name} className="w-full h-40 object-cover rounded-xl" />
        ) : (
          <div className="w-full h-40 bg-gray-100 rounded-xl flex items-center justify-center">
            <Package size={32} className="text-gray-300" />
          </div>
        )}
      </div>

      {/* Header */}
      <div onClick={() => setExpanded(e => !e)}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">{p.sku}</div>
            <div className="font-bold text-gray-900 text-sm leading-tight mt-0.5">{p.name}</div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="font-black text-brand-600 text-sm">RM{p.price.toFixed(0)}</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mt-1.5">
          <span className={cn("badge capitalize", SERIES_COLOR[p.series] ?? "bg-gray-50 text-gray-500")}>{p.series}</span>
          <span className="badge bg-gray-100 text-gray-600 capitalize">{CAT_LABEL[p.category] ?? p.category}</span>
          <span className="badge bg-blue-50 text-blue-600 capitalize">{UC_LABEL[p.useCase] ?? p.useCase}</span>
          <span className={cn("badge capitalize", STATUS_COLOR[p.status] ?? "bg-gray-100 text-gray-500")}>{p.status}</span>
        </div>
      </div>

      {/* Selling points — always show top 3 */}
      {sp.length > 0 && (
        <div onClick={() => setExpanded(e => !e)} className="flex flex-wrap gap-1">
          {sp.slice(0, 3).map(s => (
            <span key={s} className="text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">✔ {s}</span>
          ))}
          {sp.length > 3 && <span className="text-[10px] text-gray-400">+{sp.length - 3} more</span>}
        </div>
      )}

      {/* Short pitch */}
      {p.shortPitch && (
        <p onClick={() => setExpanded(e => !e)} className="text-xs text-gray-500 italic">"{p.shortPitch}"</p>
      )}

      {/* Expand toggle */}
      <button onClick={() => setExpanded(e => !e)}
        className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600 font-semibold">
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {expanded ? "Less" : "More details"}
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="space-y-3 border-t border-gray-100 pt-3">
          {/* All media */}
          {p.media.length > 1 && (
            <div className="grid grid-cols-3 gap-1">
              {p.media.map((m) => (
                m.type === "image"
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img key={m.id} src={m.url} alt="" className="w-full h-20 object-cover rounded-lg" />
                  : <video key={m.id} src={m.url} className="w-full h-20 object-cover rounded-lg" controls />
              ))}
            </div>
          )}

          {/* All selling points */}
          {sp.length > 3 && (
            <div className="flex flex-wrap gap-1">
              {sp.slice(3).map(s => (
                <span key={s} className="text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">✔ {s}</span>
              ))}
            </div>
          )}

          {/* Barcode */}
          {p.barcode && (
            <div className="text-xs text-gray-500">Barcode: <span className="font-mono font-semibold text-gray-700">{p.barcode}</span></div>
          )}

          {/* Media folder link */}
          {p.mediaFolderUrl && (
            <a href={p.mediaFolderUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-600 font-semibold">
              <ExternalLink size={11} /> Open Media Folder
            </a>
          )}

          {/* Actions */}
          {canEdit && (
            <div className="flex gap-2 pt-1">
              <button onClick={() => onEdit(p)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-600 text-xs font-semibold rounded-lg transition-colors">
                <Pencil size={11} /> Edit
              </button>
              <button onClick={() => onArchive(p)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold rounded-lg transition-colors">
                {p.status === "archive" ? <CheckCircle2 size={11} /> : <Archive size={11} />}
                {p.status === "archive" ? "Unarchive" : "Archive"}
              </button>
              <button onClick={() => onDelete(p.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-500 text-xs font-semibold rounded-lg transition-colors">
                <Trash2 size={11} /> Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Add / Edit Modal ────────────────────────────────────────────────────────
const BLANK_FORM = {
  name: "", category: "bag", useCase: "daily", series: "core",
  price: "", barcode: "", mainImageUrl: "", mediaFolderUrl: "",
  sellingPoints: [] as string[], shortPitch: "", sku: "",
};

function ProductModal({ initial, draft, onClose, onSaved }: {
  initial?: PM | null;
  draft?: typeof BLANK_FORM | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState(initial ? {
    name: initial.name, category: initial.category, useCase: initial.useCase,
    series: initial.series, price: String(initial.price),
    barcode: initial.barcode ?? "", mainImageUrl: initial.mainImageUrl ?? "",
    mediaFolderUrl: initial.mediaFolderUrl ?? "",
    sellingPoints: (() => { try { return JSON.parse(initial.sellingPoints); } catch { return []; } })(),
    shortPitch: initial.shortPitch ?? "", sku: initial.sku,
  } : draft ? { ...draft } : { ...BLANK_FORM });

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function toggleSP(sp: string) {
    setForm(f => ({
      ...f,
      sellingPoints: f.sellingPoints.includes(sp)
        ? f.sellingPoints.filter((s: string) => s !== sp)
        : [...f.sellingPoints, sp],
    }));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setForm(f => ({ ...f, mainImageUrl: url }));
    } catch { setError("Image upload failed"); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  }

  async function submit() {
    if (!form.name.trim() || !form.sku.trim()) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        sku: form.sku.trim(),
        name: form.name.trim(), category: form.category, useCase: form.useCase,
        series: form.series, price: parseFloat(form.price) || 0,
        barcode: form.barcode.trim() || null,
        mainImageUrl: form.mainImageUrl.trim() || null,
        mediaFolderUrl: form.mediaFolderUrl.trim() || null,
        sellingPoints: form.sellingPoints,
        shortPitch: form.shortPitch.trim() || null,
      };
      if (isEdit) {
        await apiFetch(`/api/product-master/${initial!.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await apiFetch("/api/product-master", { method: "POST", body: JSON.stringify(payload) });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally { setSaving(false); }
  }

  const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-brand-400 bg-white";
  const f = form;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
            <BookOpen size={18} className="text-brand-500" />
            {isEdit ? "Edit Product" : "Add to Master"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Main image */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Main Photo</label>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            {f.mainImageUrl ? (
              <div className="relative w-full h-40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.mainImageUrl} alt="" className="w-full h-40 object-cover rounded-xl" />
                <button onClick={() => setForm(frm => ({ ...frm, mainImageUrl: "" }))}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white text-sm">
                  <X size={13} />
                </button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="w-full h-28 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-brand-300 hover:text-brand-500 transition-all disabled:opacity-50">
                {uploading ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />}
                <span className="text-xs font-medium">{uploading ? "Uploading…" : "Upload main photo"}</span>
              </button>
            )}
          </div>

          {/* Name + SKU */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Product Name *</label>
              <input className={inputCls} placeholder="e.g. Core Sling V2"
                value={f.name} onChange={e => setForm(frm => ({ ...frm, name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">SKU *</label>
              <input className={inputCls} placeholder="e.g. BAI-001"
                value={f.sku} onChange={e => setForm(frm => ({ ...frm, sku: e.target.value.toUpperCase() }))} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Price (RM)</label>
              <input className={inputCls} type="number" placeholder="0"
                value={f.price} onChange={e => setForm(frm => ({ ...frm, price: e.target.value }))} />
            </div>
          </div>

          {/* Category / Use Case / Series */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Category</label>
              <select className={inputCls} value={f.category} onChange={e => setForm(frm => ({ ...frm, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Use Case</label>
              <select className={inputCls} value={f.useCase} onChange={e => setForm(frm => ({ ...frm, useCase: e.target.value }))}>
                {USE_CASES.map(u => <option key={u} value={u}>{UC_LABEL[u]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Series</label>
              <select className={inputCls} value={f.series} onChange={e => setForm(frm => ({ ...frm, series: e.target.value }))}>
                {SERIES.map(s => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
          </div>

          {/* Selling Points */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Selling Points</label>
            <div className="flex flex-wrap gap-1.5">
              {SELLING_POINTS_OPTIONS.map(sp => (
                <button key={sp} type="button" onClick={() => toggleSP(sp)}
                  className={cn("px-2.5 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all",
                    f.sellingPoints.includes(sp)
                      ? "bg-green-500 text-white border-green-500"
                      : "bg-white text-gray-500 border-gray-200 hover:border-green-300")}>
                  {sp}
                </button>
              ))}
            </div>
          </div>

          {/* Short pitch */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Short Pitch</label>
            <input className={inputCls} placeholder="One-liner for your sales team…"
              value={f.shortPitch} onChange={e => setForm(frm => ({ ...frm, shortPitch: e.target.value }))} />
          </div>

          {/* Barcode + Media folder */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Barcode</label>
              <input className={inputCls} placeholder="Optional"
                value={f.barcode} onChange={e => setForm(frm => ({ ...frm, barcode: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Media Folder URL</label>
              <input className={inputCls} placeholder="Google Drive link…"
                value={f.mediaFolderUrl} onChange={e => setForm(frm => ({ ...frm, mediaFolderUrl: e.target.value }))} />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">{error}</div>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={submit} disabled={saving || !f.name.trim() || !f.sku.trim()}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors text-sm">
              {saving && <Loader2 size={15} className="animate-spin" />}
              {isEdit ? "Save Changes" : "Add to Master"}
            </button>
            <button onClick={onClose}
              className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold rounded-xl transition-colors text-sm">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function ProductMasterPage() {
  const [q, setQ]                   = useState("");
  const [catFilter, setCatFilter]   = useState("");
  const [ucFilter, setUcFilter]     = useState("");
  const [seriesFilter, setSeriesFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("selling");
  const [showModal, setShowModal]       = useState(false);
  const [editTarget, setEditTarget]     = useState<PM | null>(null);
  const [promoteDraft, setPromoteDraft] = useState<typeof BLANK_FORM | null>(null);

  // Pick up War Room promote draft
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("promote") === "1") {
      try {
        const raw = sessionStorage.getItem("pm_draft");
        if (raw) {
          setPromoteDraft(JSON.parse(raw) as typeof BLANK_FORM);
          setShowModal(true);
          sessionStorage.removeItem("pm_draft");
          window.history.replaceState({}, "", "/product-master");
        }
      } catch { /* */ }
    }
  }, []);

  const params = new URLSearchParams();
  if (q)            params.set("q", q);
  if (catFilter)    params.set("category", catFilter);
  if (ucFilter)     params.set("useCase", ucFilter);
  if (seriesFilter) params.set("series", seriesFilter);
  if (statusFilter) params.set("status", statusFilter);

  const url = `/api/product-master?${params.toString()}`;
  const { data, loading, refetch } = useData<PM[]>(url, [q, catFilter, ucFilter, seriesFilter, statusFilter]);
  const products = data ?? [];

  const isFiltered = !!(q || catFilter || ucFilter || seriesFilter);

  async function handleArchive(p: PM) {
    const newStatus = p.status === "archive" ? "selling" : "archive";
    await apiFetch(`/api/product-master/${p.id}`, {
      method: "PATCH", body: JSON.stringify({ status: newStatus }),
    });
    refetch();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this product from the master list?")) return;
    await apiFetch(`/api/product-master/${id}`, { method: "DELETE" });
    refetch();
  }

  const handleSaved = useCallback(() => { refetch(); setEditTarget(null); }, [refetch]);

  const filterBtn = (label: string, active: boolean, onClick: () => void, color = "brand") => (
    <button onClick={onClick}
      className={cn("px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all capitalize",
        active
          ? color === "brand" ? "bg-brand-500 text-white border-brand-500 shadow-sm"
            : color === "blue"   ? "bg-blue-500 text-white border-blue-500 shadow-sm"
            : color === "purple" ? "bg-purple-500 text-white border-purple-500 shadow-sm"
            : "bg-green-500 text-white border-green-500 shadow-sm"
          : "bg-white text-gray-500 border-gray-200 hover:border-gray-300")}>
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen size={22} className="text-brand-500" /> Product Master
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Official product catalog — {products.length} product{products.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => { setEditTarget(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={q} onChange={e => setQ(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-brand-400"
          placeholder="Search by SKU, name, or barcode…"
        />
        {q && (
          <button onClick={() => setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="space-y-2">
        {/* Status */}
        <div className="flex gap-1.5 flex-wrap">
          {filterBtn("All", statusFilter === "", () => setStatusFilter(""), "brand")}
          {filterBtn("Selling", statusFilter === "selling", () => setStatusFilter("selling"), "green")}
          {filterBtn("Archive", statusFilter === "archive", () => setStatusFilter("archive"), "brand")}
        </div>

        {/* Category */}
        <div className="flex gap-1.5 flex-wrap">
          {filterBtn("All Categories", catFilter === "", () => setCatFilter(""), "brand")}
          {CATEGORIES.map(c => filterBtn(CAT_LABEL[c], catFilter === c, () => setCatFilter(catFilter === c ? "" : c), "brand"))}
        </div>

        {/* Use Case */}
        <div className="flex gap-1.5 flex-wrap">
          {filterBtn("All Use Cases", ucFilter === "", () => setUcFilter(""), "blue")}
          {USE_CASES.map(u => filterBtn(UC_LABEL[u], ucFilter === u, () => setUcFilter(ucFilter === u ? "" : u), "blue"))}
        </div>

        {/* Series */}
        <div className="flex gap-1.5 flex-wrap">
          {filterBtn("All Series", seriesFilter === "", () => setSeriesFilter(""), "purple")}
          {SERIES.map(s => filterBtn(s.charAt(0).toUpperCase() + s.slice(1), seriesFilter === s, () => setSeriesFilter(seriesFilter === s ? "" : s), "purple"))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gray-300" size={32} /></div>
      ) : products.length === 0 ? (
        <EmptyState filtered={isFiltered || statusFilter !== ""} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(p => (
            <ProductCard key={p.id} p={p}
              onEdit={setEditTarget}
              onArchive={handleArchive}
              onDelete={handleDelete}
              canEdit={true}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {(showModal || editTarget) && (
        <ProductModal
          initial={editTarget}
          draft={!editTarget ? promoteDraft : null}
          onClose={() => { setShowModal(false); setEditTarget(null); setPromoteDraft(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
