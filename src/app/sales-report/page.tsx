"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { useData, apiFetch } from "@/hooks/useData";
import { useAuth } from "@/context/AuthContext";
import {
  FileSpreadsheet, CheckCircle, AlertCircle, X, Zap,
  TrendingUp, Package, DollarSign, Percent, ChevronDown, ChevronUp,
  Save, Search, Camera, Loader2, ScanLine, Trash2, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Shared types ──────────────────────────────────────────────────────────────
type Outlet = { id: string; name: string; city: string; type: string };

// ─── Shared helpers ────────────────────────────────────────────────────────────
function fmt(n: number) {
  return `RM ${n.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" });
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const USE_CASES      = ["Work", "Travel", "Daily", "Gift"];
const TRIGGERS       = ["Design", "Function", "Price", "Staff ⭐"];
const CUSTOMER_TYPES = ["First Time", "Repeat", "Tourist"];
const LOST_REASONS   = ["Too Expensive", "No Stock", "Wrong Size", "Just Browsing"];
const ADD_ON_OPTIONS = ["Belt", "Keychain", "Card Holder", "Wallet", "Pouch"];

// ─── Barcode Scanner ───────────────────────────────────────────────────────────
function BarcodeScanner({ onScan, onClose }: {
  onScan: (code: string) => void;
  onClose: () => void;
}) {
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
        const controls = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current!,
          (result) => {
            if (result && !stopped) {
              stopped = true;
              controls.stop();
              onScan(result.getText());
            }
          }
        );
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
          <ScanLine size={18} />
          <span className="font-semibold">Scan Barcode</span>
        </div>
        <button onClick={onClose}
          className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center text-white">
          <X size={18} />
        </button>
      </div>

      {camError ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8">
          <AlertCircle size={40} className="text-red-400" />
          <p className="text-red-300 text-center text-sm">{camError}</p>
          <button onClick={onClose}
            className="px-6 py-2.5 bg-white/10 rounded-xl text-white text-sm font-semibold">
            Close
          </button>
        </div>
      ) : (
        <>
          <div className="flex-1 relative overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <video ref={videoRef} className="w-full h-full object-cover" />
            {/* Scan overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-40 border-2 border-brand-400 rounded-xl relative">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-brand-400 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-brand-400 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-brand-400 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-brand-400 rounded-br-lg" />
                {ready && (
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-brand-400 animate-bounce" style={{ animation: "scan 2s linear infinite" }} />
                )}
              </div>
            </div>
          </div>
          <p className="text-center text-gray-400 text-sm py-5 flex-shrink-0">
            {ready ? "Point camera at the barcode" : "Starting camera…"}
          </p>
        </>
      )}
    </div>
  );
}

// ─── Product result type ────────────────────────────────────────────────────────
type ProductResult = {
  id: string; name: string; productCode: string | null;
  category: string; defaultUseCase: string | null; defaultTrigger: string | null;
  targetPrice: number | null; imageUrl: string | null;
};

// ─── Quick Log Tab ─────────────────────────────────────────────────────────────
type SaleEntry = {
  id: string; productCode: string; productName: string; category: string;
  useCase: string; buyingTrigger: string; createdAt: string;
  outlet: { name: string };
};

function QuickLogTab({ outlets }: { outlets: Outlet[] }) {
  const { user } = useAuth();

  const [outletId, setOutletId]       = useState(user?.outletId ?? "");
  const [scanning, setScanning]       = useState(false);
  const [searchQ, setSearchQ]         = useState("");
  const [searching, setSearching]     = useState(false);
  const [results, setResults]         = useState<ProductResult[]>([]);
  const [product, setProduct]         = useState<ProductResult | null>(null);
  const [useCase, setUseCase]         = useState("");
  const [trigger, setTrigger]         = useState("");
  const [showMore, setShowMore]       = useState(false);
  const [customerType, setCustomerType] = useState("");
  const [lostReason, setLostReason]   = useState("");
  const [addOns, setAddOns]           = useState<string[]>([]);
  const [submitting, setSubmitting]   = useState(false);
  const [lastSaved, setLastSaved]     = useState<{ name: string; useCase: string; trigger: string } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: recentEntries, refetch: refetchEntries } = useData<SaleEntry[]>("/api/sale-entries?limit=8");

  // Auto-detect outlet for sales role
  useEffect(() => {
    if (user?.outletId) setOutletId(user.outletId);
  }, [user]);

  // Search debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!searchQ.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(searchQ)}`);
        const data = await res.json();
        setResults(data);
      } finally { setSearching(false); }
    }, 300);
  }, [searchQ]);

  function selectProduct(p: ProductResult) {
    setProduct(p);
    setUseCase(p.defaultUseCase ?? "");
    setTrigger(p.defaultTrigger ?? "");
    setSearchQ("");
    setResults([]);
  }

  async function handleScan(code: string) {
    setScanning(false);
    setSearching(true);
    try {
      const res = await fetch(`/api/products/search?q=${encodeURIComponent(code)}`);
      const data: ProductResult[] = await res.json();
      if (data.length > 0) {
        selectProduct(data[0]);
      } else {
        setSearchQ(code);
      }
    } finally { setSearching(false); }
  }

  async function submit() {
    if (!product || !useCase || !trigger || !outletId) return;
    setSubmitting(true);
    try {
      await apiFetch("/api/sale-entries", {
        method: "POST",
        body: JSON.stringify({
          productCode: product.productCode ?? product.id,
          productName: product.name,
          category: product.category,
          useCase, buyingTrigger: trigger,
          customerType: customerType || null,
          lostReason: lostReason || null,
          addOns,
          outletId,
        }),
      });
      setLastSaved({ name: product.name, useCase, trigger });
      resetForm();
      refetchEntries();
    } finally { setSubmitting(false); }
  }

  function resetForm() {
    setProduct(null); setUseCase(""); setTrigger("");
    setShowMore(false); setCustomerType(""); setLostReason(""); setAddOns([]);
    setSearchQ("");
  }

  const canSubmit = !!product && !!useCase && !!trigger && !!outletId;
  const isAdmin   = user && !user.outletId;

  return (
    <div className="space-y-4 max-w-lg">
      {/* Success toast */}
      {lastSaved && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-4 py-3">
          <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-green-800">Logged! +2 pts</p>
            <p className="text-xs text-green-600 truncate">{lastSaved.name} · {lastSaved.useCase} · {lastSaved.trigger}</p>
          </div>
          <button onClick={() => setLastSaved(null)}><X size={14} className="text-green-400" /></button>
        </div>
      )}

      {/* Outlet selector — only for admin/manager without fixed outlet */}
      {isAdmin && (
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Outlet</label>
          <select className="select text-sm" value={outletId} onChange={e => setOutletId(e.target.value)}>
            <option value="">Select outlet…</option>
            {outlets.map(o => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* ── STEP 1: Product Selector ── */}
      <div className="card space-y-3">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          1 — Select Product
        </p>

        {/* Scan button */}
        <button onClick={() => setScanning(true)}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold text-sm transition-colors">
          <Camera size={18} /> Scan Barcode
        </button>

        {/* Search fallback */}
        <div className="relative">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-8 text-sm" placeholder="Search by name or SKU code…"
              value={searchQ} onChange={e => setSearchQ(e.target.value)} />
            {searching && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />}
          </div>
          {results.length > 0 && (
            <div className="absolute z-10 top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
              {results.map(r => (
                <button key={r.id} onClick={() => selectProduct(r)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 flex items-center gap-3">
                  {r.imageUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={r.imageUrl} alt="" className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
                    : <div className="w-10 h-10 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                        <Package size={16} className="text-gray-300" />
                      </div>
                  }
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{r.name}</p>
                    <p className="text-[11px] text-gray-400">
                      {r.productCode ? `${r.productCode} · ` : ""}{r.category}
                      {r.targetPrice ? ` · RM${r.targetPrice}` : ""}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected product card */}
        {product && (
          <div className="flex items-center gap-3 bg-brand-50 border border-brand-200 rounded-xl px-3 py-2.5">
            {product.imageUrl
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={product.imageUrl} alt="" className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
              : <div className="w-12 h-12 bg-brand-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                  <Package size={20} className="text-brand-400" />
                </div>
            }
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm">{product.name}</p>
              <p className="text-[11px] text-gray-500">
                {product.productCode ? `${product.productCode} · ` : ""}{product.category}
                {product.targetPrice ? ` · RM${product.targetPrice}` : ""}
              </p>
            </div>
            <button onClick={resetForm} className="text-gray-400 hover:text-red-400 flex-shrink-0">
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      {/* ── STEP 2: Choice Data (only shows when product selected) ── */}
      {product && (
        <div className="card space-y-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            2 — Quick Choice
          </p>

          {/* Use Case */}
          <div>
            <p className="text-xs font-bold text-gray-700 mb-2">Use Case <span className="text-red-400">*</span></p>
            <div className="grid grid-cols-4 gap-2">
              {USE_CASES.map(uc => (
                <button key={uc} onClick={() => setUseCase(uc)}
                  className={cn("py-2.5 rounded-xl text-xs font-bold border-2 transition-all",
                    useCase === uc
                      ? "bg-blue-500 text-white border-blue-500 shadow-sm"
                      : "bg-white text-gray-600 border-gray-200 hover:border-blue-300")}>
                  {uc}
                </button>
              ))}
            </div>
          </div>

          {/* Buying Trigger */}
          <div>
            <p className="text-xs font-bold text-gray-700 mb-2">Buying Trigger <span className="text-red-400">*</span></p>
            <div className="grid grid-cols-4 gap-2">
              {TRIGGERS.map(t => (
                <button key={t} onClick={() => setTrigger(t)}
                  className={cn("py-2.5 rounded-xl text-xs font-bold border-2 transition-all",
                    trigger === t
                      ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                      : "bg-white text-gray-600 border-gray-200 hover:border-amber-300")}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* More Details toggle */}
          <button onClick={() => setShowMore(v => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors">
            {showMore ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {showMore ? "Less details" : "+ More details (optional)"}
          </button>

          {showMore && (
            <div className="space-y-3 pt-1">
              {/* Customer Type */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1.5">Customer Type</p>
                <div className="flex flex-wrap gap-2">
                  {CUSTOMER_TYPES.map(ct => (
                    <button key={ct} onClick={() => setCustomerType(ct === customerType ? "" : ct)}
                      className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all",
                        customerType === ct
                          ? "bg-purple-500 text-white border-purple-500"
                          : "bg-white text-gray-600 border-gray-200")}>
                      {ct}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lost Reason */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1.5">Lost Reason (if no sale)</p>
                <div className="flex flex-wrap gap-2">
                  {LOST_REASONS.map(lr => (
                    <button key={lr} onClick={() => setLostReason(lr === lostReason ? "" : lr)}
                      className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all",
                        lostReason === lr
                          ? "bg-red-500 text-white border-red-500"
                          : "bg-white text-gray-600 border-gray-200")}>
                      {lr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add-ons */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1.5">Add-ons Sold</p>
                <div className="flex flex-wrap gap-2">
                  {ADD_ON_OPTIONS.map(ao => (
                    <button key={ao}
                      onClick={() => setAddOns(prev => prev.includes(ao) ? prev.filter(x => x !== ao) : [...prev, ao])}
                      className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all",
                        addOns.includes(ao)
                          ? "bg-green-500 text-white border-green-500"
                          : "bg-white text-gray-600 border-gray-200")}>
                      {ao}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Submit */}
          <button onClick={submit} disabled={!canSubmit || submitting}
            className="w-full py-4 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-40 bg-brand-500 hover:bg-brand-600 text-white shadow-md">
            {submitting
              ? <><Loader2 size={16} className="animate-spin" />Saving…</>
              : <><CheckCircle size={16} />Submit Sale Data</>
            }
          </button>
        </div>
      )}

      {/* Recent entries */}
      {(recentEntries ?? []).length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Recent Logs</p>
          <div className="space-y-1.5">
            {(recentEntries ?? []).slice(0, 5).map(e => (
              <div key={e.id} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-3 py-2.5">
                <div className="w-8 h-8 bg-brand-50 rounded-lg flex-shrink-0 flex items-center justify-center">
                  <Package size={13} className="text-brand-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-800 truncate">{e.productName}</p>
                  <p className="text-[10px] text-gray-400">{e.useCase} · {e.buyingTrigger} · {e.outlet.name}</p>
                </div>
                <p className="text-[10px] text-gray-400 flex-shrink-0">{fmtTime(e.createdAt)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Barcode Scanner overlay */}
      {scanning && <BarcodeScanner onScan={handleScan} onClose={() => setScanning(false)} />}
    </div>
  );
}

// ─── Upload Report Tab ─────────────────────────────────────────────────────────
type PreviewRow = {
  description: string; warehouse: string; qty: number;
  amount: number; profit: number; discAmt: number; grossAmt: number;
};
type Preview = {
  warehouseName: string;
  revenue: number; totalProfit: number; totalQty: number; totalDisc: number;
  totalRows: number;
  rows: PreviewRow[];
  topProducts: { name: string; qty: number; amount: number; profit: number }[];
};
type SavedReport = {
  id: string; week: string; salesDate: string | null;
  revenue: number; totalProfit: number; totalQty: number;
  warehouseName: string | null; createdAt: string;
  outlet: { name: string }; user: { name: string };
};

function UploadReportTab({ outlets }: { outlets: Outlet[] }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging]       = useState(false);
  const [fileName, setFileName]       = useState<string | null>(null);
  const [file, setFile]               = useState<File | null>(null);
  const [previewing, setPreviewing]   = useState(false);
  const [preview, setPreview]         = useState<Preview | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [outletId, setOutletId]       = useState("");
  const [salesDate, setSalesDate]     = useState("");
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState<{ revenue: number; outlet: string } | null>(null);
  const [showAllRows, setShowAllRows] = useState(false);
  const [duplicate, setDuplicate]     = useState<{
    existingId: string; existingDate: string; existingRevenue: number; outletName: string;
  } | null>(null);
  const { data: reports, refetch }    = useData<SavedReport[]>("/api/sales-report");
  const { user } = useAuth();

  const processFile = useCallback(async (f: File) => {
    setFile(f); setFileName(f.name);
    setPreview(null); setError(null); setSaved(null); setPreviewing(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch("/api/sales-report/preview", { method: "POST", body: fd });
      if (!res.ok) { setError("Failed to read file. Make sure it's the correct Excel format."); return; }
      const data = await res.json();
      setPreview(data);
      if (data.warehouseName && outlets) {
        const match = outlets.find(o =>
          o.name.toLowerCase().includes(data.warehouseName.toLowerCase()) ||
          data.warehouseName.toLowerCase().includes(o.name.toLowerCase())
        );
        if (match) setOutletId(match.id);
      }
    } catch {
      setError("Error reading file. Make sure it's a valid .xlsx file.");
    } finally {
      setPreviewing(false);
    }
  }, [outlets]);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f && (f.name.endsWith(".xlsx") || f.name.endsWith(".xls"))) processFile(f);
    else setError("Please drop an Excel (.xlsx) file");
  }
  async function handleSave(force = false) {
    if (!file || !outletId) return;
    setSaving(true);
    setDuplicate(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("outletId", outletId);
      if (salesDate) fd.append("salesDate", salesDate);
      if (force) fd.append("force", "true");
      const res = await fetch("/api/sales-report", { method: "POST", body: fd });
      if (res.status === 409) {
        const d = await res.json();
        setDuplicate(d);
        return;
      }
      if (!res.ok) {
        let msg = `Save failed (${res.status})`;
        try { const d = await res.json(); msg = d.error ?? msg; } catch { /* */ }
        setError(msg); return;
      }
      const outletName = outlets?.find(o => o.id === outletId)?.name ?? "outlet";
      setSaved({ revenue: preview?.revenue ?? 0, outlet: outletName });
      setFile(null); setFileName(null); setPreview(null); setOutletId(""); setSalesDate("");
      setDuplicate(null);
      if (fileRef.current) fileRef.current.value = "";
      refetch();
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this report?")) return;
    await fetch(`/api/sales-report?id=${id}`, { method: "DELETE" });
    refetch();
  }
  function resetUpload() {
    setFile(null); setFileName(null); setPreview(null);
    setError(null); setSaved(null); setShowAllRows(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  const displayedRows = showAllRows ? (preview?.rows ?? []) : (preview?.rows ?? []).slice(0, 8);
  const canSave = !!outletId && !saving;

  return (
    <div className="max-w-3xl space-y-4 pb-32">
      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <CheckCircle size={24} className="text-green-600" />
          </div>
          <div className="flex-1">
            <p className="font-black text-green-800 text-lg">Saved successfully!</p>
            <p className="text-sm text-green-700 mt-0.5">{saved.outlet} · {fmt(saved.revenue)} revenue added to Data Hub</p>
          </div>
          <button onClick={() => setSaved(null)} className="text-green-400 hover:text-green-600"><X size={16} /></button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">
          <AlertCircle size={16} className="flex-shrink-0" />{error}
          <button onClick={() => setError(null)} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      {duplicate && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-amber-800 text-sm">Report already uploaded</p>
              <p className="text-xs text-amber-700 mt-0.5">
                {duplicate.outletName} · {duplicate.existingDate} · {fmt(duplicate.existingRevenue)} already exists in the system.
              </p>
            </div>
            <button onClick={() => setDuplicate(null)}><X size={14} className="text-amber-400" /></button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setDuplicate(null)}
              className="btn-secondary text-xs px-4 py-2"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors"
            >
              <RefreshCw size={12} />
              Replace existing report
            </button>
          </div>
        </div>
      )}

      {!preview && !previewing && (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 shadow-sm">
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={onFileChange} />
          <div onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`p-12 flex flex-col items-center gap-4 cursor-pointer rounded-2xl transition-all ${dragging ? "bg-brand-50" : "hover:bg-gray-50"}`}>
            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center">
              <FileSpreadsheet size={32} className="text-green-600" />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-800">Click to choose Excel file</p>
              <p className="text-sm text-gray-400 mt-1">or drag & drop here</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-1">
              <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full">SALES REPORT(DDMMYY).xlsx</span>
            </div>
          </div>
        </div>
      )}

      {previewing && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-100 border-t-brand-500 rounded-full animate-spin" />
          <p className="text-gray-500 font-medium">Reading {fileName}…</p>
        </div>
      )}

      {preview && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3">
            <FileSpreadsheet size={18} className="text-green-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800 text-sm truncate">{fileName}</p>
              <p className="text-xs text-gray-400">{preview.totalRows} products · from {preview.warehouseName || "unknown outlet"}</p>
            </div>
            <button onClick={resetUpload} className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 flex-shrink-0">
              <X size={13} /> Change file
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: DollarSign, label: "Revenue",   value: fmt(preview.revenue),      color: "text-green-600",  bg: "bg-green-50"  },
              { icon: TrendingUp, label: "Profit",     value: fmt(preview.totalProfit),   color: "text-blue-600",   bg: "bg-blue-50"   },
              { icon: Package,    label: "Units Sold", value: `${preview.totalQty} pcs`,  color: "text-purple-600", bg: "bg-purple-50" },
              { icon: Percent,    label: "Discounts",  value: fmt(preview.totalDisc),     color: "text-red-500",    bg: "bg-red-50"    },
            ].map(s => (
              <div key={s.label} className={`${s.bg} rounded-2xl p-4`}>
                <s.icon size={16} className={`${s.color} mb-2`} />
                <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Top Products</p>
            <div className="space-y-2">
              {preview.topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-brand-50 rounded-full flex items-center justify-center text-[11px] font-black text-brand-600 flex-shrink-0">{i + 1}</span>
                  <span className="flex-1 text-sm font-medium text-gray-800 truncate">{p.name}</span>
                  <span className="text-xs text-gray-400 flex-shrink-0">{p.qty} pcs</span>
                  <span className="text-sm font-bold text-gray-700 flex-shrink-0">{fmt(p.amount)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">All Line Items</p>
              <button onClick={() => setShowAllRows(!showAllRows)} className="text-xs text-brand-500 flex items-center gap-1">
                {showAllRows ? <><ChevronUp size={12} />Collapse</> : <><ChevronDown size={12} />Show all {preview.rows.length}</>}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2 font-semibold text-gray-500">Product</th>
                    <th className="text-right px-3 py-2 font-semibold text-gray-500">Qty</th>
                    <th className="text-right px-3 py-2 font-semibold text-gray-500">Gross</th>
                    <th className="text-right px-3 py-2 font-semibold text-gray-500">Disc</th>
                    <th className="text-right px-4 py-2 font-semibold text-green-600">Net</th>
                    <th className="text-right px-4 py-2 font-semibold text-blue-600">Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {displayedRows.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-medium text-gray-800">{r.description}</td>
                      <td className="px-3 py-2.5 text-right text-gray-500">{r.qty}</td>
                      <td className="px-3 py-2.5 text-right text-gray-400">{r.grossAmt.toFixed(2)}</td>
                      <td className="px-3 py-2.5 text-right text-red-400">{r.discAmt > 0 ? `-${r.discAmt.toFixed(2)}` : "—"}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-green-600">{r.amount.toFixed(2)}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-blue-600">{r.profit.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!preview && (reports ?? []).length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Recent Reports</h2>
            {["admin", "manager"].includes(user?.role ?? "") && (
              <p className="text-[11px] text-gray-400">Trash icon to delete duplicates</p>
            )}
          </div>
          <div className="space-y-2">
            {(reports ?? []).slice(0, 20).map(r => (
              <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileSpreadsheet size={15} className="text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm">{r.outlet.name}</p>
                  <p className="text-xs text-gray-400">{r.salesDate ? fmtDate(r.salesDate) : r.week} · {r.user.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-green-600 text-sm">{fmt(r.revenue)}</p>
                  <p className="text-xs text-blue-500">{fmt(r.totalProfit)} profit</p>
                </div>
                {["admin", "manager"].includes(user?.role ?? "") && (
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="text-gray-300 hover:text-red-400 transition-colors p-1 rounded flex-shrink-0"
                    title="Delete report"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {preview && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl px-4 py-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Select Outlet &amp; Save</p>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Outlet <span className="text-red-400">*</span></label>
                <select className="select text-sm" value={outletId} onChange={e => setOutletId(e.target.value)}>
                  <option value="">Select outlet…</option>
                  {(outlets ?? []).map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <div className="w-36">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Sales Date</label>
                <input type="date" className="input text-sm" value={salesDate} onChange={e => setSalesDate(e.target.value)} />
              </div>
              <button onClick={() => handleSave()} disabled={!canSave}
                className="flex-shrink-0 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors">
                {saving
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
                  : <><Save size={16} />Save to Data Hub</>
                }
              </button>
            </div>
            {!outletId && <p className="text-xs text-amber-500 mt-2">⚠ Please select the outlet before saving</p>}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function SalesReportPage() {
  const [tab, setTab] = useState<"quick" | "upload">("quick");
  const { data: outlets } = useData<Outlet[]>("/api/outlets");

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <FileSpreadsheet size={18} className="text-green-600" />
            Sales Report
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Quick log + Excel upload</p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          <button onClick={() => setTab("quick")}
            className={cn("flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
              tab === "quick" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}>
            <Zap size={14} /> Quick Log
          </button>
          <button onClick={() => setTab("upload")}
            className={cn("flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
              tab === "upload" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}>
            <FileSpreadsheet size={14} /> Upload Report
          </button>
        </div>
      </div>

      {tab === "quick"  && <QuickLogTab  outlets={outlets ?? []} />}
      {tab === "upload" && <UploadReportTab outlets={outlets ?? []} />}
    </div>
  );
}
