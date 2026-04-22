"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Store, Users, LayoutGrid, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const adminNav = [
  { href: "/admin",         icon: LayoutGrid, label: "Overview"  },
  { href: "/admin/outlets", icon: Store,       label: "Outlets"   },
  { href: "/admin/staff",   icon: Users,       label: "Staff & Users" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="fixed inset-0 z-[100] flex bg-stone-950">
      {/* Admin sidebar */}
      <aside className="w-[220px] flex-shrink-0 flex flex-col border-r border-stone-800">
        {/* Header */}
        <div className="px-5 py-5 border-b border-stone-800">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <ShieldCheck size={15} className="text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-white leading-tight">Admin Panel</div>
              <div className="text-[10px] text-stone-500 leading-tight">JackStudio OS</div>
            </div>
          </div>
          <Link href="/"
            className="flex items-center gap-2 text-xs text-stone-400 hover:text-white transition-colors group">
            <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
            Back to App
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {adminNav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all",
                  active
                    ? "bg-brand-600 text-white font-semibold"
                    : "text-stone-400 hover:text-white hover:bg-stone-800"
                )}>
                <item.icon size={15} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-stone-800">
          <p className="text-[10px] text-stone-600">Admin &amp; Manager only</p>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto bg-stone-900">
        <div className="max-w-5xl mx-auto p-8">{children}</div>
      </main>
    </div>
  );
}
