"use client";
import { useState, useEffect, useRef } from "react";
import { Loader2, ChevronLeft, ChevronDown, ChevronUp, ScanLine, X, AlertCircle, Camera, ImageIcon } from "lucide-react";
import { useData, apiFetch } from "@/hooks/useData";
import { useAuth } from "@/context/AuthContext";
import { useLang } from "@/context/LangContext";

// ─── Per-category config ───────────────────────────────────────────────────────
const CATEGORY_CONFIG = {
  Bag: {
    emoji: "👜",
    lostReasons: ["Too Heavy", "Not Enough Compartments", "Wrong Size", "Design Not Matching", "Price", "Function Not Enough"],
    marketSignals: ["Lightweight", "More Compartments", "Laptop Slot", "Water Resistant", "Expandable", "Anti-Theft"],
  },
  Wallet: {
    emoji: "👛",
    lostReasons: ["Too Thick", "No Cash Slot", "Too Few Card Slots", "Design Not Matching", "Price"],
    marketSignals: ["RFID", "Slim Design", "Cash Compartment", "More Card Slots", "No Hole Design"],
  },
  "Card Holder": {
    emoji: "💳",
    lostReasons: ["Too Few Slots", "Design Not Matching", "Price", "No Protection", "Too Bulky"],
    marketSignals: ["More Card Slots", "RFID", "Slim Design", "Minimalist Look", "Easy Access"],
  },
  Belt: {
    emoji: "🪢",
    lostReasons: ["Too Short", "No Ladies Option", "Limited Design", "Quality Concern", "Price"],
    marketSignals: ["Longer Size", "Ladies Design", "More Colors", "Multi-Occasion Use", "Premium Buckle"],
  },
  Luggage: {
    emoji: "🧳",
    lostReasons: ["Too Expensive", "Not Expandable", "Design Not Matching", "Too Heavy", "No Value Feel"],
    marketSignals: ["Expandable", "Clip Lock (not zip)", "Lightweight", "Hard Case Option", "Double Security"],
  },
  Accessories: {
    emoji: "✨",
    lostReasons: ["Design Not Matching", "Price", "Not Useful", "No Suitable Option"],
    marketSignals: ["Bundle Option", "Gift Wrap", "Customization", "Color Variety"],
  },
} as const;

type Category = keyof typeof CATEGORY_CONFIG;

const USE_CASES      = ["Work", "Travel", "Daily", "Gift"] as const;
const USE_EMOJIS     = { Work: "💼", Travel: "✈️", Daily: "☀️", Gift: "🎁" };
const TRIGGERS       = ["Design", "Function", "Price", "Staff ⭐"] as const;
const CUSTOMER_TYPES = ["First Time", "Repeat", "Tourist"] as const;
const ADD_ON_OPTIONS = ["Belt", "Keychain", "Card Holder", "Wallet", "Pouch"] as const;

type Outcome = "sold" | "not_sold";
type Outlet  = { id: string; name: string; isActive: boolean };

// Map raw DB category string → wizard Category key
function mapCategory(raw: string): Category | null {
  const s = raw.toLowerCase();
  if (s.includes("bag") || s.includes("backpack") || s.includes("sling") || s.includes("tote")) return "Bag";
  if (s.includes("wallet"))           return "Wallet";
  if (s.includes("card"))             return "Card Holder";
  if (s.includes("belt"))             return "Belt";
  if (s.includes("luggage") || s.includes("travel") || s.includes("suitcase")) return "Luggage";
  if (s.includes("accessor") || s.includes("pouch") || s.includes("keychain")) return "Accessories";
  return null;
}

