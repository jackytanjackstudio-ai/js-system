"use client";
import { useState, useEffect } from "react";
import { useData, apiFetch } from "@/hooks/useData";
import { useAuth } from "@/context/AuthContext";
import {
  Phone, User, Store, Calendar, Search, MessageSquare,
  X, ZoomIn, ChevronDown, ChevronUp, Bell,
} from "lucide-react";
import { AccessGuard } from "@/components/AccessGuard";

// ─── Types ────────────────────────────────────────────────────────────────────

type CsForm     = { actionType: string; comment: string; notify: boolean };
type FollowUpForm = { note: string; outcome: string };

type Lead = {
  id: string;
  userId: string;
  staffName: string | null;
  customerName: string | null;
  customerPhone: string | null;
  lookingFor: string;
  nobuReasons: string;
  quote: string | null;
  imageUrl: string | null;
  createdAt: string;
  outlet: { name: string };
  user: { name: string };
  csStatus: string;
  csActionType: string | null;
  csComment: string | null;
  csReviewer: string | null;
  csReviewedAt: string | null;
  staffNotified: boolean;
  staffFollowedUp: boolean;
  followUpNote: string | null;
  csOutcome: string | null;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const CS_STATUS_CFG: Record<string, { label: string; bg: string; text: string }> = {
  pending:        { label: "Pending CS",     bg: "#FEF3C7", text: "#D97706" },
  cs_reviewed:    { label: "CS Reviewed",    bg: "#DBEAFE", text: "#1D4ED8" },
  staff_notified: { label: "Staff Notified", bg: "#EDE9FE", text: "#6D28D9" },
  followed_up:    { label: "Followed Up",    bg: "#D1FAE5", text: "#065F46" },
  converted:      { label: "Converted ✓",   bg: "#D1FAE5", text: "#065F46" },
  no_action:      { label: "No Action",      bg: "#F3F4F6", text: "#6B7280" },
};

const CS_ACTIONS = [
  { value: "stock_available", label: "Stock Available", icon: "✅", color: "#065F46", bg: "#D1FAE5" },
  { value: "similar_product", label: "Similar Product", icon: "🔄", color: "#1D4ED8", bg: "#DBEAFE" },
  { value: "coming_soon",     label: "Coming Soon",     icon: "📦", color: "#D97706", bg: "#FEF3C7" },
  { value: "no_stock",        label: "No Stock",        icon: "❌", color: "#991B1B", bg: "#FEE2E2" },
  { value: "service_issue",   label: "Service Issue",   icon: "⚠️", color: "#92400E", bg: "#FEF3C7" },
  { value: "other",           label: "Other",           icon: "📝", color: "#374151", bg: "#F3F4F6" },
];

const DASH_CATEGORIES = ["Bag", "Wallet", "Belt", "Luggage", "Card Holder", "Accessories"];

const CAT_EMOJI: Record<string, string> = {
  Wallet: "👜", "Card Holder": "🪪", Bag: "🎒", Luggage: "🧳", Accessories: "✨", Gift: "🎁",
};

const REASON_EMOJI: Record<string, string> = {
  Price: "💰", Size: "📏", Design: "🎨", Quality: "🔍", "Not urgent": "⏳",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseTags(raw: string): string[] {
  try { return JSON.parse(raw) as string[]; } catch { return []; }
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-MY", { day: "numeric", month: "short" });
}

function fmtFull(iso: string) {
  return new Date(iso).toLocaleDateString("en-MY", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

function CsStatusBadge({ status }: { status: string }) {
  const cfg = CS_STATUS_CFG[status] ?? CS_STATUS_CFG.pending;
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
      style={{ backgroundColor: cfg.bg, color: cfg.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.text }} />
      {cfg.label}
    </span>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const { user, permission } = useAuth();

  // ── State ──
  const [mainTab, setMainTab]             = useState<"contacts" | "dashboard">("contacts");
  const [csFilter, setCsFilter]           = useState("all");
  const [filterCat, setFilterCat]         = useState<string | null>(null);
  const [dashCatFilter, setDashCatFilter] = useState<string | null>(null);
  const [search, setSearch]               = useState("");
  const [lightbox, setLightbox]           = useState<string | null>(null);
  const [expanded, setExpanded]           = useState<Record<string, boolean>>({});
  const [csFormData, setCsFormData]       = useState<Record<string, CsForm>>({});
  const [followUpData, setFollowUpData]   = useState<Record<string, FollowUpForm>>({});
  const [submitting, setSubmitting]       = useState<string | null>(null);

  const { data: raw, loading, refetch } = useData<Lead[]>("/api/inputs?limit=500");

  const leadsPermission    = permission("leads");
  const canSubmitCsReview  = ["cs_review", "full"].includes(leadsPermission);
  const canSeeCsComments   = !["none", "read"].includes(leadsPermission);
  const showCsDashboard    = ["cs_review", "full"].includes(leadsPermission);
  // isCS = shorthand for "can submit CS reviews" (used throughout render logic)
  const isCS = canSubmitCsReview;
  const all  = raw ?? [];

  // Auto-expand staff_notified leads that belong to this staff member
  useEffect(() => {
    if (!user || isCS || !raw) return;
    const mine = raw.filter(l => l.csStatus === "staff_notified" && l.userId === user.id);
    if (!mine.length) return;
    setExpanded(prev => {
      const next = { ...prev };
      for (const l of mine) {
        if (next[l.id] === undefined) next[l.id] = true;
      }
      return next;
    });
  }, [raw, user, isCS]);

  // ── Form helpers ──
  const getCsForm   = (id: string): CsForm =>
    csFormData[id] ?? { actionType: "", comment: "", notify: false };
  const patchCsForm = (id: string, patch: Partial<CsForm>) =>
    setCsFormData(prev => ({ ...prev, [id]: { ...getCsForm(id), ...patch } }));

  const getFollowUp   = (id: string): FollowUpForm =>
    followUpData[id] ?? { note: "", outcome: "" };
  const patchFollowUp = (id: string, patch: Partial<FollowUpForm>) =>
    setFollowUpData(prev => ({ ...prev, [id]: { ...getFollowUp(id), ...patch } }));

  // ── API calls ──
  async function submitCSReview(leadId: string) {
    const form = getCsForm(leadId);
    if (!form.actionType || !form.comment.trim()) return;
    setSubmitting(leadId);
    try {
      await apiFetch("/api/inputs/cs-review", {
        method: "PATCH",
        body: JSON.stringify({
          leadId,
          csActionType: form.actionType,
          csComment:    form.comment,
          notifyStaff:  form.notify,
        }),
      });
      await refetch();
      setExpanded(prev => ({ ...prev, [leadId]: false }));
    } catch {
      alert("Failed to submit review. Please try again.");
    } finally {
      setSubmitting(null);
    }
  }

  async function submitFollowUp(leadId: string) {
    const form = getFollowUp(leadId);
    if (!form.outcome) return;
    setSubmitting(leadId);
    try {
      await apiFetch("/api/inputs/cs-review", {
        method: "PUT",
        body: JSON.stringify({ leadId, followUpNote: form.note, outcome: form.outcome }),
      });
      await refetch();
    } catch {
      alert("Failed to submit follow-up. Please try again.");
    } finally {
      setSubmitting(null);
    }
  }

  // ── Derived data ──
  const demandCounts: Record<string, number> = {};
  for (const l of all) {
    for (const t of parseTags(l.lookingFor)) {
      demandCounts[t] = (demandCounts[t] ?? 0) + 1;
    }
  }
  const demandRanked = Object.entries(demandCounts).sort((a, b) => b[1] - a[1]);
  const maxDemand    = demandRanked[0]?.[1] ?? 1;

  const reasonCounts: Record<string, number> = {};
  for (const l of all) {
    for (const t of parseTags(l.nobuReasons)) {
      reasonCounts[t] = (reasonCounts[t] ?? 0) + 1;
    }
  }
  const reasonRanked = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]);

  const contacts     = all.filter(l => l.customerName || l.customerPhone);
  const pendingCount = contacts.filter(l => (l.csStatus ?? "pending") === "pending").length;
  const myNotified   = !isCS
    ? contacts.filter(l => l.csStatus === "staff_notified" && l.userId === user?.id)
    : [];

  // CS Status filter
  let csFiltered = contacts;
  if (csFilter !== "all") {
    csFiltered = contacts.filter(l => {
      const s = l.csStatus ?? "pending";
      if (csFilter === "pending")        return s === "pending";
      if (csFilter === "cs_reviewed")    return s === "cs_reviewed";
      if (csFilter === "staff_notified") return s === "staff_notified";
      if (csFilter === "followed_up")    return ["followed_up", "converted", "no_action"].includes(s);
      return true;
    });
  }

  // For staff: sort their notified leads to the top
  if (!isCS && user) {
    csFiltered = [...csFiltered].sort((a, b) => {
      const aUp = a.csStatus === "staff_notified" && a.userId === user.id ? -1 : 0;
      const bUp = b.csStatus === "staff_notified" && b.userId === user.id ? -1 : 0;
      return aUp - bUp;
    });
  }

  const filtered = csFiltered.filter(l => {
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

  // CS Dashboard: pending, oldest first
  const today           = new Date().toDateString();
  const reviewedToday   = contacts.filter(l => l.csReviewedAt && new Date(l.csReviewedAt).toDateString() === today).length;
  const notifiedCount   = contacts.filter(l => l.csStatus === "staff_notified").length;
  const dashLeads       = [...contacts]
    .filter(l => {
      if ((l.csStatus ?? "pending") !== "pending") return false;
      return !dashCatFilter || parseTags(l.lookingFor).includes(dashCatFilter);
    })
    .reverse();

  // ── CS panel content ──
  function renderCSPanelContent(l: Lead, alwaysOpen: boolean) {
    const form        = getCsForm(l.id);
    const fuForm      = getFollowUp(l.id);
    const actionCfg   = CS_ACTIONS.find(a => a.value === l.csActionType);
    const isMyLead    = l.userId === user?.id;
    const canFollowUp = !isCS && isMyLead && l.csStatus === "staff_notified";
    const isBusy      = submitting === l.id;
    const status      = l.csStatus ?? "pending";

    // Already reviewed by CS
    if (status !== "pending") {
      return (
        <div className="space-y-2.5">
          {actionCfg && (
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: actionCfg.bg, color: actionCfg.color }}
              >
                {actionCfg.icon} {actionCfg.label}
              </span>
              <span className="text-xs text-gray-400">
                {l.csReviewer}{l.csReviewedAt && ` · ${fmtFull(l.csReviewedAt)}`}
              </span>
            </div>
          )}
          {l.csComment && (
            <p
              className="text-sm text-gray-700 italic pl-3"
              style={{ borderLeft: `2px solid ${actionCfg?.color ?? "#D97706"}` }}
            >
              &ldquo;{l.csComment}&rdquo;
            </p>
          )}
          {l.staffFollowedUp ? (
            <div className="text-xs text-gray-500 flex items-center gap-1.5 flex-wrap">
              <span className="text-green-600 font-semibold">✓ Followed up</span>
              {l.csOutcome && <span>· {l.csOutcome}</span>}
              {l.followUpNote && <span className="italic">&ldquo;{l.followUpNote}&rdquo;</span>}
            </div>
          ) : canFollowUp && (
            <div className="space-y-2.5 pt-2 border-t border-orange-100">
              <p className="text-xs font-semibold text-gray-600">How did it go?</p>
              <textarea
                className="input text-sm w-full resize-none"
                rows={2}
                placeholder="Optional notes on this follow-up…"
                value={fuForm.note}
                onChange={e => patchFollowUp(l.id, { note: e.target.value })}
              />
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "converted", label: "Customer Bought ✓" },
                  { value: "lost",      label: "Didn't Buy ✗" },
                  { value: "pending",   label: "Still Following Up…" },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => patchFollowUp(l.id, { outcome: opt.value })}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                      fuForm.outcome === opt.value
                        ? "bg-brand-500 text-white border-brand-500"
                        : "bg-white text-gray-600 border-gray-200 hover:border-brand-300"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <button
                disabled={!fuForm.outcome || isBusy}
                onClick={() => submitFollowUp(l.id)}
                className="w-full py-2 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-opacity"
                style={{ backgroundColor: "#C17F24" }}
              >
                {isBusy ? "Saving…" : "Mark as Followed Up"}
              </button>
            </div>
          )}
        </div>
      );
    }

    // Pending — non-CS users see a placeholder (but only if they can see comments at all)
    if (!isCS) {
      if (!canSeeCsComments) return null;
      return <p className="text-xs text-gray-400 italic">Waiting for CS review…</p>;
    }

    // Pending — CS sees the form
    return (
      <div className="space-y-3">
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-2">Action Type</p>
          <div className="grid grid-cols-2 gap-2">
            {CS_ACTIONS.map(type => (
              <button
                key={type.value}
                onClick={() => patchCsForm(l.id, { actionType: type.value })}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all min-h-[44px] text-left"
                style={
                  form.actionType === type.value
                    ? { backgroundColor: type.bg, color: type.color, borderColor: type.color }
                    : { backgroundColor: "white", color: "#6B7280", borderColor: "#E5E7EB" }
                }
              >
                <span>{type.icon}</span>
                <span>{type.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-1">
            Comment <span className="text-red-400">*</span>
          </p>
          <textarea
            className="input text-sm w-full resize-none"
            rows={3}
            placeholder="e.g. Warehouse has Black in M size. Can arrange pickup at Mayang Mall. Please contact customer to confirm."
            value={form.comment}
            onChange={e => patchCsForm(l.id, { comment: e.target.value })}
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.notify}
            onChange={e => patchCsForm(l.id, { notify: e.target.checked })}
            className="w-4 h-4 rounded"
          />
          <span className="text-xs text-gray-600">Notify staff immediately</span>
        </label>
        <button
          disabled={!form.actionType || !form.comment.trim() || isBusy}
          onClick={() => submitCSReview(l.id)}
          className="w-full py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-opacity"
          style={{ backgroundColor: "#C17F24" }}
        >
          {isBusy ? "Submitting…" : "Submit CS Review"}
        </button>
      </div>
    );
  }

  // ── Lead card ──
  function renderLeadCard(l: Lead, dashMode = false) {
    const looking       = parseTags(l.lookingFor);
    const reasons       = parseTags(l.nobuReasons);
    const status        = l.csStatus ?? "pending";
    const isNotifiedMe  = !isCS && l.userId === user?.id && status === "staff_notified";
    const isOpen        = dashMode || !!expanded[l.id];

    return (
      <div
        key={l.id}
        className="bg-white rounded-2xl shadow-sm p-4"
        style={
          isNotifiedMe
            ? { border: "2px solid #C17F24", boxShadow: "0 0 0 3px rgba(193,127,36,0.12)" }
            : { border: "1px solid #F3F4F6" }
        }
      >
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <User size={16} className="text-brand-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
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
              <CsStatusBadge status={status} />
            </div>

            <div className="flex flex-wrap gap-1.5 mt-2">
              {looking.map(tag => (
                <span key={tag} className="px-2.5 py-1 bg-brand-50 text-brand-700 text-xs font-semibold rounded-lg">
                  {CAT_EMOJI[tag] ?? ""} {tag}
                </span>
              ))}
              {reasons.map(r => (
                <span key={r} className="px-2.5 py-1 bg-red-50 text-red-600 text-xs font-medium rounded-lg">
                  {REASON_EMOJI[r] ?? ""} {r}
                </span>
              ))}
            </div>

            {l.quote && (
              <p className="mt-2 text-xs text-gray-500 italic flex gap-1">
                <MessageSquare size={11} className="flex-shrink-0 mt-0.5" />
                &ldquo;{l.quote}&rdquo;
              </p>
            )}

            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
              <span className="flex items-center gap-1"><Store size={10} />{l.outlet.name}</span>
              <span className="flex items-center gap-1"><User size={10} />{l.staffName ?? l.user.name}</span>
              <span className="flex items-center gap-1"><Calendar size={10} />{fmt(l.createdAt)}</span>
            </div>
          </div>

          {l.imageUrl && (
            <button
              onClick={() => setLightbox(l.imageUrl!)}
              className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-gray-200 relative group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={l.imageUrl} alt="Customer photo" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                <ZoomIn size={18} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          )}
        </div>

        {/* CS Panel */}
        {dashMode ? (
          <div className="mt-3 rounded-xl p-3.5" style={{ backgroundColor: "#FDF8F0", border: "1px solid #F0EDE8" }}>
            {renderCSPanelContent(l, true)}
          </div>
        ) : (
          <div className="mt-3 border-t border-gray-100 pt-2.5">
            <button
              className="w-full flex items-center justify-between text-xs text-gray-400 hover:text-gray-600 transition-colors"
              onClick={() => setExpanded(prev => ({ ...prev, [l.id]: !prev[l.id] }))}
            >
              <span className="font-medium">CS Review</span>
              {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {isOpen && (
              <div className="mt-3 rounded-xl p-3.5" style={{ backgroundColor: "#FDF8F0", border: "1px solid #F0EDE8" }}>
                {renderCSPanelContent(l, false)}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── Render ──
  return (
    <AccessGuard module="leads">
    <div className="p-6 max-w-4xl mx-auto space-y-6">

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 text-white bg-white/20 hover:bg-white/30 rounded-full p-2"
            onClick={() => setLightbox(null)}
          >
            <X size={20} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt="Customer photo"
            className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl object-contain"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900">Customer Demand Report</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {all.length} total inputs · {contacts.length} with contact info
        </p>
      </div>

      {/* Staff notification banner */}
      {myNotified.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <Bell size={18} className="text-amber-600 flex-shrink-0" />
          <p className="text-sm font-semibold text-amber-800">
            You have {myNotified.length} new CS update{myNotified.length > 1 ? "s" : ""} on your leads — check the cards below
          </p>
        </div>
      )}

      {/* Main tabs */}
      <div className="flex gap-1 border-b border-gray-100">
        {[
          { key: "contacts" as const, label: "👥 Customer Contacts" },
          ...(showCsDashboard ? [{ key: "dashboard" as const, label: "🎯 CS Dashboard" }] : []),
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setMainTab(tab.key)}
            className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              mainTab === tab.key
                ? "border-brand-500 text-brand-600"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {tab.label}
            {tab.key === "dashboard" && pendingCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══════════ CUSTOMER CONTACTS TAB ══════════ */}
      {mainTab === "contacts" && (
        <div className="space-y-6">

          {/* CS Status filter row */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mb-2">
            {[
              { key: "all",            label: "All" },
              { key: "pending",        label: "Pending CS", count: pendingCount },
              { key: "cs_reviewed",    label: "CS Reviewed" },
              { key: "staff_notified", label: "Staff Notified" },
              { key: "followed_up",    label: "Followed Up" },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setCsFilter(tab.key)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  csFilter === tab.key
                    ? "bg-brand-500 text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    csFilter === tab.key ? "bg-white/30 text-white" : "bg-red-500 text-white"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Demand Summary */}
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
                        <span>{CAT_EMOJI[tag] ?? "📦"}</span>
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

          {/* Why didn't buy */}
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

          {/* Customer Contacts list */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                Customer Contacts
                {filterCat && <span className="text-brand-500 normal-case"> · {filterCat}</span>}
              </h2>
              {filterCat && (
                <button onClick={() => setFilterCat(null)} className="text-xs text-gray-400 hover:text-gray-600 underline">
                  Clear filter
                </button>
              )}
            </div>

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
                {filtered.map(l => renderLeadCard(l))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════ CS DASHBOARD TAB ══════════ */}
      {mainTab === "dashboard" && isCS && (
        <div className="space-y-5">

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Pending Review", value: pendingCount,   color: "#D97706" },
              { label: "Reviewed Today", value: reviewedToday,  color: "#1D4ED8" },
              { label: "Staff Notified", value: notifiedCount,  color: "#6D28D9" },
            ].map(stat => (
              <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                <div className="text-2xl font-black" style={{ color: stat.color }}>{stat.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Category filter */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setDashCatFilter(null)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                !dashCatFilter ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              All Pending
            </button>
            {DASH_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setDashCatFilter(dashCatFilter === cat ? null : cat)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  dashCatFilter === cat ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {CAT_EMOJI[cat] ?? ""} {cat}
              </button>
            ))}
          </div>

          {/* Pending leads */}
          {loading ? (
            <div className="text-center text-gray-400 py-12">Loading…</div>
          ) : dashLeads.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center text-gray-400">
              <p className="text-sm font-semibold">All caught up!</p>
              <p className="text-xs mt-1">No leads pending CS review.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dashLeads.map(l => renderLeadCard(l, true))}
            </div>
          )}
        </div>
      )}
    </div>
    </AccessGuard>
  );
}
