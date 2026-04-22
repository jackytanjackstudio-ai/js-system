"use client";
import { useState } from "react";
import { useData, apiFetch } from "@/hooks/useData";
import { Play, TrendingUp, MessageCircle, ShoppingBag, CheckCircle, Loader2 } from "lucide-react";
import { useLang } from "@/context/LangContext";

type Content = { id: string; title: string; platform: string; views: number; likes: number; comments: number; linkedSales: number; topComment: string | null; productSignal: string | null; user: { name: string }; };

const platforms = ["TikTok", "Instagram", "YouTube", "Rednote", "Facebook"];

function fmt(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000)    return `${(n / 1000).toFixed(0)}K`;
  return String(n);
}

export default function CreatorInsight() {
  const { t } = useLang();
  const { data: videos, loading, refetch } = useData<Content[]>("/api/creator");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ platform: "TikTok", title: "", views: "", likes: "", comments: "", linkedSales: "", topComment: "", productSignal: "" });

  async function handleSubmit() {
    if (!form.title) return;
    setSaving(true);
    try {
      await apiFetch("/api/creator", {
        method: "POST",
        body: JSON.stringify({
          platform: form.platform,
          title: form.title,
          views: parseInt(form.views || "0"),
          likes: parseInt(form.likes || "0"),
          comments: parseInt(form.comments || "0"),
          linkedSales: parseInt(form.linkedSales || "0"),
          topComment: form.topComment || null,
          productSignal: form.productSignal || null,
        }),
      });
      setSubmitted(true);
      refetch();
      setForm({ platform: "TikTok", title: "", views: "", likes: "", comments: "", linkedSales: "", topComment: "", productSignal: "" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">{t("cr_title")}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{t("cr_subtitle")}</p>
        </div>
        <button className="btn-primary" onClick={() => setSubmitted(false)}>{t("cr_log_btn")}</button>
      </div>

      {!submitted ? (
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-800">{t("cr_log_title")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t("cr_platform")}</label>
              <select className="select" value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}>
                {platforms.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t("cr_content_title")}</label>
              <input className="input" placeholder="e.g. Slim Wallet Unboxing – Summer Collection"
                value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t("cr_views")}</label>
              <input type="number" className="input" placeholder="0"
                value={form.views} onChange={e => setForm(f => ({ ...f, views: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t("cr_likes")}</label>
              <input type="number" className="input" placeholder="0"
                value={form.likes} onChange={e => setForm(f => ({ ...f, likes: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Comments</label>
              <input type="number" className="input" placeholder="0"
                value={form.comments} onChange={e => setForm(f => ({ ...f, comments: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t("cr_linked_sales")}</label>
              <input type="number" className="input" placeholder="0"
                value={form.linkedSales} onChange={e => setForm(f => ({ ...f, linkedSales: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t("cr_top_comment")}</label>
            <textarea className="textarea" rows={2} placeholder={t("cr_top_comment_ph")}
              value={form.topComment} onChange={e => setForm(f => ({ ...f, topComment: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t("cr_product_signal")}</label>
            <input className="input" placeholder='e.g. Cabin Luggage 20" — multiple comments asking'
              value={form.productSignal} onChange={e => setForm(f => ({ ...f, productSignal: e.target.value }))} />
          </div>
          <button className="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
            onClick={handleSubmit} disabled={!form.title || saving}>
            {saving && <Loader2 size={14} className="animate-spin" />}
            {t("cr_submit")}
          </button>
        </div>
      ) : (
        <div className="card flex flex-col items-center py-8 gap-3">
          <CheckCircle size={36} className="text-green-500" />
          <p className="font-semibold text-gray-800">{t("cr_success")}</p>
          <button className="btn-secondary" onClick={() => setSubmitted(false)}>{t("cr_log_more")}</button>
        </div>
      )}

      <div>
        <h2 className="font-semibold text-gray-800 mb-3">{t("cr_this_week")}</h2>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-gray-300" /></div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {(videos ?? []).map((v) => (
              <div key={v.id} className="card space-y-3">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Play size={18} className="text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">{v.title}</span>
                      <span className="badge bg-gray-100 text-gray-600">{v.platform}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{t("cr_by")} {v.user.name}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="text-sm font-bold text-gray-900">{fmt(v.views)}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5 flex items-center justify-center gap-1">
                      <TrendingUp size={10} /> {t("cr_views")}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="text-sm font-bold text-gray-900">{fmt(v.likes)}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{t("cr_likes")}</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="text-sm font-bold text-gray-900">{fmt(v.comments)}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5 flex items-center justify-center gap-1">
                      <MessageCircle size={10} />
                    </div>
                  </div>
                  <div className="bg-brand-50 rounded-xl p-3 text-center">
                    <div className="text-sm font-bold text-brand-700">{v.linkedSales}</div>
                    <div className="text-[10px] text-brand-500 mt-0.5 flex items-center justify-center gap-1">
                      <ShoppingBag size={10} /> {t("cr_linked_sales")}
                    </div>
                  </div>
                </div>
                {(v.topComment || v.productSignal) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {v.topComment && (
                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                        <div className="text-[10px] text-blue-400 font-semibold mb-1">{t("cr_top_comment_tag")}</div>
                        <p className="text-sm text-blue-800 italic">"{v.topComment}"</p>
                      </div>
                    )}
                    {v.productSignal && (
                      <div className="bg-brand-50 border border-brand-100 rounded-xl p-3">
                        <div className="text-[10px] text-brand-400 font-semibold mb-1">{t("cr_signal_tag")}</div>
                        <p className="text-sm text-brand-800 font-semibold">{v.productSignal}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {!videos?.length && <p className="text-sm text-gray-400 text-center py-6">No creator content logged yet</p>}
          </div>
        )}
      </div>
    </div>
  );
}