// ─── Barcode Scanner ───────────────────────────────────────────────────────────
function BarcodeScanner({ onScan, onClose }: { onScan: (code: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [camError, setCamError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let stopped = false;
    let stopFn: (() => void) | null = null;
    async function start() {
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const reader = new BrowserMultiFormatReader();
        if (stopped) return;
        setReady(true);
        const controls = await reader.decodeFromVideoDevice(undefined, videoRef.current!, (result) => {
          if (result && !stopped) { stopped = true; controls.stop(); onScan(result.getText()); }
        });
        stopFn = () => controls.stop();
      } catch {
        setCamError("Camera unavailable. Allow camera permission and try again.");
      }
    }
    start();
    return () => { stopped = true; stopFn?.(); };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-2 text-white">
          <ScanLine size={18} /><span className="font-semibold">Scan Product Barcode</span>
        </div>
        <button onClick={onClose} className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center text-white">
          <X size={18} />
        </button>
      </div>
      {camError ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8">
          <AlertCircle size={40} className="text-red-400" />
          <p className="text-red-300 text-center text-sm">{camError}</p>
          <button onClick={onClose} className="px-6 py-2.5 bg-white/10 rounded-xl text-white text-sm font-semibold">Close</button>
        </div>
      ) : (
        <>
          <div className="flex-1 relative overflow-hidden">
            <video ref={videoRef} className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-40 border-2 border-brand-400 rounded-xl relative">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-brand-400 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-brand-400 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-brand-400 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-brand-400 rounded-br-lg" />
              </div>
            </div>
          </div>
          <p className="text-center text-gray-400 text-sm py-5 flex-shrink-0">
            {ready ? "Point camera at the product barcode" : "Starting camera…"}
          </p>
        </>
      )}
    </div>
  );
}

