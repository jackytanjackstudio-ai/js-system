"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useData, apiFetch } from "@/hooks/useData";
import { useAuth } from "@/context/AuthContext";
import { Calendar, ChevronLeft, ChevronRight, Plus, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Campaign = {
  id: string; name: string; type: string;
  startDate: string; endDate: string; status: string;
  _count?: { tasks: number; submissions: number };
};

const TYPE_CFG = {
  sales:          { label: "Sales",          dot: "bg-red-500",    bar: "bg-red-500 text-white",         pill: "bg-red-100 text-red-700 border border-red-200"          },
  branding:       { label: "Branding",       dot: "bg-blue-500",   bar: "bg-blue-500 text-white",        pill: "bg-blue-100 text-blue-700 border border-blue-200"       },
  product_launch: { label: "Product Launch", dot: "bg-green-500",  bar: "bg-green-500 text-white",       pill: "bg-green-100 text-green-700 border border-green-200"    },
  vm_update:      { label: "VM Update",      dot: "bg-purple-500", bar: "bg-purple-500 text-white",      pill: "bg-purple-100 text-purple-700 border border-purple-200" },
} as Record<string, { label: string; dot: string; bar: string; pill: string }>;

const STATUS_CFG = {
  upcoming:  "bg-amber-100 text-amber-700",
  active:    "bg-green-100 text-green-700",
  completed: "bg-gray-100 text-gray-500",
} as Record<string, string>;

const DAYS   = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const CHANNELS = ["Offline", "TikTok", "Shopee", "Instagram", "WhatsApp"];

// ─── Calendar helpers ─────────────────────────────────────────────────────────

function getCalendarWeeks(year: number, month: number): (Date | null)[][] {
  const first = new Date(year, month, 1);
  const last  = new Date(year, month + 1, 0);
  const days: (Date | null)[] = [];
  for (let i = 0; i < first.getDay(); i++) days.push(null);
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
  while (days.length % 7 !== 0) days.push(null);
  // Split into weeks
  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  return weeks;
}

function getCampaignSpanInWeek(
  campaign: Campaign,
  week: (Date | null)[]
): { colStart: number; colEnd: number; isStart: boolean; isEnd: boolean } | null {
  const campStart = new Date(campaign.startDate + "T00:00:00");
  const campEnd   = new Date(campaign.endDate   + "T00:00:00");

  const validDates = week.filter(Boolean) as Date[];
  if (!validDates.length) return null;

  const weekFirst = validDates[0];
  const weekLast  = validDates[validDates.length - 1];

  if (campEnd < weekFirst || campStart > weekLast) return null;

  const effStart = campStart >= weekFirst ? campStart : weekFirst;
  const effEnd   = campEnd   <= weekLast  ? campEnd   : weekLast;

  let colStart = week.findIndex(d => d && d.getTime() === effStart.getTime()) + 1;
  if (colStart < 1) colStart = week.findIndex(d => d !== null) + 1;

  let colEnd = 1;
  for (let i = week.length - 1; i >= 0; i--) {
    const d = week[i];
    if (d && d.getTime() <= effEnd.getTime()) { colEnd = i + 2; break; }
  }

  return {
    colStart,
    colEnd: Math.min(colEnd, 8),
    isStart: campStart >= weekFirst,
    isEnd:   campEnd   <= weekLast,
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CampaignCalendar() {
  const router   = useRouter();
  const { user } = useAuth();
  const { data: campaigns, loading, refetch } = useData<Campaign[]>("/api/campaigns");

  const today = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [showNew,   setShowNew]   = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    name: "", type: "sales", startDate: "", endDate: "",
    channels: [] as string[], revenueTarget: "", unitsTarget: "",
  });

  const weeks = useMemo(() => getCalendarWeeks(year, month), [year, month]);
  const list  = campaigns ?? [];

  const canCreate = ["admin", "manager", "product"].includes(user?.role ?? "");

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  async function createCampaign() {
    setFormError("");
    if (!form.name || !form.startDate || !form.endDate) { setFormError("Please fill in name, start date and end date."); return; }
    if (form.endDate < form.startDate) { setFormError("End date cannot be before start date."); return; }
    setSaving(true);
    try {
      const res = await apiFetch("/api/campaigns", {
        method: "POST",
        body: JSON.stringify({
          name: form.name, type: form.type, startDate: form.startDate, endDate: form.endDate,
          channels: form.channels,
          objective: { revenue: form.revenueTarget ? Number(form.revenueTarget) : 0, units: form.unitsTarget ? Number(form.unitsTarget) : 0 },
        }),
      });
      setShowNew(false); setFormError("");
      setForm({ name: "", type: "sales", startDate: "", endDate: "", channels: [], revenueTarget: "", unitsTarget: "" });
      refetch();
      router.push(`/campaign/${res.id}`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create campaign.");
    } finally { setSaving(false); }
  }

  function toggleChannel(ch: string) {
    setForm(f => ({ ...f, channels: f.channels.includes(ch) ? f.channels.filter(c => c !== ch) : [...f.channels, ch] }));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Calendar size={22} className="text-brand-500" /> Campaign Calendar
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">All campaigns driven from here</p>
        </div>
        {canCreate && (
          <button onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            <Plus size={16} /> New Campaign
          </button>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        {Object.entries(TYPE_CFG).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className={cn("w-3 h-3 rounded-sm", v.dot)} />
            {v.label}
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Month nav */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><ChevronLeft size={18} /></button>
          <h2 className="text-base font-bold text-gray-900">{MONTHS[month]} {year}</h2>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><ChevronRight size={18} /></button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
          {DAYS.map(d => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400">{d}</div>
          ))}
        </div>

        {/* Weeks */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400"><Loader2 size={24} className="animate-spin" /></div>
        ) : (
          <div>
            {weeks.map((week, wi) => {
              // Find campaigns active in this week, with their span info
              const weekCampaigns = list
                .map(c => ({ campaign: c, span: getCampaignSpanInWeek(c, week) }))
                .filter(x => x.span !== null) as { campaign: Campaign; span: NonNullable<ReturnType<typeof getCampaignSpanInWeek>> }[];

              return (
                <div key={wi} className="border-b border-gray-50 last:border-0">
                  {/* Campaign bars row */}
                  {weekCampaigns.length > 0 && (
                    <div className="grid grid-cols-7 px-0.5 pt-1.5 gap-y-0.5">
                      {weekCampaigns.map(({ campaign, span }) => {
                        const cfg = TYPE_CFG[campaign.type] ?? TYPE_CFG.sales;
                        return (
                          <button
                            key={campaign.id}
                            onClick={() => router.push(`/campaign/${campaign.id}`)}
                            title={campaign.name}
                            style={{ gridColumn: `${span.colStart} / ${span.colEnd}` }}
                            className={cn(
                              "text-left text-[10px] font-semibold px-2 py-0.5 truncate transition-opacity hover:opacity-80",
                              cfg.bar,
                              span.isStart ? "rounded-l-full pl-2" : "pl-1",
                              span.isEnd   ? "rounded-r-full pr-2" : "pr-0",
                            )}>
                            {span.isStart ? campaign.name : ""}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Day cells */}
                  <div className="grid grid-cols-7">
                    {week.map((date, di) => {
                      const isToday = date
                        ? date.getFullYear() === today.getFullYear() &&
                          date.getMonth()    === today.getMonth()    &&
                          date.getDate()     === today.getDate()
                        : false;
                      return (
                        <div key={di} className={cn(
                          "min-h-[56px] p-2",
                          !date && "bg-gray-50/40",
                          di < 6 && "border-r border-gray-50",
                        )}>
                          {date && (
                            <div className={cn(
                              "w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold",
                              isToday ? "bg-brand-500 text-white" : "text-gray-600",
                            )}>
                              {date.getDate()}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Campaign list */}
      {list.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">All Campaigns</h3>
          <div className="space-y-2">
            {list.map(c => {
              const cfg  = TYPE_CFG[c.type]   ?? TYPE_CFG.sales;
              const sCfg = STATUS_CFG[c.status] ?? STATUS_CFG.upcoming;
              return (
                <button key={c.id} onClick={() => router.push(`/campaign/${c.id}`)}
                  className="w-full flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-4 py-3 hover:border-brand-200 hover:shadow-sm transition-all text-left">
                  <span className={cn("w-3 h-3 rounded-sm shrink-0", cfg.dot)} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">{c.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{c.startDate} → {c.endDate}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full", sCfg)}>
                      {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                    </span>
                    <span className="text-xs text-gray-400">{cfg.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Create Campaign Modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">New Campaign</h2>
              <button onClick={() => { setShowNew(false); setFormError(""); }} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Campaign Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Mother's Day Promotion"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400">
                  {Object.entries(TYPE_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Start Date *</label>
                  <input type="date" value={form.startDate}
                    onChange={e => setForm(f => ({ ...f, startDate: e.target.value, endDate: f.endDate < e.target.value ? "" : f.endDate }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">End Date *</label>
                  <input type="date" value={form.endDate} min={form.startDate}
                    onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                    className={cn("w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400",
                      form.endDate && form.endDate < form.startDate ? "border-red-300 bg-red-50" : "border-gray-200")} />
                </div>
              </div>
              {form.endDate && form.endDate < form.startDate && (
                <p className="text-xs text-red-600 -mt-2">End date must be after start date</p>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Channels</label>
                <div className="flex flex-wrap gap-2">
                  {CHANNELS.map(ch => (
                    <button key={ch} onClick={() => toggleChannel(ch)}
                      className={cn("text-xs px-3 py-1.5 rounded-full border font-medium transition-all",
                        form.channels.includes(ch) ? "bg-brand-500 text-white border-brand-500" : "bg-white text-gray-500 border-gray-200 hover:border-brand-300")}>
                      {ch}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Revenue Target (RM)</label>
                  <input type="number" value={form.revenueTarget} onChange={e => setForm(f => ({ ...f, revenueTarget: e.target.value }))} placeholder="0"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Units Target</label>
                  <input type="number" value={form.unitsTarget} onChange={e => setForm(f => ({ ...f, unitsTarget: e.target.value }))} placeholder="0"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
                </div>
              </div>
            </div>
            {formError && (
              <div className="mx-6 mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">{formError}</div>
            )}
            <div className="px-6 pb-5 flex gap-3">
              <button onClick={() => { setShowNew(false); setFormError(""); }}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={createCampaign}
                disabled={saving || !form.name || !form.startDate || !form.endDate || form.endDate < form.startDate}
                className="flex-1 py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />} Create Campaign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
