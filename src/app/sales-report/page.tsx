"use client";
import { useState, useRef, useCallback } from "react";
import { useData } from "@/hooks/useData";
import {
  FileSpreadsheet, CheckCircle, AlertCircle, X,
  TrendingUp, Package, DollarSign, Percent, ChevronDown, ChevronUp,
  ArrowRight, Save
} from "lucide-react";

type Outlet = { id: string; name: string; city: string; type: string };

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

function fmt(n: number) {
  return `RM ${n.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });
}

export default function SalesReportPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging]     = useState(false);
  const [fileName, setFileName]     = useState<string | null>(null);
  const [file, setFile]             = useState<File | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview]       = useState<Preview | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const [outletId, setOutletId]     = useState("");
  const [salesDate, setSalesDate]   = useState("");
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState<{ revenue: number; outlet: string } | null>(null);
  const [showAllRows, setShowAllRows] = useState(false);

  const { data: outlets } = useData<Outlet[]>("/api/outlets");
  const { data: reports, refetch } = useData<SavedReport[]>("/api/sales-report");

  const processFile = useCallback(async (f: File) => {
    setFile(f);
    setFileName(f.name);
    setPreview(null);
    setError(null);
    setSaved(null);
    setPreviewing(true);
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

  async function handleSave() {
    if (!file || !outletId) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("outletId", outletId);
      if (salesDate) fd.append("salesDate", salesDate);
      const res = await fetch("/api/sales-report", { method: "POST", body: fd });
      if (!res.ok) {
        let msg = `Save failed (${res.status})`;
        try { const d = await res.json(); msg = d.error ?? msg; } catch { /* ignore */ }
        setError(msg);
        return;
      }
      const outletName = outlets?.find(o => o.id === outletId)?.name ?? "outlet";
      setSaved({ revenue: preview?.revenue ?? 0, outlet: outletName });
      setFile(null); setFileName(null); setPreview(null); setOutletId(""); setSalesDate("");
      if (fileRef.current) fileRef.current.value = "";
      refetch();
    } finally {
      setSaving(false);
    }
  }

  function resetUpload() {
    setFile(null); setFileName(null); setPreview(null);
    setError(null); setSaved(null); setShowAllRows(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  const displayedRows = showAllRows ? (preview?.rows ?? []) : (preview?.rows ?? []).slice(0, 8);
  const canSave = !!outletId && !saving;

  // Determine current step
  const step = preview ? 2 : 1;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 pb-32">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900">Sales Report Upload</h1>
        <p className="text-sm text-gray-500 mt-0.5">Upload your POS Excel file — data saves to Data Hub automatically</p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2">
        {[
          { n: 1, label: "Upload File" },
          { n: 2, label: "Review & Save" },
        ].map((s, i) => (
          <div key={s.n} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
              step === s.n
                ? "bg-brand-500 text-white"
                : step > s.n
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-400"
            }`}>
              {step > s.n
                ? <CheckCircle size={14} />
                : <span className="w-4 h-4 flex items-center justify-center text-xs">{s.n}</span>
              }
              {s.label}
            </div>
            {i < 1 && <ArrowRight size={14} className="text-gray-300" />}
          </div>
        ))}
      </div>

      {/* Success card */}
      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <CheckCircle size={24} className="text-green-600" />
          </div>
          <div className="flex-1">
            <p className="font-black text-green-800 text-lg">Saved successfully!</p>
            <p className="text-sm text-green-700 mt-0.5">
              {saved.outlet} · {fmt(saved.revenue)} revenue added to Data Hub
            </p>
          </div>
          <button onClick={() => setSaved(null)} className="text-green-400 hover:text-green-600 mt-0.5">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">
          <AlertCircle size={16} className="flex-shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      {/* STEP 1 — Upload zone */}
      {!preview && !previewing && (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 shadow-sm">
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={onFileChange} />
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`p-12 flex flex-col items-center gap-4 cursor-pointer rounded-2xl transition-all ${
              dragging ? "bg-brand-50 border-brand-400" : "hover:bg-gray-50"
            }`}
          >
            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center">
              <FileSpreadsheet size={32} className="text-green-600" />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-800">Click to choose Excel file</p>
              <p className="text-sm text-gray-400 mt-1">or drag & drop here</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-1">
              <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full">SALES REPORT(DDMMYY).xlsx</span>
              <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full">SALES REPORT(DDMMYY CODE).xlsx</span>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {previewing && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-100 border-t-brand-500 rounded-full animate-spin" />
          <p className="text-gray-500 font-medium">Reading {fileName}…</p>
        </div>
      )}

      {/* STEP 2 — Preview */}
      {preview && (
        <div className="space-y-4">

          {/* File info bar */}
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

          {/* Summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: DollarSign, label: "Revenue",    value: fmt(preview.revenue),      color: "text-green-600",  bg: "bg-green-50"  },
              { icon: TrendingUp, label: "Profit",      value: fmt(preview.totalProfit),   color: "text-blue-600",   bg: "bg-blue-50"   },
              { icon: Package,    label: "Units Sold",  value: `${preview.totalQty} pcs`,  color: "text-purple-600", bg: "bg-purple-50" },
              { icon: Percent,    label: "Discounts",   value: fmt(preview.totalDisc),     color: "text-red-500",    bg: "bg-red-50"    },
            ].map(s => (
              <div key={s.label} className={`${s.bg} rounded-2xl p-4`}>
                <s.icon size={16} className={`${s.color} mb-2`} />
                <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Top products */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Top Products</p>
            <div className="space-y-2">
              {preview.topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-brand-50 rounded-full flex items-center justify-center text-[11px] font-black text-brand-600 flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm font-medium text-gray-800 truncate">{p.name}</span>
                  <span className="text-xs text-gray-400 flex-shrink-0">{p.qty} pcs</span>
                  <span className="text-sm font-bold text-gray-700 flex-shrink-0">{fmt(p.amount)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Line items (collapsible) */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">All Line Items</p>
              <button
                onClick={() => setShowAllRows(!showAllRows)}
                className="text-xs text-brand-500 flex items-center gap-1">
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

      {/* Past reports */}
      {!preview && (reports ?? []).length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Recent Reports</h2>
          <div className="space-y-2">
            {(reports ?? []).slice(0, 8).map(r => (
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
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── STICKY SAVE BAR (appears when preview is ready) ── */}
      {preview && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl px-4 py-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              Step 2 — Select Outlet &amp; Save
            </p>
            <div className="flex items-end gap-3">
              {/* Outlet */}
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Outlet <span className="text-red-400">*</span>
                </label>
                <select
                  className="select text-sm"
                  value={outletId}
                  onChange={e => setOutletId(e.target.value)}
                >
                  <option value="">Select outlet…</option>
                  {(outlets ?? []).map(o => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div className="w-36">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Sales Date</label>
                <input
                  type="date"
                  className="input text-sm"
                  value={salesDate}
                  onChange={e => setSalesDate(e.target.value)}
                />
              </div>

              {/* Save button */}
              <button
                onClick={handleSave}
                disabled={!canSave}
                className="flex-shrink-0 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors"
              >
                {saving
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
                  : <><Save size={16} />Save to Data Hub</>
                }
              </button>
            </div>
            {!outletId && (
              <p className="text-xs text-amber-500 mt-2">⚠ Please select the outlet before saving</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
