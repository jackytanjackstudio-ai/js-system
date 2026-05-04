"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { useData, apiFetch } from "@/hooks/useData";
import { useAuth } from "@/context/AuthContext";
import {
  Sword, PackagePlus, FlaskConical, BookMarked, Brain, BarChart3,
  Star, Loader2, ArrowRight, CheckCircle2, XCircle, ChevronDown, ChevronUp,
  ChevronLeft, ChevronRight, X as XIcon, TrendingUp, AlertTriangle, Package, Camera, ThumbsUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────
type ValidationEntry = {
  id: string; outletId: string; outletName: string;
  confidenceScore: number; wouldSell: boolean;
  expectedSales: number; reason: string | null;
};
type ReservationEntry = {
  id: string; outletId: string; outletName: string; quantity: number;
};
type Product = {
  id: string; name: string; category: string; status: string; stage: string;
  hitRate: number; signalSource: string | null; notes: string | null;
  decisionDate: string | null; tasks: string;
  targetPrice: number | null; cost: number | null; imageUrl: string | null;
  imageUrls: string; productCode: string | null;
  useCase: string; style: string | null; material: string | null;
  colours: string; targetQty: number | null;
  brand: string | null; promotions: string; sellingPoints: string; demandScore: number;
  validations: ValidationEntry[];
  reservations: ReservationEntry[];
};

function getImages(p: Pick<Product, "imageUrl" | "imageUrls">): string[] {
  try {
    const arr = JSON.parse(p.imageUrls || "[]") as string[];
    if (arr.length > 0) return arr.slice(0, 4);
  } catch { /* */ }
  return p.imageUrl ? [p.imageUrl] : [];
}
type Outlet = { id: string; name: string; isActive: boolean };
type Tab = "sourcing" | "validation" | "reservation" | "decision" | "tracking";

const CATEGORIES   = ["Wallet", "Card Holder", "Bag", "Luggage", "Accessories", "Gift", "Other"];
const USE_CASES    = ["Work", "Travel", "Daily", "Gift"];
const SELLING_POINTS = ["Simple", "Slim", "Large Capacity", "Multi Compartment", "Premium Look", "Lightweight"];
const SALES_OPTIONS = [5, 10, 20, 30, 50, 100];
const BRANDS = ["Euro Polo", "Jack Studio", "Lancaster Polo"];

const PROMOTIONS   = [
  { value: "Discount",   emoji: "🏷️" },
  { value: "Free Gift",  emoji: "🎁" },
  { value: "Add On",     emoji: "➕" },
  { value: "Best Buy",   emoji: "⭐" },
];

// ─── Cloudinary helpers ─────────────────────────────────────────────────────
function resizeToBlob(file: File): Promise<Blob> {
  return new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 800;
      const scale = Math.min(MAX / img.width, MAX / img.height, 1);
      const canvas = document.createElement("canvas");
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob(blob => resolve(blob!), "image/jpeg", 0.80);
    };
    img.src = url;
  });
}

