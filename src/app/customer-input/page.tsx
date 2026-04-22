"use client";
import { useState } from "react";
import { CheckCircle, Clock } from "lucide-react";
import { useLang } from "@/context/LangContext";

const lookingFor = ["Wallet", "Card Holder", "Tote Bag", "Backpack", "Luggage", "Belt", "Accessories", "Gift"];
const nobuReasons = ["Price", "Design", "Size/Colour", "Quality concern", "Not urgent", "Comparing brands", "Other"];
const suggestions = ["Bigger size", "More colours", "Lower price", "Bundle deal", "Personalization", "Other"];
const stores = ["KL Flagship", "Pavilion", "1Utama", "Online – Shopee", "Online – Lazada", "TikTok Shop", "WhatsApp"];

const recentInputs = [
  { by: "Jason", store: "KL Flagship", looking: "Wallet",   reason: "—",     note: "Customer wants brown slim wallet, asked if restock coming", time: "2h ago" },
  { by: "Amirul", store: "1Utama",    looking: "Luggage",  reason: "Price", note: "Budget RM300, our entry is RM400",                          time: "4h ago" },
  { by: "Store KL", store: "KL Flagship", looking: "Tote", reason: "—",     note: "3 customers asked for crossbody strap option today",         time: "5h ago" },
];

export default function CustomerInput() {
  const { t } = useLang();
  const [submitted, setSubmitted] = useState(false);
  const [looking, setLooking]   = useState<string[]>([]);
  const [reasons, setReasons]   = useState<string[]>([]);
  const [sug, setSug]           = useState<string[]>([]);

  function toggle(arr: string[], setArr: (v: string[]) => void, val: string) {
    setArr(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle size={32} className="text-green-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">{t("ci_success_title")}</h2>
        <p className="text-sm text-gray-500">{t("ci_success_sub")}</p>
        <button className="btn-primary" onClick={() => setSubmitted(false)}>{t("ci_new")}</button>
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
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t("ci_store")}</label>
          <select className="select">
            <option value="">{t("ci_select")}</option>
            {stores.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {t("ci_looking")} <span className="text-gray-400 font-normal">{t("ci_looking_sub")}</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {lookingFor.map((item) => (
              <button
                key={item}
                onClick={() => toggle(looking, setLooking, item)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                  looking.includes(item)
                    ? "bg-brand-500 text-white border-brand-500"
                    : "bg-white text-gray-600 border-gray-200 hover:border-brand-300"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {t("ci_reason")} <span className="text-gray-400 font-normal">{t("ci_reason_sub")}</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {nobuReasons.map((r) => (
              <button
                key={r}
                onClick={() => toggle(reasons, setReasons, r)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                  reasons.includes(r)
                    ? "bg-red-500 text-white border-red-500"
                    : "bg-white text-gray-600 border-gray-200 hover:border-red-200"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t("ci_suggestion")}</label>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => toggle(sug, setSug, s)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                  sug.includes(s)
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-white text-gray-600 border-gray-200 hover:border-blue-200"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {t("ci_quote_label")} <span className="text-red-400 text-xs">{t("ci_quote_warn")}</span>
          </label>
          <textarea className="textarea" rows={2} placeholder={t("ci_quote_ph")} />
        </div>

        <button className="btn-primary w-full py-3 text-base" onClick={() => setSubmitted(true)}>
          {t("ci_submit")}
        </button>
      </div>

      <div>
        <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Clock size={14} /> {t("ci_recent")}
        </h2>
        <div className="space-y-2">
          {recentInputs.map((r, i) => (
            <div key={i} className="card py-3 px-4 flex gap-3 items-start">
              <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                {r.by[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-gray-800">{r.by}</span>
                  <span className="text-xs text-gray-400">{r.store}</span>
                  <span className="badge bg-brand-100 text-brand-700">{r.looking}</span>
                  {r.reason !== "—" && <span className="badge bg-red-100 text-red-700">{r.reason}</span>}
                </div>
                <p className="text-sm text-gray-600 mt-1 italic">"{r.note}"</p>
              </div>
              <span className="text-xs text-gray-300 flex-shrink-0">{r.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
