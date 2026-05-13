"use client";
import { useState, useRef } from "react";
import { useData, apiFetch } from "@/hooks/useData";
import { Store, Users, Activity, ShieldCheck, Database, Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";

type Outlet = { id: string; name: string; city: string; type: string; isActive: boolean };
type Staff  = { id: string; name: string; email: string; role: string; isActive: boolean };

const ROLE_COLORS: Record<string, string> = {
  admin:      "bg-red-900 text-red-300",
  supervisor: "bg-amber-900 text-amber-300",
  staff:      "bg-blue-900 text-blue-300",
  marketing:  "bg-pink-900 text-pink-300",
  content:    "bg-purple-900 text-purple-300",
  cs:         "bg-cyan-900 text-cyan-300",
  product:    "bg-green-900 text-green-300",
  // Legacy DB values
  manager:    "bg-amber-900 text-amber-300",
  sales:      "bg-blue-900 text-blue-300",
  creator:    "bg-purple-900 text-purple-300",
};

function SkuCatalogImport() {
  const { data: catalogInfo, refetch } = useData<{ count: number }>("/api/admin/sku-catalog");
  const fileRef   = useRef<HTMLInputElement>(null);
  const [status,   setStatus]   = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [result,   setResult]   = useState<{ imported: number; total: number } | null>(null);
  const [errMsg,   setErrMsg]   = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("uploading");
    setResult(null);
    setErrMsg("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/sku-catalog", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setErrMsg(data.error ?? "Import failed"); setStatus("error"); return; }
      setResult(data.data ?? data);
      setStatus("done");
      refetch();
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : "Import failed");
      setStatus("error");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const count = catalogInfo?.count ?? 0;

  return (
    <div className="bg-stone-800 border border-stone-700 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-amber-600/20 flex items-center justify-center">
          <Database size={16} className="text-amber-400" />
        </div>
        <div>
          <h2 className="text-white font-semibold text-sm">SKU Catalog</h2>
          <p className="text-stone-400 text-xs">{count > 0 ? `${count.toLocaleString()} products loaded` : "No products loaded yet"}</p>
        </div>
      </div>

      <p className="text-stone-400 text-xs leading-relaxed">
        Upload your <span className="text-white font-medium">MASTER CODE LIST.xlsx</span> to enable barcode scanning in Sales Report Quick Log.
        Re-uploading will update existing products automatically.
      </p>

      <label className={`flex items-center justify-center gap-2 w-full py-3 rounded-lg border-2 border-dashed cursor-pointer transition-all text-sm font-semibold
        ${status === "uploading" ? "border-amber-600/40 text-amber-400/50 pointer-events-none" :
          "border-amber-600/40 text-amber-400 hover:border-amber-500 hover:bg-amber-600/5"}`}>
        {status === "uploading"
          ? <><Loader2 size={16} className="animate-spin" /> Importing…</>
          : <><Upload size={15} /> Upload Master Code List (.xlsx)</>}
        <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} disabled={status === "uploading"} />
      </label>

      {status === "done" && result && (
        <div className="flex items-center gap-2 text-green-400 text-xs font-semibold">
          <CheckCircle size={14} />
          {result.imported.toLocaleString()} of {result.total.toLocaleString()} products imported successfully.
        </div>
      )}
      {status === "error" && (
        <div className="flex items-center gap-2 text-red-400 text-xs font-semibold">
          <AlertCircle size={14} /> {errMsg}
        </div>
      )}
    </div>
  );
}

export default function AdminOverview() {
  const { data: outlets, loading: ol } = useData<Outlet[]>("/api/outlets");
  const { data: staff,   loading: sl } = useData<Staff[]>("/api/staff");

  const physical    = (outlets ?? []).filter(o => o.type === "physical" && o.isActive);
  const online      = (outlets ?? []).filter(o => o.type === "online"   && o.isActive);
  const activeStaff = (staff ?? []).filter(s => s.isActive);

  const roleCounts = (staff ?? []).reduce<Record<string, number>>((acc, s) => {
    acc[s.role] = (acc[s.role] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Overview</h1>
        <p className="text-stone-400 text-sm mt-1">Manage outlets, staff, and user accounts.</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-stone-800 border border-stone-700 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-brand-600/20 flex items-center justify-center">
              <Store size={16} className="text-brand-400" />
            </div>
            <span className="text-stone-400 text-sm font-medium">Outlets</span>
          </div>
          <div className="text-3xl font-bold text-white">{ol ? "…" : physical.length + online.length}</div>
          <div className="text-stone-500 text-xs mt-1">{physical.length} physical · {online.length} online</div>
        </div>

        <div className="bg-stone-800 border border-stone-700 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600/20 flex items-center justify-center">
              <Users size={16} className="text-blue-400" />
            </div>
            <span className="text-stone-400 text-sm font-medium">Active Users</span>
          </div>
          <div className="text-3xl font-bold text-white">{sl ? "…" : activeStaff.length}</div>
          <div className="text-stone-500 text-xs mt-1">{(staff ?? []).length} total accounts</div>
        </div>

        <div className="bg-stone-800 border border-stone-700 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-green-600/20 flex items-center justify-center">
              <Activity size={16} className="text-green-400" />
            </div>
            <span className="text-stone-400 text-sm font-medium">Roles</span>
          </div>
          <div className="text-3xl font-bold text-white">{Object.keys(roleCounts).length}</div>
          <div className="text-stone-500 text-xs mt-1">role types in system</div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/admin/outlets" className="bg-stone-800 border border-stone-700 hover:border-brand-600 rounded-xl p-5 group transition-all">
          <div className="flex items-center gap-3 mb-2">
            <Store size={18} className="text-brand-400" />
            <span className="text-white font-semibold group-hover:text-brand-400 transition-colors">Manage Outlets</span>
          </div>
          <p className="text-stone-500 text-sm">Add, rename, or deactivate physical stores and online channels.</p>
        </Link>

        <Link href="/admin/staff" className="bg-stone-800 border border-stone-700 hover:border-blue-600 rounded-xl p-5 group transition-all">
          <div className="flex items-center gap-3 mb-2">
            <Users size={18} className="text-blue-400" />
            <span className="text-white font-semibold group-hover:text-blue-400 transition-colors">Staff & Users</span>
          </div>
          <p className="text-stone-500 text-sm">Manage login accounts, roles, and outlet assignments.</p>
        </Link>

        <Link href="/admin/signal-tags" className="bg-stone-800 border border-stone-700 hover:border-green-600 rounded-xl p-5 group transition-all">
          <div className="flex items-center gap-3 mb-2">
            <Activity size={18} className="text-green-400" />
            <span className="text-white font-semibold group-hover:text-green-400 transition-colors">Signal Tags</span>
          </div>
          <p className="text-stone-500 text-sm">Manage dynamic market signal tags for Customer Input — Product, Customer & Trend signals.</p>
        </Link>
      </div>

      {/* SKU Catalog import */}
      <SkuCatalogImport />

      {/* Role breakdown */}
      {!sl && (
        <div className="bg-stone-800 border border-stone-700 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <ShieldCheck size={15} className="text-brand-400" /> Role Breakdown
          </h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(roleCounts).map(([role, count]) => (
              <div key={role} className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize flex items-center gap-1.5 ${ROLE_COLORS[role] ?? "bg-stone-700 text-stone-300"}`}>
                <span>{role}</span>
                <span className="opacity-60">·</span>
                <span>{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
