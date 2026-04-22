"use client";
import { useState } from "react";
import { useData, apiFetch } from "@/hooks/useData";
import { Plus, Pencil, Check, X, Loader2, ToggleLeft, ToggleRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Outlet = { id: string; name: string; city: string; type: string; isActive: boolean; _count: { inputs: number; salesReports: number } };

export default function AdminOutlets() {
  const { data: outlets, loading, refetch } = useData<Outlet[]>("/api/outlets");

  const [editingId, setEditingId]   = useState<string | null>(null);
  const [editForm, setEditForm]     = useState({ name: "", city: "" });
  const [saving, setSaving]         = useState(false);
  const [showAdd, setShowAdd]       = useState(false);
  const [newForm, setNewForm]       = useState({ name: "", city: "", type: "physical" });

  async function saveEdit(id: string) {
    setSaving(true);
    try {
      await apiFetch("/api/outlets", { method: "PATCH", body: JSON.stringify({ id, ...editForm }) });
      setEditingId(null);
      refetch();
    } finally { setSaving(false); }
  }

  async function toggleActive(o: Outlet) {
    await apiFetch("/api/outlets", { method: "PATCH", body: JSON.stringify({ id: o.id, isActive: !o.isActive }) });
    refetch();
  }

  async function addOutlet() {
    if (!newForm.name.trim() || !newForm.city.trim()) return;
    setSaving(true);
    try {
      await apiFetch("/api/outlets", { method: "POST", body: JSON.stringify(newForm) });
      setNewForm({ name: "", city: "", type: "physical" });
      setShowAdd(false);
      refetch();
    } finally { setSaving(false); }
  }

  function startEdit(o: Outlet) {
    setEditingId(o.id);
    setEditForm({ name: o.name, city: o.city });
  }

  const physical = (outlets ?? []).filter(o => o.type === "physical");
  const online   = (outlets ?? []).filter(o => o.type === "online");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Outlets</h1>
          <p className="text-stone-400 text-sm mt-1">Add, rename, or deactivate outlets and channels.</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg transition-colors">
          <Plus size={15} /> Add Outlet
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-stone-800 border border-brand-600 rounded-xl p-5 space-y-4">
          <h3 className="text-white font-semibold">New Outlet</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-stone-400 mb-1.5">Name</label>
              <input className="w-full bg-stone-700 border border-stone-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500"
                placeholder="e.g. Pavilion KL" value={newForm.name}
                onChange={(e) => setNewForm({ ...newForm, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs text-stone-400 mb-1.5">City</label>
              <input className="w-full bg-stone-700 border border-stone-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500"
                placeholder="e.g. Kuala Lumpur" value={newForm.city}
                onChange={(e) => setNewForm({ ...newForm, city: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs text-stone-400 mb-1.5">Type</label>
              <select className="w-full bg-stone-700 border border-stone-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500"
                value={newForm.type} onChange={(e) => setNewForm({ ...newForm, type: e.target.value })}>
                <option value="physical">Physical Store</option>
                <option value="online">Online Channel</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addOutlet} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors">
              {saving && <Loader2 size={13} className="animate-spin" />} Save Outlet
            </button>
            <button onClick={() => setShowAdd(false)}
              className="px-4 py-2 bg-stone-700 hover:bg-stone-600 text-stone-300 text-sm font-semibold rounded-lg transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-stone-600" /></div>
      ) : (
        <>
          {/* Physical */}
          <OutletTable title="Physical Stores" outlets={physical}
            editingId={editingId} editForm={editForm} saving={saving}
            setEditForm={setEditForm} onEdit={startEdit}
            onSave={saveEdit} onCancel={() => setEditingId(null)}
            onToggle={toggleActive} />

          {/* Online */}
          <OutletTable title="Online Channels" outlets={online}
            editingId={editingId} editForm={editForm} saving={saving}
            setEditForm={setEditForm} onEdit={startEdit}
            onSave={saveEdit} onCancel={() => setEditingId(null)}
            onToggle={toggleActive} />
        </>
      )}
    </div>
  );
}

function OutletTable({ title, outlets, editingId, editForm, saving, setEditForm, onEdit, onSave, onCancel, onToggle }: {
  title: string; outlets: Outlet[];
  editingId: string | null; editForm: { name: string; city: string }; saving: boolean;
  setEditForm: (f: { name: string; city: string }) => void;
  onEdit: (o: Outlet) => void; onSave: (id: string) => void;
  onCancel: () => void; onToggle: (o: Outlet) => void;
}) {
  return (
    <div>
      <h2 className="text-stone-400 text-xs font-semibold uppercase tracking-wider mb-3">{title} ({outlets.length})</h2>
      <div className="bg-stone-800 border border-stone-700 rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-stone-700">
              <th className="text-left text-xs text-stone-500 font-semibold px-5 py-3">Name</th>
              <th className="text-left text-xs text-stone-500 font-semibold px-5 py-3">City</th>
              <th className="text-right text-xs text-stone-500 font-semibold px-5 py-3">Inputs</th>
              <th className="text-right text-xs text-stone-500 font-semibold px-5 py-3">Reports</th>
              <th className="text-right text-xs text-stone-500 font-semibold px-5 py-3">Status</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {outlets.map((o, i) => (
              <tr key={o.id} className={cn("group", i < outlets.length - 1 && "border-b border-stone-700/50")}>
                <td className="px-5 py-3.5">
                  {editingId === o.id ? (
                    <input autoFocus className="bg-stone-700 border border-brand-500 rounded-lg px-2.5 py-1.5 text-white text-sm w-44 focus:outline-none"
                      value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      onKeyDown={(e) => { if (e.key === "Enter") onSave(o.id); if (e.key === "Escape") onCancel(); }} />
                  ) : (
                    <span className={cn("text-sm font-semibold", o.isActive ? "text-white" : "text-stone-500 line-through")}>{o.name}</span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  {editingId === o.id ? (
                    <input className="bg-stone-700 border border-stone-600 rounded-lg px-2.5 py-1.5 text-white text-sm w-32 focus:outline-none focus:border-brand-500"
                      value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      onKeyDown={(e) => { if (e.key === "Enter") onSave(o.id); if (e.key === "Escape") onCancel(); }} />
                  ) : (
                    <span className="text-stone-400 text-sm">{o.city}</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-right text-sm text-stone-400">{o._count.inputs}</td>
                <td className="px-5 py-3.5 text-right text-sm text-stone-400">{o._count.salesReports}</td>
                <td className="px-5 py-3.5 text-right">
                  <span className={cn("text-xs font-semibold px-2 py-1 rounded-md", o.isActive ? "bg-green-900/50 text-green-400" : "bg-stone-700 text-stone-500")}>
                    {o.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  {editingId === o.id ? (
                    <div className="flex items-center gap-1.5 justify-end">
                      <button onClick={() => onSave(o.id)} disabled={saving}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg transition-colors">
                        {saving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />} Save
                      </button>
                      <button onClick={onCancel}
                        className="p-1.5 bg-stone-700 hover:bg-stone-600 text-stone-400 rounded-lg transition-colors">
                        <X size={11} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onEdit(o)}
                        className="p-1.5 bg-stone-700 hover:bg-stone-600 text-stone-400 hover:text-white rounded-lg transition-colors" title="Edit">
                        <Pencil size={12} />
                      </button>
                      <button onClick={() => onToggle(o)}
                        className="p-1.5 bg-stone-700 hover:bg-stone-600 text-stone-400 hover:text-white rounded-lg transition-colors" title={o.isActive ? "Deactivate" : "Activate"}>
                        {o.isActive ? <ToggleRight size={14} className="text-green-400" /> : <ToggleLeft size={14} />}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {outlets.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-stone-600 text-sm">No outlets yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
