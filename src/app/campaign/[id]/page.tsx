"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useData, apiFetch } from "@/hooks/useData";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft, Target, Megaphone, FileText, MessageSquare,
  ImageIcon, CheckSquare, BarChart2, Plus, X, Check,
  Loader2, Upload, Trash2, Star, Store, Search, ZoomIn
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Cloudinary direct upload (bypasses Vercel — no env vars needed) ──────────
async function resizeToBlob(file: File): Promise<Blob> {
  return new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 1200;
      const scale = Math.min(MAX / img.width, MAX / img.height, 1);
      const canvas = document.createElement("canvas");
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob(blob => resolve(blob!), "image/jpeg", 0.82);
    };
    img.src = url;
  });
}

async function uploadToCloudinary(file: File): Promise<string> {
  const blob = await resizeToBlob(file);
  const fd = new FormData();
  fd.append("file", blob, "photo.jpg");
  fd.append("upload_preset", "jackstudio_upload");
  fd.append("folder", "jackstudio/vm");
  const res = await fetch("https://api.cloudinary.com/v1_1/ds0ka66z1/image/upload", {
    method: "POST",
    body: fd,
  });
  if (!res.ok) throw new Error("Upload failed — check internet connection");
  const data = await res.json();
  if (!data.secure_url) throw new Error(data.error?.message ?? "Upload failed");
  return data.secure_url as string;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type CampaignOutlet = { id: string; outletId: string; outletName: string };

type Campaign = {
  id: string; name: string; type: string; startDate: string; endDate: string;
  channels: string; objective: string; mechanics: string; mechanicsPhotos: string;
  contentPlan: string; salesScript: string | null; status: string;
  scopeType: string; scopeRegions: string; owner: string;
  vmGuide: VMGuide | null;
  tasks: CampaignTask[];
  submissions: VMSubmission[];
  campaignOutlets: CampaignOutlet[];
};
type VMGuide     = { id: string; campaignId: string; images: string; checklist: string };
type CampaignTask = { id: string; taskName: string; category: string; assignedTo: string | null; deadline: string | null; status: string };
type VMSubmission = { id: string; outletId: string; outletName: string; imageUrls: string; status: string; displayScore: number | null; complianceScore: number | null; cleanlinessScore: number | null; notes: string | null; submittedAt: string | null };
type VMImage     = { url: string; type: "correct" | "wrong"; label: string };
type ChecklistItem = { id: string; label: string; required: boolean };

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CFG = {
  sales:          { label: "Sales",          dot: "bg-red-500",    badge: "bg-red-100 text-red-700"       },
  branding:       { label: "Branding",       dot: "bg-blue-500",   badge: "bg-blue-100 text-blue-700"    },
  product_launch: { label: "Product Launch", dot: "bg-green-500",  badge: "bg-green-100 text-green-700"  },
  vm_update:      { label: "VM Update",      dot: "bg-purple-500", badge: "bg-purple-100 text-purple-700" },
} as Record<string, { label: string; dot: string; badge: string }>;

const STATUS_CFG = {
  upcoming:  { label: "Upcoming",  cls: "bg-amber-100 text-amber-700" },
  active:    { label: "Active",    cls: "bg-green-100 text-green-700" },
  completed: { label: "Completed", cls: "bg-gray-100 text-gray-500"  },
} as Record<string, { label: string; cls: string }>;

const TASK_CAT_COLOR = {
  poster:  "bg-pink-100 text-pink-700",
  staff:   "bg-blue-100 text-blue-700",
  vm:      "bg-purple-100 text-purple-700",
  content: "bg-amber-100 text-amber-700",
  general: "bg-gray-100 text-gray-600",
} as Record<string, string>;

const TABS = [
  { id: "overview",   label: "Overview",      icon: Target       },
  { id: "mechanics",  label: "Mechanics",     icon: Megaphone    },
  { id: "content",    label: "Content Plan",  icon: FileText     },
  { id: "script",     label: "Sales Script",  icon: MessageSquare },
  { id: "vm",         label: "VM Guide",      icon: ImageIcon    },
  { id: "tasks",      label: "Tasks",         icon: CheckSquare  },
  { id: "performance",label: "Performance",   icon: BarChart2    },
] as const;

type TabId = typeof TABS[number]["id"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parse<T>(s: string, fallback: T): T {
  try { return JSON.parse(s); } catch { return fallback; }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CampaignDetail({ params }: { params: { id: string } }) {
  const { id } = params;
  const router  = useRouter();
  const { user } = useAuth();
  const { data: campaign, loading, refetch } = useData<Campaign>(`/api/campaigns/${id}`);
  const [tab, setTab]           = useState<TabId>("overview");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isAdmin = ["admin", "manager", "product"].includes(user?.role ?? "");

  async function deleteCampaign() {
    setDeleting(true);
    try {
      await apiFetch(`/api/campaigns/${id}`, { method: "DELETE" });
      router.push("/campaign");
    } finally { setDeleting(false); }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-32 text-gray-400">
      <Loader2 size={28} className="animate-spin" />
    </div>
  );
  if (!campaign) return <div className="text-gray-400 py-20 text-center">Campaign not found.</div>;

  const cfg     = TYPE_CFG[campaign.type]   ?? TYPE_CFG.sales;
  const sCfg    = STATUS_CFG[campaign.status] ?? STATUS_CFG.upcoming;
  const channels = parse<string[]>(campaign.channels, []);

  return (
    <div className="space-y-6">
      {/* Breadcrumb + header */}
      <div>
        <button onClick={() => router.push("/campaign")}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-3">
          <ArrowLeft size={15} /> Campaign Calendar
        </button>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className={cn("w-4 h-4 rounded-full", cfg.dot)} />
            <div>
              <h1 className="page-title">{campaign.name}</h1>
              <p className="text-sm text-gray-400 mt-0.5">{campaign.startDate} → {campaign.endDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("text-xs font-semibold px-3 py-1 rounded-full", cfg.badge)}>{cfg.label}</span>
            <span className={cn("text-xs font-semibold px-3 py-1 rounded-full", sCfg.cls)}>{sCfg.label}</span>
            {channels.map(ch => (
              <span key={ch} className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">{ch}</span>
            ))}
            {isAdmin && (
              confirmDelete ? (
                <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-2 py-1">
                  <span className="text-xs text-red-700 font-semibold">Delete?</span>
                  <button onClick={deleteCampaign} disabled={deleting}
                    className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-2 py-0.5 rounded">
                    {deleting ? <Loader2 size={11} className="animate-spin" /> : "Yes"}
                  </button>
                  <button onClick={() => setConfirmDelete(false)} className="text-xs text-gray-500 hover:text-gray-700">No</button>
                </div>
              ) : (
                <button onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1 text-xs font-semibold text-red-400 hover:text-red-600 px-2.5 py-1 rounded-lg border border-red-100 hover:border-red-300 hover:bg-red-50 transition-all">
                  <Trash2 size={12} /> Delete
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all",
              tab === t.id ? "bg-brand-500 text-white shadow-sm" : "text-gray-500 hover:bg-gray-100",
            )}>
            <t.icon size={14} />{t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "overview"    && <OverviewTab    campaign={campaign} isAdmin={isAdmin} refetch={refetch} />}
      {tab === "mechanics"   && <MechanicsTab   campaign={campaign} isAdmin={isAdmin} refetch={refetch} />}
      {tab === "content"     && <ContentTab     campaign={campaign} isAdmin={isAdmin} refetch={refetch} />}
      {tab === "script"      && <ScriptTab      campaign={campaign} isAdmin={isAdmin} refetch={refetch} />}
      {tab === "vm"          && <VMTab          campaign={campaign} isAdmin={isAdmin} refetch={refetch} />}
      {tab === "tasks"       && <TasksTab       campaign={campaign} isAdmin={isAdmin} refetch={refetch} />}
      {tab === "performance" && <PerformanceTab campaign={campaign} />}
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

const ALL_CHANNELS = ["Offline", "TikTok", "Shopee", "Instagram", "WhatsApp"];
const ALL_TYPES    = [
  { value: "sales",          label: "Sales"          },
  { value: "branding",       label: "Branding"       },
  { value: "product_launch", label: "Product Launch" },
  { value: "vm_update",      label: "VM Update"      },
];
const ALL_OWNERS = [
  { value: "hq",             label: "HQ"             },
  { value: "outlet_manager", label: "Outlet Manager" },
  { value: "marketing",      label: "Marketing Team" },
];
const REGIONS = ["Klang Valley", "Johor", "Penang", "Sabah", "Sarawak", "Perak", "Kedah", "Melaka", "Pahang", "Negeri Sembilan", "Others"];

type Outlet = { id: string; name: string; city: string; region: string | null; isActive: boolean };

function OverviewTab({ campaign, isAdmin, refetch }: { campaign: Campaign; isAdmin: boolean; refetch: () => void }) {
  const obj         = parse<{ revenue?: number; units?: number }>(campaign.objective, {});
  const done        = campaign.tasks.filter(t => t.status === "done").length;
  const total       = campaign.tasks.length;
  const subApproved = campaign.submissions.filter(s => s.status === "approved").length;
  const subTotal    = campaign.submissions.length;

  const { data: outlets } = useData<Outlet[]>("/api/outlets");
  const activeOutlets = (outlets ?? []).filter(o => o.isActive);

  const [editing,      setEditing]      = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [outletSearch, setOutletSearch] = useState("");
  const [form, setForm] = useState({
    name:         campaign.name,
    type:         campaign.type,
    startDate:    campaign.startDate,
    endDate:      campaign.endDate,
    status:       campaign.status,
    channels:     parse<string[]>(campaign.channels, []),
    revenue:      obj.revenue?.toString() ?? "",
    units:        obj.units?.toString()   ?? "",
    scopeType:    campaign.scopeType    ?? "all",
    scopeOutlets: campaign.campaignOutlets.map(co => co.outletId),
    scopeRegions: parse<string[]>(campaign.scopeRegions, []),
    owner:        campaign.owner ?? "hq",
  });

  const filteredOutlets = activeOutlets.filter(o =>
    !outletSearch ||
    o.name.toLowerCase().includes(outletSearch.toLowerCase()) ||
    (o.city ?? "").toLowerCase().includes(outletSearch.toLowerCase())
  );

  function resetForm() {
    setForm({
      name:         campaign.name,
      type:         campaign.type,
      startDate:    campaign.startDate,
      endDate:      campaign.endDate,
      status:       campaign.status,
      channels:     parse<string[]>(campaign.channels, []),
      revenue:      obj.revenue?.toString() ?? "",
      units:        obj.units?.toString()   ?? "",
      scopeType:    campaign.scopeType    ?? "all",
      scopeOutlets: campaign.campaignOutlets.map(co => co.outletId),
      scopeRegions: parse<string[]>(campaign.scopeRegions, []),
      owner:        campaign.owner ?? "hq",
    });
    setOutletSearch("");
    setEditing(false);
  }

  async function save() {
    if (!form.name || !form.startDate || !form.endDate) return;
    if (form.endDate < form.startDate) return;
    setSaving(true);
    try {
      await apiFetch(`/api/campaigns/${campaign.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name:         form.name,
          type:         form.type,
          startDate:    form.startDate,
          endDate:      form.endDate,
          status:       form.status,
          channels:     form.channels,
          objective:    { revenue: form.revenue ? Number(form.revenue) : 0, units: form.units ? Number(form.units) : 0 },
          scopeType:    form.scopeType,
          scopeOutlets: form.scopeOutlets,
          scopeRegions: form.scopeRegions,
          owner:        form.owner,
        }),
      });
      refetch(); setEditing(false);
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

  const channels     = parse<string[]>(campaign.channels, []);
  const scopeRegions = parse<string[]>(campaign.scopeRegions, []);

  const scopeDisplay = (() => {
    if (campaign.scopeType === "all") return { label: "All Outlets", color: "bg-emerald-100 text-emerald-700 border border-emerald-200" };
    if (campaign.scopeType === "selected") {
      const n = campaign.campaignOutlets.length;
      const label = n === 1 ? campaign.campaignOutlets[0]?.outletName : `${n} Outlets`;
      return { label: label ?? "Selected", color: "bg-sky-100 text-sky-700 border border-sky-200" };
    }
    if (campaign.scopeType === "region") {
      const label = scopeRegions.length === 1 ? scopeRegions[0] : `${scopeRegions.length} Regions`;
      return { label, color: "bg-violet-100 text-violet-700 border border-violet-200" };
    }
    return { label: "—", color: "bg-gray-100 text-gray-500" };
  })();

  const ownerLabel = ALL_OWNERS.find(o => o.value === campaign.owner)?.label ?? campaign.owner ?? "HQ";

  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Revenue Target" value={obj.revenue ? `RM ${obj.revenue.toLocaleString()}` : "—"} />
        <KPICard label="Units Target"   value={obj.units   ? obj.units.toString()                  : "—"} />
        <KPICard label="Tasks Done"     value={`${done} / ${total}`} />
        <KPICard label="VM Approved"    value={`${subApproved} / ${subTotal}`} />
      </div>

      {/* Campaign details card */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-800">Campaign Details</h3>
          {isAdmin && !editing && (
            <button onClick={() => setEditing(true)}
              className="text-xs font-semibold text-brand-500 hover:text-brand-700 px-3 py-1.5 rounded-lg border border-brand-200 hover:bg-brand-50 transition-all">
              Edit Campaign
            </button>
          )}
        </div>

        {editing ? (
          /* ── Edit form ── */
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Campaign Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400">
                  {ALL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400">
                  <option value="upcoming">Upcoming</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Start Date</label>
                <input type="date" value={form.startDate}
                  onChange={e => setForm(f => ({ ...f, startDate: e.target.value, endDate: f.endDate < e.target.value ? "" : f.endDate }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">End Date</label>
                <input type="date" value={form.endDate} min={form.startDate}
                  onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                  className={cn("w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400",
                    form.endDate && form.endDate < form.startDate ? "border-red-300 bg-red-50" : "border-gray-200")} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2">Channels</label>
              <div className="flex flex-wrap gap-2">
                {ALL_CHANNELS.map(ch => (
                  <button key={ch} onClick={() => toggleChannel(ch)}
                    className={cn("text-xs px-3 py-1.5 rounded-full border font-medium transition-all",
                      form.channels.includes(ch) ? "bg-brand-500 text-white border-brand-500" : "bg-white text-gray-500 border-gray-200 hover:border-brand-300")}>
                    {ch}
                  </button>
                ))}
              </div>
            </div>

            {/* Scope editor */}
            <div className="border border-gray-100 rounded-xl p-4 space-y-3 bg-gray-50/50">
              <div className="text-xs font-bold text-gray-600 uppercase tracking-wide">Campaign Scope</div>
              <div className="space-y-2">
                {([
                  { value: "all",      label: "All Outlets"      },
                  { value: "selected", label: "Selected Outlets" },
                  { value: "region",   label: "Region"           },
                ] as const).map(opt => (
                  <label key={opt.value} className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-all text-sm",
                    form.scopeType === opt.value ? "border-brand-400 bg-brand-50" : "border-gray-200 bg-white hover:border-gray-300"
                  )}>
                    <input type="radio" name="editScopeType" value={opt.value}
                      checked={form.scopeType === opt.value}
                      onChange={() => setForm(f => ({ ...f, scopeType: opt.value, scopeOutlets: [], scopeRegions: [] }))}
                      className="accent-brand-500" />
                    <span className="font-medium text-gray-800">{opt.label}</span>
                  </label>
                ))}
              </div>

              {form.scopeType === "selected" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input value={outletSearch} onChange={e => setOutletSearch(e.target.value)}
                        placeholder="Search outlets..."
                        className="w-full pl-7 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-400" />
                    </div>
                    <button onClick={() => setForm(f => ({ ...f, scopeOutlets: activeOutlets.map(o => o.id) }))}
                      className="text-[11px] font-semibold text-brand-600 hover:text-brand-800 whitespace-nowrap">Select All</button>
                    <button onClick={() => setForm(f => ({ ...f, scopeOutlets: [] }))}
                      className="text-[11px] font-semibold text-gray-500 hover:text-gray-700 whitespace-nowrap">Clear</button>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                    {filteredOutlets.map(o => (
                      <label key={o.id} className={cn(
                        "flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-all text-sm",
                        form.scopeOutlets.includes(o.id) ? "border-brand-300 bg-brand-50" : "border-gray-100 bg-white hover:border-gray-200"
                      )}>
                        <input type="checkbox" checked={form.scopeOutlets.includes(o.id)}
                          onChange={() => toggleScopeOutlet(o.id)} className="accent-brand-500 shrink-0" />
                        <span className="font-medium text-gray-800 flex-1">{o.name}</span>
                        {o.city && <span className="text-gray-400 text-xs">{o.city}</span>}
                      </label>
                    ))}
                  </div>
                  <p className="text-[11px] text-gray-400">{form.scopeOutlets.length} outlet{form.scopeOutlets.length !== 1 ? "s" : ""} selected</p>
                </div>
              )}

              {form.scopeType === "region" && (
                <div className="flex flex-wrap gap-2">
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

            {/* Owner */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Campaign Owner</label>
              <div className="flex gap-2">
                {ALL_OWNERS.map(o => (
                  <button key={o.value} onClick={() => setForm(f => ({ ...f, owner: o.value }))}
                    className={cn("text-xs px-3 py-1.5 rounded-full border font-medium transition-all",
                      form.owner === o.value ? "bg-brand-500 text-white border-brand-500" : "bg-white text-gray-500 border-gray-200 hover:border-brand-300")}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Revenue Target (RM)</label>
                <input type="number" value={form.revenue} onChange={e => setForm(f => ({ ...f, revenue: e.target.value }))} placeholder="0"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Units Target</label>
                <input type="number" value={form.units} onChange={e => setForm(f => ({ ...f, units: e.target.value }))} placeholder="0"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={save} disabled={saving || !form.name || !form.startDate || !form.endDate || form.endDate < form.startDate}
                className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold rounded-lg disabled:opacity-50">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Save Changes
              </button>
              <button onClick={resetForm} className="px-5 py-2.5 border border-gray-200 text-sm font-semibold text-gray-600 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* ── Read view ── */
          <div className="space-y-3 text-sm">
            <Row label="Duration">{campaign.startDate} → {campaign.endDate}</Row>
            <Row label="Type">
              <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full",
                TYPE_CFG[campaign.type]?.badge ?? "bg-gray-100 text-gray-500")}>
                {TYPE_CFG[campaign.type]?.label ?? campaign.type}
              </span>
            </Row>
            <Row label="Status">
              <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full",
                STATUS_CFG[campaign.status]?.cls ?? "bg-gray-100 text-gray-500")}>
                {STATUS_CFG[campaign.status]?.label ?? campaign.status}
              </span>
            </Row>
            <Row label="Channels">
              <div className="flex flex-wrap gap-1">
                {channels.length ? channels.map(ch => (
                  <span key={ch} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{ch}</span>
                )) : <span className="text-gray-400">—</span>}
              </div>
            </Row>
            <Row label="Scope">
              <div className="space-y-1.5">
                <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full", scopeDisplay.color)}>
                  <Store size={11} /> {scopeDisplay.label}
                </span>
                {campaign.scopeType === "selected" && campaign.campaignOutlets.length > 1 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {campaign.campaignOutlets.map(co => (
                      <span key={co.id} className="text-[11px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-600 border border-sky-100">{co.outletName}</span>
                    ))}
                  </div>
                )}
                {campaign.scopeType === "region" && scopeRegions.length > 1 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {scopeRegions.map(r => (
                      <span key={r} className="text-[11px] px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 border border-violet-100">{r}</span>
                    ))}
                  </div>
                )}
              </div>
            </Row>
            <Row label="Owner">
              <span className="text-xs font-medium text-gray-700">{ownerLabel}</span>
            </Row>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-xs font-semibold text-gray-400 w-24 shrink-0 mt-0.5">{label}</span>
      <div className="flex-1 text-gray-700">{children}</div>
    </div>
  );
}

function KPICard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide">{label}</div>
      <div className="text-lg font-bold text-gray-800 mt-0.5">{value}</div>
    </div>
  );
}

// ─── Mechanics Tab ────────────────────────────────────────────────────────────

function MechanicsTab({ campaign, isAdmin, refetch }: { campaign: Campaign; isAdmin: boolean; refetch: () => void }) {
  const [items, setItems]   = useState<string[]>(() => parse<string[]>(campaign.mechanics, []));
  const [photos, setPhotos] = useState<string[]>(() => parse<string[]>(campaign.mechanicsPhotos ?? "[]", []));
  const [newItem, setNewItem]   = useState("");
  const [saving, setSaving]     = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox]   = useState<string | null>(null);

  async function saveItems(list: string[]) {
    setSaving(true);
    try {
      await apiFetch(`/api/campaigns/${campaign.id}`, { method: "PATCH", body: JSON.stringify({ mechanics: list }) });
      refetch();
    } finally { setSaving(false); }
  }

  async function savePhotos(list: string[]) {
    await apiFetch(`/api/campaigns/${campaign.id}`, { method: "PATCH", body: JSON.stringify({ mechanicsPhotos: list }) });
    refetch();
  }

  function add() {
    if (!newItem.trim()) return;
    const next = [...items, newItem.trim()];
    setItems(next); setNewItem(""); saveItems(next);
  }

  function remove(i: number) {
    const next = items.filter((_, j) => j !== i);
    setItems(next); saveItems(next);
  }

  async function handlePhotoUpload(files: FileList | null) {
    if (!files) return;
    setUploading(true);
    try {
      const urls = await Promise.all(Array.from(files).map(f => uploadToCloudinary(f)));
      const next = [...photos, ...urls];
      setPhotos(next); savePhotos(next);
    } finally { setUploading(false); }
  }

  function removePhoto(i: number) {
    const next = photos.filter((_, j) => j !== i);
    setPhotos(next); savePhotos(next);
  }

  return (
    <div className="space-y-4">
      {/* Mechanics list */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-800">Sales Mechanics</h3>
          {saving && <Loader2 size={14} className="animate-spin text-gray-400" />}
        </div>
        <div className="space-y-2">
          {items.length === 0 && <p className="text-sm text-gray-400">No mechanics added yet.</p>}
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2.5">
              <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
              <span className="flex-1 text-sm text-gray-700">{item}</span>
              {isAdmin && <button onClick={() => remove(i)} className="text-gray-300 hover:text-red-400"><X size={14} /></button>}
            </div>
          ))}
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <input value={newItem} onChange={e => setNewItem(e.target.value)}
              onKeyDown={e => e.key === "Enter" && add()}
              placeholder='e.g. "RM180 Free Gift"'
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
            <button onClick={add} className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-lg">
              <Plus size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Pop Card / Design Photos */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-800">Pop Card & Design References</h3>
            <p className="text-xs text-gray-400 mt-0.5">Upload pop card designs, display references, and visuals for the designer.</p>
          </div>
          {isAdmin && (
            <label className={cn(
              "flex items-center gap-2 px-3 py-2 bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-semibold rounded-lg cursor-pointer transition-colors",
              uploading && "opacity-60 pointer-events-none"
            )}>
              {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
              {uploading ? "Uploading…" : "Upload Photos"}
              <input type="file" accept="image/*" multiple className="hidden"
                onChange={e => handlePhotoUpload(e.target.files)} />
            </label>
          )}
        </div>

        {photos.length === 0 ? (
          <div className="border-2 border-dashed border-gray-200 rounded-xl py-10 text-center">
            <ImageIcon size={28} className="text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No design photos yet</p>
            {isAdmin && <p className="text-xs text-gray-300 mt-1">Click "Upload Photos" to add pop card designs</p>}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {photos.map((url, i) => (
              <div key={i} className="relative group rounded-xl overflow-hidden border border-gray-100 aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Design ${i + 1}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button onClick={() => setLightbox(url)}
                    className="p-1.5 bg-white rounded-lg text-gray-700 hover:text-brand-600 transition-colors">
                    <ZoomIn size={14} />
                  </button>
                  {isAdmin && (
                    <button onClick={() => removePhoto(i)}
                      className="p-1.5 bg-white rounded-lg text-gray-700 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="absolute bottom-1.5 right-1.5 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded font-semibold">
                  {i + 1}/{photos.length}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <div className="relative max-w-3xl max-h-[90vh]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lightbox} alt="Pop card design" className="max-w-full max-h-[90vh] object-contain rounded-xl" />
            <button onClick={() => setLightbox(null)}
              className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70">
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Content Tab ──────────────────────────────────────────────────────────────

function ContentTab({ campaign, isAdmin, refetch }: { campaign: Campaign; isAdmin: boolean; refetch: () => void }) {
  const init = parse<{ tiktok?: number; ig?: number; youtube?: number; themes?: string[] }>(campaign.contentPlan, {});
  const [tiktok,   setTiktok]   = useState(init.tiktok   ?? 0);
  const [ig,       setIg]       = useState(init.ig        ?? 0);
  const [youtube,  setYoutube]  = useState(init.youtube   ?? 0);
  const [themes,   setThemes]   = useState<string[]>(init.themes ?? []);
  const [newTheme, setNewTheme] = useState("");
  const [saving,   setSaving]   = useState(false);

  async function saveWithThemes(t: string[]) {
    setSaving(true);
    try {
      await apiFetch(`/api/campaigns/${campaign.id}`, {
        method: "PATCH",
        body: JSON.stringify({ contentPlan: { tiktok, ig, youtube, themes: t } }),
      });
      refetch();
    } finally { setSaving(false); }
  }

  async function save() { await saveWithThemes(themes); }

  async function addThemeAndSave() {
    if (!newTheme.trim()) return;
    const updated = [...themes, newTheme.trim()];
    setThemes(updated);
    setNewTheme("");
    await saveWithThemes(updated);
  }

  async function removeThemeAndSave(i: number) {
    const updated = themes.filter((_, j) => j !== i);
    setThemes(updated);
    await saveWithThemes(updated);
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <h3 className="text-sm font-bold text-gray-800">Content Volume</h3>
        <div className="grid grid-cols-3 gap-3">
          {([["TikTok", tiktok, setTiktok], ["Instagram", ig, setIg], ["YouTube", youtube, setYoutube]] as const).map(([label, val, setter]) => (
            <div key={label}>
              <label className="text-xs font-semibold text-gray-500 block mb-1">{label} Videos</label>
              {isAdmin ? (
                <input type="number" value={val} onChange={e => setter(Number(e.target.value))} min={0}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
              ) : (
                <div className="text-2xl font-bold text-gray-800">{val}</div>
              )}
            </div>
          ))}
        </div>
        {isAdmin && (
          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-lg">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Save
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <h3 className="text-sm font-bold text-gray-800">Content Themes</h3>
        <div className="flex flex-wrap gap-2">
          {themes.length === 0 && <p className="text-sm text-gray-400">No themes yet.</p>}
          {themes.map((th, i) => (
            <span key={i} className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-full bg-brand-50 text-brand-700 border border-brand-100">
              {th}
              {isAdmin && (
                <button onClick={() => removeThemeAndSave(i)} className="text-brand-400 hover:text-red-500">
                  <X size={12} />
                </button>
              )}
            </span>
          ))}
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <input value={newTheme} onChange={e => setNewTheme(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addThemeAndSave(); } }}
              placeholder='e.g. "Travel" / "Family" / "Gift"'
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
            <button onClick={addThemeAndSave} disabled={saving || !newTheme.trim()}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white text-sm font-semibold rounded-lg">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={16} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Script Tab ───────────────────────────────────────────────────────────────

function ScriptTab({ campaign, isAdmin, refetch }: { campaign: Campaign; isAdmin: boolean; refetch: () => void }) {
  const [script,  setScript]  = useState(campaign.salesScript ?? "");
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [copied,  setCopied]  = useState(false);

  async function save() {
    setSaving(true);
    try {
      await apiFetch(`/api/campaigns/${campaign.id}`, { method: "PATCH", body: JSON.stringify({ salesScript: script }) });
      refetch(); setSaved(true); setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  }

  async function copyScript() {
    const text = script || "";
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const waLink = script
    ? `https://wa.me/?text=${encodeURIComponent(`📋 *${campaign.name} — Sales Script*\n\n${script}`)}`
    : null;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-bold text-gray-800">Sales Script</h3>
        {script && (
          <div className="flex items-center gap-2">
            <button onClick={copyScript}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                copied
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300")}>
              {copied ? <><Check size={12} /> Copied!</> : <>📋 Copy</>}
            </button>
            {waLink && (
              <a href={waLink} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-500 hover:bg-green-600 text-white transition-colors">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Share via WhatsApp
              </a>
            )}
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-2 text-xs text-amber-700 font-medium">
          Write the exact words for the team to use with customers during this campaign.
        </div>
      )}

      {isAdmin ? (
        <textarea value={script} onChange={e => setScript(e.target.value)} rows={12}
          placeholder={"\"Sir, sekarang ada Raya promo...\"\n\"Kalau beli RM180 ada free gift...\"\n\nObjection handling:\n\"Mahal?\" → \"Tapi ada free gift worth RM50...\""}
          className="w-full border border-gray-200 rounded-lg px-3 py-3 text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none" />
      ) : (
        <pre className="bg-gray-50 rounded-lg px-4 py-3 text-sm font-mono leading-relaxed whitespace-pre-wrap text-gray-700 min-h-[120px]">
          {script || "No script added yet. Check back later."}
        </pre>
      )}

      {isAdmin && (
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-lg">
          {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : null}
          {saved ? "Saved!" : "Save Script"}
        </button>
      )}
    </div>
  );
}

// ─── VM Tab ───────────────────────────────────────────────────────────────────

function VMTab({ campaign, isAdmin, refetch }: { campaign: Campaign; isAdmin: boolean; refetch: () => void }) {
  const { user } = useAuth();
  const isSales  = user?.role === "sales";
  const vm       = campaign.vmGuide;
  const [images,    setImages]    = useState<VMImage[]>(() => vm ? parse<VMImage[]>(vm.images, []).filter((i: VMImage) => !!i.url) : []);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(() => vm ? parse<ChecklistItem[]>(vm.checklist, []) : []);
  const [uploading,   setUploading]   = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [newItem,     setNewItem]     = useState("");
  const [newRequired, setNewRequired] = useState(true);
  const [lightbox,    setLightbox]    = useState<string | null>(null);
  const [failedUrls,  setFailedUrls]  = useState<Set<string>>(new Set());

  async function saveVM(imgs: VMImage[], checks: ChecklistItem[]) {
    setSaving(true);
    try {
      await apiFetch(`/api/campaigns/${campaign.id}/vm`, { method: "PUT", body: JSON.stringify({ images: imgs, checklist: checks }) });
      refetch();
    } finally { setSaving(false); }
  }

  async function uploadImage(file: File, type: "correct" | "wrong") {
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      const next = [...images, { url, type, label: type === "correct" ? "Correct Display" : "Wrong Display" }];
      setImages(next);
      await saveVM(next, checklist);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally { setUploading(false); }
  }

  function removeImage(i: number) {
    const next = images.filter((_, j) => j !== i);
    setImages(next); saveVM(next, checklist);
  }

  function addChecklistItem() {
    if (!newItem.trim()) return;
    const item: ChecklistItem = { id: `item_${Date.now()}`, label: newItem.trim(), required: newRequired };
    const next = [...checklist, item];
    setChecklist(next); setNewItem(""); saveVM(images, next);
  }

  function removeChecklistItem(id: string) {
    const next = checklist.filter(c => c.id !== id);
    setChecklist(next); saveVM(images, next);
  }

  function toggleRequired(id: string) {
    const next = checklist.map(c => c.id === id ? { ...c, required: !c.required } : c);
    setChecklist(next); saveVM(images, next);
  }

  return (
    <div className="space-y-5">
      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white" onClick={() => setLightbox(null)}><X size={28} /></button>
          <img src={lightbox} alt="preview" className="max-w-full max-h-full rounded-xl shadow-2xl object-contain" onClick={e => e.stopPropagation()} />
        </div>
      )}
      {/* Display Guide */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        {/* Title row */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-800">Display Guide</h3>
          {(saving || uploading) && <Loader2 size={14} className="animate-spin text-gray-400" />}
        </div>

        {/* Correct | Themes | Wrong header row */}
        {(() => {
          const themes = parse<{ themes?: string[] }>(campaign.contentPlan, {}).themes ?? [];
          return (
            <div className="grid grid-cols-2 gap-4 items-center">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs font-semibold text-green-700">Correct ✓</span>
              </div>
              <div className="flex items-center gap-1.5 justify-end">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-xs font-semibold text-red-700">Wrong ✗</span>
              </div>
              {themes.length > 0 && (
                <div className="col-span-2 flex flex-wrap justify-center gap-1.5 -mt-2">
                  {themes.map((th, i) => (
                    <span key={i} className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-100">
                      {th}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        <div className="grid grid-cols-2 gap-4">
          {/* Correct */}
          <div className="space-y-2">
              {images.filter(img => img.type === "correct" && img.url && !failedUrls.has(img.url)).map((img, idx) => (
                <div key={idx} className="relative group">
                  <img src={img.url} alt={img.label}
                    className="w-full rounded-lg object-cover h-36 border-2 border-green-200 cursor-zoom-in"
                    onClick={() => setLightbox(img.url)}
                    onError={() => setFailedUrls(prev => { const s = new Set(prev); s.add(img.url); return s; })} />
                  {isAdmin && (
                    <button onClick={() => removeImage(images.indexOf(img))}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={10} />
                    </button>
                  )}
                </div>
              ))}
              {images.filter(img => img.type === "correct" && img.url && !failedUrls.has(img.url)).length === 0 && (
                <div className="h-24 rounded-lg border-2 border-dashed border-green-100 flex items-center justify-center text-xs text-gray-300">No photo yet</div>
              )}
              {isAdmin && (
                <label className="flex flex-col items-center justify-center w-full h-16 rounded-lg border-2 border-dashed border-green-200 cursor-pointer hover:border-green-400 text-green-500 transition-colors">
                  {uploading ? <Loader2 size={16} className="animate-spin" /> : <><Upload size={16} /><span className="text-xs mt-0.5">Add Photo</span></>}
                  <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], "correct")} />
                </label>
              )}
          </div>
          {/* Wrong */}
          <div className="space-y-2">
              {images.filter(img => img.type === "wrong" && img.url && !failedUrls.has(img.url)).map((img, idx) => (
                <div key={idx} className="relative group">
                  <img src={img.url} alt={img.label}
                    className="w-full rounded-lg object-cover h-36 border-2 border-red-200 cursor-zoom-in"
                    onClick={() => setLightbox(img.url)}
                    onError={() => setFailedUrls(prev => { const s = new Set(prev); s.add(img.url); return s; })} />
                  {isAdmin && (
                    <button onClick={() => removeImage(images.indexOf(img))}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={10} />
                    </button>
                  )}
                </div>
              ))}
              {images.filter(img => img.type === "wrong" && img.url && !failedUrls.has(img.url)).length === 0 && (
                <div className="h-24 rounded-lg border-2 border-dashed border-red-100 flex items-center justify-center text-xs text-gray-300">No photo yet</div>
              )}
              {isAdmin && (
                <label className="flex flex-col items-center justify-center w-full h-16 rounded-lg border-2 border-dashed border-red-200 cursor-pointer hover:border-red-400 text-red-400 transition-colors">
                  {uploading ? <Loader2 size={16} className="animate-spin" /> : <><Upload size={16} /><span className="text-xs mt-0.5">Add Photo</span></>}
                  <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], "wrong")} />
                </label>
              )}
          </div>
        </div>
      </div>

      {/* VM Checklist */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-800">VM Checklist</h3>
          {saving && <Loader2 size={13} className="animate-spin text-gray-400" />}
        </div>
        {checklist.length === 0 && <p className="text-sm text-gray-400">No checklist items yet.</p>}
        {checklist.map(item => (
          <div key={item.id} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
            <div className={cn("w-4 h-4 rounded border-2 flex items-center justify-center shrink-0",
              item.required ? "border-brand-500 bg-brand-500" : "border-gray-200")}>
              {item.required && <Check size={10} className="text-white" />}
            </div>
            <span className="flex-1 text-sm text-gray-700">{item.label}</span>
            {isAdmin ? (
              <div className="flex items-center gap-1.5">
                <button onClick={() => toggleRequired(item.id)}
                  className={cn("text-[10px] font-semibold px-2 py-0.5 rounded border transition-all",
                    item.required ? "bg-red-50 text-red-600 border-red-200" : "bg-gray-100 text-gray-400 border-gray-200 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200")}>
                  {item.required ? "Required" : "Optional"}
                </button>
                <button onClick={() => removeChecklistItem(item.id)} className="text-gray-300 hover:text-red-400">
                  <Trash2 size={13} />
                </button>
              </div>
            ) : (
              <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded",
                item.required ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-400")}>
                {item.required ? "Required" : "Optional"}
              </span>
            )}
          </div>
        ))}

        {/* Add new checklist item — admin/manager/product only */}
        {isAdmin && (
          <div className="pt-2 space-y-2">
            <div className="flex gap-2">
              <input value={newItem} onChange={e => setNewItem(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addChecklistItem()}
                placeholder='e.g. "Side Banner Setup"'
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
              <button onClick={() => setNewRequired(r => !r)}
                className={cn("px-3 py-2 rounded-lg text-xs font-semibold border transition-all",
                  newRequired ? "bg-red-50 text-red-600 border-red-200" : "bg-gray-100 text-gray-500 border-gray-200")}>
                {newRequired ? "Required" : "Optional"}
              </button>
              <button onClick={addChecklistItem}
                className="px-3 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-lg">
                <Plus size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sales: Submit VM photos / Admin: Review submissions */}
      {isSales
        ? <SalesVMSubmit campaign={campaign} user={user} refetch={refetch} />
        : <VMSubmissionsSection campaign={campaign} isAdmin={isAdmin} refetch={refetch} />
      }
    </div>
  );
}

// ─── Sales VM Submit ──────────────────────────────────────────────────────────

const VM_AREAS = [
  { key: "front",  label: "Front / Entrance Display" },
  { key: "main",   label: "Main Table Setup"         },
  { key: "promo",  label: "Promo / Gift Area"        },
] as const;

function SalesVMSubmit({ campaign, user, refetch }: {
  campaign: Campaign;
  user: { id: string; name: string; role: string; outletId?: string | null } | null;
  refetch: () => void;
}) {
  const { data: outlets } = useData<{ id: string; name: string }[]>("/api/outlets");
  const [outletId,   setOutletId]   = useState(user?.outletId ?? "");
  const [photos,     setPhotos]     = useState<Record<string, string>>({});
  const [uploading,  setUploading]  = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [error,      setError]      = useState("");

  const outletName = outlets?.find(o => o.id === outletId)?.name ?? "";

  async function uploadPhoto(area: string, file: File) {
    setUploading(area);
    try {
      const url = await uploadToCloudinary(file);
      setPhotos(p => ({ ...p, [area]: url }));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally { setUploading(null); }
  }

  async function submit() {
    if (!outletId) { setError("Please select your outlet."); return; }
    if (Object.keys(photos).length === 0) { setError("Please upload at least one photo."); return; }
    setError(""); setSubmitting(true);
    try {
      const imageUrls = Object.entries(photos).map(([area, url]) => ({ area, url }));
      await apiFetch(`/api/campaigns/${campaign.id}/submissions`, {
        method: "POST",
        body: JSON.stringify({ outletId, outletName, imageUrls }),
      });
      setSubmitted(true); refetch();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed.");
    } finally { setSubmitting(false); }
  }

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
          <Check size={24} className="text-white" />
        </div>
        <h3 className="text-sm font-bold text-green-800 mb-1">VM Photos Submitted!</h3>
        <p className="text-xs text-green-600">HQ will review and score your display.</p>
      </div>
    );
  }

  const existing = campaign.submissions.find(s => s.outletId === outletId);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
      <div>
        <h3 className="text-sm font-bold text-gray-800">Submit Your VM Photos</h3>
        <p className="text-xs text-gray-400 mt-0.5">Upload photos of your store display for HQ review</p>
      </div>

      {existing && (
        <div className={cn("text-xs font-semibold px-3 py-2 rounded-lg",
          existing.status === "approved" ? "bg-green-50 text-green-700 border border-green-200" :
          existing.status === "rejected" ? "bg-red-50 text-red-700 border border-red-200" :
          "bg-amber-50 text-amber-700 border border-amber-200")}>
          {existing.status === "approved" && `✓ Approved — Score: ${(existing.displayScore ?? 0) + (existing.complianceScore ?? 0) + (existing.cleanlinessScore ?? 0)}/30`}
          {existing.status === "rejected" && `✗ Rejected — ${existing.notes ?? "Please resubmit"}`}
          {existing.status === "submitted" && "⏳ Submitted — Waiting for HQ review"}
          {existing.status === "pending"   && "Draft saved"}
        </div>
      )}

      {/* Outlet selector */}
      {!user?.outletId && (
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Your Outlet</label>
          <select value={outletId} onChange={e => setOutletId(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400">
            <option value="">Select outlet…</option>
            {(outlets ?? []).map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>
      )}
      {user?.outletId && outletName && (
        <div className="text-xs text-gray-500">Outlet: <span className="font-semibold text-gray-700">{outletName}</span></div>
      )}

      {/* Photo upload per area */}
      <div className="space-y-3">
        {VM_AREAS.map(area => (
          <div key={area.key}>
            <label className="block text-xs font-semibold text-gray-600 mb-1">{area.label}</label>
            {photos[area.key] ? (
              <div className="relative group">
                <img src={photos[area.key]} alt={area.label} className="w-full h-36 object-cover rounded-lg border border-gray-200" />
                <button onClick={() => setPhotos(p => { const n = { ...p }; delete n[area.key]; return n; })}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <X size={10} />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 w-full h-20 rounded-lg border-2 border-dashed border-gray-200 cursor-pointer hover:border-brand-300 text-gray-400 hover:text-brand-500 transition-colors">
                {uploading === area.key ? <Loader2 size={18} className="animate-spin" /> : <><Upload size={18} /><span className="text-xs">Upload {area.label}</span></>}
                <input type="file" accept="image/*" className="hidden"
                  onChange={e => e.target.files?.[0] && uploadPhoto(area.key, e.target.files[0])} />
              </label>
            )}
          </div>
        ))}
      </div>

      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

      <button onClick={submit} disabled={submitting || !outletId || Object.keys(photos).length === 0}
        className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
        {submitting ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
        Submit VM to HQ
      </button>
    </div>
  );
}

// ─── VM Submissions ───────────────────────────────────────────────────────────

function VMSubmissionsSection({ campaign, isAdmin, refetch }: { campaign: Campaign; isAdmin: boolean; refetch: () => void }) {
  const subs = campaign.submissions;
  const [scoring,  setScoring]  = useState<string | null>(null);
  const [scores,   setScores]   = useState<{ display: number; compliance: number; cleanliness: number; notes: string }>({
    display: 8, compliance: 8, cleanliness: 8, notes: "",
  });
  const [saving,   setSaving]   = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  async function approve(sub: VMSubmission) {
    if (!isAdmin) return;
    setScoring(sub.id);
    setScores({ display: sub.displayScore ?? 8, compliance: sub.complianceScore ?? 8, cleanliness: sub.cleanlinessScore ?? 8, notes: sub.notes ?? "" });
  }

  async function submitScore(subId: string, status: "approved" | "rejected") {
    setSaving(true);
    try {
      await apiFetch(`/api/campaigns/${campaign.id}/submissions/${subId}`, {
        method: "PATCH",
        body: JSON.stringify({
          status,
          displayScore:     status === "approved" ? scores.display     : null,
          complianceScore:  status === "approved" ? scores.compliance  : null,
          cleanlinessScore: status === "approved" ? scores.cleanliness : null,
          notes: scores.notes,
        }),
      });
      refetch(); setScoring(null);
    } finally { setSaving(false); }
  }

  const STATUS_SUB = {
    pending:   "bg-gray-100 text-gray-500",
    submitted: "bg-amber-100 text-amber-700",
    approved:  "bg-green-100 text-green-700",
    rejected:  "bg-red-100 text-red-700",
  } as Record<string, string>;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
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
            alt="VM submission photo"
            className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl object-contain"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-800">VM Submissions</h3>
        <span className="text-xs text-gray-400">{subs.filter(s => s.status === "approved").length}/{subs.length} approved</span>
      </div>

      {subs.length === 0 && <p className="text-sm text-gray-400">No submissions yet.</p>}

      <div className="space-y-3">
        {subs.map(sub => {
          const allImgs  = parse<{ url?: string; area: string }[]>(sub.imageUrls, []);
          const imgs     = allImgs.filter(img => !!img.url);
          const total = (sub.displayScore ?? 0) + (sub.complianceScore ?? 0) + (sub.cleanlinessScore ?? 0);
          return (
            <div key={sub.id} className="border border-gray-100 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-800">{sub.outletName}</div>
                  {sub.submittedAt && (
                    <div className="text-xs text-gray-400 mt-0.5">
                      Submitted {new Date(sub.submittedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", STATUS_SUB[sub.status] ?? STATUS_SUB.pending)}>
                  {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                </span>
              </div>

              {imgs.length > 0 ? (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {imgs.map((img, i) => (
                    <button
                      key={i}
                      className="shrink-0 group relative"
                      onClick={() => setLightbox(img.url!)}
                      title="Tap to enlarge"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt={img.area} className="w-28 h-24 object-cover rounded-lg border border-gray-100" />
                      <div className="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                        <ZoomIn size={18} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-[10px] text-gray-400 text-center mt-0.5 capitalize">{img.area}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
                  <ImageIcon size={13} />
                  No photos — submission was made before photo upload was set up.
                  {isAdmin && sub.status === "submitted" && (
                    <span className="ml-1 text-amber-600 font-semibold">Ask outlet to resubmit.</span>
                  )}
                </div>
              )}

              {sub.status === "approved" && (
                <div className="flex gap-3 text-xs">
                  <ScorePill label="Display"     score={sub.displayScore}     max={10} />
                  <ScorePill label="Compliance"  score={sub.complianceScore}  max={10} />
                  <ScorePill label="Cleanliness" score={sub.cleanlinessScore} max={10} />
                  <div className="bg-brand-50 text-brand-700 px-2 py-1 rounded-lg font-bold">{total}/30 Total</div>
                </div>
              )}

              {sub.notes && (
                <p className="text-xs text-gray-500 italic">{sub.notes}</p>
              )}

              {isAdmin && sub.status === "submitted" && scoring !== sub.id && (
                <button onClick={() => approve(sub)}
                  className="text-xs font-semibold text-brand-600 hover:underline">
                  Review & Score →
                </button>
              )}

              {isAdmin && scoring === sub.id && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-semibold text-gray-700">Score this submission</p>
                  {(["display", "compliance", "cleanliness"] as const).map(key => (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-24 capitalize">{key}</span>
                      <input type="range" min={0} max={10} value={scores[key]}
                        onChange={e => setScores(s => ({ ...s, [key]: Number(e.target.value) }))}
                        className="flex-1" />
                      <span className="text-sm font-bold text-gray-700 w-8 text-right">{scores[key]}/10</span>
                    </div>
                  ))}
                  <input value={scores.notes} onChange={e => setScores(s => ({ ...s, notes: e.target.value }))}
                    placeholder="Notes (optional)"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-400" />
                  <div className="flex gap-2">
                    <button onClick={() => submitScore(sub.id, "approved")} disabled={saving}
                      className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg">
                      Approve
                    </button>
                    <button onClick={() => submitScore(sub.id, "rejected")} disabled={saving}
                      className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg">
                      Reject
                    </button>
                    <button onClick={() => setScoring(null)} className="px-3 py-2 text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ScorePill({ label, score, max }: { label: string; score: number | null; max: number }) {
  if (score === null) return null;
  const color = score >= max * 0.8 ? "bg-green-100 text-green-700" : score >= max * 0.5 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";
  return (
    <div className={cn("px-2 py-1 rounded-lg font-semibold", color)}>
      {label}: {score}/{max}
    </div>
  );
}

// ─── Tasks Tab ────────────────────────────────────────────────────────────────

function TasksTab({ campaign, isAdmin, refetch }: { campaign: Campaign; isAdmin: boolean; refetch: () => void }) {
  const [tasks, setTasks] = useState(campaign.tasks);
  const [newTask, setNewTask] = useState({ taskName: "", category: "general", assignedTo: "", deadline: "" });
  const [updating, setUpdating] = useState<string | null>(null);
  const [adding, setAdding]     = useState(false);
  const [saving, setSaving]     = useState(false);

  useEffect(() => { setTasks(campaign.tasks); }, [campaign.tasks]);

  async function toggleTask(task: CampaignTask) {
    const next = task.status === "done" ? "pending" : "done";
    setUpdating(task.id);
    try {
      await apiFetch(`/api/campaigns/${campaign.id}/tasks/${task.id}`, {
        method: "PATCH", body: JSON.stringify({ status: next }),
      });
      setTasks(ts => ts.map(t => t.id === task.id ? { ...t, status: next } : t));
    } finally { setUpdating(null); }
  }

  async function addTask() {
    if (!newTask.taskName.trim()) return;
    setSaving(true);
    try {
      const res = await apiFetch(`/api/campaigns/${campaign.id}/tasks`, {
        method: "POST",
        body: JSON.stringify({
          taskName:   newTask.taskName,
          category:   newTask.category,
          assignedTo: newTask.assignedTo || null,
          deadline:   newTask.deadline   || null,
        }),
      });
      setTasks(ts => [...ts, res]);
      setNewTask({ taskName: "", category: "general", assignedTo: "", deadline: "" });
      setAdding(false);
    } finally { setSaving(false); }
  }

  async function deleteTask(id: string) {
    try {
      await apiFetch(`/api/campaigns/${campaign.id}/tasks/${id}`, { method: "DELETE" });
      setTasks(ts => ts.filter(t => t.id !== id));
    } catch { /* ignore */ }
  }

  const done  = tasks.filter(t => t.status === "done").length;
  const total = tasks.length;
  const pct   = total ? Math.round((done / total) * 100) : 0;

  const grouped = tasks.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {} as Record<string, CampaignTask[]>);

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">Campaign Tasks</span>
          <span className="text-sm font-bold text-gray-800">{done}/{total} done</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Task groups */}
      {Object.entries(grouped).map(([cat, catTasks]) => (
        <div key={cat} className="bg-white rounded-xl border border-gray-100 p-5 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full capitalize", TASK_CAT_COLOR[cat] ?? TASK_CAT_COLOR.general)}>
              {cat}
            </span>
            <span className="text-xs text-gray-400">{catTasks.filter(t => t.status === "done").length}/{catTasks.length}</span>
          </div>
          {catTasks.map(task => (
            <div key={task.id} className={cn("flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0",
              task.status === "done" && "opacity-60")}>
              <button onClick={() => toggleTask(task)} disabled={!!updating}
                className={cn("w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all",
                  task.status === "done" ? "border-green-500 bg-green-500" : "border-gray-300 hover:border-brand-400")}>
                {updating === task.id ? <Loader2 size={10} className="animate-spin text-white" /> :
                  task.status === "done" ? <Check size={10} className="text-white" /> : null}
              </button>
              <div className="flex-1 min-w-0">
                <div className={cn("text-sm font-medium text-gray-800", task.status === "done" && "line-through")}>{task.taskName}</div>
                <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                  {task.assignedTo && <span>{task.assignedTo}</span>}
                  {task.deadline   && <span>Due {task.deadline}</span>}
                </div>
              </div>
              {isAdmin && (
                <button onClick={() => deleteTask(task.id)} className="text-gray-200 hover:text-red-400 shrink-0">
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      ))}

      {/* Add task */}
      {isAdmin && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          {!adding ? (
            <button onClick={() => setAdding(true)}
              className="flex items-center gap-2 text-sm text-brand-500 hover:text-brand-700 font-semibold">
              <Plus size={15} /> Add Task
            </button>
          ) : (
            <div className="space-y-3">
              <input value={newTask.taskName} onChange={e => setNewTask(f => ({ ...f, taskName: e.target.value }))}
                placeholder="Task name"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
              <div className="grid grid-cols-3 gap-2">
                <select value={newTask.category} onChange={e => setNewTask(f => ({ ...f, category: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400">
                  {["general", "poster", "staff", "vm", "content"].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <input value={newTask.assignedTo} onChange={e => setNewTask(f => ({ ...f, assignedTo: e.target.value }))}
                  placeholder="Assigned to"
                  className="border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
                <input type="date" value={newTask.deadline} onChange={e => setNewTask(f => ({ ...f, deadline: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
              </div>
              <div className="flex gap-2">
                <button onClick={addTask} disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-lg">
                  {saving && <Loader2 size={14} className="animate-spin" />} Add
                </button>
                <button onClick={() => setAdding(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Performance Tab ──────────────────────────────────────────────────────────

function PerformanceTab({ campaign }: { campaign: Campaign }) {
  const subs  = campaign.submissions;
  const tasks = campaign.tasks;
  const obj   = parse<{ revenue?: number; units?: number }>(campaign.objective, {});

  const approved    = subs.filter(s => s.status === "approved");
  const totalStores = subs.length;
  const vmPct       = totalStores ? Math.round((approved.length / totalStores) * 100) : 0;
  const taskDone    = tasks.filter(t => t.status === "done").length;
  const taskPct     = tasks.length ? Math.round((taskDone / tasks.length) * 100) : 0;
  const avgScore    = approved.length
    ? Math.round(approved.reduce((a, s) => a + (s.displayScore ?? 0) + (s.complianceScore ?? 0) + (s.cleanlinessScore ?? 0), 0) / approved.length)
    : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <PerfCard label="VM Compliance"   value={`${vmPct}%`}         sub={`${approved.length}/${totalStores} stores`} />
        <PerfCard label="Task Completion" value={`${taskPct}%`}        sub={`${taskDone}/${tasks.length} done`}         />
        <PerfCard label="Avg VM Score"    value={`${avgScore}/30`}     sub="display + compliance + clean"              />
        <PerfCard label="Revenue Target"  value={obj.revenue ? `RM ${obj.revenue.toLocaleString()}` : "—"} sub="objective" />
      </div>

      {/* VM compliance table */}
      {subs.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Store-by-Store VM</h3>
          <div className="space-y-2">
            {subs.map(sub => {
              const total = (sub.displayScore ?? 0) + (sub.complianceScore ?? 0) + (sub.cleanlinessScore ?? 0);
              const pct   = sub.status === "approved" ? Math.round((total / 30) * 100) : 0;
              return (
                <div key={sub.id} className="flex items-center gap-3">
                  <div className="w-28 text-sm font-medium text-gray-700 truncate">{sub.outletName}</div>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full", pct >= 80 ? "bg-green-400" : pct >= 60 ? "bg-amber-400" : "bg-red-400")}
                      style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-sm font-bold text-gray-700 w-12 text-right">
                    {sub.status === "approved" ? `${total}/30` : sub.status}
                  </div>
                  {sub.status === "approved" && total >= 24 && <Star size={13} className="text-amber-400 fill-amber-400" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Task breakdown */}
      {tasks.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Task Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(["poster", "staff", "vm", "content"] as const).map(cat => {
              const catTasks = tasks.filter(t => t.category === cat);
              const catDone  = catTasks.filter(t => t.status === "done").length;
              return (
                <div key={cat} className="bg-gray-50 rounded-lg p-3">
                  <div className={cn("text-xs font-bold px-2 py-0.5 rounded-full inline-block mb-2 capitalize", TASK_CAT_COLOR[cat])}>
                    {cat}
                  </div>
                  <div className="text-lg font-bold text-gray-800">{catDone}/{catTasks.length}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function PerfCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-bold text-gray-900 mt-1">{value}</div>
      <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
    </div>
  );
}
