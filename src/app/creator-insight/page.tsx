"use client";
import { useState } from "react";
import { useData, apiFetch } from "@/hooks/useData";
import { TrendingUp, MessageCircle, ShoppingBag, Loader2, Zap, ArrowUpRight, CheckCircle2, AlertCircle } from "lucide-react";
import { useLang } from "@/context/LangContext";

type Content = {
  id: string; title: string; platform: string; contentUrl: string | null;
  contentType: string | null; productTags: string; views: number; likes: number;
  comments: number; linkedSales: number; topComment: string | null;
  productSignal: string | null; signalScore: number; aiSignals: string;
  pushedToWarRoom: boolean; user: { name: string };
};

const PLATFORMS = ["TikTok", "Instagram", "YouTube", "Rednote", "Facebook"];
const CONTENT_TYPES = ["Unboxing", "Daily Use", "Work", "Travel", "Review", "Lifestyle"];
const PRODUCT_TAGS = ["Wallet", "Bag", "Luggage", "Backpack", "Tote", "Crossbody", "Accessories"];

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function detectPlatform(url: string): string {
  if (url.includes("tiktok.com"))   return "TikTok";
  if (url.includes("instagram.com")) return "Instagram";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "YouTube";
  if (url.includes("xiaohongshu") || url.includes("rednote")) return "Rednote";
  if (url.includes("facebook.com")) return "Facebook";
  return "TikTok";
}

function scoreLabel(score: number): { label: string; color: string } {
  if (score >= 70) return { label: "HIGH", color: "text-red-600 bg-red-50 border-red-200" };
  if (score >= 40) return { label: "MEDIUM", color: "text-amber-600 bg-amber-50 border-amber-200" };
  return { label: "LOW", color: "text-gray-500 bg-gray-50 border-gray-200" };
}

const EMPTY = {
  contentUrl: "", platform: "TikTok", title: "", contentType: "",
  productTags: [] as string[], views: "", likes: "", comments: "",
  linkedSales: "", topComment: "",
};

