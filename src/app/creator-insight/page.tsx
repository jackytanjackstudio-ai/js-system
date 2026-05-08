"use client";
import { useState, useRef } from "react";
import { useData, apiFetch } from "@/hooks/useData";
import StrategyBar from "@/components/StrategyBar";
import {
  Link2, Eye, Heart, MessageCircle, ShoppingBag, Zap,
  Loader2, X, ArrowUpRight, Plus, Bookmark, Share2, Check,
} from "lucide-react";

type Content = {
  id: string;
  title: string;
  platform: string;
  contentUrl: string | null;
  views: number;
  likes: number;
  comments: number;
  saves: number;
  shares: number;
  linkedSales: number;
  topComment: string | null;
  signalScore: number;
  performanceLevel: string;
  objective: string;
  detectedKeywords: string;
  aiSignals: string;
  pushedToWarRoom: boolean;
  productId: string | null;
  user: { name: string };
};

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function detectPlatform(url: string): "tiktok" | "instagram" {
  if (url.includes("instagram.com") || url.includes("ig.me")) return "instagram";
  return "tiktok";
}

function PerfBadge({ level, score }: { level: string; score: number }) {
  if (level === "high")
    return (
      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-200">
        🔥 HIGH · {score}
      </span>
    );
  if (level === "medium")
    return (
      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200">
        👍 MEDIUM · {score}
      </span>
    );
  return (
    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-50 text-gray-500 border border-gray-200">
      ⚠️ LOW · {score}
    </span>
  );
}

function ObjBadge({ obj }: { obj: string }) {
  const map: Record<string, string> = {
    traffic: "bg-blue-50 text-blue-600",
    trust: "bg-green-50 text-green-600",
    conversion: "bg-purple-50 text-purple-600",
  };
  return (
    <span className={`badge ${map[obj] ?? "bg-gray-100 text-gray-500"} capitalize`}>
      {obj}
    </span>
  );
}

const OBJECTIVES = [
  { value: "traffic",    label: "Traffic",    desc: "Views & reach" },
  { value: "trust",      label: "Trust",      desc: "Education & review" },
  { value: "conversion", label: "Conversion", desc: "Direct sales" },
] as const;

type FormState = {
  views: string;
  likes: string;
  comments: string;
  saves: string;
  sales: string;
  topComment: string;
  objective: "traffic" | "trust" | "conversion";
};

const EMPTY_FORM: FormState = {
  views: "", likes: "", comments: "", saves: "", sales: "",
  topComment: "", objective: "traffic",
};

