"use client";
import { useState, useEffect } from "react";
import { CheckCircle, ChevronDown, ChevronUp, Loader2, Zap } from "lucide-react";

const categories = [
  { label: "Wallet",      emoji: "👜" },
  { label: "Card Holder", emoji: "🪪" },
  { label: "Bag",         emoji: "🎒" },
  { label: "Luggage",     emoji: "🧳" },
  { label: "Accessories", emoji: "✨" },
  { label: "Gift",        emoji: "🎁" },
];

const nobuReasons = [
  { label: "Price",       emoji: "💰" },
  { label: "Size",        emoji: "📏" },
  { label: "Design",      emoji: "🎨" },
  { label: "Quality",     emoji: "🔍" },
  { label: "Not urgent",  emoji: "⏳" },
];

const suggestions = [
  "Bigger size",
  "More colours",
  "Lower price",
  "More compartments",
  "Personalization",
];

function toggle(arr: string[], val: string) {
  return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];
}

type SubmitResult = { weekCount: number; topDemand: string | null };

export default function MobileInputPage({ params }: { params: { outlet: string } }) {
  const { outlet: outletId } = params;

  const [outletName, setOutletName] = useState("Loading…");
  const [staffList, setStaffList]   = useState<{ id: string; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]         = useState<SubmitResult | null>(null);

  const [staffName, setStaffName] = useState("");
  const [looking,   setLooking]   = useState<string[]>([]);
  const [reasons,   setReasons]   = useState<string[]>([]);
  const [sug,       setSug]       = useState<string[]>([]);
  const [quote,     setQuote]     = useState("");
  const [showContact, setShowContact] = useState(false);
  const [custName,  setCustName]  = useState("");
  const [custPhone, setCustPhone] = useState("");

  useEffect(() => {
    fetch(`/api/outlets/${outletId}/staff`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {
          setOutletName(d.outlet.name);
          setStaffList([...d.staff, { id: "other", name: "Other" }]);
        } else {
          setOutletName(outletId.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()));
        }
      });
  }, [outletId]);

  async function handleSubmit() {
    if (!staffName || !looking.length) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/inputs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outletId,
          staffName,
          lookingFor:    looking,
          nobuReasons:   reasons,
          suggestions:   sug,
          quote:         quote || null,
          customerName:  custName  || null,
          customerPhone: custPhone || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult({ weekCount: data.weekCount ?? 1, topDemand: data.topDemand ?? null });
      }
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setResult(null);
    setLooking([]); setReasons([]); setSug([]); setQuote("");
    setStaffName(""); setCustName(""); setCustPhone(""); setShowContact(false);
  }

  const showSuggestions = looking.length > 0 || reasons.length > 0;
  const canSubmit = staffName && looking.length > 0 && !submitting;

  // Success screen
  if (result) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#f8f7f4] flex flex-col items-center justify-center px-6 gap-5 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle size={40} className="text-green-500" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-gray-900">已记录！</h2>
          <p className="text-gray-500 mt-1 text-sm">Input recorded successfully</p>
        </div>
        <div className="bg-white rounded-2xl px-6 py-4 shadow-sm border border-gray-100 w-full max-w-sm">
          <div className="text-3xl font-black text-brand-600">#{result.weekCount}</div>
          <div className="text-sm text-gray-500">本周第 {result.weekCount} 条客户需求</div>
          <div className="text-xs text-gray-400">This week&apos;s {result.weekCount}{result.weekCount === 1 ? "st" : result.weekCount === 2 ? "nd" : result.weekCount === 3 ? "rd" : "th"} input</div>
        </div>
        {result.topDemand && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3 w-full max-w-sm">
            <Zap size={16} className="text-amber-500 flex-shrink-0" />
            <div className="text-left">
              <div className="text-xs text-amber-600 font-semibold">🔥 本周热门需求</div>
              <div className="text-sm font-bold text-amber-800">{result.topDemand}</div>
            </div>
          </div>
        )}
        <button
          className="w-full max-w-sm bg-brand-500 text-white py-4 rounded-2xl font-bold text-lg active:bg-brand-600 transition-colors"
          onClick={reset}
        >
          + 新建记录
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-[#f8f7f4] overflow-y-auto">
      {/* Header */}
      <div className="bg-brand-500 text-white px-5 pt-10 pb-5">
        <div className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">JackStudio OS</div>
        <h1 className="text-xl font-bold">{outletName}</h1>
        <p className="text-sm opacity-80 mt-0.5">Customer Input · 30 seconds</p>
      </div>

      <div className="px-4 py-5 space-y-6 max-w-lg mx-auto">

        {/* Step 0 — Who are you */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Who are you?</label>
          <div className="relative">
            <select className="select py-3.5 text-base appearance-none pr-10" value={staffName}
              onChange={e => setStaffName(e.target.value)}>
              <option value="">Select your name…</option>
              {staffList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Step 1 — What were they looking for */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Customer looking for? <span className="text-red-400 normal-case font-normal">(required)</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {categories.map(c => {
              const on = looking.includes(c.label);
              return (
                <button key={c.label} onClick={() => setLooking(toggle(looking, c.label))}
                  className={`py-3 rounded-2xl text-sm font-semibold border-2 transition-all flex flex-col items-center gap-1 ${
                    on ? "bg-brand-500 text-white border-brand-500 shadow-md" : "bg-white text-gray-600 border-gray-100 active:border-brand-300"
                  }`}>
                  <span className="text-xl">{c.emoji}</span>
                  <span className="text-xs">{c.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2 — Why didn't buy */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Why didn&apos;t they buy? <span className="text-gray-400 normal-case font-normal">(optional)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {nobuReasons.map(r => {
              const on = reasons.includes(r.label);
              return (
                <button key={r.label} onClick={() => setReasons(toggle(reasons, r.label))}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all flex items-center gap-1.5 ${
                    on ? "bg-red-500 text-white border-red-500 shadow-md" : "bg-white text-gray-600 border-gray-100 active:border-red-300"
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
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Customer suggested?
            </label>
            <div className="flex flex-wrap gap-2">
              {suggestions.map(s => {
                const on = sug.includes(s);
                return (
                  <button key={s} onClick={() => setSug(toggle(sug, s))}
                    className={`px-3.5 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                      on ? "bg-blue-500 text-white border-blue-500 shadow-md" : "bg-white text-gray-600 border-gray-100 active:border-blue-300"
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
            Customer&apos;s exact words <span className="text-red-400 normal-case font-normal">(write what they SAID)</span>
          </label>
          <textarea
            className="textarea text-base py-3 min-h-[70px]"
            placeholder='"Can this come in brown?" / "Need bigger for travel"'
            value={quote}
            onChange={e => setQuote(e.target.value)}
          />
        </div>

        {/* Step 5 — Contact (collapsed) */}
        <div>
          <button
            onClick={() => setShowContact(!showContact)}
            className="flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors">
            {showContact ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showContact ? "Hide customer info" : "+ Add customer name / phone (optional)"}
          </button>
          {showContact && (
            <div className="mt-3 space-y-2">
              <input className="input" placeholder="Customer name (optional)" value={custName}
                onChange={e => setCustName(e.target.value)} />
              <input className="input" type="tel" placeholder="Phone number (optional)" value={custPhone}
                onChange={e => setCustPhone(e.target.value)} />
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          className="w-full bg-brand-500 text-white py-4 rounded-2xl font-bold text-lg active:bg-brand-600 transition-colors shadow-lg shadow-brand-200 disabled:opacity-40 flex items-center justify-center gap-2"
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          {submitting ? <><Loader2 size={20} className="animate-spin" /> Recording…</> : "Submit →"}
        </button>

        <p className="text-center text-xs text-gray-400 pb-8">{outletName} · JackStudio OS</p>
      </div>
    </div>
  );
}
