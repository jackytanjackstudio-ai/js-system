"use client";
import { useState } from "react";
import { CheckCircle, Clock, Loader2, ChevronDown, ChevronUp, Zap } from "lucide-react";
import { useLang } from "@/context/LangContext";
import { useData, apiFetch } from "@/hooks/useData";
import { useAuth } from "@/context/AuthContext";

const categories = [
  { label: "Wallet",      emoji: "👜" },
  { label: "Card Holder", emoji: "🪪" },
  { label: "Bag",         emoji: "🎒" },
  { label: "Luggage",     emoji: "🧳" },
  { label: "Accessories", emoji: "✨" },
  { label: "Gift",        emoji: "🎁" },
];

const nobuReasons = [
  { label: "Price",      emoji: "💰" },
  { label: "Size",       emoji: "📏" },
  { label: "Design",     emoji: "🎨" },
  { label: "Quality",    emoji: "🔍" },
  { label: "Not urgent", emoji: "⏳" },
];

const suggestions = ["Bigger size", "More colours", "Lower price", "More compartments", "Personalization"];

type Outlet = { id: string; name: string; type: string; isActive: boolean };
type Input  = {
  id: string; createdAt: string; quote: string | null;
  staffName: string | null; lookingFor: string; nobuReasons: string;
  outlet: { name: string }; user: { name: string };
};
type SubmitResult = { weekCount: number; topDemand: string | null };

function toggle(arr: string[], val: string) {
  return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];
}