function QuickModal({
  url,
  platform,
  onClose,
  onSaved,
}: {
  url: string;
  platform: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  function num(v: string) {
    return parseInt(v.replace(/[^0-9]/g, "") || "0");
  }

  async function handleSave() {
    setSaving(true);
    try {
      await apiFetch("/api/creator", {
        method: "POST",
        body: JSON.stringify({
          platform: platform === "instagram" ? "Instagram" : "TikTok",
          title: url,
          contentUrl: url,
          views: num(form.views),
          likes: num(form.likes),
          comments: num(form.comments),
          saves: num(form.saves),
          linkedSales: num(form.sales),
          topComment: form.topComment || null,
          objective: form.objective,
        }),
      });
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900 text-sm">Quick Content Input</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {platform === "instagram" ? "📷 Instagram" : "🎵 TikTok"} · 10 seconds
            </p>
          </div>
          <button onClick={onClose}>
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Metrics grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {([
              { key: "views",    label: "👁 Views",    icon: Eye        },
              { key: "likes",    label: "❤️ Likes",    icon: Heart      },
              { key: "comments", label: "💬 Comments", icon: MessageCircle },
              { key: "sales",    label: "💰 Sales",    icon: ShoppingBag },
            ] as const).map(({ key, label }) => (
              <div key={key}>
                <label className="text-[11px] font-semibold text-gray-400 mb-1 block">
                  {label}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder="0"
                  className="input w-full text-sm text-center py-2"
                />
              </div>
            ))}
          </div>

          {/* Top Comment */}
          <div>
            <label className="text-[11px] font-semibold text-gray-400 mb-1 block">
              Top Comment
            </label>
            <textarea
              value={form.topComment}
              onChange={(e) => setForm((f) => ({ ...f, topComment: e.target.value }))}
              placeholder='"Does it fit cabin size?"'
              rows={2}
              className="input w-full text-sm resize-none"
            />
          </div>

          {/* Objective */}
          <div>
            <label className="text-[11px] font-semibold text-gray-400 mb-1.5 block">
              Objective
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {OBJECTIVES.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, objective: o.value }))}
                  className={`rounded-xl border p-2 text-center transition-all ${
                    form.objective === o.value
                      ? "bg-brand-500 border-brand-500 text-white"
                      : "border-gray-200 text-gray-600 hover:border-brand-300"
                  }`}
                >
                  <div className="text-xs font-bold">{o.label}</div>
                  <div className={`text-[10px] mt-0.5 ${form.objective === o.value ? "text-white/70" : "text-gray-400"}`}>
                    {o.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Saving & extracting keywords…
              </>
            ) : (
              <>
                <Check size={14} />
                Save
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function ContentCard({ item }: { item: Content }) {
  const keywords: string[] = (() => {
    try {
      const dk = JSON.parse(item.detectedKeywords);
      if (Array.isArray(dk) && dk.length > 0) return dk;
      return JSON.parse(item.aiSignals);
    } catch { return []; }
  })();

  return (
    <div className="card space-y-3">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="badge bg-gray-100 text-gray-600">
              {item.platform === "TikTok" ? "🎵" : "📷"} {item.platform}
            </span>
            <ObjBadge obj={item.objective} />
            {item.pushedToWarRoom && (
              <span className="badge bg-red-50 text-red-500 flex items-center gap-0.5">
                <ArrowUpRight size={10} />
                WAR ROOM
              </span>
            )}
          </div>
          {item.contentUrl ? (
            <a
              href={item.contentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-gray-900 hover:text-brand-600 transition-colors mt-1 block truncate"
            >
              {item.title}
            </a>
          ) : (
            <p className="text-sm font-semibold text-gray-900 mt-1 truncate">{item.title}</p>
          )}
        </div>
        <PerfBadge level={item.performanceLevel} score={Math.round(item.signalScore)} />
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-1.5">
        {[
          { val: fmt(item.views),       label: "Views",    emoji: "👁" },
          { val: fmt(item.likes),       label: "Likes",    emoji: "❤️" },
          { val: fmt(item.comments),    label: "Comments", emoji: "💬" },
          { val: String(item.linkedSales), label: "Sales", emoji: "💰" },
        ].map(({ val, label, emoji }) => (
          <div key={label} className="bg-gray-50 rounded-xl p-2 text-center">
            <div className="text-xs font-bold text-gray-800">
              {emoji} {val}
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Top comment */}
      {item.topComment && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
          <p className="text-[10px] text-blue-400 font-bold mb-1">TOP COMMENT</p>
          <p className="text-xs text-blue-800 italic leading-relaxed">
            &ldquo;{item.topComment}&rdquo;
          </p>
        </div>
      )}

      {/* Detected keywords */}
      {keywords.length > 0 && (
        <div>
          <p className="text-[10px] text-gray-400 font-bold mb-1.5 flex items-center gap-1">
            <Zap size={9} /> KEYWORDS
          </p>
          <div className="flex flex-wrap gap-1">
            {keywords.map((k, i) => (
              <span
                key={i}
                className="text-xs bg-brand-50 border border-brand-100 text-brand-700 px-2 py-0.5 rounded-full"
              >
                {k}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CreatorInsight() {
  const { data: feed, loading, refetch } = useData<Content[]>("/api/creator");
  const [urlInput, setUrlInput] = useState("");
  const [modal, setModal] = useState<{ url: string; platform: string } | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleUrlChange(val: string) {
    setUrlInput(val);
    // Auto-open modal when URL looks complete
    if (
      val.includes("tiktok.com/") ||
      val.includes("instagram.com/") ||
      val.includes("vm.tiktok.com/") ||
      val.includes("ig.me/")
    ) {
      setModal({ url: val, platform: detectPlatform(val) });
    }
  }

  function handleSaved() {
    setJustSaved(true);
    setUrlInput("");
    refetch();
    setTimeout(() => setJustSaved(false), 2000);
  }

  const high   = feed?.filter((c) => c.performanceLevel === "high").length ?? 0;
  const medium = feed?.filter((c) => c.performanceLevel === "medium").length ?? 0;
  const low    = feed?.filter((c) => c.performanceLevel === "low").length ?? 0;

  return (
    <div className="p-6 space-y-5 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Creator Insight</h1>
        <p className="text-sm text-gray-500 mt-0.5">Content → Product Decision System</p>
      </div>

      <StrategyBar show="content" />

      {/* URL Paste Zone */}
      <div className="card border-2 border-dashed border-brand-200 bg-brand-50/40">
        <p className="text-xs font-semibold text-brand-600 mb-2 flex items-center gap-1.5">
          <Link2 size={12} />
          Paste TikTok / Instagram link to log content
        </p>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={urlInput}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://www.tiktok.com/@creator/video/..."
            className="input flex-1 text-sm font-mono"
          />
          <button
            onClick={() => {
              if (urlInput.trim()) {
                setModal({ url: urlInput.trim(), platform: detectPlatform(urlInput) });
              }
            }}
            className="btn-primary px-4 text-sm flex items-center gap-1.5"
          >
            <Plus size={14} />
            Log
          </button>
        </div>
        {justSaved && (
          <p className="text-xs text-green-600 font-semibold mt-2 flex items-center gap-1">
            <Check size={12} />
            Saved! Keywords extracted automatically.
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center">
          <div className="text-2xl font-bold text-red-500">{high}</div>
          <div className="text-xs text-gray-400 mt-0.5">🔥 High</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-amber-500">{medium}</div>
          <div className="text-xs text-gray-400 mt-0.5">👍 Medium</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-gray-400">{low}</div>
          <div className="text-xs text-gray-400 mt-0.5">⚠️ Low</div>
        </div>
      </div>

      {/* Feed */}
      <div>
        <h2 className="font-semibold text-gray-800 text-sm mb-3">
          Content Signal Feed · Top {feed?.length ?? 0} ranked by score
        </h2>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={24} className="animate-spin text-gray-300" />
          </div>
        ) : !feed?.length ? (
          <div className="card text-center py-12">
            <Zap size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium text-sm">No content logged yet</p>
            <p className="text-gray-400 text-xs mt-1">
              Paste a TikTok or Instagram link above to start
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {feed.map((item) => (
              <ContentCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* Quick Input Modal */}
      {modal && (
        <QuickModal
          url={modal.url}
          platform={modal.platform}
          onClose={() => {
            setModal(null);
            setUrlInput("");
          }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
