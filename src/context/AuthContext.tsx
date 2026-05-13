"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { normalizeRole, canAccess, getPermission, UserRole, PermissionLevel } from "@/lib/permissions";

type User = { id: string; email: string; name: string; role: string; outletId?: string | null };

type AuthCtx = {
  user:         User | null;
  loading:      boolean;
  logout:       () => Promise<void>;
  role:         UserRole;
  isAdmin:      boolean;
  isSupervisor: boolean;
  isStaff:      boolean;
  isCS:         boolean;
  isProduct:    boolean;
  isHQ:         boolean;
  isOutletUser: boolean;
  can:          (module: string) => boolean;
  permission:   (module: string) => PermissionLevel;
};

const AuthContext = createContext<AuthCtx>({
  user: null, loading: true, logout: async () => {},
  role: "staff",
  isAdmin: false, isSupervisor: false, isStaff: false,
  isCS: false, isProduct: false, isHQ: false, isOutletUser: false,
  can: () => false, permission: () => "none",
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.ok ? r.json() : null)
      .then(d => setUser(d))
      .finally(() => setLoading(false));
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  const role         = normalizeRole(user?.role ?? "staff");
  const isAdmin      = role === "admin";
  const isSupervisor = role === "supervisor";
  const isStaff      = role === "staff";
  const isCS         = role === "cs";
  const isProduct    = role === "product";
  const isHQ         = ["admin", "marketing", "content", "cs", "product"].includes(role);
  const isOutletUser = ["supervisor", "staff"].includes(role);

  const can        = (module: string) => canAccess(role, module);
  const permission = (module: string): PermissionLevel => getPermission(role, module);

  return (
    <AuthContext.Provider value={{
      user, loading, logout,
      role, isAdmin, isSupervisor, isStaff, isCS, isProduct, isHQ, isOutletUser,
      can, permission,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
