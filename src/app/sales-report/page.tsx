"use client";
import { useState, useRef, useCallback } from "react";
import { useData } from "@/hooks/useData";
import {
  Upload, FileSpreadsheet, CheckCircle, AlertCircle, X,
  TrendingUp, Package, DollarSign, Percent, ChevronDown, ChevronUp, Store
} from "lucide-react";

type Outlet = { id: string; name: string; city: string; type: string };

type PreviewRow = {
  description: string; warehouse: string; qty: number;
  amount: number; profit: number; discAmt: number; grossAmt: number;
};

type Preview = {
  warehouseName: string;
  revenue: number;
  totalProfit: number;
  totalQty: number;
  totalDisc: number;
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

function fmt(n: number) { return `RM ${n.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function fmtDate(iso: string) { return new Date(iso).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" }); }

export default function SalesReportPage() {
  const fileRef  = useRef<HTMLInputElement>(null);
  const [dragging, setDragging]   = useState(false);
  const [fileName, setFileName]   = useState<string | null>(null);
  const [file, setFile]           = useState<File | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview]     = useState<Preview | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const [outletId, setOutletId]   = useState("");
  const [salesDate, setSalesDate] = useState("");
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [showAllRows, setShowAllRows] = useState(false);

  const { data: outlets } = useData<Outlet[]>("/api/outlets");
  const { data: reports, refetch } = useData<SavedReport[]>("/api/sales-report");

  const processFile = useCallback(async (f: File) => {
    setFile(f);
    setFileName(f.name);
    setPreview(null);
    setError(null);
    setSaved(false);
    setPreviewing(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch("/api/sales-report/preview", { method: "POST", body: fd });
      if (!res.ok) { setError("Failed to parse file"); return; }
      const data = await res.json();
      setPreview(data);
      // Auto-detect outlet
      if (data.warehouseName && outlets) {
        const match = outlets.find(o =>
          o.name.toLowerCase().includes(data.warehouseName.toLowerCase()) ||
          data.warehouseName.toLowerCase().includes(o.name.toLowerCase())
        );
        if (match) setOutletId(match.id);
      }
    } catch {
      setError("Error reading file. Make sure it's a valid Excel (.xlsx) file.");
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
      setSaved(true);
      setFile(null); setFileName(null); setPreview(null);
      if (fileRef.current) fileRef.current.value = "";
      refetch();
    } finally {
      setSaving(false);
    }
  }

  function resetUpload() {
    setFile(null); setFileName(null); setPreview(null);
    setError(null); setSaved(false); setShowAllRows(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  const displayedRows = showAllRows ? (preview?.rows ?? []) : (preview?.rows ?? []).slice(0, 10);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900">Sales Report</h1>
        <p className="text-sm text-gray-500 mt-0.5">Upload Excel file exported from your POS system</p>
      </div>

      {/* Success banner */}
      {saved && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-5 py-4">
          <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
          <div>
            <p className="font-bold text-green-800">Report saved successfully!</p>
            <p className="text-sm text-green-600">Data is now reflected in Data Hub.</p>
          </div>
          <button onClick={() => setSaved(false)} className="ml-auto text-green-400 hover:text-green-600">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Upload zone */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Upload Excel File</h2>

        <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={onFileChange} />

        {!preview && !previewing && (
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center gap-3 cursor-pointer transition-all ${
              dragging ? "border-brand-400 bg-brand-50" : "border-gray-200 hover:border-brand-300 hover:bg-gray-50"
            }`}
          >
            <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center">
              <FileSpreadsheet size={28} className="text-green-600" />
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-700">Drag & drop Excel file here</p>
              <p className="text-sm text-gray-400 mt-0.5">or click to browse · .xlsx only</p>
            </div>
            <div className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">
              Supports: SALES REPORT(DDMMYY).xlsx · SALES REPORT(DDMMYY CODE).xlsx
            </div>
          </div>
        )}

        {previewing && (
          <div className="flex flex-col items-center gap-3 py-10">
            <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Reading {fileName}…</p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">
            <AlertCircle size={16} className="flex-shrink-0" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto"><X size={14} /></button>
          </div>
        )}

        {/* Preview */}
        {preview && (
          <div className="space-y-5">
            {/* File name + reset */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FileSpreadsheet size={16} className="text-green-500" />
                <span className="font-medium">{fileName}</span>
                <span className="text-gray-400">· {preview.totalRows} items</span>
              </div>
              <button onClick={resetUpload} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                <X size={13} /> Remove
              </button>
            </div>

            {/* Detected outlet */}
            {preview.warehouseName && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5 text-sm">
                <Store size={14} className="text-amber-600" />
                <span className="text-amber-700">Detected outlet: <strong>{preview.warehouseName}</strong></span>
              </div>
            )}

            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: DollarSign, label: "Revenue",    value: fmt(preview.revenue),     color: "text-green-600",  bg: "bg-green-50"  },
                { icon: TrendingUp, label: "Profit",     value: fmt(preview.totalProfit),  color: "text-blue-600",   bg: "bg-blue-50"   },
                { icon: Package,    label: "Units Sold", value: `${preview.totalQty} pcs`, color: "text-purple-600", bg: "bg-purple-50" },
                { icon: Percent,    label: "Discount",   value: fmt(preview.totalDisc),    color: "text-red-500",    bg: "bg-red-50"    },
              ].map(s => (
                <div key={s.label} className={`${s.bg} rounded-xl p-3`}>
                  <div className={`${s.color} mb-1`}><s.icon size={16} /></div>
                  <div className={`text-lg font-black ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-gray-500">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Top products */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Top Products by Revenue</p>
              <div className="space-y-1.5">
                {preview.topProducts.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-3 text-sm">
                    <span className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-500 flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="flex-1 font-medium text-gray-800 truncate">{p.name}</span>
                    <span className="text-gray-400 text-xs">{p.qty}pcs</span>
                    <span className="font-bold text-gray-700">{fmt(p.amount)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Full line items table */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">All Line Items</p>
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold text-gray-500">Product</th>
                      <th className="text-right px-3 py-2 font-semibold text-gray-500">Qty</th>
                      <th className="text-right px-3 py-2 font-semibold text-gray-500">Gross</th>
                      <th className="text-right px-3 py-2 font-semibold text-gray-500">Disc</th>
                      <th className="text-right px-3 py-2 font-semibold text-gray-500 text-green-600">Net</th>
                      <th className="text-right px-3 py-2 font-semibold text-gray-500 text-blue-600">Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {displayedRows.map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium text-gray-800">{r.description}</td>
                        <td className="px-3 py-2 text-right text-gray-500">{r.qty}</td>
                        <td className="px-3 py-2 text-right text-gray-500">{r.grossAmt.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right text-red-400">
                          {r.discAmt > 0 ? `-${r.discAmt.toFixed(2)}` : "—"}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-green-600">{r.amount.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right font-semibold text-blue-600">{r.profit.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {(preview.rows.length > 10) && (
                <button
                  onClick={() => setShowAllRows(!showAllRows)}
                  className="mt-2 text-xs text-brand-500 hover:text-brand-600 flex items-center gap-1">
                  {showAllRows
                    ? <><ChevronUp size={12} /> Show less</>
                    : <><ChevronDown size={12} /> Show all {preview.rows.length} items</>}
                </button>
              )}
            </div>

            {/* Confirm fields */}
            <div className="border-t border-gray-100 pt-4 space-y-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Confirm Before Saving</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Outlet *</label>
                  <div className="relative">
                    <select className="select" value={outletId} onChange={e => setOutletId(e.target.value)}>
                      <option value="">Select outlet…</option>
                      {(outlets ?? []).map(o => (
                        <option key={o.id} value={o.id}>{o.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Sales Date</label>
                  <input type="date" className="input" value={salesDate} onChange={e => setSalesDate(e.target.value)} />
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={!outletId || saving}
                className="w-full bg-brand-500 text-white py-3.5 rounded-2xl font-bold text-base disabled:opacity-40 flex items-center justify-center gap-2 hover:bg-brand-600 transition-colors">
                {saving
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                  : <><Upload size={18} /> Save Report to Data Hub</>}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Past reports */}
      {(reports ?? []).length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Recent Reports</h2>
          <div className="space-y-2">
            {(reports ?? []).slice(0, 10).map(r => (
              <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-4">
                <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileSpreadsheet size={16} className="text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-800 text-sm">{r.outlet.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {r.salesDate ? fmtDate(r.salesDate) : r.week} · by {r.user.name}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-black text-green-600 text-sm">{fmt(r.revenue)}</div>
                  <div className="text-xs text-blue-500">+{fmt(r.totalProfit)} profit</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