async function uploadToCloudinary(file: File): Promise<string> {
  const blob = await resizeToBlob(file);
  const fd = new FormData();
  fd.append("file", blob, "photo.jpg");
  fd.append("upload_preset", "jackstudio_upload");
  const res = await fetch("https://api.cloudinary.com/v1_1/ds0ka66z1/image/upload", { method: "POST", body: fd });
  if (!res.ok) throw new Error("Upload failed");
  return (await res.json()).secure_url as string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function margin(target: number | null, cost: number | null): number | null {
  if (!target || !cost || target === 0) return null;
  return Math.round(((target - cost) / target) * 100);
}

function computeDecision(p: Product) {
  const demand = p.demandScore;
  const avgConf = p.validations.length > 0
    ? p.validations.reduce((s, v) => s + v.confidenceScore, 0) / p.validations.length / 5 * 100
    : 0;
  const totalRes = p.reservations.reduce((s, r) => s + r.quantity, 0);
  const resScore = Math.min(totalRes / 50, 1) * 100;
  const final = Math.round(demand * 0.4 + avgConf * 0.3 + resScore * 0.3);
  const go = final >= 75 ? "go_bullet" : final >= 55 ? "go_conservative" : "no_go";
  const orderQty = go === "go_bullet" ? Math.max(Math.ceil(totalRes * 1.2), 50)
    : go === "go_conservative" ? Math.max(Math.ceil(totalRes * 0.8), 20) : 0;
  const channels = [...p.reservations].sort((a, b) => b.quantity - a.quantity).slice(0, 3).map(r => r.outletName);
  return { demand, avgConf: Math.round(avgConf), totalRes, resScore: Math.round(resScore), final, go, orderQty, channels };
}

// ─── Sub-components ─────────────────────────────────────────────────────────
function StarsInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button key={i} onClick={() => onChange(i)} type="button">
          <Star size={20} className={i <= value ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"} />
        </button>
      ))}
    </div>
  );
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-xs font-bold text-gray-700">{value}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function ImageUploader({ onUpload }: { onUpload: (url: string) => Promise<void> }) {
  const [processing, setProcessing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setProcessing(true);
    try {
      const url = await uploadToCloudinary(file);
      await onUpload(url);
    } finally {
      setProcessing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
      <button onClick={() => fileRef.current?.click()} disabled={processing}
        className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center gap-2 text-gray-400 hover:border-brand-300 hover:text-brand-500 transition-all disabled:opacity-50 text-xs font-semibold">
        {processing ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
        {processing ? "Uploading…" : "Upload Image"}
      </button>
    </>
  );
}

function EmptyState({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="text-center py-16 space-y-3">
      <div className="w-14 h-14 bg-gray-100 rounded-2xl mx-auto flex items-center justify-center">{icon}</div>
      <p className="font-semibold text-gray-500">{title}</p>
      <p className="text-sm text-gray-400 max-w-xs mx-auto">{sub}</p>
    </div>
  );
}

// ─── Tab 1: Sourcing Pool ───────────────────────────────────────────────────
function SourcingPool({ products, onAdvance, onDelete, onUploadImage, canEdit }: {
  products: Product[];
  onAdvance: (id: string, status: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUploadImage: (id: string, url: string) => Promise<void>;
  canEdit: boolean;
}) {
  const [lightbox, setLightbox] = useState<{ urls: string[]; index: number } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [ucFilter, setUcFilter]       = useState<string>("All");
  const [brandFilter, setBrandFilter] = useState<string>("All");

  const activeBrands = Array.from(new Set(products.map(p => p.brand).filter(Boolean))) as string[];

  const filtered = products.filter(p => {
    const uc: string[] = (() => { try { return JSON.parse(p.useCase); } catch { return []; } })();
    const ucOk = ucFilter === "All" || uc.includes(ucFilter);
    const brandOk = brandFilter === "All" || p.brand === brandFilter;
    return ucOk && brandOk;
  });

  if (!products.length)
    return <EmptyState icon={<PackagePlus size={28} className="text-gray-300" />} title="Sourcing pool is empty" sub="Add products you're considering to evaluate them through the system." />;

  return (
    <>
    {/* Brand Tabs */}
    {activeBrands.length > 0 && (
      <div className="flex gap-1.5 flex-wrap mb-2">
        {["All", ...activeBrands].map(b => (
          <button key={b} onClick={() => setBrandFilter(b)}
            className={cn("px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border-2",
              brandFilter === b
                ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                : "bg-white text-gray-500 border-gray-200 hover:border-amber-300")}>
            {b}
            {b !== "All" && (
              <span className="ml-1 opacity-60">
                ({products.filter(p => p.brand === b).length})
              </span>
            )}
          </button>
        ))}
      </div>
    )}

    {/* Use Case Tabs */}
    <div className="flex gap-1.5 flex-wrap mb-4">
      {["All", ...USE_CASES].map(uc => (
        <button key={uc} onClick={() => setUcFilter(uc)}
          className={cn("px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border-2",
            ucFilter === uc
              ? "bg-blue-500 text-white border-blue-500 shadow-sm"
              : "bg-white text-gray-500 border-gray-200 hover:border-blue-300")}>
          {uc}
          {uc !== "All" && (
            <span className="ml-1 opacity-60">
              ({products.filter(p => { const u: string[] = (() => { try { return JSON.parse(p.useCase); } catch { return []; } })(); return u.includes(uc); }).length})
            </span>
          )}
        </button>
      ))}
    </div>

    {filtered.length === 0 && (
      <div className="text-center py-8 text-sm text-gray-400">No products match the selected filters</div>
    )}

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {filtered.map(p => {
        const m = margin(p.targetPrice, p.cost);
        const uc: string[] = (() => { try { return JSON.parse(p.useCase); } catch { return []; } })();
        const sp: string[] = (() => { try { return JSON.parse(p.sellingPoints || "[]"); } catch { return []; } })();
        const colours: string[] = (() => { try { return JSON.parse(p.colours || "[]"); } catch { return []; } })();
        const promos: string[] = (() => { try { return JSON.parse(p.promotions || "[]"); } catch { return []; } })();
        const images = getImages(p);
        const hasImage = images.length > 0;
        const humanLabel = [
          uc.length > 0 ? uc.join(" / ") : null,
          p.category,
        ].filter(Boolean).join(" ");

        return (
          <div key={p.id} className="card space-y-3">
            {/* Images grid */}
            {hasImage ? (
              <div className={`grid gap-1 rounded-xl overflow-hidden ${
                images.length === 1 ? "grid-cols-1" :
                images.length === 2 ? "grid-cols-2" :
                images.length === 3 ? "grid-cols-3" : "grid-cols-2"
              }`}>
                {images.map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={url} alt={p.name}
                    onClick={() => setLightbox({ urls: images, index: i })}
                    className={`w-full object-cover cursor-pointer hover:opacity-90 transition-opacity ${
                      images.length === 1 ? "h-40" :
                      images.length === 4 && i >= 2 ? "h-20" :
                      "h-28"
                    } ${images.length === 4 ? "" : ""}`}
                  />
                ))}
              </div>
            ) : (
              <div className="w-full h-28 bg-gray-100 rounded-xl flex items-center justify-center">
                <Package size={28} className="text-gray-300" />
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-gray-900 text-sm">{p.name}</span>
                {p.brand && <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{p.brand}</span>}
              </div>
              {/* Human-readable label: "Daily / Travel Bag · ✔ Slim · ✔ Lightweight · RM129" */}
              <div className="text-[11px] text-gray-500 mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                {humanLabel && <span className="font-semibold text-gray-700">{humanLabel}</span>}
                {sp.map(s => <span key={s} className="text-green-600 font-semibold">✔ {s}</span>)}
                {p.targetPrice && <span className="font-bold text-brand-600">RM{p.targetPrice}</span>}
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {p.style && <span className="badge bg-purple-50 text-purple-600">{p.style}</span>}
              </div>
              {promos.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {promos.map(promo => {
                    const p2 = PROMOTIONS.find(p => p.value === promo);
                    return (
                      <span key={promo} className="text-[10px] font-bold px-2 py-0.5 bg-orange-50 text-orange-600 border border-orange-200 rounded-full">
                        {p2?.emoji} {promo}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pricing + Target Qty */}
            {(p.targetPrice || p.cost || p.targetQty) && (
              <div className="grid grid-cols-4 gap-1.5 text-center bg-gray-50 rounded-xl p-2">
                {p.targetPrice && (
                  <div><div className="text-[10px] text-gray-400">Price</div>
                    <div className="text-xs font-bold text-gray-800">RM{p.targetPrice}</div></div>
                )}
                {p.cost && (
                  <div><div className="text-[10px] text-gray-400">Cost</div>
                    <div className="text-xs font-bold text-gray-800">RM{p.cost}</div></div>
                )}
                {m !== null && (
                  <div><div className="text-[10px] text-gray-400">Margin</div>
                    <div className={`text-xs font-bold ${m >= 50 ? "text-green-600" : m >= 30 ? "text-amber-600" : "text-red-500"}`}>{m}%</div></div>
                )}
                {p.targetQty && (
                  <div><div className="text-[10px] text-gray-400">Target Qty</div>
                    <div className="text-xs font-bold text-brand-700">{p.targetQty}</div></div>
                )}
              </div>
            )}

            {/* Material */}
            {p.material && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-400 font-semibold uppercase">Material:</span>
                <span className="text-[10px] text-gray-700">{p.material}</span>
              </div>
            )}

            {/* Colours */}
            {colours.length > 0 && (
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-[10px] text-gray-400 font-semibold uppercase">Colours:</span>
                {colours.map(c => (
                  <span key={c} className="text-[10px] font-semibold px-2 py-0.5 bg-white border border-gray-200 rounded-full text-gray-700">{c}</span>
                ))}
              </div>
            )}

            {p.notes && <p className="text-xs text-gray-500 italic">"{p.notes}"</p>}

            {canEdit && (
              <div className="space-y-2 pt-1">
                {/* Add more images if < 4 */}
                {images.length < 4 && (
                  <ImageUploader onUpload={url => onUploadImage(p.id, url)} />
                )}
                {images.length > 0 && images.length < 4 && (
                  <p className="text-[10px] text-gray-400 text-center">{images.length}/4 photos · add up to {4 - images.length} more</p>
                )}

                <div className="flex gap-2">
                  <div className="flex-1 relative group">
                    <button
                      onClick={() => hasImage && onAdvance(p.id, "Validating")}
                      disabled={!hasImage}
                      className={cn(
                        "w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-colors",
                        hasImage
                          ? "bg-brand-500 hover:bg-brand-600 text-white"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      )}>
                      Send to Validation <ArrowRight size={12} />
                    </button>
                    {!hasImage && (
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        Upload image first
                      </div>
                    )}
                  </div>
                  {confirmDelete === p.id ? (
                    <div className="flex gap-1">
                      <button onClick={() => { onDelete(p.id); setConfirmDelete(null); }}
                        className="px-2 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-[10px] font-bold transition-colors">
                        Yes
                      </button>
                      <button onClick={() => setConfirmDelete(null)}
                        className="px-2 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-[10px] font-bold transition-colors">
                        No
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDelete(p.id)}
                      className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl text-xs font-semibold transition-colors">
                      ✕
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>

    {/* Lightbox */}
    {lightbox && (
      <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col" onClick={() => setLightbox(null)}>
        <div className="flex justify-end px-4 py-3 flex-shrink-0" onClick={e => e.stopPropagation()}>
          <button onClick={() => setLightbox(null)}
            className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white">
            <XIcon size={18} />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center relative px-12 min-h-0" onClick={e => e.stopPropagation()}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox.urls[lightbox.index]} alt="" className="max-h-full max-w-full object-contain rounded-xl" />
          {lightbox.index > 0 && (
            <button onClick={() => setLightbox({ ...lightbox, index: lightbox.index - 1 })}
              className="absolute left-2 w-10 h-10 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center text-white">
              <ChevronLeft size={20} />
            </button>
          )}
          {lightbox.index < lightbox.urls.length - 1 && (
            <button onClick={() => setLightbox({ ...lightbox, index: lightbox.index + 1 })}
              className="absolute right-2 w-10 h-10 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center text-white">
              <ChevronRight size={20} />
            </button>
          )}
        </div>
        {lightbox.urls.length > 1 && (
          <div className="flex gap-2 justify-center px-4 py-3 flex-shrink-0" onClick={e => e.stopPropagation()}>
            {lightbox.urls.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={url} alt=""
                onClick={() => setLightbox({ ...lightbox, index: i })}
                className={`w-14 h-14 object-cover rounded-lg cursor-pointer transition-all ${
                  i === lightbox.index ? "ring-2 ring-brand-400 opacity-100" : "opacity-50 hover:opacity-80"
                }`}
              />
            ))}
          </div>
        )}
        <p className="text-center text-xs text-gray-600 pb-3">
          {lightbox.index + 1} / {lightbox.urls.length} · Tap outside to close
        </p>
      </div>
    )}
    </>
  );
}

// ─── Tab 2: Validation ───────────────────────────────────────────────────────
function ValidationTab({ products, outlets, onSubmitValidation, onAdvance, canEdit }: {
  products: Product[];
  outlets: Outlet[];
  onSubmitValidation: (productId: string, data: object) => Promise<void>;
  onAdvance: (id: string, status: string) => Promise<void>;
  canEdit: boolean;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [forms, setForms] = useState<Record<string, {
    outletId: string; confidence: number; wouldSell: boolean; expected: number; reason: string; submitting: boolean;
  }>>({});

  function getForm(id: string) {
    return forms[id] ?? { outletId: "", confidence: 0, wouldSell: true, expected: 10, reason: "", submitting: false };
  }
  function setForm(id: string, patch: Partial<ReturnType<typeof getForm>>) {
    setForms(prev => ({ ...prev, [id]: { ...getForm(id), ...patch } }));
  }

  if (!products.length)
    return <EmptyState icon={<FlaskConical size={28} className="text-gray-300" />} title="No products in validation" sub="Send products from the Sourcing Pool to start collecting store feedback." />;

  return (
    <div className="space-y-4">
      {products.map(p => {
        const form = getForm(p.id);
        const isOpen = expanded === p.id;
        const avgConf = p.validations.length > 0
          ? (p.validations.reduce((s, v) => s + v.confidenceScore, 0) / p.validations.length).toFixed(1)
          : null;

        return (
          <div key={p.id} className="card space-y-3">
            <div className="flex gap-3">
              {p.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.imageUrl} alt={p.name} className="w-20 h-20 object-cover rounded-xl flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-gray-900">{p.name}</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <span className="badge bg-gray-100 text-gray-600">{p.category}</span>
                      {p.targetPrice && <span className="badge bg-green-50 text-green-700">RM{p.targetPrice}</span>}
                      <span className="badge bg-amber-50 text-amber-600">Signal: {p.demandScore}/100</span>
                      {avgConf && <span className="badge bg-blue-50 text-blue-600">Avg: {avgConf}★</span>}
                    </div>
                  </div>
                  {canEdit && (
                    <button onClick={() => onAdvance(p.id, "Reserving")}
                      className="text-xs font-semibold px-3 py-1.5 bg-brand-100 hover:bg-brand-200 text-brand-700 rounded-lg transition-colors flex-shrink-0">
                      → Reserve
                    </button>
                  )}
                </div>
              </div>
            </div>

            {p.validations.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {p.validations.map(v => (
                  <div key={v.id} className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-gray-700">{v.outletName}</span>
                      <div className="flex">
                        {[1,2,3,4,5].map(i => (
                          <Star key={i} size={10} className={i <= v.confidenceScore ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"} />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      {v.wouldSell
                        ? <span className="text-[10px] text-green-600 font-semibold">✔ Would sell</span>
                        : <span className="text-[10px] text-red-500 font-semibold">✖ Won't sell</span>}
                      <span className="text-[10px] text-gray-400">Est. {v.expectedSales}/mo</span>
                    </div>
                    {v.reason && <p className="text-[10px] text-gray-500 italic">"{v.reason}"</p>}
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-gray-100 pt-3">
              <button onClick={() => setExpanded(isOpen ? null : p.id)}
                className="flex items-center gap-2 text-xs font-semibold text-brand-600 hover:text-brand-700">
                {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                {p.validations.length > 0 ? "Add / update store validation" : "Submit validation for a store"}
              </button>

              {isOpen && (
                <div className="mt-3 space-y-3 bg-gray-50 rounded-xl p-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Store</label>
                    <select className="select text-sm" value={form.outletId}
                      onChange={e => setForm(p.id, { outletId: e.target.value })}>
                      <option value="">Select store…</option>
                      {outlets.filter(o => o.isActive).map(o => (
                        <option key={o.id} value={o.id}>{o.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Confidence (1–5)</label>
                    <StarsInput value={form.confidence} onChange={n => setForm(p.id, { confidence: n })} />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Would you sell this?</label>
                    <div className="flex gap-2">
                      {([true, false] as const).map(v => (
                        <button key={String(v)} onClick={() => setForm(p.id, { wouldSell: v })}
                          className={`px-4 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${
                            form.wouldSell === v
                              ? v ? "bg-green-500 text-white border-green-500" : "bg-red-500 text-white border-red-500"
                              : "bg-white text-gray-600 border-gray-200"
                          }`}>
                          {v ? "✔ Yes" : "✖ No"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Expected monthly sales</label>
                    <div className="flex flex-wrap gap-2">
                      {SALES_OPTIONS.map(n => (
                        <button key={n} onClick={() => setForm(p.id, { expected: n })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${
                            form.expected === n ? "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-600 border-gray-200"
                          }`}>
                          {n} units
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Reason</label>
                    <textarea className="textarea text-sm" rows={2}
                      placeholder='"Customer always asks for this…"'
                      value={form.reason} onChange={e => setForm(p.id, { reason: e.target.value })} />
                  </div>

                  <button
                    disabled={!form.outletId || form.confidence === 0 || form.submitting}
                    onClick={async () => {
                      if (!form.outletId) return;
                      setForm(p.id, { submitting: true });
                      const outlet = outlets.find(o => o.id === form.outletId);
                      await onSubmitValidation(p.id, {
                        outletId: form.outletId, outletName: outlet?.name ?? form.outletId,
                        confidenceScore: form.confidence, wouldSell: form.wouldSell,
                        expectedSales: form.expected, reason: form.reason || null,
                      });
                      setForm(p.id, { submitting: false, outletId: "", confidence: 0, reason: "" });
                      setExpanded(null);
                    }}
                    className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                    {form.submitting && <Loader2 size={14} className="animate-spin" />}
                    Submit Validation
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Tab 3: Reservation ──────────────────────────────────────────────────────
function ReservationTab({ products, outlets, onSubmitReservation, onAdvance, canEdit }: {
  products: Product[]; outlets: Outlet[];
  onSubmitReservation: (id: string, data: object) => Promise<void>;
  onAdvance: (id: string, status: string) => Promise<void>;
  canEdit: boolean;
}) {
  const [qtys, setQtys] = useState<Record<string, Record<string, string>>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  function getQty(pid: string, oid: string, fallback: number) {
    return qtys[pid]?.[oid] ?? String(fallback);
  }
  function setQty(pid: string, oid: string, val: string) {
    setQtys(prev => ({ ...prev, [pid]: { ...(prev[pid] ?? {}), [oid]: val } }));
  }

  if (!products.length)
    return <EmptyState icon={<BookMarked size={28} className="text-gray-300" />} title="No products in reservation" sub="Move validated products here for stores to commit quantities." />;

  return (
    <div className="space-y-4">
      {products.map(p => {
        const totalRes = p.reservations.reduce((s, r) => s + r.quantity, 0);
        const activeOutlets = outlets.filter(o => o.isActive);

        return (
          <div key={p.id} className="card space-y-4">
            <div className="flex items-center gap-3">
              {p.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.imageUrl} alt={p.name} className="w-16 h-16 object-cover rounded-xl flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-gray-900">{p.name}</div>
                  <div className="flex gap-1 mt-1">
                    <span className="badge bg-gray-100 text-gray-600">{p.category}</span>
                    {p.targetPrice && <span className="badge bg-green-50 text-green-700">RM{p.targetPrice}</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-2xl font-black text-brand-600">{totalRes}</div>
                  <div className="text-[10px] text-gray-400">total reserved</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {activeOutlets.map(outlet => {
                const existing = p.reservations.find(r => r.outletId === outlet.id);
                const val = getQty(p.id, outlet.id, existing?.quantity ?? 0);
                const key = `${p.id}-${outlet.id}`;
                return (
                  <div key={outlet.id} className="flex items-center gap-3">
                    <span className="text-xs text-gray-700 w-28 flex-shrink-0 truncate">{outlet.name}</span>
                    <input type="number" min="0"
                      className="input py-1.5 text-sm w-24 flex-shrink-0 text-center"
                      value={val}
                      onChange={e => setQty(p.id, outlet.id, e.target.value)} />
                    <button disabled={saving[key]}
                      onClick={async () => {
                        setSaving(prev => ({ ...prev, [key]: true }));
                        await onSubmitReservation(p.id, { outletId: outlet.id, outletName: outlet.name, quantity: parseInt(val) || 0 });
                        setSaving(prev => ({ ...prev, [key]: false }));
                      }}
                      className="text-[10px] font-semibold px-2 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors flex-shrink-0">
                      {saving[key] ? <Loader2 size={10} className="animate-spin" /> : "Save"}
                    </button>
                    {existing && existing.quantity > 0 && (
                      <span className="text-[10px] text-gray-400 flex-shrink-0">Current: {existing.quantity}</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Stores: <span className="font-bold text-gray-800">{p.reservations.filter(r => r.quantity > 0).length} / {activeOutlets.length}</span>
              </span>
              <span className="text-sm font-black text-brand-600">{totalRes} units total</span>
            </div>

            {canEdit && (
              <button onClick={() => onAdvance(p.id, "Watchlist")}
                className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                Ready for Decision <ArrowRight size={14} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Tab 4: Decision ─────────────────────────────────────────────────────────
function DecisionTab({ products, onApprove, onReject, onPromote, canEdit }: {
  products: Product[];
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  onPromote: (p: Product) => void;
  canEdit: boolean;
}) {
  if (!products.length)
    return <EmptyState icon={<Brain size={28} className="text-gray-300" />} title="No products awaiting decision" sub="Products with reservation data will appear here for final approval." />;

  return (
    <div className="space-y-4">
      {products.map(p => {
        const dec = computeDecision(p);
        const isGo = dec.go === "go_bullet";
        const isMid = dec.go === "go_conservative";

        return (
          <div key={p.id} className={`card border-2 space-y-4 ${isGo ? "border-green-200" : isMid ? "border-amber-200" : "border-gray-100"}`}>
            <div className="flex items-start gap-3">
              {p.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.imageUrl} alt={p.name} className="w-16 h-16 object-cover rounded-xl flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0 flex items-start justify-between gap-3">
                <div>
                  <div className="font-bold text-gray-900">{p.name}</div>
                  <div className="flex gap-1 mt-1">
                    <span className="badge bg-gray-100 text-gray-600">{p.category}</span>
                    {p.targetPrice && <span className="badge bg-green-50 text-green-700">RM{p.targetPrice}</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`text-3xl font-black ${isGo ? "text-green-600" : isMid ? "text-amber-600" : "text-gray-400"}`}>{dec.final}</div>
                  <div className="text-[10px] text-gray-400">Final Score</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <ScoreBar label="Demand Signal (×0.4)" value={dec.demand} color="bg-amber-400" />
              <ScoreBar label="Sales Confidence (×0.3)" value={dec.avgConf} color="bg-blue-400" />
              <ScoreBar label="Reservation Volume (×0.3)" value={dec.resScore} color="bg-green-400" />
            </div>

            <div className={`rounded-xl p-4 ${isGo ? "bg-green-50 border border-green-200" : isMid ? "bg-amber-50 border border-amber-200" : "bg-gray-50 border border-gray-200"}`}>
              <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${isGo ? "text-green-700" : isMid ? "text-amber-700" : "text-gray-500"}`}>
                System Recommendation
              </div>
              {isGo && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-green-800 font-semibold">
                    <CheckCircle2 size={14} className="text-green-500" /> Proceed to Bullet Test
                  </div>
                  <div className="flex items-center gap-2 text-sm text-green-800 font-semibold">
                    <CheckCircle2 size={14} className="text-green-500" /> Initial Order: {dec.orderQty} units
                  </div>
                  {dec.channels.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-green-800 font-semibold">
                      <CheckCircle2 size={14} className="text-green-500" /> Channels: {dec.channels.join(" + ")}
                    </div>
                  )}
                </div>
              )}
              {isMid && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-amber-800 font-semibold">
                    <AlertTriangle size={14} className="text-amber-500" /> Proceed with caution
                  </div>
                  <div className="flex items-center gap-2 text-sm text-amber-800 font-semibold">
                    <AlertTriangle size={14} className="text-amber-500" /> Conservative order: {dec.orderQty} units
                  </div>
                </div>
              )}
              {!isGo && !isMid && (
                <div className="flex items-center gap-2 text-sm text-gray-600 font-semibold">
                  <XCircle size={14} className="text-gray-400" /> Not ready — gather more data
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-gray-50 rounded-xl p-2">
                <div className="text-lg font-black text-gray-800">
                  {p.validations.length > 0 ? (p.validations.reduce((s, v) => s + v.confidenceScore, 0) / p.validations.length).toFixed(1) : "—"}
                </div>
                <div className="text-[10px] text-gray-400">Avg Confidence</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-2">
                <div className="text-lg font-black text-gray-800">{dec.totalRes}</div>
                <div className="text-[10px] text-gray-400">Reserved Units</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-2">
                <div className="text-lg font-black text-gray-800">{p.validations.length}</div>
                <div className="text-[10px] text-gray-400">Stores Validated</div>
              </div>
            </div>

            {canEdit && (
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => onApprove(p.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-semibold transition-colors">
                  <CheckCircle2 size={14} /> Approve → Bullet Test
                </button>
                <button onClick={() => onPromote(p)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold transition-colors">
                  → Master
                </button>
                <button onClick={() => onReject(p.id)}
                  className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5">
                  <XCircle size={14} /> Reject
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Tab 5: Tracking ─────────────────────────────────────────────────────────
function TrackingTab({ products, onStatusChange, onPromote, canEdit }: {
  products: Product[];
  onStatusChange: (id: string, status: string, stage?: string) => Promise<void>;
  onPromote: (p: Product) => void;
  canEdit: boolean;
}) {
  const statusConfig: Record<string, { color: string; bg: string }> = {
    Testing:    { color: "text-blue-700",  bg: "bg-blue-100"  },
    Scale:      { color: "text-green-700", bg: "bg-green-100" },
    Eliminated: { color: "text-red-600",   bg: "bg-red-100"   },
  };

  if (!products.length)
    return <EmptyState icon={<BarChart3 size={28} className="text-gray-300" />} title="No products in tracking" sub="Approved products will appear here to track their performance." />;

  return (
    <div className="space-y-3">
      {products.map(p => {
        const sc = statusConfig[p.status] ?? statusConfig.Testing;
        return (
          <div key={p.id} className="card">
            <div className="flex items-center gap-3 flex-wrap">
              {p.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.imageUrl} alt={p.name} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-900 text-sm">{p.name}</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  <span className="badge bg-gray-100 text-gray-600">{p.category}</span>
                  <span className={`badge ${p.stage === "Cannonball" ? "bg-green-100 text-green-700" : "bg-blue-50 text-blue-600"}`}>{p.stage}</span>
                </div>
              </div>

              {p.hitRate > 0 && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${p.hitRate >= 70 ? "bg-green-500" : p.hitRate >= 40 ? "bg-amber-400" : "bg-red-400"}`}
                      style={{ width: `${p.hitRate}%` }} />
                  </div>
                  <span className="text-xs font-bold text-gray-700">{p.hitRate}%</span>
                </div>
              )}

              <span className={`status-pill flex-shrink-0 ${sc.bg} ${sc.color}`}>{p.status}</span>

              {canEdit && p.status === "Testing" && (
                <div className="flex gap-1.5 flex-shrink-0">
                  <button onClick={() => onStatusChange(p.id, "Testing", "Cannonball")}
                    className="text-[10px] font-semibold px-2 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200">→ Cannonball</button>
                  <button onClick={() => onStatusChange(p.id, "Scale")}
                    className="text-[10px] font-semibold px-2 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200">→ Scale</button>
                  <button onClick={() => onStatusChange(p.id, "Eliminated")}
                    className="text-[10px] font-semibold px-2 py-1 bg-red-100 text-red-600 rounded-lg hover:bg-red-200">Eliminate</button>
                </div>
              )}
              {canEdit && p.status === "Scale" && (
                <div className="flex gap-1.5 flex-shrink-0">
                  <button onClick={() => onPromote(p)}
                    className="text-[10px] font-semibold px-2 py-1 bg-brand-100 text-brand-700 rounded-lg hover:bg-brand-200">→ Product Master</button>
                  <button onClick={() => onStatusChange(p.id, "Eliminated")}
                    className="text-[10px] font-semibold px-2 py-1 bg-red-100 text-red-600 rounded-lg hover:bg-red-200">Discontinue</button>
                </div>
              )}
            </div>

            {p.stage === "Cannonball" && p.status === "Testing" && p.hitRate >= 60 && (
              <div className="mt-2 flex items-center gap-2 bg-green-50 rounded-xl px-3 py-2">
                <TrendingUp size={13} className="text-green-500" />
                <span className="text-xs font-semibold text-green-700">Ready for Scale 🔥 — Hit rate {p.hitRate}%</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Add Product Modal ────────────────────────────────────────────────────────
function AddProductModal({ onClose, onSave }: {
  onClose: () => void;
  onSave: (data: object) => Promise<void>;
}) {
  const [form, setForm] = useState({
    name: "", productCode: "", category: "Bag", targetPrice: "", cost: "",
    useCase: [] as string[], sellingPoints: [] as string[],
    brand: "", notes: "",
  });
  const [imageUrls, setImageUrls]     = useState<string[]>([]);
  const [imgProcessing, setImgProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function toggleUC(uc: string) {
    setForm(f => {
      const already = f.useCase.includes(uc);
      if (!already && f.useCase.length >= 2) return f;
      return { ...f, useCase: already ? f.useCase.filter(u => u !== uc) : [...f.useCase, uc] };
    });
  }

  function toggleSP(sp: string) {
    setForm(f => {
      const already = f.sellingPoints.includes(sp);
      if (!already && f.sellingPoints.length >= 3) return f;
      return { ...f, sellingPoints: already ? f.sellingPoints.filter(s => s !== sp) : [...f.sellingPoints, sp] };
    });
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || imageUrls.length >= 4) return;
    setImgProcessing(true);
    try {
      const url = await uploadToCloudinary(file);
      setImageUrls(prev => [...prev, url].slice(0, 4));
    } finally {
      setImgProcessing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function submit() {
    if (!form.name.trim()) return;
    setSaving(true);
    await onSave({
      name: form.name.trim(), productCode: form.productCode.trim() || null,
      category: form.category,
      targetPrice: form.targetPrice ? parseFloat(form.targetPrice) : null,
      cost: form.cost ? parseFloat(form.cost) : null,
      useCase: form.useCase, sellingPoints: form.sellingPoints,
      brand: form.brand || null,
      notes: form.notes || null,
      imageUrl: imageUrls[0] ?? null,
      imageUrls,
    });
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900 text-lg">Add to Sourcing Pool</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        {/* Photos */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
            Photos <span className="text-amber-500 normal-case font-normal">(up to 4)</span>
          </label>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          <div className="grid grid-cols-4 gap-2">
            {imageUrls.map((url, i) => (
              <div key={i} className="relative aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full h-full object-cover rounded-xl" />
                <button onClick={() => setImageUrls(prev => prev.filter((_, idx) => idx !== i))}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-white text-[10px]">×</button>
              </div>
            ))}
            {imageUrls.length < 4 && (
              <button onClick={() => fileRef.current?.click()} disabled={imgProcessing}
                className="aspect-square border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-brand-300 hover:text-brand-500 transition-all disabled:opacity-50">
                {imgProcessing ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                <span className="text-[10px] font-medium">{imgProcessing ? "…" : "Add"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Product Name *</label>
          <input className="input" placeholder="e.g. Urban Sling V2" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        </div>

        {/* SKU */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">SKU</label>
          <input className="input font-mono" placeholder="Your barcode / SKU code" value={form.productCode}
            onChange={e => setForm(f => ({ ...f, productCode: e.target.value }))} />
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Category *</label>
          <select className="select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Use Case */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
            Use Case <span className="normal-case font-normal text-gray-400">(max 2)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {USE_CASES.map(uc => (
              <button key={uc} onClick={() => toggleUC(uc)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${
                  form.useCase.includes(uc) ? "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                }`}>
                {uc}
              </button>
            ))}
          </div>
        </div>

        {/* Selling Points */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
            Selling Points <span className="normal-case font-normal text-gray-400">(pick 3)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {SELLING_POINTS.map(sp => {
              const on = form.sellingPoints.includes(sp);
              return (
                <button key={sp} onClick={() => toggleSP(sp)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${
                    on ? "bg-green-500 text-white border-green-500"
                       : form.sellingPoints.length >= 3 ? "bg-white text-gray-300 border-gray-100 cursor-not-allowed"
                       : "bg-white text-gray-600 border-gray-200 hover:border-green-300"
                  }`}>
                  {on ? "✔ " : ""}{sp}
                </button>
              );
            })}
          </div>
        </div>

        {/* Price + Cost */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Target Price (RM)</label>
            <input className="input" type="number" placeholder="129" value={form.targetPrice}
              onChange={e => setForm(f => ({ ...f, targetPrice: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Est Cost (RM)</label>
            <input className="input" type="number" placeholder="55" value={form.cost}
              onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} />
          </div>
        </div>

        {form.targetPrice && form.cost && (() => {
          const m = margin(parseFloat(form.targetPrice), parseFloat(form.cost));
          return m !== null ? (
            <div className={`text-center text-sm font-bold rounded-xl py-1.5 ${m >= 50 ? "bg-green-50 text-green-700" : m >= 30 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-600"}`}>
              Margin: {m}%
            </div>
          ) : null;
        })()}

        {/* Brand */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Brand</label>
          <select className="select" value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}>
            <option value="">Select brand…</option>
            {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Notes <span className="normal-case font-normal text-gray-400">(optional)</span></label>
          <textarea className="textarea" rows={2} placeholder="Any observations…" value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>

        <button disabled={!form.name.trim() || saving} onClick={submit}
          className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2">
          {saving && <Loader2 size={14} className="animate-spin" />}
          Add to Sourcing Pool
        </button>
      </div>
    </div>
  );
}

// ─── Promote to Master Modal ─────────────────────────────────────────────────
function PromoteModal({ product, onClose, onSaved }: {
  product: Product;
  onClose: () => void;
  onSaved: () => void;
}) {
  const sp: string[] = (() => { try { return JSON.parse(product.sellingPoints || "[]"); } catch { return []; } })();
  const uc: string[] = (() => { try { return JSON.parse(product.useCase || "[]"); } catch { return []; } })();
  const images = getImages(product);

  const [sku, setSku]             = useState(product.productCode ?? "");
  const [retailPrice, setRetailPrice] = useState(String(product.targetPrice ?? ""));
  const [shortPitch, setShortPitch]   = useState("");
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState("");

  async function submit() {
    if (!sku.trim() || !shortPitch.trim()) return;
    setSaving(true);
    setError("");
    try {
      await apiFetch("/api/products/promote", {
        method: "POST",
        body: JSON.stringify({
          warRoomProductId: product.id,
          sku: sku.trim().toUpperCase(),
          retailPrice: parseFloat(retailPrice) || 0,
          shortPitch: shortPitch.trim(),
        }),
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Promote failed");
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="font-bold text-gray-900">Promote to Product Master</div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XIcon size={18} /></button>
        </div>

        {/* Preview */}
        <div className="px-6 pt-5 pb-4 bg-gray-50 mx-4 mt-4 rounded-xl space-y-3">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Preview — auto-filled from War Room</div>
          <div className="flex gap-3">
            {images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={images[0]} alt="" className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
            ) : (
              <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center">
                <Package size={20} className="text-gray-300" />
              </div>
            )}
            <div className="min-w-0">
              <div className="font-bold text-gray-900 text-sm">{product.name}</div>
              <div className="flex gap-1 flex-wrap mt-1">
                <span className="badge bg-gray-200 text-gray-600 text-[10px]">{product.category}</span>
                {uc.map(u => <span key={u} className="badge bg-blue-100 text-blue-600 text-[10px]">{u}</span>)}
              </div>
              {sp.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {sp.map(s => <span key={s} className="text-[10px] text-green-600 font-semibold">✔ {s}</span>)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Inputs */}
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">SKU *</label>
            <input className="input font-mono" placeholder="Your barcode formula SKU"
              value={sku} onChange={e => setSku(e.target.value.toUpperCase())} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Retail Price (RM) *</label>
            <input className="input" type="number" placeholder="129"
              value={retailPrice} onChange={e => setRetailPrice(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Short Pitch *</label>
            <input className="input" placeholder="One-liner your sales team says to customers…"
              value={shortPitch} onChange={e => setShortPitch(e.target.value)} />
          </div>

          {error && <div className="text-red-500 text-sm bg-red-50 rounded-xl px-3 py-2">{error}</div>}

          <button onClick={submit}
            disabled={saving || !sku.trim() || !shortPitch.trim()}
            className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors">
            {saving && <Loader2 size={14} className="animate-spin" />}
            Confirm → Add to Master
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProductWarRoom() {
  const { user } = useAuth();
  const { data: products, loading, refetch } = useData<Product[]>("/api/products");
  const { data: outlets } = useData<Outlet[]>("/api/outlets");
  const [activeTab, setActiveTab]     = useState<Tab>("sourcing");
  const [showAdd, setShowAdd]         = useState(false);
  const [promoteTarget, setPromoteTarget] = useState<Product | null>(null);

  // Sales users → redirect to Product Feedback
  if (user && user.role === "sales") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 text-center px-4">
        <div className="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center">
          <ThumbsUp size={28} className="text-brand-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Wrong room!</h2>
          <p className="text-sm text-gray-500 mt-1">Product War Room is for buyers & managers.<br />Your page is Product Feedback.</p>
        </div>
        <Link href="/product-feedback"
          className="btn-primary flex items-center gap-2 px-8 py-3">
          Go to Product Feedback <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  const canEdit = ["admin", "product", "manager"].includes(user?.role ?? "");
  const canDecide = ["admin", "manager"].includes(user?.role ?? "");

  const list       = products ?? [];
  const sourcing   = list.filter(p => p.status === "Sourcing");
  const validating = list.filter(p => p.status === "Validating");
  const reserving  = list.filter(p => p.status === "Reserving");
  const watchlist  = list.filter(p => p.status === "Watchlist");
  const tracking   = list.filter(p => ["Testing", "Scale", "Eliminated"].includes(p.status));

  const tabs: { key: Tab; label: string; count: number; icon: React.ReactNode }[] = [
    { key: "sourcing",    label: "Sourcing Pool",  count: sourcing.length,   icon: <PackagePlus size={14} />  },
    { key: "validation",  label: "Validation",     count: validating.length, icon: <FlaskConical size={14} /> },
    { key: "reservation", label: "Reservation",    count: reserving.length,  icon: <BookMarked size={14} />   },
    { key: "decision",    label: "Decision",       count: watchlist.length,  icon: <Brain size={14} />        },
    { key: "tracking",    label: "Tracking",       count: tracking.length,   icon: <BarChart3 size={14} />    },
  ];

  async function advanceStatus(id: string, status: string, stage?: string) {
    await apiFetch(`/api/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(stage ? { status, stage } : { status }),
    });
    refetch();
  }

  async function deleteProduct(id: string) {
    await apiFetch(`/api/products/${id}`, { method: "DELETE" });
    refetch();
  }

  async function uploadImage(id: string, url: string) {
    const product = list.find(p => p.id === id);
    const current: string[] = (() => { try { return JSON.parse(product?.imageUrls || "[]") as string[]; } catch { return []; } })();
    const updated = [...current, url].slice(0, 4);
    await apiFetch(`/api/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ imageUrl: updated[0], imageUrls: updated }),
    });
    refetch();
  }

  async function submitValidation(productId: string, data: object) {
    await apiFetch(`/api/products/${productId}/validate`, { method: "POST", body: JSON.stringify(data) });
    refetch();
  }

  async function submitReservation(productId: string, data: object) {
    await apiFetch(`/api/products/${productId}/reserve`, { method: "POST", body: JSON.stringify(data) });
    refetch();
  }

  async function addProduct(data: object) {
    await apiFetch("/api/products", { method: "POST", body: JSON.stringify(data) });
    refetch();
  }

  function promoteToMaster(p: Product) {
    setPromoteTarget(p);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Sword size={20} className="text-brand-500" />
            Product War Room
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Market already decided — the system just shows you the answer</p>
        </div>
        {canEdit && (
          <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
            <PackagePlus size={14} /> Add Product
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex-shrink-0",
              activeTab === tab.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}>
            {tab.icon}
            {tab.label}
            {tab.count > 0 && (
              <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                activeTab === tab.key ? "bg-brand-100 text-brand-700" : "bg-gray-200 text-gray-600")}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1.5 text-[10px] text-gray-400 overflow-x-auto">
        {["Sourcing", "→", "Validation", "→", "Reservation", "→", "Decision", "→", "Bullet", "→", "Scale"].map((s, i) => (
          <span key={i} className={s === "→" ? "text-gray-300" : "font-semibold"}>{s}</span>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gray-300" size={32} /></div>
      ) : (
        <>
          {activeTab === "sourcing" && (
            <SourcingPool products={sourcing} onAdvance={advanceStatus} onDelete={deleteProduct}
              onUploadImage={uploadImage} canEdit={canEdit} />
          )}
          {activeTab === "validation" && (
            <ValidationTab products={validating} outlets={outlets ?? []}
              onSubmitValidation={submitValidation} onAdvance={advanceStatus} canEdit={canEdit} />
          )}
          {activeTab === "reservation" && (
            <ReservationTab products={reserving} outlets={outlets ?? []}
              onSubmitReservation={submitReservation} onAdvance={advanceStatus} canEdit={canEdit} />
          )}
          {activeTab === "decision" && (
            <DecisionTab products={watchlist}
              onApprove={id => advanceStatus(id, "Testing")}
              onReject={id => advanceStatus(id, "Eliminated")}
              onPromote={setPromoteTarget}
              canEdit={canDecide} />
          )}
          {activeTab === "tracking" && (
            <TrackingTab products={tracking} onStatusChange={advanceStatus} onPromote={promoteToMaster} canEdit={canEdit} />
          )}
        </>
      )}

      {showAdd && <AddProductModal onClose={() => setShowAdd(false)} onSave={addProduct} />}
      {promoteTarget && (
        <PromoteModal
          product={promoteTarget}
          onClose={() => setPromoteTarget(null)}
          onSaved={refetch}
        />
      )}
    </div>
  );
}
