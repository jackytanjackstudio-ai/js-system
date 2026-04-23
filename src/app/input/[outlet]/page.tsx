"use client";
import { useState, useEffect, useRef } from "react";
import { CheckCircle, ChevronDown, ChevronUp, Loader2, Zap, Camera, X, ImageIcon } from "lucide-react";

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

// Image feature tags
const styleTagGroups = [
  { group: "Style",    tags: ["Formal", "Casual", "Travel", "Sporty", "Luxury"] },
  { group: "Size",     tags: ["Compact", "Medium", "Large"] },
  { group: "Features", tags: ["Multi-compartment", "RFID", "Laptop slot", "Anti-theft", "Waterproof"] },
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

  const [staffName,    setStaffName]    = useState("");
  const [looking,      setLooking]      = useState<string[]>([]);
  const [reasons,      setReasons]      = useState<string[]>([]);
  const [sug,          setSug]          = useState<string[]>([]);
  const [quote,        setQuote]        = useState("");
  const [showContact,  setShowContact]  = useState(false);
  const [custName,     setCustName]     = useState("");
  const [custPhone,    setCustPhone]    = useState("");

  // Image state
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl,     setImageUrl]     = useState<string | null>(null);
  const [imageTags,    setImageTags]    = useState<string[]>([]);
  const [uploading,    setUploading]    = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // local preview immediately
    setImagePreview(URL.createObjectURL(file));
    setImageUrl(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (res.ok) setImageUrl(data.url);
      else setImagePreview(null); // upload failed, clear preview
    } finally {
      setUploading(false);
    }
  }

  function removeImage() {
    setImagePreview(null);
    setImageUrl(null);
    setImageTags([]);
    if (fileRef.current) fileRef.current.value = "";
  }

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
          imageUrl:      imageUrl  || null,
          imageTags:     imageTags,
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
    removeImage();
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
        <button className="w-full max-w-sm bg-brand-500 text-white py-4 rounded-2xl font-bold text-lg active:bg-brand-600 transition-colors"
          onClick={reset}>
          + 新建记录
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

        {/* Who are you */}
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

        {/* Looking for */}
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

        {/* Why didn't buy */}
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
                  <span>{r.emoji}</span><span>{r.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Suggestions (auto-appear) */}
        {showSuggestions && (
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Customer suggested?</label>
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

        {/* Image upload */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Customer showed you a photo? <span className="text-gray-400 normal-case font-normal">(optional)</span>
          </label>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />

          {!imagePreview ? (
            <button onClick={() => fileRef.current?.click()}
              className="w-full py-5 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center gap-2 text-gray-400 active:border-brand-300 active:text-brand-500 transition-all">
              <Camera size={24} />
              <span className="text-sm font-medium">Upload photo</span>
              <span className="text-xs">JPEG · PNG · up to 8MB</span>
            </button>
          ) : (
            <div className="space-y-3">
              {/* Preview */}
              <div className="relative rounded-2xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Customer photo" className="w-full max-h-48 object-cover" />
                {uploading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Loader2 size={24} className="animate-spin text-white" />
                  </div>
                )}
                <button onClick={removeImage}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center text-white">
                  <X size={14} />
                </button>
                {imageUrl && !uploading && (
                  <div className="absolute bottom-2 left-2 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                    <ImageIcon size={9} /> Uploaded
                  </div>
                )}
              </div>

              {/* Feature tags (appear after image upload) */}
              {imageUrl && (
                <div className="bg-gray-50 rounded-2xl p-3 space-y-3">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">What style / features? (helps us track trends)</p>
                  {styleTagGroups.map(group => (
                    <div key={group.group}>
                      <p className="text-[10px] font-semibold text-gray-400 mb-1.5">{group.group}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {group.tags.map(tag => {
                          const on = imageTags.includes(tag);
                          return (
                            <button key={tag} onClick={() => setImageTags(toggle(imageTags, tag))}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                on ? "bg-purple-500 text-white border-purple-500" : "bg-white text-gray-600 border-gray-200 active:border-purple-300"
                              }`}>
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quote */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Customer&apos;s exact words <span className="text-red-400 normal-case font-normal">(write what they SAID)</span>
          </label>
          <textarea className="textarea text-base py-3 min-h-[70px]"
            placeholder='"Can this come in brown?" / "Need bigger for travel"'
            value={quote} onChange={e => setQuote(e.target.value)} />
        </div>

        {/* Contact (collapsed) */}
        <div>
          <button onClick={() => setShowContact(!showContact)}
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

        <button
          className="w-full bg-brand-500 text-white py-4 rounded-2xl font-bold text-lg active:bg-brand-600 transition-colors shadow-lg shadow-brand-200 disabled:opacity-40 flex items-center justify-center gap-2"
          disabled={!canSubmit}
          onClick={handleSubmit}>
          {submitting ? <><Loader2 size={20} className="animate-spin" /> Recording…</> : "Submit →"}
        </button>

        <p className="text-center text-xs text-gray-400 pb-8">{outletName} · JackStudio OS</p>
      </div>
    </div>
  );
}
