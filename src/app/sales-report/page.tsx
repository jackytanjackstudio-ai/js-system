"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { useData } from "@/hooks/useData";
import { useAuth } from "@/context/AuthContext";
import { useLang } from "@/context/LangContext";
import {
  FileSpreadsheet, CheckCircle, AlertCircle, X,
  TrendingUp, Package, DollarSign, Percent, ChevronDown, ChevronUp,
  Save, Trash2, RefreshCw, Users, BarChart2, ShoppingBag,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────
type Outlet = { id: string; name: string; city: string; type: string };
type PreviewRow = {
  description: string; warehouse: string; qty: number;
  amount: number; profit: number; discAmt: number; grossAmt: number;
};
type Preview = {
  warehouseName: string; revenue: number; totalProfit: number;
  totalQty: number; totalDisc: number; totalRows: number;
  rows: PreviewRow[];
  topProducts: { name: string; qty: number; amount: number; profit: number }[];
};
type SavedReport = {
  id: string; week: string; salesDate: string | null;
  revenue: number; totalProfit: number; totalQty: number;
  warehouseName: string | null; createdAt: string;
  outlet: { name: string }; user: { name: string };
};
type AddonBreakdown = {
  sku: string; promoName: string; addonPrice: number;
  originalPrice: number | null; minSpend: number | null;
  customersTook: number; totalRevenue: number; totalProfit: number;
  profitMargin: number; atvWithAddon: number; atvWithoutAddon: number;
  atvUplift: number; addonRate: number;
};
type Metrics = {
  customerCount: number; atv: number;
  addonCustomers: number; atvWithAddon: number; atvWithoutAddon: number;
  atvUplift: number; addonBreakdown: AddonBreakdown[];
  hasSkuData: boolean; reportCount: number;
};

// ─── i18n ──────────────────────────────────────────────────────────────────────
type LangKey = "en" | "zh" | "ms";
const L: Record<LangKey, Record<string, string>> = {
  en: {
    customers: "Customers", uniqueTxns: "unique transactions",
    avgTransaction: "Avg Transaction", perVisit: "per customer visit",
    addonTaken: "Add-on Taken", ofCustomers: "% of customers",
    addonPerformance: "Add-on Promotion Performance",
    customersTook: "Customers Took", revenue: "Revenue", profitMargin: "Profit Margin",
    withAddon: "With Add-on", withoutAddon: "Without Add-on", uplift: "Uplift",
    addonRate: "% of customers took this", importMpos: "Import MPOS Data",
    minSpend: "Min spend", originalPrice: "Original price",
    noData: "Upload MPOS reports to see analytics.",
    noSkuData: "Upload a new report to see add-on analysis (SKU data required).",
    filterOutlet: "All Outlets", filterFrom: "From", filterTo: "To",
    atvComparison: "ATV Comparison", analyticsTitle: "Sales Analytics",
  },
  zh: {
    customers: "客户数", uniqueTxns: "独立交易",
    avgTransaction: "平均客单价", perVisit: "每次消费",
    addonTaken: "加购人数", ofCustomers: "% 客户参与",
    addonPerformance: "加购促销表现",
    customersTook: "参与人数", revenue: "收入", profitMargin: "利润率",
    withAddon: "有加购", withoutAddon: "无加购", uplift: "提升",
    addonRate: "% 客户加购了", importMpos: "导入 MPOS 数据",
    minSpend: "最低消费", originalPrice: "原价",
    noData: "上传 MPOS 报表以查看分析。",
    noSkuData: "上传新报表以查看加购分析（需要 SKU 数据）。",
    filterOutlet: "全部门店", filterFrom: "从", filterTo: "到",
    atvComparison: "客单价对比", analyticsTitle: "销售分析",
  },
  ms: {
    customers: "Pelanggan", uniqueTxns: "transaksi unik",
    avgTransaction: "Purata Transaksi", perVisit: "setiap kunjungan",
    addonTaken: "Ambil Add-on", ofCustomers: "% pelanggan",
    addonPerformance: "Prestasi Promosi Add-on",
    customersTook: "Pelanggan Ambil", revenue: "Hasil", profitMargin: "Margin Untung",
    withAddon: "Dengan Add-on", withoutAddon: "Tanpa Add-on", uplift: "Peningkatan",
    addonRate: "% pelanggan ambil", importMpos: "Import Data MPOS",
    minSpend: "Belanja minimum", originalPrice: "Harga asal",
    noData: "Muat naik laporan MPOS untuk lihat analitik.",
    noSkuData: "Muat naik laporan baru untuk analisis add-on (data SKU diperlukan).",
    filterOutlet: "Semua Cawangan", filterFrom: "Dari", filterTo: "Ke",
    atvComparison: "Perbandingan ATV", analyticsTitle: "Analitik Jualan",
  },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return `RM ${n.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" });
}

// ─── Analytics Section ─────────────────────────────────────────────────────────
type AnalyticsProps = {
  outlets: Outlet[];
  syncOutletId?: string;
  syncDate?: string;
};

function AnalyticsSection({ outlets, syncOutletId, syncDate }: AnalyticsProps) {
  const { lang } = useLang();
  const lk = L[lang as LangKey] ?? L.en;
  const { isOutletUser, user } = useAuth();

  const lockedOutletId = isOutletUser ? (user?.outletId ?? "") : "";

  const [outletId, setOutletId] = useState(syncOutletId ?? "");
  const [from, setFrom]         = useState(syncDate ?? "");
  const [to, setTo]             = useState(syncDate ?? "");
  const [metrics, setMetrics]   = useState<Metrics | null>(null);
  const [loading, setLoading]   = useState(false);
  const [open, setOpen]         = useState(true);

  // Outlet users are locked to their own outlet; admins sync from save-bar
  useEffect(() => {
    if (lockedOutletId) setOutletId(lockedOutletId);
    else if (syncOutletId !== undefined) setOutletId(syncOutletId);
  }, [syncOutletId, lockedOutletId]);
  useEffect(() => {
    if (syncDate) { setFrom(syncDate); setTo(syncDate); }
  }, [syncDate]);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (outletId) params.set("outletId", outletId);
    if (from) params.set("from", from);
    if (to)   params.set("to", to);
    try {
      const res = await fetch(`/api/sales-report/metrics?${params}`).then(r => r.json());
      setMetrics(res);
    } finally { setLoading(false); }
  }, [outletId, from, to]);

  useEffect(() => { fetchMetrics(); }, [fetchMetrics]);

  const addonData = metrics?.addonBreakdown[0];
  const maxAtv    = Math.max(metrics?.atvWithAddon ?? 0, metrics?.atvWithoutAddon ?? 0) * 1.15 || 1;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 cursor-pointer"
        onClick={() => setOpen(o => !o)}>
        <div className="flex items-center gap-2.5">
          <BarChart2 size={16} className="text-brand-500" />
          <p className="font-bold text-gray-800 text-sm">{lk.analyticsTitle}</p>
          {metrics && (
            <span className="text-xs text-gray-400">{metrics.reportCount} reports</span>
          )}
        </div>
        {open ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
      </div>

      {open && (
        <div className="p-5 space-y-5">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">Outlet</label>
              {isOutletUser ? (
                <div className="h-8 flex items-center px-2.5 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-700 font-semibold gap-1.5">
                  {outlets.find(o => o.id === lockedOutletId)?.name ?? "Your Outlet"}
                  <span className="text-brand-500 font-normal">· Your Outlet</span>
                </div>
              ) : (
                <select value={outletId} onChange={e => setOutletId(e.target.value)}
                  className="select text-xs py-1.5 h-8">
                  <option value="">{lk.filterOutlet}</option>
                  {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              )}
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">{lk.filterFrom}</label>
              <input type="date" value={from} onChange={e => setFrom(e.target.value)}
                className="input text-xs py-1.5 h-8 w-32" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">{lk.filterTo}</label>
              <input type="date" value={to} onChange={e => setTo(e.target.value)}
                className="input text-xs py-1.5 h-8 w-32" />
            </div>
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
              <div className="w-4 h-4 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
              Loading…
            </div>
          )}

          {!loading && metrics && metrics.reportCount === 0 && (
            <p className="text-sm text-gray-400 py-2">{lk.noData}</p>
          )}

          {!loading && metrics && metrics.reportCount > 0 && (
            <>
              {/* Metric cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-brand-50 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users size={15} className="text-brand-500" />
                    <span className="text-xs font-bold text-brand-600">{lk.customers}</span>
                  </div>
                  <p className="text-2xl font-black text-brand-700">{metrics.customerCount.toLocaleString()}</p>
                  <p className="text-xs text-brand-400 mt-0.5">{lk.uniqueTxns}</p>
                </div>

                <div className="bg-green-50 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign size={15} className="text-green-500" />
                    <span className="text-xs font-bold text-green-600">{lk.avgTransaction}</span>
                  </div>
                  <p className="text-2xl font-black text-green-700">{fmt(metrics.atv)}</p>
                  <p className="text-xs text-green-400 mt-0.5">{lk.perVisit}</p>
                </div>

                <div className="bg-blue-50 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ShoppingBag size={15} className="text-blue-500" />
                    <span className="text-xs font-bold text-blue-600">{lk.addonTaken}</span>
                  </div>
                  <p className="text-2xl font-black text-blue-700">{metrics.addonCustomers}</p>
                  <p className="text-xs text-blue-400 mt-0.5">
                    {addonData ? `${addonData.addonRate.toFixed(1)}% ${lk.ofCustomers}` : lk.ofCustomers}
                  </p>
                </div>
              </div>

              {/* ATV Comparison */}
              {metrics.hasSkuData && (metrics.atvWithAddon > 0 || metrics.atvWithoutAddon > 0) && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{lk.atvComparison}</p>
                  <div className="space-y-2">
                    {[
                      { label: lk.withAddon,    value: metrics.atvWithAddon,    color: "bg-brand-500" },
                      { label: lk.withoutAddon, value: metrics.atvWithoutAddon, color: "bg-gray-300"  },
                    ].map(row => (
                      <div key={row.label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-600">{row.label}</span>
                          <span className="text-xs font-bold text-gray-800">{fmt(row.value)}</span>
                        </div>
                        <div className="h-2.5 bg-gray-100 rounded-full">
                          <div className={`h-2.5 rounded-full ${row.color} transition-all`}
                            style={{ width: `${(row.value / maxAtv) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  {metrics.atvUplift > 0 && (
                    <div className="inline-flex items-center gap-1.5 bg-green-50 border border-green-100 rounded-xl px-3 py-1.5 mt-1">
                      <TrendingUp size={12} className="text-green-500" />
                      <span className="text-xs font-bold text-green-700">+{fmt(metrics.atvUplift)} {lk.uplift}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Add-on breakdown */}
              {metrics.hasSkuData && metrics.addonBreakdown.map(addon => (
                <div key={addon.sku} className="border border-gray-100 rounded-2xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-0.5">{lk.addonPerformance}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="font-black text-gray-800 text-sm">{addon.sku}</span>
                      <span className="text-gray-400 text-xs">·</span>
                      <span className="text-sm text-gray-600">{addon.promoName}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      RM{addon.addonPrice} add-on
                      {addon.originalPrice ? ` · ${lk.originalPrice} RM${addon.originalPrice}` : ""}
                      {addon.minSpend ? ` · ${lk.minSpend} RM${addon.minSpend}` : ""}
                    </p>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Pill stats */}
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: lk.customersTook, value: addon.customersTook.toString(), color: "bg-brand-50 text-brand-700" },
                        { label: lk.revenue, value: fmt(addon.totalRevenue), color: "bg-green-50 text-green-700" },
                        { label: lk.profitMargin, value: `${addon.profitMargin.toFixed(0)}%`, color: "bg-blue-50 text-blue-700" },
                      ].map(p => (
                        <div key={p.label} className={`px-3 py-2 rounded-xl ${p.color}`}>
                          <p className="text-[10px] font-semibold opacity-70">{p.label}</p>
                          <p className="text-sm font-black">{p.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* ATV bars */}
                    <div className="space-y-1.5">
                      {[
                        { label: lk.withAddon,    value: addon.atvWithAddon,    color: "bg-brand-500" },
                        { label: lk.withoutAddon, value: addon.atvWithoutAddon, color: "bg-gray-300"  },
                      ].map(row => {
                        const max = Math.max(addon.atvWithAddon, addon.atvWithoutAddon) * 1.15 || 1;
                        return (
                          <div key={row.label}>
                            <div className="flex justify-between mb-0.5">
                              <span className="text-[11px] text-gray-500">{row.label}</span>
                              <span className="text-[11px] font-bold text-gray-700">{fmt(row.value)}</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full">
                              <div className={`h-2 rounded-full ${row.color}`}
                                style={{ width: `${(row.value / max) * 100}%` }} />
                            </div>
                          </div>
                        );
                      })}
                      {addon.atvUplift > 0 && (
                        <p className="text-xs font-bold text-green-600">+{fmt(addon.atvUplift)} {lk.uplift}</p>
                      )}
                    </div>

                    {/* Addon rate bar */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-[11px] text-gray-500">{lk.addonRate}</span>
                        <span className="text-[11px] font-bold text-gray-700">{addon.addonRate.toFixed(1)}%</span>
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded-full">
                        <div className="h-2.5 bg-amber-400 rounded-full transition-all"
                          style={{ width: `${Math.min(addon.addonRate, 100)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {!metrics.hasSkuData && (
                <p className="text-xs text-gray-400 italic">{lk.noSkuData}</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Upload Report Tab ─────────────────────────────────────────────────────────
type UploadTabProps = {
  outlets: Outlet[];
  onOutletChange?: (id: string) => void;
  onDateChange?: (date: string) => void;
};

function UploadReportTab({ outlets, onOutletChange, onDateChange }: UploadTabProps) {
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
  const { user, isOutletUser } = useAuth();

  // Lock outlet to the user's own outlet for outlet-scoped roles
  useEffect(() => {
    if (isOutletUser && user?.outletId) {
      setOutletId(user.outletId);
      onOutletChange?.(user.outletId);
    }
  }, [isOutletUser, user?.outletId]); // eslint-disable-line react-hooks/exhaustive-deps

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
        if (match && !isOutletUser) { setOutletId(match.id); onOutletChange?.(match.id); }
      }
    } catch {
      setError("Error reading file. Make sure it's a valid .xlsx file.");
    } finally { setPreviewing(false); }
  }, [outlets]);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f && (f.name.endsWith(".xlsx") || f.name.endsWith(".xls"))) processFile(f);
    else setError("Please drop an Excel (.xlsx) file");
  }
  async function handleSave(force = false) {
    if (!file || !outletId) return;
    setSaving(true); setDuplicate(null);
    try {
      const fd = new FormData();
      fd.append("file", file); fd.append("outletId", outletId);
      if (salesDate) fd.append("salesDate", salesDate);
      if (force) fd.append("force", "true");
      const res = await fetch("/api/sales-report", { method: "POST", body: fd });
      if (res.status === 409) { const d = await res.json(); setDuplicate(d); return; }
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
    <div className="space-y-4 pb-32">
      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <CheckCircle size={24} className="text-green-600" />
          </div>
          <div className="flex-1">
            <p className="font-black text-green-800 text-lg">Saved successfully!</p>
            <p className="text-sm text-green-700 mt-0.5">{saved.outlet} · {fmt(saved.revenue)} revenue added</p>
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
                {duplicate.outletName} · {duplicate.existingDate} · {fmt(duplicate.existingRevenue)} already exists.
              </p>
            </div>
            <button onClick={() => setDuplicate(null)}><X size={14} className="text-amber-400" /></button>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setDuplicate(null)} className="btn-secondary text-xs px-4 py-2">Cancel</button>
            <button onClick={() => handleSave(true)} disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors">
              <RefreshCw size={12} /> Replace existing report
            </button>
          </div>
        </div>
      )}

      {!preview && !previewing && (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 shadow-sm">
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={onFileChange} />
          <div onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)} onDrop={onDrop}
            className={`p-12 flex flex-col items-center gap-4 cursor-pointer rounded-2xl transition-all ${dragging ? "bg-brand-50" : "hover:bg-gray-50"}`}>
            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center">
              <FileSpreadsheet size={32} className="text-green-600" />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-800">Click to choose Excel file</p>
              <p className="text-sm text-gray-400 mt-1">or drag & drop here · MPOS format</p>
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
              <p className="text-xs text-gray-400">{preview.totalRows} products · {preview.warehouseName || "unknown outlet"}</p>
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
                  <button onClick={() => handleDelete(r.id)}
                    className="text-gray-300 hover:text-red-400 transition-colors p-1 rounded flex-shrink-0">
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
                {isOutletUser ? (
                  <div className="h-9 flex items-center px-3 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-700 font-semibold gap-1.5">
                    {(outlets ?? []).find(o => o.id === outletId)?.name ?? "Your Outlet"}
                    <span className="text-brand-500 font-normal">· Your Outlet</span>
                  </div>
                ) : (
                  <select className="select text-sm" value={outletId} onChange={e => { setOutletId(e.target.value); onOutletChange?.(e.target.value); }}>
                    <option value="">Select outlet…</option>
                    {(outlets ?? []).map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                )}
              </div>
              <div className="w-36">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Sales Date</label>
                <input type="date" className="input text-sm" value={salesDate} onChange={e => { setSalesDate(e.target.value); onDateChange?.(e.target.value); }} />
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

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function SalesReportPage() {
  const { data: outlets } = useData<Outlet[]>("/api/outlets");
  const [syncOutletId, setSyncOutletId] = useState("");
  const [syncDate, setSyncDate]         = useState("");

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h1 className="page-title flex items-center gap-2">
          <FileSpreadsheet size={18} className="text-green-600" />
          Sales Report
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">Upload MPOS Excel · analytics update automatically</p>
      </div>

      <AnalyticsSection outlets={outlets ?? []} syncOutletId={syncOutletId} syncDate={syncDate} />
      <UploadReportTab
        outlets={outlets ?? []}
        onOutletChange={setSyncOutletId}
        onDateChange={setSyncDate}
      />
    </div>
  );
}
