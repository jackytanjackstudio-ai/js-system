"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { canAccess } from "@/lib/permissions";

interface Props {
  module: string;
  children: React.ReactNode;
}

export function AccessGuard({ module, children }: Props) {
  const { role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !canAccess(role, module)) {
      router.replace("/");
    }
  }, [loading, role, module, router]);

  // While auth is loading, render children to avoid flash
  if (loading) return <>{children}</>;
  if (!canAccess(role, module)) return null;
  return <>{children}</>;
}
