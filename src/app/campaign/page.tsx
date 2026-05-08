"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useData, apiFetch } from "@/hooks/useData";
import { useAuth } from "@/context/AuthContext";
import { Calendar, ChevronLeft, ChevronRight, Plus, X, Loader2, Store, Search } from "lucide-react";
import { cn } from "@/lib/utils";

type CampaignOutlet = { id: string; outletId: string; outletName: string };

type Campaign = {
  id: string; name: string; type: string;
  startDate: string; endDate: string; status: string;
  scopeType: string; scopeRegions: string; owner: string;
  campaignOutlets: CampaignOutlet[];
  _count?: { tasks: number; submissions: number };
};

type Outlet = { id: string; name: string; city: string; region: string | null; isActive: boolean };

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
const REGIONS  = ["Klang Valley", "Johor", "Penang", "Sabah", "Sarawak", "Perak", "Kedah", "Melaka", "Pahang", "Negeri Sembilan", "Others"];
const OWNERS   = [
  { value: "hq",              label: "HQ"              },
  { value: "outlet_manager",  label: "Outlet Manager"  },
  { value: "marketing",       label: "Marketing Team"  },
];

const PRESET_TASKS: Record<string, { taskName: string; category: string }[]> = {
  sales: [
    { taskName: "Setup promo display",           category: "vm"      },
    { taskName: "Print & place campaign poster", category: "vm"      },
    { taskName: "Staff campaign briefing",       category: "staff"   },
    { taskName: "Sales script training",         category: "staff"   },
    { taskName: "TikTok campaign video",         category: "content" },
  ],
  branding: [
    { taskName: "Brand display setup",           category: "vm"      },
    { taskName: "Window display update",         category: "vm"      },
    { taskName: "Staff brand guidelines briefing", category: "staff" },
    { taskName: "IG brand post",                 category: "content" },
    { taskName: "TikTok branding video",         category: "content" },
  ],
  product_launch: [
    { taskName: "New product display setup",     category: "vm"      },
    { taskName: "Demo station setup",            category: "vm"      },
    { taskName: "Product knowledge training",    category: "staff"   },
    { taskName: "Launch day briefing",           category: "staff"   },
    { taskName: "Launch TikTok video",           category: "content" },
    { taskName: "IG product launch post",        category: "content" },
  ],
  vm_update: [
    { taskName: "Remove old VM materials",       category: "vm"      },
    { taskName: "Install new VM setup",          category: "vm"      },
    { taskName: "Submit VM photos to HQ",        category: "vm"      },
    { taskName: "VM compliance check",           category: "vm"      },
  ],
};

// ─── Scope badge helper ───────────────────────────────────────────────────────

function ScopeBadge({ campaign }: { campaign: Campaign }) {
  const { scopeType, campaignOutlets, scopeRegions } = campaign;
  if (scopeType === "all") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500 text-white">
        ALL
      </span>
    );
  }
  if (scopeType === "selected") {
    const n = campaignOutlets.length;
    if (n === 1) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-500 text-white">
          LOCAL
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500 text-white">
        {n} STORES
      </span>
    );
  }
  if (scopeType === "region") {
    const regions: string[] = (() => { try { return JSON.parse(scopeRegions); } catch { return []; } })();
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-500 text-white">
        {regions.length === 1 ? regions[0] : `${regions.length} REGIONS`}
      </span>
    );
  }
  return null;
}

// ─── Calendar helpers ─────────────────────────────────────────────────────────

