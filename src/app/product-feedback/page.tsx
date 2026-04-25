"use client";
import { useState } from "react";
import { useData, apiFetch } from "@/hooks/useData";
import { useAuth } from "@/context/AuthContext";
import { Star, CheckCircle2, Loader2, Package } from "lucide-react";

type Product = {
  id: string; name: string; category: string; status: string;
  targetPrice: number | null; useCase: string; imageUrl: string | null;
};
type Outlet = { id: string; name: string; isActive: boolean };

const REASONS = [
  { value: "Customer often asks", label: "客户常问" },
  { value: "Easy to sell",        label: "好卖"     },
  { value: "Good design",         label: "设计好"   },
  { value: "Reasonable price",    label: "价格合理" },
];
const SALES_OPTIONS = [5, 10, 20, 30, 50];

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
                {/* Image */}
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imageUrl} alt={p.name} className="w-full h-52 object-cover rounded-xl" />
                ) : (
                  <div className="w-full h-36 bg-gray-100 rounded-xl flex items-center justify-center">
                    <Package size={32} className="text-gray-300" />
                  </div>
                )}

                {/* Info */}
                <div>
                  <div className="text-xl font-black text-gray-900">{p.name}</div>
                  {p.targetPrice && <div className="text-lg font-bold text-brand-600 mt-0.5">RM{p.targetPrice}</div>}
                  {uc.length > 0 && (
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                      {uc.map(u => <span key={u} className="badge bg-blue-50 text-blue-600">{u}</span>)}
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
                <button
                  type="button"
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
    </div>
  );
}
