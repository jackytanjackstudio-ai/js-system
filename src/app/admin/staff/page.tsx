"use client";
import { useState } from "react";
import { useData, apiFetch } from "@/hooks/useData";
import { Plus, Loader2, ToggleLeft, ToggleRight, Pencil, Check, X, KeyRound, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

type Staff  = { id: string; name: string; email: string; role: string; outletId: string | null; isActive: boolean; outlet: { name: string } | null };
type Outlet = { id: string; name: string; type: string };

const ROLES = ["admin", "manager", "sales", "creator", "product"];

const ROLE_COLORS: Record<string, string> = {
  admin:   "bg-red-900/50 text-red-400",
  manager: "bg-amber-900/50 text-amber-400",
  sales:   "bg-blue-900/50 text-blue-400",
  creator: "bg-purple-900/50 text-purple-400",
  product: "bg-green-900/50 text-green-400",
};

export default function AdminStaff() {
  const { user: me } = useAuth();
  const { data: staff,   loading: sl, refetch: refetchStaff }   = useData<Staff[]>("/api/staff");
  const { data: outlets, loading: ol }                           = useData<Outlet[]>("/api/outlets");

  const [showAdd, setShowAdd]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm]   = useState({ name: "", role: "", outletId: "" });
  const [newForm, setNewForm]     = useState({ name: "", email: "", role: "sales", outletId: "", password: "" });
  const [search, setSearch]       = useState("");
  const [filterRole, setFilterRole]     = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterOutlet, setFilterOutlet] = useState("");
  const [resetId, setResetId]     = useState<string | null>(null);
  const [newPw, setNewPw]         = useState("");

  async function addUser() {
    if (!newForm.name.trim() || !newForm.email.trim()) return;
    setSaving(true);
    try {
      await apiFetch("/api/staff", {
        method: "POST",
        body: JSON.stringify({ ...newForm, outletId: newForm.outletId || null, password: newForm.password || "jackstudio2026" }),
      });
      setNewForm({ name: "", email: "", role: "sales", outletId: "", password: "" });
      setShowAdd(false);
      refetchStaff();
    } finally { setSaving(false); }
  }

  async function saveEdit(id: string) {
    setSaving(true);
    try {
      await apiFetch("/api/staff", {
        method: "PATCH",
        body: JSON.stringify({ id, name: editForm.name, role: editForm.role, outletId: editForm.outletId || null }),
      });
      setEditingId(null);
      refetchStaff();
    } finally { setSaving(false); }
  }

  async function toggleActive(s: Staff) {
    await apiFetch("/api/staff", { method: "PATCH", body: JSON.stringify({ id: s.id, isActive: !s.isActive }) });
    refetchStaff();
  }

  async function deleteUser(s: Staff) {
    if (!confirm(`Delete "${s.name}"? This cannot be undone.`)) return;
    await apiFetch("/api/staff", { method: "DELETE", body: JSON.stringify({ id: s.id }) });
    refetchStaff();
  }

  async function resetPassword(id: string) {
    if (!newPw.trim()) return;
    setSaving(true);
    try {
      await apiFetch("/api/staff", { method: "PATCH", body: JSON.stringify({ id, password: newPw.trim() }) });
      setResetId(null);
      setNewPw("");
    } finally { setSaving(false); }
  }

  function startEdit(s: Staff) {
    setEditingId(s.id);
    setEditForm({ name: s.name, role: s.role, outletId: s.outletId ?? "" });
  }

  const filtered = (staff ?? []).filter(s => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.email.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterRole && s.role !== filterRole) return false;
    if (filterStatus === "active" && !s.isActive) return false;
    if (filterStatus === "inactive" && s.isActive) return false;
    if (filterOutlet && (s.outletId ?? "") !== filterOutlet) return false;
    return true;
  });

  const inputCls = "w-full bg-stone-700 border border-stone-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500 placeholder-stone-500";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Staff & Users</h1>
          <p className="text-stone-400 text-sm mt-1">Manage login accounts, roles, and outlet assignments.</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg transition-colors">
          <Plus size={15} /> Add User
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-stone-800 border border-brand-600 rounded-xl p-5 space-y-4">
          <h3 className="text-white font-semibold">New User Account</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-stone-400 mb-1.5">Full Name</label>
              <input className={inputCls} placeholder="e.g. Ahmad Fariz"
                value={newForm.name} onChange={(e) => setNewForm({ ...newForm, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs text-stone-400 mb-1.5">Email</label>
              <input className={inputCls} type="email" placeholder="user@jackstudio.my"
                value={newForm.email} onChange={(e) => setNewForm({ ...newForm, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs text-stone-400 mb-1.5">Role</label>
              <select className={inputCls} value={newForm.role} onChange={(e) => setNewForm({ ...newForm, role: e.target.value })}>
                {ROLES.map(r => <option key={r} value={r} className="bg-stone-800 capitalize">{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-stone-400 mb-1.5">Outlet</label>
              <select className={inputCls} value={newForm.outletId} onChange={(e) => setNewForm({ ...newForm, outletId: e.target.value })}>
                <option value="" className="bg-stone-800">HQ / All outlets</option>
                {(outlets ?? []).map(o => <option key={o.id} value={o.id} className="bg-stone-800">{o.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-stone-400 mb-1.5 flex items-center gap-1.5">
                <KeyRound size={11} /> Password <span className="text-stone-600">(default: jackstudio2026)</span>
              </label>
              <input className={inputCls} type="password" placeholder="Leave blank for default"
                value={newForm.password} onChange={(e) => setNewForm({ ...newForm, password: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addUser} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors">
              {saving && <Loader2 size={13} className="animate-spin" />} Create Account
            </button>
            <button onClick={() => setShowAdd(false)}
              className="px-4 py-2 bg-stone-700 hover:bg-stone-600 text-stone-300 text-sm font-semibold rounded-lg transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search + Filters */}
      <div className="space-y-2">
        <input className="w-full bg-stone-800 border border-stone-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-500 placeholder-stone-500"
          placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="flex flex-wrap gap-2">
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
            className="bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-300 text-xs focus:outline-none focus:border-brand-500">
            <option value="">All Roles</option>
            {ROLES.map(r => <option key={r} value={r} className="bg-stone-900 capitalize">{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
          </select>
          <select value={filterOutlet} onChange={e => setFilterOutlet(e.target.value)}
            className="bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-300 text-xs focus:outline-none focus:border-brand-500">
            <option value="">All Outlets</option>
            <option value="" disabled>──</option>
            {(outlets ?? []).map(o => <option key={o.id} value={o.id} className="bg-stone-900">{o.name}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-300 text-xs focus:outline-none focus:border-brand-500">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          {(filterRole || filterOutlet || filterStatus) && (
            <button onClick={() => { setFilterRole(""); setFilterOutlet(""); setFilterStatus(""); }}
              className="px-3 py-2 bg-stone-700 hover:bg-stone-600 text-stone-400 text-xs rounded-lg transition-colors">
              Clear
            </button>
          )}
          <span className="ml-auto text-xs text-stone-500 self-center">{filtered.length} user{filtered.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Table */}
      {sl || ol ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-stone-600" /></div>
      ) : (
        <div className="bg-stone-800 border border-stone-700 rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-stone-700">
                <th className="text-left text-xs text-stone-500 font-semibold px-5 py-3">User</th>
                <th className="text-left text-xs text-stone-500 font-semibold px-5 py-3">Role</th>
                <th className="text-left text-xs text-stone-500 font-semibold px-5 py-3">Outlet</th>
                <th className="text-right text-xs text-stone-500 font-semibold px-5 py-3">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr key={s.id} className={cn("group", i < filtered.length - 1 && "border-b border-stone-700/50")}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-stone-700 text-stone-300 text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {s.name[0].toUpperCase()}
                      </div>
                      <div>
                        {editingId === s.id ? (
                          <input autoFocus className="bg-stone-700 border border-brand-500 rounded-lg px-2.5 py-1 text-white text-sm w-36 focus:outline-none"
                            value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            onKeyDown={(e) => { if (e.key === "Enter") saveEdit(s.id); if (e.key === "Escape") setEditingId(null); }} />
                        ) : (
                          <div className={cn("text-sm font-semibold", s.isActive ? "text-white" : "text-stone-500")}>{s.name}</div>
                        )}
                        <div className="text-xs text-stone-500">{s.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    {editingId === s.id ? (
                      <select className="bg-stone-700 border border-stone-600 rounded-lg px-2.5 py-1.5 text-white text-sm focus:outline-none focus:border-brand-500"
                        value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
                        {ROLES.map(r => <option key={r} value={r} className="bg-stone-800 capitalize">{r}</option>)}
                      </select>
                    ) : (
                      <span className={cn("text-xs font-semibold px-2 py-1 rounded-md capitalize", ROLE_COLORS[s.role] ?? "bg-stone-700 text-stone-400")}>
                        {s.role}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    {editingId === s.id ? (
                      <select className="bg-stone-700 border border-stone-600 rounded-lg px-2.5 py-1.5 text-white text-sm focus:outline-none focus:border-brand-500"
                        value={editForm.outletId} onChange={(e) => setEditForm({ ...editForm, outletId: e.target.value })}>
                        <option value="" className="bg-stone-800">HQ / All</option>
                        {(outlets ?? []).map(o => <option key={o.id} value={o.id} className="bg-stone-800">{o.name}</option>)}
                      </select>
                    ) : (
                      <span className="text-stone-400 text-sm">{s.outlet?.name ?? "HQ / All"}</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className={cn("text-xs font-semibold px-2 py-1 rounded-md", s.isActive ? "bg-green-900/50 text-green-400" : "bg-stone-700 text-stone-500")}>
                      {s.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {editingId === s.id ? (
                      <div className="flex items-center gap-1.5 justify-end">
                        <button onClick={() => saveEdit(s.id)} disabled={saving}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg transition-colors">
                          {saving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />} Save
                        </button>
                        <button onClick={() => setEditingId(null)}
                          className="p-1.5 bg-stone-700 hover:bg-stone-600 text-stone-400 rounded-lg transition-colors">
                          <X size={11} />
                        </button>
                      </div>
                    ) : resetId === s.id ? (
                      <div className="flex items-center gap-1.5 justify-end">
                        <input autoFocus type="password" placeholder="New password"
                          value={newPw} onChange={(e) => setNewPw(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") resetPassword(s.id); if (e.key === "Escape") { setResetId(null); setNewPw(""); } }}
                          className="bg-stone-700 border border-amber-600/60 rounded-lg px-2.5 py-1 text-white text-xs w-32 focus:outline-none focus:border-amber-500 placeholder-stone-500" />
                        <button onClick={() => resetPassword(s.id)} disabled={saving || !newPw.trim()}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors">
                          {saving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                        </button>
                        <button onClick={() => { setResetId(null); setNewPw(""); }}
                          className="p-1.5 bg-stone-700 hover:bg-stone-600 text-stone-400 rounded-lg transition-colors">
                          <X size={11} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEdit(s)}
                          className="p-1.5 bg-stone-700 hover:bg-stone-600 text-stone-400 hover:text-white rounded-lg transition-colors" title="Edit">
                          <Pencil size={12} />
                        </button>
                        <button onClick={() => { setResetId(s.id); setNewPw(""); setEditingId(null); }}
                          className="p-1.5 bg-stone-700 hover:bg-stone-600 text-stone-400 hover:text-amber-400 rounded-lg transition-colors" title="Reset Password">
                          <KeyRound size={12} />
                        </button>
                        <button onClick={() => toggleActive(s)}
                          className="p-1.5 bg-stone-700 hover:bg-stone-600 text-stone-400 hover:text-white rounded-lg transition-colors" title={s.isActive ? "Deactivate" : "Activate"}>
                          {s.isActive ? <ToggleRight size={14} className="text-green-400" /> : <ToggleLeft size={14} />}
                        </button>
                        {me?.id !== s.id && (
                          <button onClick={() => deleteUser(s)}
                            className="p-1.5 bg-stone-700 hover:bg-red-900/60 text-stone-400 hover:text-red-400 rounded-lg transition-colors" title="Delete user">
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
