"use client";
import { useState } from "react";
import { useData } from "@/hooks/useData";
import { Phone, User, Store, Calendar, Search, MessageSquare } from "lucide-react";

type Lead = {
  id: string;
  staffName: string | null;
  customerName: string | null;
  customerPhone: string | null;
  lookingFor: string;
  nobuReasons: string;
  suggestions: string;
  quote: string | null;
  week: string | null;
  imageUrl: string | null;
  createdAt: string;
  outlet: { name: string };
  user: { name: string };
};

function parseTags(raw: string): string[] {
  try { return JSON.parse(raw) as string[]; } catch { return []; }
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-MY", { day: "numeric", month: "short" });
}

const CATEGORY_EMOJI: Record<string, string> = {
  Wallet: "👜", "Card Holder": "🪪", Bag: "🎒", Luggage: "🧳", Accessories: "✨", Gift: "🎁",
};

const REASON_EMOJI: Record<string, string> = {
  Price: "💰", Size: "📏", Design: "🎨", Quality: "🔍", "Not urgent": "⏳",
};

export default function LeadsPage() {
  const [search, setSearch]     = useState("");
  const [filterCat, setFilterCat] = useState<string | null>(null);

  const { data: raw, loading } = useData<Lead[]>("/api/inputs?limit=500");
  const all = raw ?? [];

  // --- Demand summary across ALL inputs ---
  const demandCounts: Record<string, number> = {};
  for (const l of all) {
    for (const t of parseTags(l.lookingFor)) {
      demandCounts[t] = (demandCounts[t] ?? 0) + 1;
    }
  }
  const demandRanked = Object.entries(demandCounts).sort((a, b) => b[1] - a[1]);
  const maxDemand = demandRanked[0]?.[1] ?? 1;

  // --- Why didn't buy summary ---
  const reasonCounts: Record<string, number> = {};
  for (const l of all) {
    for (const t of parseTags(l.nobuReasons)) {
      reasonCounts[t] = (reasonCounts[t] ?? 0) + 1;
    }
  }
  const reasonRanked = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]);

  // --- Contacts: only records with name or phone ---
  const contacts = all.filter(l => l.customerName || l.customerPhone);

  const filtered = contacts.filter(l => {
    const tags = parseTags(l.lookingFor);
    if (filterCat && !tags.includes(filterCat)) return false;
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      l.customerName?.toLowerCase().includes(q) ||
      l.customerPhone?.includes(q) ||
      l.outlet.name.toLowerCase().includes(q) ||
      tags.join(" ").toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900">Customer Demand Report</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {all.length} total inputs · {contacts.length} with contact info
        </p>
      </div>

      {/* === DEMAND SUMMARY === */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
          What Customers Are Looking For
        </h2>
        {loading ? (
          <div className="text-gray-400 text-sm">Loading…</div>
        ) : demandRanked.length === 0 ? (
          <div className="text-gray-400 text-sm">No data yet.</div>
        ) : (
          <div className="space-y-2.5">
            {demandRanked.map(([tag, count]) => (
              <button
                key={tag}
                onClick={() => setFilterCat(filterCat === tag ? null : tag)}
                className={`w-full text-left transition-all rounded-xl p-2 -mx-2 ${
                  filterCat === tag ? "bg-brand-50" : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                    <span>{CATEGORY_EMOJI[tag] ?? "📦"}</span>
                    <span>{tag}</span>
                    {filterCat === tag && (
                      <span className="text-[10px] bg-brand-500 text-white px-1.5 py-0.5 rounded-full">filtered</span>
                    )}
                  </span>
                  <span className="text-sm font-bold text-brand-600">{count} customers</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-full transition-all"
                    style={{ width: `${(count / maxDemand) * 100}%` }}
                  />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* === WHY DIDN'T BUY === */}
      {reasonRanked.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
            Why They Didn&apos;t Buy
          </h2>
          <div className="flex flex-wrap gap-3">
            {reasonRanked.map(([reason, count]) => (
              <div key={reason} className="flex items-center gap-2 bg-red-50 rounded-xl px-4 py-2.5">
                <span className="text-lg">{REASON_EMOJI[reason] ?? "❓"}</span>
                <div>
                  <div className="text-sm font-bold text-red-700">{reason}</div>
                  <div className="text-xs text-red-400">{count}x mentioned</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* === CUSTOMER CONTACTS === */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
            Customer Contacts {filterCat && <span className="text-brand-500 normal-case">· {filterCat}</span>}
          </h2>
          {filterCat && (
            <button onClick={() => setFilterCat(null)} className="text-xs text-gray-400 hover:text-gray-600 underline">
              Clear filter
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Search name, phone, outlet…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-12">Loading…</div>
        ) : contacts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center text-gray-400">
            <User size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No customer contacts yet.</p>
            <p className="text-xs mt-1">Add customer name / phone when submitting an input.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-gray-400 py-8 text-sm">No contacts match.</div>
        ) : (
          <div className="space-y-3">
            {filtered.map(l => {
              const looking = parseTags(l.lookingFor);
              const reasons = parseTags(l.nobuReasons);
              const quote   = l.quote;

              return (
                <div key={l.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User size={16} className="text-brand-600" />
                    </div>
                    <div className="flex-1 min-w-0">

                      {/* Name + phone */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-bold text-gray-900">
                          {l.customerName ?? <span className="text-gray-400 font-normal italic">No name</span>}
                        </span>
                        {l.customerPhone && (
                          <a href={`tel:${l.customerPhone}`}
                            className="flex items-center gap-1 text-sm text-brand-600 font-semibold hover:underline">
                            <Phone size={12} />{l.customerPhone}
                          </a>
                        )}
                      </div>

                      {/* Looking for */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {looking.map(tag => (
                          <span key={tag} className="px-2.5 py-1 bg-brand-50 text-brand-700 text-xs font-semibold rounded-lg">
                            {CATEGORY_EMOJI[tag] ?? ""} {tag}
                          </span>
                        ))}
                        {reasons.map(r => (
                          <span key={r} className="px-2.5 py-1 bg-red-50 text-red-600 text-xs font-medium rounded-lg">
                            {REASON_EMOJI[r] ?? ""} {r}
                          </span>
                        ))}
                      </div>

                      {/* Quote */}
                      {quote && (
                        <p className="mt-2 text-xs text-gray-500 italic flex gap-1">
                          <MessageSquare size={11} className="flex-shrink-0 mt-0.5" />
                          &ldquo;{quote}&rdquo;
                        </p>
                      )}

                      {/* Meta */}
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                        <span className="flex items-center gap-1"><Store size={10} />{l.outlet.name}</span>
                        <span className="flex items-center gap-1"><User size={10} />{l.staffName ?? l.user.name}</span>
                        <span className="flex items-center gap-1"><Calendar size={10} />{fmt(l.createdAt)}</span>
                      </div>
                    </div>

                    {/* Customer photo thumbnail */}
                    {l.imageUrl && (
                      <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-gray-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={l.imageUrl} alt="Customer photo" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