export default function CreatorInsight() {
  const { t } = useLang();
  const { data: videos, loading, refetch } = useData<Content[]>("/api/creator");
  const [step, setStep]     = useState<1 | 2 | "done">(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm]     = useState(EMPTY);
  const [result, setResult] = useState<{ aiSignals: string[]; signalScore: number; pushedToWarRoom: boolean } | null>(null);

  function handleUrlChange(url: string) {
    setForm(f => ({ ...f, contentUrl: url, platform: url ? detectPlatform(url) : f.platform }));
  }

  function toggleTag(tag: string) {
    setForm(f => ({
      ...f,
      productTags: f.productTags.includes(tag)
        ? f.productTags.filter(t => t !== tag)
        : f.productTags.length < 2 ? [...f.productTags, tag] : f.productTags,
    }));
  }

  async function handleSubmit() {
    if (!form.title || !form.contentType) return;
    setSaving(true);
    try {
      const res = await apiFetch("/api/creator", {
        method: "POST",
        body: JSON.stringify({
          platform:    form.platform,
          title:       form.title || form.contentUrl,
          contentUrl:  form.contentUrl || null,
          contentType: form.contentType,
          productTags: form.productTags,
          views:       parseInt(form.views || "0"),
          likes:       parseInt(form.likes || "0"),
          comments:    parseInt(form.comments || "0"),
          linkedSales: parseInt(form.linkedSales || "0"),
          topComment:  form.topComment || null,
        }),
      });
      setResult({ aiSignals: res.aiSignals ?? [], signalScore: res.signalScore ?? 0, pushedToWarRoom: res.pushedToWarRoom ?? false });
      setStep("done");
      refetch();
    } finally {
      setSaving(false);
    }
  }

  function reset() { setForm(EMPTY); setStep(1); setResult(null); }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">{t("cr_title")}</h1>
          <p className="text-sm text-gray-400 mt-0.5">Content → Signal → War Room</p>
        </div>
        {step === "done" && (
          <button className="btn-primary" onClick={reset}>+ Log Content</button>
        )}
      </div>

      {/* Input Form */}
      {step !== "done" && (
        <div className="card space-y-5">
          <div className="flex items-center gap-3 mb-1">
            {[1, 2].map(s => (
              <div key={s} className="flex items-center gap-1.5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= s ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-400"}`}>{s}</div>
                <span className={`text-xs font-medium ${step >= s ? "text-gray-800" : "text-gray-400"}`}>{s === 1 ? "内容信息" : "数据 & 评论"}</span>
                {s === 1 && <div className="w-8 h-px bg-gray-200 mx-1" />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-4">
              {/* URL */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Content Link</label>
                <input className="input font-mono text-sm"
                  placeholder="https://www.tiktok.com/@... or Instagram URL"
                  value={form.contentUrl}
                  onChange={e => handleUrlChange(e.target.value)} />
                {form.contentUrl && (
                  <p className="text-xs text-brand-600 mt-1 font-medium">✓ Platform: {form.platform}</p>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Content Title / Description</label>
                <input className="input" placeholder="e.g. Slim Wallet Unboxing – Summer Collection"
                  value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>

              {/* Content Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Content Type</label>
                <div className="flex flex-wrap gap-2">
                  {CONTENT_TYPES.map(type => (
                    <button key={type} onClick={() => setForm(f => ({ ...f, contentType: type }))}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${form.contentType === type ? "bg-brand-600 text-white border-brand-600" : "bg-white text-gray-600 border-gray-200 hover:border-brand-400"}`}>
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Tags */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Product Tags <span className="text-gray-400 font-normal">(max 2)</span></label>
                <div className="flex flex-wrap gap-2">
                  {PRODUCT_TAGS.map(tag => (
                    <button key={tag} onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${form.productTags.includes(tag) ? "bg-brand-600 text-white border-brand-600" : "bg-white text-gray-600 border-gray-200 hover:border-brand-400"}`}>
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <button className="btn-primary w-full"
                onClick={() => setStep(2)}
                disabled={!form.title || !form.contentType}>
                Next → Add Stats
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              {/* Quick Stats */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Performance Stats</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { key: "views",       label: "Views",        icon: <TrendingUp size={12} /> },
                    { key: "likes",       label: "Likes",        icon: null },
                    { key: "comments",    label: "Comments",     icon: <MessageCircle size={12} /> },
                    { key: "linkedSales", label: "Linked Sales", icon: <ShoppingBag size={12} /> },
                  ].map(({ key, label, icon }) => (
                    <div key={key}>
                      <label className="flex items-center gap-1 text-xs text-gray-500 mb-1">{icon}{label}</label>
                      <input type="number" className="input text-center" placeholder="0"
                        value={form[key as keyof typeof form] as string}
                        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Comments */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Paste Top Comments <span className="text-gray-400 font-normal">(AI will extract signals)</span>
                </label>
                <textarea className="textarea" rows={3}
                  placeholder={"\"Can this come in brown?\"\n\"Is it waterproof?\"\n\"Need bigger size for laptop\""}
                  value={form.topComment}
                  onChange={e => setForm(f => ({ ...f, topComment: e.target.value }))} />
              </div>

              <div className="flex gap-3">
                <button className="btn-secondary flex-1" onClick={() => setStep(1)}>← Back</button>
                <button className="btn-primary flex-2 flex items-center justify-center gap-2"
                  onClick={handleSubmit} disabled={saving}>
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {saving ? "Analyzing..." : "Submit & Generate Signals →"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Result Card */}
      {step === "done" && result && (
        <div className="card space-y-4 border-2 border-brand-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={24} className="text-green-500" />
            <div>
              <p className="font-bold text-gray-900">Content logged!</p>
              <p className="text-sm text-gray-500">Signal analysis complete</p>
            </div>
            <div className="ml-auto">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${scoreLabel(result.signalScore).color}`}>
                {scoreLabel(result.signalScore).label} — {result.signalScore}/100
              </span>
            </div>
          </div>

          {result.aiSignals.length > 0 && (
            <div className="bg-brand-50 border border-brand-100 rounded-xl p-4">
              <p className="text-xs font-bold text-brand-600 mb-2 flex items-center gap-1"><Zap size={12} /> DETECTED SIGNALS</p>
              <div className="space-y-1">
                {result.aiSignals.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-brand-800">
                    <span className="text-brand-400">→</span> {s}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.pushedToWarRoom && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-3">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700 font-semibold">
                Signal score ≥ 70 — Auto-pushed to Product War Room
              </p>
              <ArrowUpRight size={14} className="text-red-500 ml-auto" />
            </div>
          )}
        </div>
      )}

      {/* Content Feed */}
      <div>
        <h2 className="font-semibold text-gray-800 mb-3">Content Signal Feed</h2>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-gray-300" /></div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {(videos ?? []).map(v => {
              const signals: string[] = (() => { try { return JSON.parse(v.aiSignals); } catch { return []; } })();
              const tags: string[]    = (() => { try { return JSON.parse(v.productTags); } catch { return []; } })();
              const score             = scoreLabel(v.signalScore);
              return (
                <div key={v.id} className="card space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 truncate">{v.title}</span>
                        <span className="badge bg-gray-100 text-gray-600">{v.platform}</span>
                        {v.contentType && <span className="badge bg-blue-50 text-blue-600">{v.contentType}</span>}
                        {tags.map(tag => <span key={tag} className="badge bg-brand-50 text-brand-600">{tag}</span>)}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">by {v.user.name}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${score.color}`}>
                        {score.label} {v.signalScore > 0 ? v.signalScore : ""}
                      </span>
                      {v.pushedToWarRoom && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-200">WAR ROOM ↑</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { val: fmt(v.views),       label: "Views",   color: "bg-gray-50"      },
                      { val: fmt(v.likes),        label: "Likes",   color: "bg-gray-50"      },
                      { val: fmt(v.comments),     label: "Comments", color: "bg-gray-50"     },
                      { val: String(v.linkedSales), label: "Sales", color: "bg-brand-50 text-brand-700" },
                    ].map(({ val, label, color }) => (
                      <div key={label} className={`${color} rounded-xl p-2 text-center`}>
                        <div className="text-sm font-bold">{val}</div>
                        <div className="text-[10px] text-gray-400">{label}</div>
                      </div>
                    ))}
                  </div>

                  {signals.length > 0 && (
                    <div className="bg-brand-50 border border-brand-100 rounded-xl p-3">
                      <p className="text-[10px] font-bold text-brand-500 mb-1.5 flex items-center gap-1"><Zap size={10} /> SIGNALS DETECTED</p>
                      <div className="flex flex-wrap gap-1.5">
                        {signals.map((s, i) => (
                          <span key={i} className="text-xs bg-white border border-brand-200 text-brand-700 px-2 py-0.5 rounded-full">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {v.topComment && !signals.length && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                      <p className="text-[10px] text-blue-400 font-semibold mb-1">TOP COMMENT</p>
                      <p className="text-sm text-blue-800 italic">"{v.topComment}"</p>
                    </div>
                  )}
                </div>
              );
            })}
            {!videos?.length && <p className="text-sm text-gray-400 text-center py-6">No content logged yet</p>}
          </div>
        )}
      </div>
    </div>
  );
}
