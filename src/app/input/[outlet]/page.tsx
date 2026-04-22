"use client";
import { useState, useEffect } from "react";
import { CheckCircle, ChevronDown, Loader2 } from "lucide-react";

const lookingForOpts = ["Wallet", "Card Holder", "Tote Bag", "Backpack", "Luggage", "Belt", "Accessories", "Gift"];
const nobuReasonOpts = ["Price", "Design", "Size/Colour", "Quality concern", "Not urgent", "Comparing brands", "Other"];
const suggestionOpts  = ["Bigger size", "More colours", "Lower price", "Bundle deal", "Personalization", "Other"];

function toggle(arr: string[], val: string) {
  return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
}

function ChipGroup({ options, selected, onChange, color }: {
  options: string[]; selected: string[]; onChange: (v: string[]) => void;
  color: "brand" | "red" | "blue";
}) {
  const base = {
    brand: { on: "bg-brand-500 text-white border-brand-500", off: "bg-white text-gray-600 border-gray-200 active:bg-brand-50" },
    red:   { on: "bg-red-500 text-white border-red-500",     off: "bg-white text-gray-600 border-gray-200 active:bg-red-50"   },
    blue:  { on: "bg-blue-500 text-white border-blue-500",   off: "bg-white text-gray-600 border-gray-200 active:bg-blue-50"  },
  }[color];
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button key={opt} onClick={() => onChange(toggle(selected, opt))}
          className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-all ${selected.includes(opt) ? base.on : base.off}`}>
          {opt}
        </button>
      ))}
    </div>
  );
}

export default function MobileInputPage({ params }: { params: { outlet: string } }) {
  const { outlet: outletId } = params;

  const [outletName, setOutletName] = useState("Loading…");
  const [staffList, setStaffList] = useState<{ id: string; name: string }[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [staffName, setStaffName] = useState("");
  const [looking, setLooking] = useState<string[]>([]);
  const [reasons, setReasons] = useState<string[]>([]);
  const [sug, setSug] = useState<string[]>([]);
  const [quote, setQuote] = useState("");

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
    if (!staffName) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/inputs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outletId, staffName, lookingFor: looking, nobuReasons: reasons, suggestions: sug, quote }),
      });
      if (res.ok) setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setSubmitted(false);
    setLooking([]); setReasons([]); setSug([]); setQuote(""); setStaffName("");
  }

  if (submitted) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#f8f7f4] flex flex-col items-center justify-center px-6 gap-5">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle size={40} className="text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 text-center">Submitted!</h2>
        <p className="text-gray-500 text-center text-sm">Sent to Data Hub automatically.</p>
        <button
          className="w-full max-w-sm bg-brand-500 text-white py-4 rounded-2xl font-bold text-lg active:bg-brand-600 transition-colors"
          onClick={reset}
        >
          + New Input
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-[#f8f7f4] overflow-y-auto">
      <div className="bg-brand-500 text-white px-5 pt-10 pb-5">
        <div className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">JackStudio OS</div>
        <h1 className="text-xl font-bold">{outletName}</h1>
        <p className="text-sm opacity-80 mt-0.5">Customer Input · 30 seconds</p>
      </div>

      <div className="px-4 py-5 space-y-6 max-w-lg mx-auto">
        {/* Staff name */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Who are you?</label>
          <div className="relative">
            <select className="select py-3.5 text-base appearance-none pr-10" value={staffName}
              onChange={(e) => setStaffName(e.target.value)}>
              <option value="">Select your name…</option>
              {staffList.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Customer looking for?</label>
          <ChipGroup options={lookingForOpts} selected={looking} onChange={setLooking} color="brand" />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Why didn&apos;t they buy? <span className="text-gray-400 font-normal text-xs">(if applicable)</span>
          </label>
          <ChipGroup options={nobuReasonOpts} selected={reasons} onChange={setReasons} color="red" />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Customer suggested?</label>
          <ChipGroup options={suggestionOpts} selected={sug} onChange={setSug} color="blue" />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Customer&apos;s exact words:
            <span className="block text-xs text-red-400 font-normal mt-0.5">Write what they SAID, not what you think</span>
          </label>
          <textarea
            className="textarea text-base py-3 min-h-[80px]"
            placeholder='"Can this come in brown?" / "Do you have a bigger size?"'
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
          />
        </div>

        <button
          className="w-full bg-brand-500 text-white py-4 rounded-2xl font-bold text-lg active:bg-brand-600 transition-colors shadow-lg shadow-brand-200 disabled:opacity-50 flex items-center justify-center gap-2"
          disabled={!staffName || submitting}
          onClick={handleSubmit}
        >
          {submitting ? <><Loader2 size={20} className="animate-spin" /> Submitting…</> : "Submit →"}
        </button>

        <p className="text-center text-xs text-gray-400 pb-8">{outletName} · JackStudio OS</p>
      </div>
    </div>
  );
}
