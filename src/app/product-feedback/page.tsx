"use client";
import { useState } from "react";
import { useData, apiFetch } from "@/hooks/useData";
import { useAuth } from "@/context/AuthContext";
import { Star, CheckCircle2, Loader2, Package, X, ChevronLeft, ChevronRight } from "lucide-react";

type Product = {
  id: string; name: string; category: string; status: string;
  targetPrice: number | null; useCase: string;
  imageUrl: string | null; imageUrls: string;
  style: string | null; material: string | null;
  colours: string; notes: string | null; targetQty: number | null;
};
type Outlet = { id: string; name: string; isActive: boolean };

const REASONS = [
  { value: "Customer often asks", label: "客户常问" },
  { value: "Easy to sell",        label: "好卖"     },
  { value: "Good design",         label: "设计好"   },
  { value: "Reasonable price",    label: "价格合理" },
];
const SALES_OPTIONS = [5, 10, 20, 30, 50];

function getImages(p: Pick<Product, "imageUrl" | "imageUrls">): string[] {
  try {
    const arr = JSON.parse(p.imageUrls || "[]") as string[];
    if (arr.length > 0) return arr.slice(0, 4);
  } catch { /* */ }
  return p.imageUrl ? [p.imageUrl] : [];
}

function StarsInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map(i => (
        <button key={i} type="button" onClick={() => onChange(i)}>
          <Star size={30} className={i <= value ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"} />
        </button>
      ))}
    </div>
  );
}

