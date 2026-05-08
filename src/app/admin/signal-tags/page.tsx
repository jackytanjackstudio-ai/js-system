"use client";
import { useState } from "react";
import { useData, apiFetch } from "@/hooks/useData";
import { Plus, Trash2, Loader2, Tag, ToggleLeft, ToggleRight } from "lucide-react";
import { cn } from "@/lib/utils";

type SignalTag = { id: string; name: string; category: string; emoji: string; isActive: boolean };

const CATEGORIES = [
  { key: "product",  label: "Product Signal",  color: "bg-blue-50 border-blue-200",   dot: "bg-blue-400",   pill: "bg-blue-100 text-blue-700",   desc: "Features customers ask about"  },
  { key: "customer", label: "Customer Signal",  color: "bg-amber-50 border-amber-200", dot: "bg-amber-400",  pill: "bg-amber-100 text-amber-700",  desc: "Customer behavior & reasons"   },
  { key: "trend",    label: "Trend Signal",     color: "bg-green-50 border-green-200", dot: "bg-green-400",  pill: "bg-green-100 text-green-700",  desc: "Market trends observed"        },
];

const DEFAULT_TAGS: Record<string, { name: string; emoji: string }[]> = {
  product:  [
    { name: "Lightweight", emoji: "🪶" }, { name: "RFID", emoji: "📡" },
    { name: "Water Resistant", emoji: "💧" }, { name: "Large Capacity", emoji: "📦" },
    { name: "Slim Design", emoji: "📐" }, { name: "Premium Leather", emoji: "✨" },
    { name: "Anti-Theft", emoji: "🔒" }, { name: "USB Charging", emoji: "🔋" },
  ],
  customer: [
    { name: "Looking for Gift", emoji: "🎁" }, { name: "Budget Conscious", emoji: "💰" },
    { name: "Need Bigger Size", emoji: "📏" }, { name: "Comparing Brands", emoji: "🔍" },
    { name: "Impulse Decision", emoji: "⚡" }, { name: "Repeat Customer", emoji: "🔄" },
    { name: "First-Time Buyer", emoji: "🌟" }, { name: "Corporate Purchase", emoji: "🏢" },
  ],
  trend: [
    { name: "Travel Trend", emoji: "✈️" }, { name: "Office Trend", emoji: "💼" },
    { name: "Minimalist Trend", emoji: "🎯" }, { name: "Outdoor Trend", emoji: "🏕️" },
    { name: "Gifting Season", emoji: "🎄" }, { name: "Father's Day", emoji: "👔" },
    { name: "Back to School", emoji: "📚" }, { name: "Crossbody Trend", emoji: "👜" },
  ],
};

export default function SignalTagsAdmin() {
  const { data: tags, loading, refetch } = useData<SignalTag[]>("/api/signal-tags");
  const [adding, setAdding] = useState<Record<string, boolean>>({});
  const [drafts, setDrafts] = useState<Record<string, { name: string; emoji: string }>>({});
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});

  async function addTag(category: string) {
    const d = drafts[category];
    if (!d?.name?.trim()) return;
    setAdding(p => ({ ...p, [category]: true }));
    try {
      await apiFetch("/api/signal-tags", { method: "POST", body: JSON.stringify({ name: d.name.trim(), category, emoji: d.emoji ?? "" }) });
      setDrafts(p => ({ ...p, [category]: { name: "", emoji: "" } }));
      refetch();
    } finally { setAdding(p => ({ ...p, [category]: false })); }
  }

  async function seedDefaults(category: string) {
    const defaults = DEFAULT_TAGS[category] ?? [];
    setAdding(p => ({ ...p, [category]: true }));
    try {
      for (const t of defaults) {
        await apiFetch("/api/signal-tags", { method: "POST", body: JSON.stringify({ name: t.name, category, emoji: t.emoji }) }).catch(() => {});
      }
      refetch();
    } finally { setAdding(p => ({ ...p, [category]: false })); }
  }

  async function toggleTag(id: string, isActive: boolean) {
    await apiFetch("/api/signal-tags", { method: "PATCH", body: JSON.stringify({ id, isActive: !isActive }) });
    refetch();
  }

  async function deleteTag(id: string) {
    if (!confirm("Delete this tag?")) return;
    setDeleting(p => ({ ...p, [id]: true }));
    try {
      await apiFetch("/api/signal-tags", { method: "DELETE", body: JSON.stringify({ id }) });
      refetch();
    } finally { setDeleting(p => ({ ...p, [id]: false })); }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gray-300" size={24} /></div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Tag size={20} className="text-brand-500" /> Signal Tags</h1>
        <p className="text-sm text-gray-400 mt-0.5">Admin-editable tags staff select in Customer Input. Keep it focused — 8–12 per category max.</p>
      </div>

      {CATEGORIES.map(cat => {
        const catTags = (tags ?? []).filter(t => t.category === cat.key);
        const draft = drafts[cat.key] ?? { name: "", emoji: "" };

        return (
          <div key={cat.key} className={cn("rounded-2xl border p-5 space-y-4", cat.color)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={cn("w-2.5 h-2.5 rounded-full", cat.dot)} />
                <span className="font-bold text-gray-800">{cat.label}</span>
                <span className="text-xs text-gray-400">{cat.desc}</span>
              </div>
              {catTags.length === 0 && (
                <button onClick={() => seedDefaults(cat.key)} disabled={adding[cat.key]}
                  className="text-xs font-semibold text-brand-500 hover:text-brand-700 border border-brand-200 bg-white px-3 py-1 rounded-lg transition-colors">
                  {adding[cat.key] ? <Loader2 size={10} className="animate-spin inline" /> : "Seed defaults"}
                </button>
              )}
            </div>

            {/* Existing tags */}
            <div className="flex flex-wrap gap-2">
              {catTags.map(tag => (
                <div key={tag.id} className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold border transition-all",
                  tag.isActive ? cat.pill + " border-transparent" : "bg-gray-100 text-gray-400 border-gray-200 opacity-60"
                )}>
                  {tag.emoji && <span>{tag.emoji}</span>}
                  <span>{tag.name}</span>
                  <button onClick={() => toggleTag(tag.id, tag.isActive)} className="ml-0.5 opacity-60 hover:opacity-100">
                    {tag.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                  </button>
                  <button onClick={() => deleteTag(tag.id)} disabled={deleting[tag.id]}
                    className="opacity-40 hover:opacity-100 hover:text-red-500 transition-opacity">
                    {deleting[tag.id] ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                  </button>
                </div>
              ))}
              {catTags.length === 0 && <p className="text-xs text-gray-400 italic">No tags yet — add below or seed defaults</p>}
            </div>

            {/* Add new tag */}
            <div className="flex gap-2">
              <input className="w-12 border border-gray-200 bg-white rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:border-brand-400"
                placeholder="😀" maxLength={2}
                value={draft.emoji}
                onChange={e => setDrafts(p => ({ ...p, [cat.key]: { ...draft, emoji: e.target.value } }))} />
              <input className="input flex-1 text-sm py-1.5"
                placeholder={`New ${cat.label} tag…`}
                value={draft.name}
                onChange={e => setDrafts(p => ({ ...p, [cat.key]: { ...draft, name: e.target.value } }))}
                onKeyDown={e => { if (e.key === "Enter") addTag(cat.key); }} />
              <button onClick={() => addTag(cat.key)} disabled={!draft.name?.trim() || adding[cat.key]}
                className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1 disabled:opacity-40">
                {adding[cat.key] ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />} Add
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
