"use client";
import Link from "next/link";
import { useData } from "@/hooks/useData";
import { Compass } from "lucide-react";

type Season = {
  id: string; quarter: string; theme: string; heroProduct: string;
  vmDirection: string; contentDirections: string; campaignType: string; isActive: boolean;
};

type Props = {
  show: "hero" | "content" | "mission";
};

const LABELS = {
  hero:    "Hero Product",
  content: "Content Direction",
  mission: "Mission",
};

export default function StrategyBar({ show }: Props) {
  const { data: strategies } = useData<Season[]>("/api/seasonal-strategy");
  const active = (strategies ?? []).find(s => s.isActive);
  if (!active) return null;

  let value = "";
  if (show === "hero") {
    value = active.heroProduct;
  } else if (show === "content") {
    const dirs: string[] = (() => { try { return JSON.parse(active.contentDirections); } catch { return []; } })();
    value = dirs.length > 0 ? dirs.join(" · ") : (active.campaignType || "—");
  } else if (show === "mission") {
    value = active.vmDirection || active.campaignType || active.theme || "—";
  }

  if (!value) return null;

  return (
    <div className="flex items-center gap-2.5 bg-brand-50 border border-brand-100 rounded-xl px-4 py-2.5 text-xs">
      <Compass size={12} className="text-brand-400 flex-shrink-0" />
      <span className="font-bold text-brand-600">{active.quarter} · {active.theme}</span>
      <span className="text-brand-200">|</span>
      <span className="text-gray-400">{LABELS[show]}:</span>
      <span className="font-bold text-gray-700 truncate">{value}</span>
      <Link href="/strategy" className="ml-auto text-brand-300 hover:text-brand-500 font-semibold transition-colors flex-shrink-0">
        Strategy →
      </Link>
    </div>
  );
}
