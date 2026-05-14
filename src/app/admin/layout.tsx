"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Store, Users, LayoutGrid, ShieldCheck, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const adminNav = [
  { href: "/admin",         icon: LayoutGrid, label: "Overview"      },
  { href: "/admin/outlets", icon: Store,      label: "Outlets"       },
  { href: "/admin/staff",   icon: Users,      label: "Staff & Users" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);

  const navContent = (
    <>
      {/* Header */}
      <div className="px-5 py-5 border-b border-stone-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <ShieldCheck size={15} className="text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-white leading-tight">Admin Panel</div>
              <div className="text-[10px] text-stone-500 leading-tight">JackStudio OS</div>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="lg:hidden text-stone-500 hover:text-white p-1 rounded">
            <X size={18} />
          </button>
        </div>
        <Link href="/" className="flex items-center gap-2 text-xs text-stone-400 hover:text-white transition-colors group">
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
                "flex items-center gap-2.5 px-3 py-3 rounded-lg text-sm transition-all",
                active ? "bg-brand-600 text-white font-semibold" : "text-stone-400 hover:text-white hover:bg-stone-800"
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
    </>
  );

  return (
    <div className="fixed inset-0 z-[100] flex flex-col lg:flex-row bg-stone-950">

      {/* Mobile top bar */}
      <header className="lg:hidden flex items-center gap-3 px-4 h-14 border-b border-stone-800 flex-shrink-0">
        <button onClick={() => setOpen(true)} className="text-stone-400 hover:text-white p-1.5 rounded-lg hover:bg-stone-800 transition-colors">
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-brand-600 rounded-md flex items-center justify-center">
            <ShieldCheck size={13} className="text-white" />
          </div>
          <span className="text-sm font-bold text-white">Admin Panel</span>
        </div>
        <Link href="/" className="ml-auto flex items-center gap-1.5 text-xs text-stone-400 hover:text-white transition-colors">
          <ArrowLeft size={12} /> App
        </Link>
      </header>

      {/* Backdrop — mobile only */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-10 bg-black/60" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-full w-[240px] bg-stone-950 border-r border-stone-800 flex flex-col z-20 transition-transform duration-300",
        "lg:static lg:w-[220px] lg:translate-x-0 lg:flex-shrink-0",
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {navContent}
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto bg-stone-900">
        <div className="max-w-5xl mx-auto p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
