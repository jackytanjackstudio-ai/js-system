"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, MessageSquare, BarChart2, Video,
  Database, Sword, CheckSquare, Trophy, Settings, Zap, Store, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/context/LangContext";
import { Lang } from "@/lib/i18n";
import { useAuth } from "@/context/AuthContext";
import { LogOut } from "lucide-react";

const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: "en", label: "EN", flag: "🇬🇧" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "ms", label: "BM",  flag: "🇲🇾" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { t, lang, setLang } = useLang();
  const { user, logout } = useAuth();

  const nav = [
    { href: "/",                  icon: LayoutDashboard, labelKey: "nav_dashboard",        group: "overview" },
    { href: "/customer-input",    icon: MessageSquare,   labelKey: "nav_customer_input",    group: "input"    },
    { href: "/sales-report",      icon: BarChart2,       labelKey: "nav_sales_report",      group: "input"    },
    { href: "/creator-insight",   icon: Video,           labelKey: "nav_creator_insight",   group: "input"    },
    { href: "/data-hub",          icon: Database,        labelKey: "nav_data_hub",           group: "core"     },
    { href: "/product-war-room",  icon: Sword,           labelKey: "nav_product_war_room",  group: "core"     },
    { href: "/outlets",           icon: Store,           labelKey: "oc_title",              group: "output"   },
    { href: "/execution",         icon: CheckSquare,     labelKey: "nav_execution",          group: "output"   },
    { href: "/rewards",           icon: Trophy,          labelKey: "nav_rewards",            group: "output"   },
    { href: "/settings",          icon: Settings,        labelKey: "nav_settings",           group: "system"   },
    { href: "/admin",             icon: ShieldCheck,     labelKey: "nav_admin",              group: "system"   },
  ] as const;

  const groups = [
    { key: "overview", labelKey: "nav_group_overview" },
    { key: "input",    labelKey: "nav_group_input"    },
    { key: "core",     labelKey: "nav_group_core"     },
    { key: "output",   labelKey: "nav_group_output"   },
    { key: "system",   labelKey: "nav_group_system"   },
  ] as const;

  return (
    <aside className="fixed top-0 left-0 h-screen w-[240px] bg-white border-r border-gray-100 flex flex-col z-50">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900 leading-tight">JackStudio OS</div>
            <div className="text-[10px] text-gray-400 leading-tight">{t("nav_tagline")}</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {groups.map((g) => {
          const items = nav.filter((n) => n.group === g.key)
            .filter((n) => n.href !== "/admin" || ["admin", "manager"].includes(user?.role ?? ""));
          if (!items.length) return null;
          return (
            <div key={g.key}>
              <div className="section-title px-1">{t(g.labelKey)}</div>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn("sidebar-link", active && "active")}
                    >
                      <item.icon size={16} />
                      {t(item.labelKey)}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Language switcher */}
      <div className="px-4 py-3 border-t border-gray-100">
        <div className="text-[10px] text-gray-400 mb-2 uppercase tracking-wider font-semibold">Language</div>
        <div className="flex gap-1.5">
          {LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all",
                lang === l.code
                  ? "bg-brand-500 text-white shadow-sm"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              )}
            >
              {l.flag} {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* User + logout */}
      {user && (
        <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-gray-800 truncate">{user.name}</div>
            <div className="text-[10px] text-gray-400 capitalize">{user.role}</div>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded"
          >
            <LogOut size={14} />
          </button>
        </div>
      )}

      {/* Week indicator */}
      <div className="px-4 py-3 border-t border-gray-100">
        <div className="text-[11px] text-gray-400">{t("nav_week_of")}</div>
        <div className="text-xs font-semibold text-gray-600">
          {new Date().toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })}
        </div>
      </div>
    </aside>
  );
}
