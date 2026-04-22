"use client";
import { useState } from "react";
import { useData, apiFetch } from "@/hooks/useData";
import { cn } from "@/lib/utils";
import { useLang } from "@/context/LangContext";
import {
  MapPin, Wifi, Users, Copy, Check, ExternalLink,
  Search, Plus, Trash2, Loader2,
} from "lucide-react";

type Outlet = {
  id: string; name: string; city: string; type: string; channelKey: string | null;
  isActive: boolean; _count: { inputs: number; salesReports: number };
};
type Staff = {
  id: string; name: string; email: string; role: string;
  outletId: string | null; isActive: boolean; outlet: { name: string } | null;
};

function CopyBtn({ text, label, copied: copiedLabel }: { text: string; label: string; copied: string }) {
  const [done, setDone] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).catch(() => {});
    setDone(true);
    setTimeout(() => setDone(false), 1800);
  }
  return (
    <button onClick={copy}
      className={cn("flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all",
        done ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600 hover:bg-brand-100 hover:text-brand-700")}>
      {done ? <Check size={11} /> : <Copy size={11} />}
      {done ? copiedLabel : label}
    </button>
  );
}

function inputColor(count: number) {
  return count >= 5 ? "text-green-600" : count >= 2 ? "text-amber-500" : "text-red-500";
}

export default function OutletsPage() {
  const { t } = useLang();
  const { data: outlets, loading: outLoading, refetch: refetchOutlets } = useData<Outlet[]>("/api/outlets");
  const { data: staff, loading: staffLoading, refetch: refetchStaff } = useData<Staff[]>("/api/staff");

  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"outlets" | "staff">("outlets");
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: "", email: "", role: "sales", outletId: "", phone: "" });
  const [saving, setSaving] = useState(false);

  const base = typeof window !== "undefined" ? window.location.origin : "";

  const physical = (outlets ?? []).filter(o => o.type === "physical");
  const online   = (outlets ?? []).filter(o => o.type === "online");

  const filteredPhysical = physical.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.city.toLowerCase().includes(search.toLowerCase())
  );

  async function addStaff() {
    if (!newStaff.name.trim() || !newStaff.email.trim()) return;
    setSaving(true);
    try {
      await apiFetch("/api/staff", {
        method: "POST",
        body: JSON.stringify({ ...newStaff, outletId: newStaff.outletId || null }),
      });
      setNewStaff({ name: "", email: "", role: "sales", outletId: "", phone: "" });
      setShowAddStaff(false);
      refetchStaff();
    } finally {
      setSaving(false);
    }
  }

  async function toggleStaffActive(s: Staff) {
    await apiFetch("/api/staff", {
      method: "PATCH",
      body: JSON.stringify({ id: s.id, isActive: !s.isActive }),
    });
    refetchStaff();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">{t("oc_title")}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{t("oc_subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTab("outlets")}
            className={cn("px-4 py-2 rounded-lg text-sm font-semibold transition-all",
              tab === "outlets" ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>
            <MapPin size={14} className="inline mr-1.5" />{t("oc_physical")} + {t("oc_online")}
          </button>
          <button onClick={() => setTab("staff")}
            className={cn("px-4 py-2 rounded-lg text-sm font-semibold transition-all",
              tab === "staff" ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>
            <Users size={14} className="inline mr-1.5" />{t("oc_staff_title")}
          </button>
        </div>
      </div>

      {tab === "outlets" && (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-4 gap-3">
            <div className="stat-card">
              <span className="text-xs text-gray-400">{t("oc_total_outlets")}</span>
              <span className="text-xl font-bold text-gray-900">{outLoading ? "…" : physical.length}</span>
              <span className="text-xs text-gray-400">Physical stores</span>
            </div>
            <div className="stat-card">
              <span className="text-xs text-gray-400">{t("oc_online")}</span>
              <span className="text-xl font-bold text-blue-600">{outLoading ? "…" : online.length}</span>
              <span className="text-xs text-gray-400">Online channels</span>
            </div>
            <div className="stat-card">
              <span className="text-xs text-gray-400">Total Inputs</span>
              <span className="text-xl font-bold text-green-600">
                {outLoading ? "…" : (outlets ?? []).reduce((s, o) => s + o._count.inputs, 0)}
              </span>
              <span className="text-xs text-gray-400">customer inputs logged</span>
            </div>
            <div className="stat-card">
              <span className="text-xs text-gray-400">Active Reports</span>
              <span className="text-xl font-bold text-brand-600">
                {outLoading ? "…" : (outlets ?? []).reduce((s, o) => s + o._count.salesReports, 0)}
              </span>
              <span className="text-xs text-gray-400">sales reports filed</span>
            </div>
          </div>

          {/* Online channels */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Wifi size={15} className="text-brand-500" />
              <h2 className="font-semibold text-gray-800">{t("oc_online")} ({online.length})</h2>
            </div>
            {outLoading ? <div className="flex justify-center py-6"><Loader2 className="animate-spin text-gray-300" /></div> : (
              <div className="grid grid-cols-4 gap-3">
                {online.map((ch) => (
                  <div key={ch.id} className="card space-y-3 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-gray-900">{ch.name}</span>
                      <span className={cn("status-pill text-xs", ch.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400")}>
                        {ch.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="bg-brand-50 rounded-lg p-2">
                        <div className={cn("text-sm font-bold", inputColor(ch._count.inputs))}>{ch._count.inputs}</div>
                        <div className="text-[10px] text-gray-400">{t("oc_inputs")}</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <div className="text-sm font-bold text-gray-700">{ch._count.salesReports}</div>
                        <div className="text-[10px] text-gray-400">Reports</div>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <CopyBtn text={`${base}/input/${ch.id}`} label={t("oc_copy")} copied={t("oc_copied")} />
                      <a href={`/input/${ch.id}`} target="_blank"
                        className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 transition-colors">
                        <ExternalLink size={11} />{t("oc_open")}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Physical outlets */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin size={15} className="text-brand-500" />
                <h2 className="font-semibold text-gray-800">{t("oc_physical")} ({physical.length})</h2>
              </div>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input className="input pl-8 py-1.5 text-xs w-40" placeholder="Search outlet…"
                  value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>

            {outLoading ? <div className="flex justify-center py-6"><Loader2 className="animate-spin text-gray-300" /></div> : (
              <div className="card overflow-hidden p-0">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left text-xs text-gray-400 font-semibold px-4 py-3">{t("oc_physical")}</th>
                      <th className="text-left text-xs text-gray-400 font-semibold px-4 py-3">City</th>
                      <th className="text-right text-xs text-gray-400 font-semibold px-4 py-3">{t("oc_inputs")}</th>
                      <th className="text-right text-xs text-gray-400 font-semibold px-4 py-3">Reports</th>
                      <th className="text-left text-xs text-gray-400 font-semibold px-4 py-3">{t("oc_qr_link")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPhysical.map((o) => (
                      <tr key={o.id} className="table-row hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3"><span className="font-semibold text-sm text-gray-900">{o.name}</span></td>
                        <td className="px-4 py-3 text-sm text-gray-500">{o.city}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={cn("text-sm font-bold", inputColor(o._count.inputs))}>{o._count.inputs}</span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-600">{o._count.salesReports}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5">
                            <CopyBtn text={`${base}/input/${o.id}`} label={t("oc_copy")} copied={t("oc_copied")} />
                            <a href={`/input/${o.id}`} target="_blank"
                              className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 transition-colors font-semibold">
                              <ExternalLink size={10} />
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {tab === "staff" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {staffLoading ? "Loading…" : `${staff?.length ?? 0} staff members`} · No passwords needed — staff use outlet QR links
            </p>
            <button className="btn-primary flex items-center gap-2" onClick={() => setShowAddStaff(!showAddStaff)}>
              <Plus size={14} /> {t("oc_add_staff")}
            </button>
          </div>

          {showAddStaff && (
            <div className="card space-y-3 border-2 border-brand-200">
              <h3 className="font-semibold text-gray-800">{t("oc_add_staff")}</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Name</label>
                  <input className="input" placeholder="Staff name"
                    value={newStaff.name} onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Email</label>
                  <input className="input" type="email" placeholder="staff@jackstudio.my"
                    value={newStaff.email} onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">{t("oc_role")}</label>
                  <select className="select" value={newStaff.role} onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}>
                    <option value="sales">Sales</option>
                    <option value="manager">Manager</option>
                    <option value="creator">Creator</option>
                    <option value="product">Product</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">{t("oc_outlet_label")}</label>
                  <select className="select" value={newStaff.outletId} onChange={(e) => setNewStaff({ ...newStaff, outletId: e.target.value })}>
                    <option value="">HQ / All outlets</option>
                    {(outlets ?? []).map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="btn-primary flex items-center gap-2" onClick={addStaff} disabled={saving}>
                  {saving && <Loader2 size={14} className="animate-spin" />} Save Staff
                </button>
                <button className="btn-secondary" onClick={() => setShowAddStaff(false)}>Cancel</button>
              </div>
            </div>
          )}

          {staffLoading ? <div className="flex justify-center py-6"><Loader2 className="animate-spin text-gray-300" /></div> : (
            <div className="card overflow-hidden p-0">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left text-xs text-gray-400 font-semibold px-4 py-3">Name</th>
                    <th className="text-left text-xs text-gray-400 font-semibold px-4 py-3">{t("oc_role")}</th>
                    <th className="text-left text-xs text-gray-400 font-semibold px-4 py-3">{t("oc_outlet_label")}</th>
                    <th className="text-left text-xs text-gray-400 font-semibold px-4 py-3">Input Link</th>
                    <th className="text-left text-xs text-gray-400 font-semibold px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {(staff ?? []).map((s) => (
                    <tr key={s.id} className={cn("table-row hover:bg-gray-50 transition-colors", !s.isActive && "opacity-50")}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                            {s.name[0]}
                          </div>
                          <div>
                            <div className="font-semibold text-sm text-gray-900">{s.name}</div>
                            <div className="text-[10px] text-gray-400">{s.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><span className="badge bg-gray-100 text-gray-600 capitalize">{s.role}</span></td>
                      <td className="px-4 py-3 text-sm text-gray-600">{s.outlet?.name ?? "—"}</td>
                      <td className="px-4 py-3">
                        {s.outletId ? (
                          <div className="flex gap-1.5">
                            <CopyBtn text={`${base}/input/${s.outletId}`} label={t("oc_copy")} copied={t("oc_copied")} />
                            <a href={`/input/${s.outletId}`} target="_blank"
                              className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 transition-colors font-semibold">
                              <ExternalLink size={10} />
                            </a>
                          </div>
                        ) : <span className="text-xs text-gray-300">No outlet set</span>}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleStaffActive(s)}
                          className="text-gray-300 hover:text-red-500 transition-colors" title={s.isActive ? "Deactivate" : "Activate"}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="alert-warning">
            <div className="text-amber-500 flex-shrink-0 mt-0.5">💡</div>
            <div className="text-sm text-gray-700">
              <strong>No accounts needed for input staff.</strong> Each outlet/channel has a unique link (e.g. <code className="bg-amber-100 px-1 rounded text-xs">/input/pavilion</code>). Share the link or print a QR code — staff tap, fill in 30 seconds, done. When staff leave, just deactivate them here. The link stays the same.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
