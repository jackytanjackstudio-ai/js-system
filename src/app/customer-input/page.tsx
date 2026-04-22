"use client";
import { useState } from "react";
import { CheckCircle, Clock, Loader2 } from "lucide-react";
import { useLang } from "@/context/LangContext";
import { useData, apiFetch } from "@/hooks/useData";
import { useAuth } from "@/context/AuthContext";

const lookingFor  = ["Wallet", "Card Holder", "Tote Bag", "Backpack", "Luggage", "Belt", "Accessories", "Gift"];
const nobuReasons = ["Price", "Design", "Size/Colour", "Quality concern", "Not urgent", "Comparing brands", "Other"];
const suggestions = ["Bigger size", "More colours", "Lower price", "Bundle deal", "Personalization", "Other"];

type Outlet = { id: string; name: string; type: string; isActive: boolean };
type Input  = {
  id: string; createdAt: string; quote: string | null;
  lookingFor: string; nobuReasons: string;
  outlet: { name: string }; user: { name: string };
};

export default function CustomerInput() {
  const { t }   = useLang();
  const { user } = useAuth();
  const { data: outlets, loading: outLoading }                       = useData<Outlet[]>("/api/outlets");
  const { data: recentInputs, loading: inputsLoading, refetch }      = useData<Input[]>("/api/inputs?limit=20");

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [outletId, setOutletId]   = useState("");
  const [looking, setLooking]     = useState<string[]>([]);
  const [reasons, setReasons]     = useState<string[]>([]);
  const [sug, setSug]             = useState<string[]>([]);
  const [quote, setQuote]         = useState("");

  function toggle(arr: string[], setArr: (v: string[]) => void, val: string) {
    setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  }

  async function handleSubmit() {
    if (!outletId || !user) return;
    setSubmitting(true);
    try {
      await apiFetch("/api/inputs", {
        method: "POST",
        body: JSON.stringify({
          outletId,
          staffName: user.name,
          lookingFor: looking,
          nobuReasons: reasons,
          suggestions: sug,
          quote: quote || null,
        }),
      });
      setSubmitted(true);
      refetch();
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setSubmitted(false);
    setOutletId("");
    setLooking([]);
    setReasons([]);
    setSug([]);
    setQuote("");
  }

  const activeOutlets = (outlets ?? []).filter(o => o.isActive);

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle size={32} className="text-green-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">{t("ci_success_title")}</h2>
        <p className="text-sm text-gray-500">{t("ci_success_sub")}</p>
        <button className="btn-primary" onClick={reset}>{t("ci_new")}</button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="page-title">{t("ci_title")}</h1>
        <p className="text-sm text-gray-400 mt-0.5">{t("ci_subtitle")}</p>
      </div>

      <div className="card space-y-5">
        {/* Store selector */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t("ci_store")}</label>
          {outLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400"><Loader2 size={14} className="animate-spin" /> Loading outlets…</div>
          ) : (
            <select className="select" value={outletId} onChange={e => setOutletId(e.target.value)}>
              <option value="">{t("ci_select")}</option>
              {activeOutlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          )}
        </div>

        {/* Looking for */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {t("ci_looking")} <span className="text-gray-400 font-normal">{t("ci_looking_sub")}</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {lookingFor.map(item => (
              <button key={item} onClick={() => toggle(looking, setLooking, item)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                  looking.includes(item) ? "bg-brand-500 text-white border-brand-500" : "bg-white text-gray-600 border-gray-200 hover:border-brand-300"
                }`}>
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* No-buy reasons */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {t("ci_reason")} <span className="text-gray-400 font-normal">{t("ci_reason_sub")}</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {nobuReasons.map(r => (
              <button key={r} onClick={() => toggle(reasons, setReasons, r)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                  reasons.includes(r) ? "bg-red-500 text-white border-red-500" : "bg-white text-gray-600 border-gray-200 hover:border-red-200"
                }`}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Suggestions */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t("ci_suggestion")}</label>
          <div className="flex flex-wrap gap-2">
            {suggestions.map(s => (
              <button key={s} onClick={() => toggle(sug, setSug, s)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                  sug.includes(s) ? "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-600 border-gray-200 hover:border-blue-200"
                }`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Quote */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {t("ci_quote_label")} <span className="text-red-400 text-xs">{t("ci_quote_warn")}</span>
          </label>
          <textarea className="textarea" rows={2} placeholder={t("ci_quote_ph")}
            value={quote} onChange={e => setQuote(e.target.value)} />
        </div>

        <button
          className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2"
          onClick={handleSubmit}
          disabled={!outletId || submitting}>
          {submitting && <Loader2 size={16} className="animate-spin" />}
          {submitting ? "Submitting…" : t("ci_submit")}
        </button>
      </div>

      {/* Recent inputs — live from DB */}
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
                    {r.user.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-800">{r.user.name}</span>
                      <span className="text-xs text-gray-400">{r.outlet.name}</span>
                      {items.map(i => <span key={i} className="badge bg-brand-100 text-brand-700">{i}</span>)}
                      {rs.map(reason => <span key={reason} className="badge bg-red-100 text-red-700">{reason}</span>)}
                    </div>
                    {r.quote && <p className="text-sm text-gray-600 mt-1 italic">"{r.quote}"</p>}
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
