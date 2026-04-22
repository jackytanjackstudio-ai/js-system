"use client";
import { useState } from "react";
import { CheckCircle, AlertCircle } from "lucide-react";
import { useLang } from "@/context/LangContext";

const channels = ["KL Flagship", "Pavilion", "1Utama", "Shopee", "Lazada", "TikTok Shop", "All Channels"];

const pastReports = [
  {
    week: "W19", by: "Jason Lim", channel: "KL Flagship",
    top: ["Slim Wallet (Brown)", "Tote Bag (Caramel)"],
    slow: ["Belt Classic (Black)"],
    quote: '"Three customers this week said they want a bigger wallet — specifically asking for zippered compartment"',
    revenue: "RM18,400",
  },
  {
    week: "W19", by: "Ecom Team", channel: "Shopee",
    top: ["Classic Wallet (Black)", "Slim Card Holder"],
    slow: ["Canvas Backpack"],
    quote: '"Most cart abandonments on luggage — customers asking if price includes lock"',
    revenue: "RM31,200",
  },
];

export default function SalesReport() {
  const { t } = useLang();
  const [submitted, setSubmitted] = useState(false);
  const [topItems, setTopItems]   = useState(["", ""]);
  const [slowItems, setSlowItems] = useState(["", ""]);

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle size={32} className="text-green-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">{t("sr_success_title")}</h2>
        <p className="text-sm text-gray-500">{t("sr_success_sub")}</p>
        <button className="btn-primary" onClick={() => setSubmitted(false)}>{t("sr_submit_another")}</button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="page-title">{t("sr_title")}</h1>
        <p className="text-sm text-gray-400 mt-0.5">{t("sr_subtitle")}</p>
      </div>

      <div className="card space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t("sr_week")}</label>
            <input type="week" className="input" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t("sr_channel")}</label>
            <select className="select">
              {channels.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t("sr_revenue")}</label>
          <input type="number" className="input" placeholder="e.g. 22000" />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {t("sr_top")} <span className="text-gray-400 font-normal">{t("sr_top_sub")}</span>
          </label>
          <div className="space-y-2">
            {topItems.map((v, i) => (
              <input
                key={i} className="input" value={v}
                onChange={(e) => { const n = [...topItems]; n[i] = e.target.value; setTopItems(n); }}
                placeholder={`#${i + 1} e.g. Slim Wallet Brown – 32 units`}
              />
            ))}
            <button className="text-xs text-brand-600 font-semibold hover:underline" onClick={() => setTopItems([...topItems, ""])}>
              {t("sr_add_row")}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t("sr_slow")}</label>
          <div className="space-y-2">
            {slowItems.map((v, i) => (
              <input
                key={i} className="input" value={v}
                onChange={(e) => { const n = [...slowItems]; n[i] = e.target.value; setSlowItems(n); }}
                placeholder={`#${i + 1} e.g. Canvas Backpack`}
              />
            ))}
            <button className="text-xs text-brand-600 font-semibold hover:underline" onClick={() => setSlowItems([...slowItems, ""])}>
              {t("sr_add_row")}
            </button>
          </div>
        </div>

        <div>
          <div className="flex items-start gap-2 mb-1.5">
            <label className="block text-sm font-semibold text-gray-700">{t("sr_quote")}</label>
            <div className="flex items-center gap-1 bg-red-50 border border-red-200 rounded-lg px-2 py-0.5">
              <AlertCircle size={11} className="text-red-500" />
              <span className="text-[10px] text-red-600 font-semibold">{t("sr_quote_warn")}</span>
            </div>
          </div>
          <textarea className="textarea" rows={2} placeholder='"Customer said: I want a bigger wallet with a coin pocket"' />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t("sr_objection")}</label>
          <select className="select">
            <option value="">{t("ci_select")}</option>
            <option>Price too high</option>
            <option>Size / colour not available</option>
            <option>Comparing with competitor</option>
            <option>No urgency</option>
            <option>Quality concern</option>
            <option>Other</option>
          </select>
        </div>

        <button className="btn-primary w-full py-3" onClick={() => setSubmitted(true)}>
          {t("sr_submit")}
        </button>
      </div>

      <div>
        <h2 className="font-semibold text-gray-700 mb-3">{t("sr_prev")}</h2>
        <div className="space-y-3">
          {pastReports.map((r, i) => (
            <div key={i} className="card space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="badge bg-gray-100 text-gray-700">{r.week}</span>
                <span className="text-sm font-semibold text-gray-800">{r.by}</span>
                <span className="text-xs text-gray-400">{r.channel}</span>
                <span className="ml-auto text-sm font-bold text-brand-600">{r.revenue}</span>
              </div>
              <div className="flex gap-4 text-xs">
                <div>
                  <span className="text-gray-400">Top: </span>
                  {r.top.map((t2) => <span key={t2} className="badge bg-green-100 text-green-700 mr-1">{t2}</span>)}
                </div>
                <div>
                  <span className="text-gray-400">Slow: </span>
                  {r.slow.map((t2) => <span key={t2} className="badge bg-red-100 text-red-700 mr-1">{t2}</span>)}
                </div>
              </div>
              <p className="text-sm text-gray-600 italic">{r.quote}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