// ─── Step dots ─────────────────────────────────────────────────────────────────
function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5 mb-5">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`rounded-full transition-all duration-300 ${
          i === current ? "w-6 h-2 bg-brand-500" :
          i < current   ? "w-2 h-2 bg-brand-300" :
                          "w-2 h-2 bg-gray-200"
        }`} />
      ))}
    </div>
  );
}

// ─── Chip button ───────────────────────────────────────────────────────────────
function ChipBtn({ label, selected, color, onClick }: {
  label: string; selected: boolean;
  color: "green" | "red" | "purple" | "blue" | "brand";
  onClick: () => void;
}) {
  const on: Record<string, string> = {
    green:  "bg-green-500 text-white border-green-500 shadow-md",
    red:    "bg-red-500 text-white border-red-500 shadow-md",
    purple: "bg-purple-500 text-white border-purple-500 shadow-md",
    blue:   "bg-blue-500 text-white border-blue-500 shadow-md",
    brand:  "bg-brand-500 text-white border-brand-500 shadow-md",
  };
  return (
    <button onClick={onClick}
      className={`px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
        selected ? on[color] : "bg-white text-gray-600 border-gray-100 hover:border-gray-300"
      }`}>
      {label}
    </button>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function CustomerLog() {
  const { t } = useLang();
  const { user } = useAuth();
  const { data: outlets, loading: outLoading } = useData<Outlet[]>("/api/outlets");

  const [step,         setStep]         = useState(0);
  const [outcome,      setOutcome]      = useState<Outcome | null>(null);
  const [outletId,     setOutletId]     = useState("");
  const [category,     setCategory]     = useState<Category | null>(null);
  const [useCase,      setUseCase]      = useState<string | null>(null);
  // Sold path
  const [buyTrigger,   setBuyTrigger]   = useState<string | null>(null);
  const [customerType, setCustomerType] = useState<string | null>(null);
  const [addOns,       setAddOns]       = useState<string[]>([]);
  // Not-sold path
  const [lostReason,    setLostReason]    = useState<string | null>(null);
  const [marketSignals, setMarketSignals] = useState<string[]>([]);
  // Step 4
  const [customerSaid,  setCustomerSaid]  = useState("");
  const [custName,      setCustName]      = useState("");
  const [custPhone,     setCustPhone]     = useState("");
  const [showContact,   setShowContact]   = useState(false);
  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [scanning,      setScanning]      = useState(false);
  const [scannedName,   setScannedName]   = useState<string | null>(null);
  const [scanSearching, setScanSearching] = useState(false);
  const [manualCode,    setManualCode]    = useState("");
  // Photo upload (no-sale path)
  const [imageUrl,    setImageUrl]    = useState<string | null>(null);
  const [imageThumb,  setImageThumb]  = useState<string | null>(null);
  const [imgLoading,  setImgLoading]  = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<{
    todayCount: number; weekCount: number; topDemand: string | null;
  } | null>(null);

  // Auto-set outlet for staff with fixed outlet
  useEffect(() => {
    if (user?.outletId) setOutletId(user.outletId);
  }, [user]);

  const activeOutlets = (outlets ?? []).filter(o => o.isActive);
  const catCfg        = category ? CATEGORY_CONFIG[category] : null;
  const hasOutlet     = !!(user?.outletId || outletId);

  const canNext = [
    outcome !== null,
    hasOutlet && !!category,
    !!useCase,
    outcome === "sold" ? !!buyTrigger : !!lostReason,
    true,
  ];

  async function handleScan(code: string) {
    setScanning(false);
    setScanSearching(true);
    try {
      const res = await fetch(`/api/products/search?q=${encodeURIComponent(code)}`);
      const products = await res.json();
      if (products.length > 0) {
        const mapped = mapCategory(products[0].category);
        if (mapped) setCategory(mapped);
        setScannedName(products[0].name);
      }
    } finally {
      setScanSearching(false);
    }
  }

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
        canvas.toBlob(blob => resolve(blob!), "image/jpeg", 0.8);
      };
      img.src = url;
    });
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgLoading(true);
    const local = URL.createObjectURL(file);
    setImageThumb(local);
    try {
      const blob = await resizeToBlob(file);
      const fd = new FormData();
      fd.append("file", blob, "photo.jpg");
      fd.append("upload_preset", "jackstudio_upload");
      const res = await fetch("https://api.cloudinary.com/v1_1/ds0ka66z1/image/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setImageUrl(data.secure_url);
      URL.revokeObjectURL(local);
    } catch {
      setImageThumb(null); setImageUrl(null);
    } finally {
      setImgLoading(false);
    }
  }

  function removePhoto() {
    setImageUrl(null); setImageThumb(null);
    if (photoRef.current) photoRef.current.value = "";
  }

  async function handleSubmit() {
    if (!hasOutlet || !user || !category || !outcome) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const data = await apiFetch("/api/inputs", {
        method: "POST",
        body: JSON.stringify({
          outletId:     user.outletId || outletId,
          staffName:    user.name,
          outcome,
          lookingFor:   [category],
          useCase:      useCase ? [useCase] : [],
          buyTrigger:   buyTrigger   || null,
          customerType: customerType || null,
          addOns,
          nobuReasons:  lostReason ? [lostReason] : [],
          signalTags:   marketSignals,
          suggestions:  [],
          quote:        customerSaid.trim() || null,
          customerName:  custName.trim()  || null,
          customerPhone: custPhone.trim() || null,
          imageUrl:      imageUrl || null,
        }),
      });
      setResult({
        todayCount: data.todayCount ?? 1,
        weekCount:  data.weekCount  ?? 1,
        topDemand:  data.topDemand  ?? null,
      });
    } catch {
      setSubmitError("Something went wrong — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setStep(0); setOutcome(null); setCategory(null); setUseCase(null);
    setBuyTrigger(null); setCustomerType(null); setAddOns([]);
    setLostReason(null); setMarketSignals([]);
    setCustomerSaid(""); setCustName(""); setCustPhone(""); setShowContact(false);
    setSubmitError(null); setScannedName(null); setManualCode(""); setResult(null);
    removePhoto();
    if (!user?.outletId) setOutletId("");
  }

  // ── Success screen ────────────────────────────────────────────────────────────
  if (result) {
    return (
      <div className="max-w-md mx-auto flex flex-col items-center gap-5 pt-6 text-center px-4">
        <div className="text-6xl">{outcome === "sold" ? "🎉" : "📝"}</div>
        <div>
          <h2 className="text-2xl font-black text-gray-900">
            {outcome === "sold" ? t("cl_sale_logged") : t("cl_feedback_saved")}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {outcome === "sold" ? t("cl_sale_logged_sub") : t("cl_feedback_saved_sub")}
          </p>
        </div>
        <div className="bg-brand-50 border border-brand-200 rounded-2xl px-8 py-4">
          <div className="text-3xl font-black text-brand-600">🔥 {result.todayCount}</div>
          <div className="text-sm text-gray-500">{t("cl_logs_today")}</div>
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          {category && <span className="badge bg-brand-100 text-brand-700">{catCfg?.emoji} {category}</span>}
          {useCase   && <span className="badge bg-purple-100 text-purple-700">{useCase}</span>}
          {outcome === "sold"     && buyTrigger  && <span className="badge bg-green-100 text-green-700">{buyTrigger}</span>}
          {outcome === "not_sold" && lostReason  && <span className="badge bg-red-100 text-red-700">{lostReason}</span>}
        </div>
        {customerSaid.trim() && (
          <p className="text-sm text-gray-600 italic bg-gray-50 rounded-2xl px-5 py-3 w-full">
            &ldquo;{customerSaid.trim()}&rdquo;
          </p>
        )}
        <button className="btn-primary w-full py-3" onClick={reset}>{t("cl_log_next")}</button>
      </div>
    );
  }

  // ── Wizard ────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-lg space-y-4">
      <div>
        <h1 className="page-title">Customer Log</h1>
        <p className="text-sm text-gray-400 mt-0.5">{t("cl_subtitle")}</p>
      </div>

      <div className="card">
        <StepDots total={5} current={step} />

        {/* ── Step 0: Outcome ─────────────────────────────────────── */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-black text-gray-900 text-center">What happened?</h2>
            <div className="grid grid-cols-2 gap-3">
              {([
                { value: "sold",     emoji: "✅", label: t("cl_sale_closed"), sub: t("cl_sale_closed_sub"),
                  base: "border-green-200 hover:border-green-400",
                  active: "bg-green-500 text-white border-green-500 shadow-md" },
                { value: "not_sold", emoji: "📋", label: t("cl_no_sale"), sub: t("cl_no_sale_sub"),
                  base: "border-red-200 hover:border-red-400",
                  active: "bg-red-500 text-white border-red-500 shadow-md" },
              ] as const).map(opt => (
                <button key={opt.value}
                  onClick={() => { setOutcome(opt.value); setStep(1); }}
                  className={`py-10 rounded-2xl border-2 flex flex-col items-center gap-2.5 transition-all font-bold text-sm ${
                    outcome === opt.value ? opt.active : `bg-white text-gray-700 ${opt.base}`
                  }`}>
                  <span className="text-5xl">{opt.emoji}</span>
                  <span>{opt.label}</span>
                  <span className={`text-xs font-normal ${outcome === opt.value ? "opacity-80" : "text-gray-400"}`}>{opt.sub}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 1: Where + What ────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <button onClick={() => setStep(0)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                <ChevronLeft size={18} />
              </button>
              <h2 className="text-lg font-black text-gray-900">{t("cl_where_what")}</h2>
            </div>

            {/* Outlet — hidden for staff with fixed outlet */}
            {!user?.outletId && (
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Store</label>
                {outLoading
                  ? <div className="flex items-center gap-2 text-sm text-gray-400"><Loader2 size={14} className="animate-spin" /> Loading…</div>
                  : (
                    <select className="select" value={outletId} onChange={e => setOutletId(e.target.value)}>
                      <option value="">Select outlet…</option>
                      {activeOutlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                  )}
              </div>
            )}

            {/* Barcode — camera scan + manual entry */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                Product Barcode / SKU <span className="text-gray-400 font-normal normal-case">(optional — auto-fills category)</span>
              </label>
              <div className="flex gap-2">
                <button onClick={() => setScanning(true)} disabled={scanSearching}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50 flex-shrink-0">
                  <Camera size={15} />
                  <span className="hidden sm:inline">Scan</span>
                </button>
                <input
                  className="input flex-1 text-sm"
                  placeholder="Type barcode / SKU…"
                  value={manualCode}
                  onChange={e => setManualCode(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && manualCode.trim()) handleScan(manualCode.trim()); }}
                />
                <button
                  onClick={() => { if (manualCode.trim()) handleScan(manualCode.trim()); }}
                  disabled={!manualCode.trim() || scanSearching}
                  className="px-3 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-colors disabled:opacity-40 flex-shrink-0">
                  {scanSearching ? <Loader2 size={15} className="animate-spin" /> : "Go"}
                </button>
              </div>
              {scannedName && (
                <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-green-700">
                  <span className="flex-1 truncate">✓ {scannedName}</span>
                  <button onClick={() => { setScannedName(null); setCategory(null); setManualCode(""); }} className="opacity-60 hover:opacity-100 flex-shrink-0">
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>

            {/* Category grid */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Category <span className="text-red-400 font-normal normal-case">(required)</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(CATEGORY_CONFIG) as Category[]).map(key => {
                  const on = category === key;
                  return (
                    <button key={key} onClick={() => setCategory(key)}
                      className={`py-3 rounded-2xl text-sm font-semibold border-2 transition-all flex flex-col items-center gap-1 ${
                        on ? "bg-brand-500 text-white border-brand-500 shadow-md" : "bg-white text-gray-600 border-gray-100 hover:border-brand-200"
                      }`}>
                      <span className="text-xl">{CATEGORY_CONFIG[key].emoji}</span>
                      <span className="text-xs">{key}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button disabled={!canNext[1]} onClick={() => setStep(2)}
              className="btn-primary w-full py-3 disabled:opacity-40">
              Continue →
            </button>
          </div>
        )}

        {/* ── Step 2: Use Case ────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <button onClick={() => setStep(1)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                <ChevronLeft size={18} />
              </button>
              <h2 className="text-lg font-black text-gray-900">{t("cl_use_case")}</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {USE_CASES.map(uc => {
                const on = useCase === uc;
                return (
                  <button key={uc} onClick={() => setUseCase(uc)}
                    className={`py-6 rounded-2xl border-2 flex flex-col items-center gap-1.5 font-semibold text-sm transition-all ${
                      on ? "bg-purple-500 text-white border-purple-500 shadow-md" : "bg-white text-gray-600 border-gray-100 hover:border-purple-200"
                    }`}>
                    <span className="text-3xl">{USE_EMOJIS[uc]}</span>
                    <span>{uc}</span>
                  </button>
                );
              })}
            </div>
            <button disabled={!canNext[2]} onClick={() => setStep(3)}
              className="btn-primary w-full py-3 disabled:opacity-40">
              Continue →
            </button>
          </div>
        )}

        {/* ── Step 3A: Sold ───────────────────────────────────────── */}
        {step === 3 && outcome === "sold" && (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <button onClick={() => setStep(2)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                <ChevronLeft size={18} />
              </button>
              <h2 className="text-lg font-black text-gray-900">{t("cl_why_buy")}</h2>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Buying Trigger <span className="text-red-400 font-normal normal-case">(required)</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {TRIGGERS.map(t => (
                  <ChipBtn key={t} label={t} selected={buyTrigger === t} color="green" onClick={() => setBuyTrigger(t)} />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Customer Type <span className="text-gray-400 font-normal normal-case">(optional)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {CUSTOMER_TYPES.map(ct => (
                  <ChipBtn key={ct} label={ct} selected={customerType === ct} color="purple"
                    onClick={() => setCustomerType(customerType === ct ? null : ct)} />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Add-ons Sold <span className="text-gray-400 font-normal normal-case">(optional)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {ADD_ON_OPTIONS.map(ao => (
                  <ChipBtn key={ao} label={ao} selected={addOns.includes(ao)} color="brand"
                    onClick={() => setAddOns(prev => prev.includes(ao) ? prev.filter(x => x !== ao) : [...prev, ao])} />
                ))}
              </div>
            </div>
            <button disabled={!canNext[3]} onClick={() => setStep(4)}
              className="btn-primary w-full py-3 disabled:opacity-40">
              Continue →
            </button>
          </div>
        )}

        {/* ── Step 3B: Not sold ───────────────────────────────────── */}
        {step === 3 && outcome === "not_sold" && (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <button onClick={() => setStep(2)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                <ChevronLeft size={18} />
              </button>
              <h2 className="text-lg font-black text-gray-900">{t("cl_why_no_sale")}</h2>
              {category && <p className="text-xs text-gray-400 -mt-3">{t("cl_no_sale_hint")} <span className="font-semibold text-gray-600">{category}s</span>.</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Lost Reason <span className="text-red-400 font-normal normal-case">(required)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {(catCfg?.lostReasons ?? []).map(r => (
                  <ChipBtn key={r} label={r} selected={lostReason === r} color="red" onClick={() => setLostReason(r)} />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                What They Want <span className="text-gray-400 font-normal normal-case">(optional)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {(catCfg?.marketSignals ?? []).map(s => (
                  <ChipBtn key={s} label={s} selected={marketSignals.includes(s)} color="blue"
                    onClick={() => setMarketSignals(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])} />
                ))}
              </div>
            </div>
            <button disabled={!canNext[3]} onClick={() => setStep(4)}
              className="btn-primary w-full py-3 disabled:opacity-40">
              Continue →
            </button>
          </div>
        )}

        {/* ── Step 4: Customer Said + Contact ─────────────────────── */}
        {step === 4 && (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <button onClick={() => setStep(3)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                <ChevronLeft size={18} />
              </button>
              <h2 className="text-lg font-black text-gray-900">{t("cl_customer_said")}</h2>
            </div>

            <div className="bg-brand-50 border border-brand-100 rounded-xl px-4 py-2.5 text-sm text-brand-700 font-medium">
              {t("cl_said_hint")}
            </div>

            <div>
              <textarea className="textarea" rows={4} maxLength={200}
                placeholder={outcome === "sold" ? t("cl_said_ph_sold") : t("cl_said_ph_nosale")}
                value={customerSaid}
                onChange={e => setCustomerSaid(e.target.value)} />
              <p className="text-xs text-gray-400 mt-1.5 text-right">
                {customerSaid.length}/200 · optional but valuable
              </p>
            </div>

            {/* Photo upload — no-sale only */}
            {outcome === "not_sold" && (
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Customer showed a photo? <span className="text-gray-400 font-normal normal-case">(optional)</span>
                </label>
                <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                {!imageThumb ? (
                  <button onClick={() => photoRef.current?.click()} disabled={imgLoading}
                    className="w-full py-4 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center gap-2 text-gray-400 hover:border-brand-300 hover:text-brand-500 transition-all disabled:opacity-50">
                    {imgLoading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                    <span className="text-sm font-medium">{imgLoading ? "Uploading…" : "Upload photo"}</span>
                  </button>
                ) : (
                  <div className="relative rounded-xl overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageThumb} alt="Customer photo" className="w-full max-h-48 object-cover" />
                    <button onClick={removePhoto}
                      className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center text-white">
                      <X size={13} />
                    </button>
                    {imageUrl && (
                      <div className="absolute bottom-2 left-2 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                        <ImageIcon size={9} /> Ready
                      </div>
                    )}
                    {imgLoading && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <Loader2 size={24} className="text-white animate-spin" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Customer contact — collapsible, for leads */}
            <div>
              <button onClick={() => setShowContact(v => !v)}
                className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors">
                {showContact ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                {showContact ? "Hide customer info" : "+ Save customer name / phone (optional)"}
              </button>
              {showContact && (
                <div className="mt-3 space-y-2">
                  <input className="input" placeholder="Customer name"
                    value={custName} onChange={e => setCustName(e.target.value)} />
                  <input className="input" type="tel" placeholder="Phone number"
                    value={custPhone} onChange={e => setCustPhone(e.target.value)} />
                  <p className="text-[11px] text-gray-400">Saved as a customer lead for follow-up.</p>
                </div>
              )}
            </div>

            {submitError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-sm text-red-700">
                <AlertCircle size={15} className="flex-shrink-0" /> {submitError}
              </div>
            )}

            <button onClick={handleSubmit} disabled={submitting}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-40">
              {submitting
                ? <><Loader2 size={16} className="animate-spin" /> Saving…</>
                : outcome === "sold" ? t("cl_submit_sale") : t("cl_submit_feedback")}
            </button>
          </div>
        )}
      </div>

      {/* Barcode scanner overlay */}
      {scanning && <BarcodeScanner onScan={handleScan} onClose={() => setScanning(false)} />}
    </div>
  );
}