function getCalendarWeeks(year: number, month: number): (Date | null)[][] {
  const first = new Date(year, month, 1);
  const last  = new Date(year, month + 1, 0);
  const days: (Date | null)[] = [];
  for (let i = 0; i < first.getDay(); i++) days.push(null);
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
  while (days.length % 7 !== 0) days.push(null);
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

type ActiveStrategy = { id: string; quarter: string; theme: string; campaignType: string; startDate: string };

export default function CampaignCalendar() {
  const router   = useRouter();
  const { user } = useAuth();
  const { data: campaigns, loading, refetch } = useData<Campaign[]>("/api/campaigns");
  const { data: outlets } = useData<Outlet[]>("/api/outlets");
  const { data: strategies } = useData<ActiveStrategy[]>("/api/seasonal-strategy");
  const activeStrategy = (strategies ?? []).find(s => (s as any).isActive && (s as any).campaignType);

  const today = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [showNew,       setShowNew]       = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [formError,     setFormError]     = useState("");
  const [outletSearch,  setOutletSearch]  = useState("");
  const [form, setForm] = useState({
    name: "", type: "sales", startDate: "", endDate: "",
    channels: [] as string[], revenueTarget: "", unitsTarget: "",
    scopeType: "all" as "all" | "selected" | "region",
    scopeOutlets: [] as string[],
    scopeRegions: [] as string[],
    owner: "hq",
  });

  const weeks       = useMemo(() => getCalendarWeeks(year, month), [year, month]);
  const list        = campaigns ?? [];
  const canCreate   = ["admin", "manager", "product"].includes(user?.role ?? "");
  const activeOutlets = (outlets ?? []).filter(o => o.isActive);
  const filteredOutlets = activeOutlets.filter(o =>
    !outletSearch ||
    o.name.toLowerCase().includes(outletSearch.toLowerCase()) ||
    (o.city ?? "").toLowerCase().includes(outletSearch.toLowerCase())
  );

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  function resetForm() {
    setForm({ name: "", type: "sales", startDate: "", endDate: "", channels: [], revenueTarget: "", unitsTarget: "", scopeType: "all", scopeOutlets: [], scopeRegions: [], owner: "hq" });
    setOutletSearch("");
    setFormError("");
  }

  async function createCampaign() {
    setFormError("");
    if (!form.name || !form.startDate || !form.endDate) { setFormError("Please fill in name, start date and end date."); return; }
    if (form.endDate < form.startDate) { setFormError("End date cannot be before start date."); return; }
    if (form.scopeType === "selected" && form.scopeOutlets.length === 0) { setFormError("Please select at least one outlet."); return; }
    if (form.scopeType === "region"   && form.scopeRegions.length === 0) { setFormError("Please select at least one region."); return; }
    setSaving(true);
    try {
      const res = await apiFetch("/api/campaigns", {
        method: "POST",
        body: JSON.stringify({
          name: form.name, type: form.type, startDate: form.startDate, endDate: form.endDate,
          channels: form.channels,
          objective: { revenue: form.revenueTarget ? Number(form.revenueTarget) : 0, units: form.unitsTarget ? Number(form.unitsTarget) : 0 },
          scopeType:    form.scopeType,
          scopeOutlets: form.scopeOutlets,
          scopeRegions: form.scopeRegions,
          owner:        form.owner,
        }),
      });
      const presets = PRESET_TASKS[form.type] ?? [];
      await Promise.all(presets.map(t =>
        apiFetch(`/api/campaigns/${res.id}/tasks`, {
          method: "POST",
          body: JSON.stringify({ taskName: t.taskName, category: t.category, assignedTo: null, deadline: null }),
        })
      ));
      setShowNew(false); resetForm(); refetch();
      router.push(`/campaign/${res.id}`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create campaign.");
    } finally { setSaving(false); }
  }

  function toggleChannel(ch: string) {
    setForm(f => ({ ...f, channels: f.channels.includes(ch) ? f.channels.filter(c => c !== ch) : [...f.channels, ch] }));
  }
  function toggleScopeOutlet(id: string) {
    setForm(f => ({ ...f, scopeOutlets: f.scopeOutlets.includes(id) ? f.scopeOutlets.filter(o => o !== id) : [...f.scopeOutlets, id] }));
  }
  function toggleScopeRegion(r: string) {
    setForm(f => ({ ...f, scopeRegions: f.scopeRegions.includes(r) ? f.scopeRegions.filter(x => x !== r) : [...f.scopeRegions, r] }));
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

      {/* Active Strategy Banner */}
      {activeStrategy?.campaignType && (
        <div className="flex items-center gap-3 bg-brand-50 border border-brand-200 rounded-xl px-4 py-2.5 text-sm">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0" />
          <span className="text-brand-700 font-semibold">{activeStrategy.quarter} · {activeStrategy.theme}</span>
          <span className="text-gray-400">·</span>
          <span className="text-xs font-bold uppercase tracking-wide text-brand-600">{activeStrategy.campaignType}</span>
          {activeStrategy.startDate && (
            <span className="text-xs text-gray-500 ml-1">from {activeStrategy.startDate}</span>
          )}
          {canCreate && (
            <button
              onClick={() => {
                setForm(f => ({
                  ...f,
                  name: activeStrategy.theme,
                  type: activeStrategy.campaignType.toLowerCase().replace(/\s+/g, "_"),
                  startDate: activeStrategy.startDate ?? "",
                }));
                setShowNew(true);
              }}
              className="ml-auto text-xs font-semibold text-brand-600 hover:text-brand-800 underline underline-offset-2"
            >
              + Create Campaign from Strategy
            </button>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        {Object.entries(TYPE_CFG).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className={cn("w-3 h-3 rounded-sm", v.dot)} />
            {v.label}
          </div>
        ))}
        <div className="flex items-center gap-2 ml-4 border-l border-gray-100 pl-4">
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500 text-white">ALL</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500 text-white">N STORES</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-500 text-white">LOCAL</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-500 text-white">REGION</span>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><ChevronLeft size={18} /></button>
          <h2 className="text-base font-bold text-gray-900">{MONTHS[month]} {year}</h2>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><ChevronRight size={18} /></button>
        </div>

        <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
          {DAYS.map(d => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400">{d}</div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400"><Loader2 size={24} className="animate-spin" /></div>
        ) : (
          <div>
            {weeks.map((week, wi) => {
              const weekCampaigns = list
                .map(c => ({ campaign: c, span: getCampaignSpanInWeek(c, week) }))
                .filter(x => x.span !== null) as { campaign: Campaign; span: NonNullable<ReturnType<typeof getCampaignSpanInWeek>> }[];

              return (
                <div key={wi} className="border-b border-gray-50 last:border-0">
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
                              "text-left text-[10px] font-semibold px-2 py-0.5 truncate transition-opacity hover:opacity-80 flex items-center gap-1",
                              cfg.bar,
                              span.isStart ? "rounded-l-full pl-2" : "pl-1",
                              span.isEnd   ? "rounded-r-full pr-2" : "pr-0",
                            )}>
                            {span.isStart && (
                              <>
                                <ScopeBadge campaign={campaign} />
                                <span className="truncate">{campaign.name}</span>
                              </>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

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
              const cfg  = TYPE_CFG[c.type]    ?? TYPE_CFG.sales;
              const sCfg = STATUS_CFG[c.status] ?? STATUS_CFG.upcoming;
              const scopeLabel = (() => {
                if (c.scopeType === "all") return "All Stores";
                if (c.scopeType === "selected") {
                  const n = c.campaignOutlets.length;
                  if (n === 1) return c.campaignOutlets[0]?.outletName ?? "1 Outlet";
                  return `${n} Outlets`;
                }
                if (c.scopeType === "region") {
                  const r: string[] = (() => { try { return JSON.parse(c.scopeRegions); } catch { return []; } })();
                  return r.length === 1 ? r[0] : `${r.length} Regions`;
                }
                return "";
              })();
              return (
                <button key={c.id} onClick={() => router.push(`/campaign/${c.id}`)}
                  className="w-full flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-4 py-3 hover:border-brand-200 hover:shadow-sm transition-all text-left">
                  <span className={cn("w-3 h-3 rounded-sm shrink-0", cfg.dot)} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">{c.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{c.startDate} → {c.endDate}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="flex items-center gap-1 text-[11px] text-gray-500">
                      <Store size={11} /> {scopeLabel}
                    </span>
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">New Campaign</h2>
              <button onClick={() => { setShowNew(false); resetForm(); }} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="px-6 py-5 space-y-5">

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Campaign Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Sunway Anniversary Sale"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
              </div>

              {/* Type + Owner */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400">
                    {Object.entries(TYPE_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Owner</label>
                  <select value={form.owner} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400">
                    {OWNERS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Dates */}
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

              {/* Campaign Scope */}
              <div className="border border-gray-100 rounded-xl p-4 space-y-3 bg-gray-50/50">
                <div className="text-xs font-bold text-gray-700 uppercase tracking-wide">Campaign Scope *</div>
                <div className="space-y-2">
                  {([
                    { value: "all",      label: "All Outlets",       desc: "Every store participates"               },
                    { value: "selected", label: "Selected Outlets",   desc: "Pick specific stores"                  },
                    { value: "region",   label: "Region",             desc: "All stores in selected region(s)"      },
                  ] as const).map(opt => (
                    <label key={opt.value} className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                      form.scopeType === opt.value ? "border-brand-400 bg-brand-50" : "border-gray-200 bg-white hover:border-gray-300"
                    )}>
                      <input type="radio" name="scopeType" value={opt.value}
                        checked={form.scopeType === opt.value}
                        onChange={() => setForm(f => ({ ...f, scopeType: opt.value, scopeOutlets: [], scopeRegions: [] }))}
                        className="mt-0.5 accent-brand-500" />
                      <div>
                        <div className="text-sm font-semibold text-gray-800">{opt.label}</div>
                        <div className="text-[11px] text-gray-400">{opt.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Selected Outlets picker */}
                {form.scopeType === "selected" && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input value={outletSearch} onChange={e => setOutletSearch(e.target.value)}
                          placeholder="Search outlets..."
                          className="w-full pl-7 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-400" />
                      </div>
                      <button onClick={() => setForm(f => ({ ...f, scopeOutlets: activeOutlets.map(o => o.id) }))}
                        className="text-[11px] font-semibold text-brand-600 hover:text-brand-800 whitespace-nowrap">
                        Select All
                      </button>
                      <button onClick={() => setForm(f => ({ ...f, scopeOutlets: [] }))}
                        className="text-[11px] font-semibold text-gray-500 hover:text-gray-700 whitespace-nowrap">
                        Clear
                      </button>
                    </div>
                    <div className="max-h-44 overflow-y-auto space-y-1 pr-1">
                      {filteredOutlets.length === 0 && (
                        <p className="text-xs text-gray-400 py-2 text-center">No outlets found</p>
                      )}
                      {filteredOutlets.map(o => (
                        <label key={o.id} className={cn(
                          "flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-all text-sm",
                          form.scopeOutlets.includes(o.id) ? "border-brand-300 bg-brand-50" : "border-gray-100 bg-white hover:border-gray-200"
                        )}>
                          <input type="checkbox" checked={form.scopeOutlets.includes(o.id)}
                            onChange={() => toggleScopeOutlet(o.id)}
                            className="accent-brand-500 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-gray-800">{o.name}</span>
                            {o.city && <span className="text-gray-400 ml-1.5 text-xs">{o.city}</span>}
                          </div>
                          {o.region && <span className="text-[10px] text-gray-400 shrink-0">{o.region}</span>}
                        </label>
                      ))}
                    </div>
                    <p className="text-[11px] text-gray-400">
                      {form.scopeOutlets.length === 0 ? "No outlets selected" : `${form.scopeOutlets.length} outlet${form.scopeOutlets.length > 1 ? "s" : ""} selected`}
                    </p>
                  </div>
                )}

                {/* Region picker */}
                {form.scopeType === "region" && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {REGIONS.map(r => (
                      <button key={r} onClick={() => toggleScopeRegion(r)}
                        className={cn("text-xs px-3 py-1.5 rounded-full border font-medium transition-all",
                          form.scopeRegions.includes(r) ? "bg-violet-500 text-white border-violet-500" : "bg-white text-gray-500 border-gray-200 hover:border-violet-300")}>
                        {r}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Channels */}
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

              {/* Targets */}
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
              <button onClick={() => { setShowNew(false); resetForm(); }}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={createCampaign}
                disabled={saving || !form.name || !form.startDate || !form.endDate || (form.endDate && form.endDate < form.startDate) as boolean}
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
