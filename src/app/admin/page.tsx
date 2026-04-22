"use client";
import { useData } from "@/hooks/useData";
import { Store, Users, Activity, ShieldCheck } from "lucide-react";
import Link from "next/link";

type Outlet = { id: string; name: string; city: string; type: string; isActive: boolean };
type Staff  = { id: string; name: string; email: string; role: string; isActive: boolean };

const ROLE_COLORS: Record<string, string> = {
  admin:   "bg-red-900 text-red-300",
  manager: "bg-amber-900 text-amber-300",
  sales:   "bg-blue-900 text-blue-300",
  creator: "bg-purple-900 text-purple-300",
  product: "bg-green-900 text-green-300",
};

export default function AdminOverview() {
  const { data: outlets, loading: ol } = useData<Outlet[]>("/api/outlets");
  const { data: staff,   loading: sl } = useData<Staff[]>("/api/staff");

  const physical  = (outlets ?? []).filter(o => o.type === "physical" && o.isActive);
  const online    = (outlets ?? []).filter(o => o.type === "online"   && o.isActive);
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
      <div className="grid grid-cols-3 gap-4">
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
      <div className="grid grid-cols-2 gap-4">
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
      </div>

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