export default function CustomerInput() {
  const { t }    = useLang();
  const { user } = useAuth();
  const { data: outlets, loading: outLoading }                  = useData<Outlet[]>("/api/outlets");
  const { data: recentInputs, loading: inputsLoading, refetch } = useData<Input[]>("/api/inputs?limit=20");

  const [result, setResult]         = useState<SubmitResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [outletId, setOutletId]     = useState("");
  const [looking,  setLooking]      = useState<string[]>([]);
  const [reasons,  setReasons]      = useState<string[]>([]);
  const [sug,      setSug]          = useState<string[]>([]);
  const [quote,    setQuote]        = useState("");
  const [showContact, setShowContact] = useState(false);
  const [custName,  setCustName]    = useState("");
  const [custPhone, setCustPhone]   = useState("");

  async function handleSubmit() {
    if (!outletId || !user || !looking.length) return;
    setSubmitting(true);
    try {
      const data = await apiFetch("/api/inputs", {
        method: "POST",
        body: JSON.stringify({
          outletId,
          staffName:     user.name,
          lookingFor:    looking,
          nobuReasons:   reasons,
          suggestions:   sug,
          quote:         quote || null,
          customerName:  custName  || null,
          customerPhone: custPhone || null,
        }),
      });
      setResult({ weekCount: data.weekCount ?? 1, topDemand: data.topDemand ?? null });
      refetch();
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setResult(null);
    setOutletId(""); setLooking([]); setReasons([]); setSug([]); setQuote("");
    setCustName(""); setCustPhone(""); setShowContact(false);
  }

  const activeOutlets    = (outlets ?? []).filter(o => o.isActive);
  const showSuggestions  = looking.length > 0 || reasons.length > 0;
  const canSubmit        = outletId && looking.length > 0 && !submitting;

  // Success screen
  if (result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 text-center px-4">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle size={40} className="text-green-500" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-gray-900">已记录！</h2>
          <p className="text-sm text-gray-500 mt-1">{t("ci_success_sub")}</p>
        </div>
        <div className="bg-white rounded-2xl px-8 py-4 shadow-sm border border-gray-100">
          <div className="text-3xl font-black text-brand-600">#{result.weekCount}</div>
          <div className="text-sm text-gray-500">本周第 {result.weekCount} 条客户需求</div>
        </div>
        {result.topDemand && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3">
            <Zap size={16} className="text-amber-500 flex-shrink-0" />
            <div className="text-left">
              <div className="text-xs text-amber-600 font-semibold">🔥 本周热门需求</div>
              <div className="text-sm font-bold text-amber-800">{result.topDemand}</div>
            </div>
          </div>
        )}
        <button className="btn-primary px-8 py-3" onClick={reset}>{t("ci_new")}</button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="page-title">{t("ci_title")}</h1>
        <p className="text-sm text-gray-400 mt-0.5">{t("ci_subtitle")}</p>
      </div>

      <div className="card space-y-6">
        {/* Store selector */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t("ci_store")}</label>
          {outLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400"><Loader2 size={14} className="animate-spin" /> Loading…</div>
          ) : (
            <select className="select" value={outletId} onChange={e => setOutletId(e.target.value)}>
              <option value="">{t("ci_select")}</option>
              {activeOutlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          )}
        </div>

        {/* Step 1 — Looking for */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            {t("ci_looking")} <span className="text-red-400 normal-case font-normal text-xs">(required)</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {categories.map(c => {
              const on = looking.includes(c.label);
              return (
                <button key={c.label} onClick={() => setLooking(toggle(looking, c.label))}
                  className={`py-3 rounded-2xl text-sm font-semibold border-2 transition-all flex flex-col items-center gap-1 ${
                    on ? "bg-brand-500 text-white border-brand-500 shadow-md" : "bg-white text-gray-600 border-gray-100 hover:border-brand-200"
                  }`}>
                  <span className="text-xl">{c.emoji}</span>
                  <span className="text-xs">{c.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2 — No-buy reasons */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            {t("ci_reason")} <span className="text-gray-400 normal-case font-normal text-xs">{t("ci_reason_sub")}</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {nobuReasons.map(r => {
              const on = reasons.includes(r.label);
              return (
                <button key={r.label} onClick={() => setReasons(toggle(reasons, r.label))}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all flex items-center gap-1.5 ${
                    on ? "bg-red-500 text-white border-red-500 shadow-md" : "bg-white text-gray-600 border-gray-100 hover:border-red-200"
                  }`}>
                  <span>{r.emoji}</span>
                  <span>{r.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 3 — Suggestions (auto-appear) */}
        {showSuggestions && (
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t("ci_suggestion")}</label>
            <div className="flex flex-wrap gap-2">
              {suggestions.map(s => {
                const on = sug.includes(s);
                return (
                  <button key={s} onClick={() => setSug(toggle(sug, s))}
                    className={`px-3.5 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                      on ? "bg-blue-500 text-white border-blue-500 shadow-md" : "bg-white text-gray-600 border-gray-100 hover:border-blue-200"
                    }`}>
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 4 — Quote */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            {t("ci_quote_label")} <span className="text-red-400 normal-case font-normal text-xs">{t("ci_quote_warn")}</span>
          </label>
          <textarea className="textarea" rows={2} placeholder={t("ci_quote_ph")}
            value={quote} onChange={e => setQuote(e.target.value)} />
        </div>

        {/* Step 5 — Contact (collapsed) */}
        <div>
          <button
            onClick={() => setShowContact(!showContact)}
            className="flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors">
            {showContact ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {showContact ? "Hide customer info" : "+ Add customer name / phone (optional)"}
          </button>
          {showContact && (
            <div className="mt-3 space-y-2">
              <input className="input" placeholder="Customer name" value={custName}
                onChange={e => setCustName(e.target.value)} />
              <input className="input" type="tel" placeholder="Phone number" value={custPhone}
                onChange={e => setCustPhone(e.target.value)} />
            </div>
          )}
        </div>

        <button
          className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2"
          onClick={handleSubmit}
          disabled={!canSubmit}>
          {submitting && <Loader2 size={16} className="animate-spin" />}
          {submitting ? "Submitting…" : t("ci_submit")}
        </button>
      </div>

      {/* Recent inputs */}
      <div>
        <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Clock size={14} /> {t("ci_recent")}
        </h2>
        {inputsLoading ? (
          <div className="flex justify-center py-6"><Loader2 className="animate-spin text-gray-300" /></div>
        ) : (
          <div className="space-y-2">
            {(recentInputs ?? []).slice(0, 10).map(r => {
              const items = JSON.parse(r.lookingFor ?? "[]") as string[];
              const rs    = JSON.parse(r.nobuReasons ?? "[]") as string[];
              return (
                <div key={r.id} className="card py-3 px-4 flex gap-3 items-start">
                  <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {(r.staffName ?? r.user.name)[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-800">{r.staffName ?? r.user.name}</span>
                      <span className="text-xs text-gray-400">{r.outlet.name}</span>
                      {items.map(i => <span key={i} className="badge bg-brand-100 text-brand-700">{i}</span>)}
                      {rs.map(reason => <span key={reason} className="badge bg-red-100 text-red-700">{reason}</span>)}
                    </div>
                    {r.quote && <p className="text-sm text-gray-600 mt-1 italic">&ldquo;{r.quote}&rdquo;</p>}
                  </div>
                  <span className="text-xs text-gray-300 flex-shrink-0 whitespace-nowrap">
                    {new Date(r.createdAt).toLocaleDateString("en-MY", { day: "numeric", month: "short" })}
                  </span>
                </div>
              );
            })}
            {!(recentInputs ?? []).length && <p className="text-sm text-gray-400">No inputs yet.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