export default function ProductFeedback() {
  const { user } = useAuth();
  const { data: products, loading } = useData<Product[]>("/api/products");
  const { data: outlets } = useData<Outlet[]>("/api/outlets");

  const [outletId, setOutletId] = useState(user?.outletId ?? "");
  const [activeImg, setActiveImg] = useState<Record<string, number>>({});
  const [lightbox, setLightbox] = useState<{ urls: string[]; index: number } | null>(null);
  const [forms, setForms] = useState<Record<string, {
    confidence: number; expected: number; reasons: string[]; submitting: boolean; done: boolean;
  }>>({});

  const validating = (products ?? []).filter(p => p.status === "Validating");
  const activeOutlets = (outlets ?? []).filter(o => o.isActive);

  function getForm(id: string) {
    return forms[id] ?? { confidence: 0, expected: 10, reasons: [], submitting: false, done: false };
  }
  function setForm(id: string, patch: Partial<ReturnType<typeof getForm>>) {
    setForms(prev => ({ ...prev, [id]: { ...getForm(id), ...patch } }));
  }
  function toggleReason(id: string, reason: string) {
    const f = getForm(id);
    const reasons = f.reasons.includes(reason) ? f.reasons.filter(r => r !== reason) : [...f.reasons, reason];
    setForm(id, { reasons });
  }

  async function submit(productId: string) {
    if (!outletId) return;
    const f = getForm(productId);
    setForm(productId, { submitting: true });
    const outlet = activeOutlets.find(o => o.id === outletId);
    await apiFetch(`/api/products/${productId}/validate`, {
      method: "POST",
      body: JSON.stringify({
        outletId,
        outletName: outlet?.name ?? outletId,
        confidenceScore: f.confidence,
        wouldSell: f.confidence >= 3,
        expectedSales: f.expected,
        reason: f.reasons.join(", ") || null,
        staffName: user?.name ?? null,
      }),
    });
    setForm(productId, { submitting: false, done: true });
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="animate-spin text-gray-300" size={32} />
    </div>
  );

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div>
        <h1 className="page-title">Product Feedback</h1>
        <p className="text-sm text-gray-400 mt-0.5">Rate the products — your feedback decides what we buy</p>
      </div>

      {/* Store selector */}
      <div className="card">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Your Store</label>
        <select className="select" value={outletId} onChange={e => setOutletId(e.target.value)}>
          <option value="">Select your store…</option>
          {activeOutlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </div>

      {!validating.length ? (
        <div className="text-center py-16 space-y-3">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl mx-auto flex items-center justify-center">
            <Package size={24} className="text-gray-300" />
          </div>
          <p className="font-semibold text-gray-500">No products to review right now</p>
          <p className="text-sm text-gray-400">Check back later — the buying team will send new products here</p>
        </div>
      ) : (
        <div className="space-y-5">
          {validating.map(p => {
            const f = getForm(p.id);
            const uc: string[] = (() => { try { return JSON.parse(p.useCase); } catch { return []; } })();
            const images = getImages(p);
            const mainIdx = activeImg[p.id] ?? 0;

            if (f.done) return (
              <div key={p.id} className="card flex items-center gap-3 bg-green-50 border-2 border-green-200">
                <CheckCircle2 size={28} className="text-green-500 flex-shrink-0" />
                <div>
                  <div className="font-bold text-green-800">{p.name}</div>
                  <div className="text-sm text-green-600">Feedback submitted ✓</div>
                </div>
              </div>
            );

            return (
              <div key={p.id} className="card space-y-5">
                {/* ── Image gallery ── */}
                {images.length > 0 ? (
                  <div className="space-y-2">
                    {/* Main image — click to open lightbox */}
                    <div className="relative cursor-pointer" onClick={() => setLightbox({ urls: images, index: mainIdx })}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={images[mainIdx]} alt={p.name}
                        className="w-full h-56 object-cover rounded-xl" />
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-all rounded-xl flex items-center justify-center">
                        <span className="opacity-0 hover:opacity-100 bg-white/90 text-xs font-bold text-gray-800 px-3 py-1.5 rounded-full transition-opacity">
                          Tap to zoom
                        </span>
                      </div>
                      {images.length > 1 && (
                        <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                          {mainIdx + 1} / {images.length}
                        </div>
                      )}
                    </div>

                    {/* Thumbnail strip */}
                    {images.length > 1 && (
                      <div className="flex gap-2">
                        {images.map((url, i) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={i} src={url} alt=""
                            onClick={() => setActiveImg(prev => ({ ...prev, [p.id]: i }))}
                            className={`w-16 h-16 object-cover rounded-lg cursor-pointer transition-all ${
                              i === mainIdx ? "ring-2 ring-brand-500 opacity-100" : "opacity-50 hover:opacity-80"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-36 bg-gray-100 rounded-xl flex items-center justify-center">
                    <Package size={32} className="text-gray-300" />
                  </div>
                )}

                {/* Product info */}
                <div className="space-y-3">
                  <div>
                    <div className="text-xl font-black text-gray-900">{p.name}</div>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      <span className="badge bg-gray-100 text-gray-600">{p.category}</span>
                      {p.style && <span className="badge bg-purple-50 text-purple-600">{p.style}</span>}
                      {uc.map(u => <span key={u} className="badge bg-blue-50 text-blue-600">{u}</span>)}
                    </div>
                  </div>

                  {/* Price + Qty */}
                  <div className="flex items-center gap-3 flex-wrap">
                    {p.targetPrice && (
                      <div className="text-lg font-bold text-brand-600">RM{p.targetPrice}</div>
                    )}
                    {p.targetQty && (
                      <div className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                        Target: {p.targetQty} units
                      </div>
                    )}
                  </div>

                  {/* Material */}
                  {p.material && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Material</span>
                      <span className="text-sm font-semibold text-gray-700">{p.material}</span>
                    </div>
                  )}

                  {/* Colours */}
                  {(() => {
                    const cols: string[] = (() => { try { return JSON.parse(p.colours || "[]"); } catch { return []; } })();
                    return cols.length > 0 ? (
                      <div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Colours Available</span>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {cols.map(c => (
                            <span key={c} className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm font-semibold text-gray-700 shadow-sm">
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null;
                  })()}

                  {/* Notes from product team */}
                  {p.notes && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
                      <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Product Team Notes</div>
                      <p className="text-sm text-amber-900 italic">"{p.notes}"</p>
                    </div>
                  )}
                </div>

                <div className="h-px bg-gray-100" />

                {/* Confidence */}
                <div>
                  <label className="block text-base font-bold text-gray-800 mb-3">你觉得这个好卖吗？</label>
                  <StarsInput value={f.confidence} onChange={n => setForm(p.id, { confidence: n })} />
                  {f.confidence > 0 && (
                    <p className="text-sm text-gray-500 mt-2">
                      {["", "不好卖", "一般", "还可以", "好卖", "非常好卖！"][f.confidence]}
                    </p>
                  )}
                </div>

                {/* Expected sales */}
                <div>
                  <label className="block text-base font-bold text-gray-800 mb-3">预计每月卖多少？</label>
                  <div className="flex flex-wrap gap-2">
                    {SALES_OPTIONS.map(n => (
                      <button key={n} type="button" onClick={() => setForm(p.id, { expected: n })}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                          f.expected === n
                            ? "bg-brand-500 text-white border-brand-500 shadow-md"
                            : "bg-white text-gray-600 border-gray-200 hover:border-brand-300"
                        }`}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reasons */}
                <div>
                  <label className="block text-base font-bold text-gray-800 mb-3">原因？</label>
                  <div className="grid grid-cols-2 gap-2">
                    {REASONS.map(r => (
                      <button key={r.value} type="button" onClick={() => toggleReason(p.id, r.value)}
                        className={`py-3 px-3 rounded-xl text-sm font-semibold border-2 transition-all text-left ${
                          f.reasons.includes(r.value)
                            ? "bg-green-500 text-white border-green-500 shadow-md"
                            : "bg-white text-gray-600 border-gray-200 hover:border-green-300"
                        }`}>
                        {f.reasons.includes(r.value) ? "✓ " : ""}{r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit */}
                <button type="button"
                  disabled={!outletId || f.confidence === 0 || f.submitting}
                  onClick={() => submit(p.id)}
                  className="w-full py-4 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white rounded-2xl font-bold text-base transition-colors flex items-center justify-center gap-2 shadow-lg shadow-brand-100">
                  {f.submitting ? <Loader2 size={18} className="animate-spin" /> : null}
                  {f.submitting ? "Submitting…" : "Submit →"}
                </button>

                {!outletId && (
                  <p className="text-xs text-red-500 text-center -mt-2">Select your store above first</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Lightbox ── */}
      {lightbox && (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col" onClick={() => setLightbox(null)}>
          {/* Close */}
          <div className="flex justify-end px-4 py-3 flex-shrink-0" onClick={e => e.stopPropagation()}>
            <button onClick={() => setLightbox(null)}
              className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white">
              <X size={18} />
            </button>
          </div>

          {/* Main image */}
          <div className="flex-1 flex items-center justify-center relative px-12 min-h-0"
            onClick={e => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lightbox.urls[lightbox.index]} alt=""
              className="max-h-full max-w-full object-contain rounded-xl" />
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

          {/* Thumbnails */}
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
    </div>
  );
}
