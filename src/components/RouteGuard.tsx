"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { canAccess } from "@/lib/permissions";

// Maps URL paths → module keys in the permission matrix
const ROUTE_MODULES: Record<string, string> = {
  "/strategy":           "strategy-hub",
  "/strategy-dashboard": "strategy-dashboard",
  "/customer-input":     "customer-input",
  "/sales-report":       "sales-report",
  "/creator-insight":    "creator-insight",
  "/creator-hub":        "creator-hub",
  "/reviews":            "reviews",
  "/data-hub":           "data-hub",
  "/campaign":           "campaign",
  "/roadshow-hub":       "roadshow-hub",
  "/product-war-room":   "product-war-room",
  "/product-master":     "product-master",
  "/outlets":            "outlets",
  "/leads":              "leads",
  "/execution":          "execution",
  "/rewards":            "rewards",
  "/leaderboard":        "leaderboard",
  "/settings":           "settings",
  "/admin":              "admin-panel",
};

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { role, loading } = useAuth();

  // Find the module key for this path (check exact match, then prefix match for sub-routes)
  const moduleKey = ROUTE_MODULES[pathname] ??
    Object.entries(ROUTE_MODULES).find(([p]) => pathname.startsWith(p + "/"))?.[1];

  useEffect(() => {
    if (loading || !moduleKey) return;
    if (!canAccess(role, moduleKey)) {
      router.replace("/");
    }
  }, [loading, role, moduleKey, router]);

  // If this route is protected and access is denied (after auth resolves), render nothing
  if (!loading && moduleKey && !canAccess(role, moduleKey)) {
    return null;
  }

  return <>{children}</>;
}
