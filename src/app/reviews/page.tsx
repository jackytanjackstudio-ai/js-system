"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Star, Plus, Filter, Copy, Zap, CheckCircle2, Loader2, X,
  MessageSquare, Trash2, Check,
} from "lucide-react";
import { apiFetch } from "@/hooks/useData";
import { useAuth } from "@/context/AuthContext";

type Review = {
  id: string;
  store: string;
  rating: number;
  reviewText: string;
  productTag: string;
  createdAt: string;
  usedForContent: boolean;
};

type GeneratedContent = {
  tiktok_script: string;
  sales_script: string;
  ecommerce_copy: string;
};

type Outlet = { id: string; name: string };

function StarRow({ rating, onChange }: { rating: number; onChange?: (r: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange?.(i)}
          className={onChange ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default"}
        >
          <Star
            size={18}
            className={
              i <= rating
                ? "text-amber-400 fill-amber-400"
                : "text-gray-200 fill-gray-200"
            }
          />
        </button>
      ))}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button
      onClick={handleCopy}
      className="btn-secondary flex items-center gap-1.5 text-xs px-3 py-1.5"
    >
      {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function ContentBlock({ label, content }: { label: string; content: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</span>
        <CopyButton text={content} />
      </div>
      <pre className="text-xs text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-xl p-3.5 leading-relaxed font-sans border border-gray-100">
        {content}
      </pre>
    </div>
  );
}

function ReviewCard({
  review,
  canGenerate,
  generating,
  onMarkUsed,
  onGenerate,
  onDelete,
}: {
  review: Review;
  canGenerate: boolean;
  generating: boolean;
  onMarkUsed: () => void;
  onGenerate: () => void;
  onDelete: () => void;
}) {
  const date = new Date(review.createdAt).toLocaleDateString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="card flex flex-col gap-3">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="badge bg-brand-50 text-brand-700">{review.store}</span>
            <span className="badge bg-gray-100 text-gray-500">{review.productTag}</span>
            {review.usedForContent && (
              <span className="badge bg-green-50 text-green-600 flex items-center gap-1">
                <CheckCircle2 size={10} />
                Used
              </span>
            )}
          </div>
          <div className="mt-1.5">
            <StarRow rating={review.rating} />
          </div>
        </div>
        <button
          onClick={onDelete}
          className="text-gray-300 hover:text-red-400 transition-colors p-1 rounded shrink-0"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Review text */}
      <p className="text-sm text-gray-700 leading-relaxed line-clamp-4">
        &ldquo;{review.reviewText}&rdquo;
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-gray-50">
        <span className="text-[11px] text-gray-400">{date}</span>
        <div className="flex items-center gap-1.5">
          {!review.usedForContent && (
            <button
              onClick={onMarkUsed}
              className="btn-secondary text-xs px-2.5 py-1.5 flex items-center gap-1"
            >
              <Check size={11} />
              Mark Used
            </button>
          )}
          {canGenerate && (
            <button
              onClick={onGenerate}
              disabled={generating}
              className="btn-primary text-xs px-2.5 py-1.5 flex items-center gap-1"
            >
              {generating ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <Zap size={11} />
              )}
              {generating ? "Generating…" : "Generate"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AddModal({
  outlets,
  onClose,
  onSaved,
}: {
  outlets: Outlet[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    store: "",
    rating: 5,
    reviewText: "",
    productTag: "",
  });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!form.store || !form.reviewText || !form.productTag) return;
    setSubmitting(true);
    try {
      await apiFetch("/api/reviews", {
        method: "POST",
        body: JSON.stringify(form),
      });
      onSaved();
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  const valid = form.store && form.reviewText.trim() && form.productTag.trim();

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Add Review</h2>
          <button onClick={onClose}>
            <X size={18} className="text-gray-400 hover:text-gray-600" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {/* Store */}
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Store</label>
            {outlets.length > 0 ? (
              <select
                value={form.store}
                onChange={(e) => setForm((f) => ({ ...f, store: e.target.value }))}
                className="input w-full text-sm"
              >
                <option value="">Select store…</option>
                {outlets.map((o) => (
                  <option key={o.id} value={o.name}>
                    {o.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={form.store}
                onChange={(e) => setForm((f) => ({ ...f, store: e.target.value }))}
                placeholder="e.g. Sunway"
                className="input w-full text-sm"
              />
            )}
          </div>

          {/* Rating */}
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">
              Rating
            </label>
            <StarRow
              rating={form.rating}
              onChange={(r) => setForm((f) => ({ ...f, rating: r }))}
            />
          </div>

          {/* Review Text */}
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">
              Review Text
            </label>
            <textarea
              value={form.reviewText}
              onChange={(e) => setForm((f) => ({ ...f, reviewText: e.target.value }))}
              placeholder="Paste or type what the customer said…"
              rows={4}
              className="input w-full text-sm resize-none"
            />
          </div>

          {/* Product Tag */}
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">
              Product Tag
            </label>
            <input
              value={form.productTag}
              onChange={(e) => setForm((f) => ({ ...f, productTag: e.target.value }))}
              placeholder="e.g. belt, wallet, backpack"
              className="input w-full text-sm"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting || !valid}
            className="btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Plus size={14} />
            )}
            Add Review
          </button>
        </div>
      </div>
    </div>
  );
}

function GeneratedModal({
  review,
  content,
  onClose,
}: {
  review: Review;
  content: GeneratedContent;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-3 shrink-0">
          <div>
            <h2 className="font-semibold text-gray-900">Generated Content</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              From {review.store} · {review.productTag} ·{" "}
              <StarRow rating={review.rating} />
            </p>
          </div>
          <button onClick={onClose}>
            <X size={18} className="text-gray-400 hover:text-gray-600" />
          </button>
        </div>
        <div className="p-5 space-y-5 overflow-y-auto">
          {content.tiktok_script && (
            <ContentBlock label="TikTok Script" content={content.tiktok_script} />
          )}
          {content.sales_script && (
            <ContentBlock label="Sales Script" content={content.sales_script} />
          )}
          {content.ecommerce_copy && (
            <ContentBlock label="E-commerce Copy" content={content.ecommerce_copy} />
          )}
        </div>
        <div className="p-4 border-t border-gray-100 shrink-0">
          <p className="text-xs text-gray-400 text-center">
            Review marked as used automatically
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [filterStore, setFilterStore] = useState("");
  const [filterTag, setFilterTag] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [genResult, setGenResult] = useState<{
    review: Review;
    content: GeneratedContent;
  } | null>(null);

  const canGenerate = ["admin", "manager", "product"].includes(user?.role ?? "");
  const canDelete = ["admin", "manager"].includes(user?.role ?? "");

  const loadReviews = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStore) params.set("store", filterStore);
    if (filterTag) params.set("productTag", filterTag);
    try {
      const data = await apiFetch(`/api/reviews?${params.toString()}`);
      setReviews(data?.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [filterStore, filterTag]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    apiFetch("/api/outlets")
      .then((d) => setOutlets(d?.data ?? []))
      .catch(() => {});
  }, []);

  async function handleMarkUsed(id: string) {
    await apiFetch(`/api/reviews/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ usedForContent: true }),
    });
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, usedForContent: true } : r))
    );
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this review?")) return;
    await apiFetch(`/api/reviews/${id}`, { method: "DELETE" });
    setReviews((prev) => prev.filter((r) => r.id !== id));
  }

  async function handleGenerate(review: Review) {
    setGeneratingId(review.id);
    try {
      const data = await apiFetch(`/api/reviews/${review.id}/generate`, {
        method: "POST",
      });
      if (data?.data) {
        setGenResult({ review, content: data.data });
        setReviews((prev) =>
          prev.map((r) => (r.id === review.id ? { ...r, usedForContent: true } : r))
        );
      }
    } finally {
      setGeneratingId(null);
    }
  }

  // Stats
  const total = reviews.length;
  const used = reviews.filter((r) => r.usedForContent).length;
  const unused = total - used;
  const avgRating =
    total > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(1)
      : "–";

  // Unique filter options derived from all loaded reviews (pre-filter)
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  useEffect(() => {
    if (!filterStore && !filterTag) setAllReviews(reviews);
  }, [reviews, filterStore, filterTag]);

  const storeOptions = Array.from(new Set(allReviews.map((r) => r.store))).sort();
  const tagOptions = Array.from(new Set(allReviews.map((r) => r.productTag))).sort();

  return (
    <div className="p-6 space-y-5 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Review Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Customer reviews → content generation
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="btn-primary flex items-center gap-2 text-sm px-4 py-2"
        >
          <Plus size={15} />
          Add Review
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card text-center">
          <div className="text-2xl font-bold text-gray-900">{total}</div>
          <div className="text-xs text-gray-400 mt-0.5">Total Reviews</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">{used}</div>
          <div className="text-xs text-gray-400 mt-0.5">Used for Content</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-brand-600">{unused}</div>
          <div className="text-xs text-gray-400 mt-0.5">Available</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-amber-500">{avgRating} ★</div>
          <div className="text-xs text-gray-400 mt-0.5">Avg Rating</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <Filter size={14} className="text-gray-400 shrink-0" />
        <select
          value={filterStore}
          onChange={(e) => setFilterStore(e.target.value)}
          className="input text-sm px-3 py-1.5"
        >
          <option value="">All Stores</option>
          {storeOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={filterTag}
          onChange={(e) => setFilterTag(e.target.value)}
          className="input text-sm px-3 py-1.5"
        >
          <option value="">All Products</option>
          {tagOptions.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        {(filterStore || filterTag) && (
          <button
            onClick={() => {
              setFilterStore("");
              setFilterTag("");
            }}
            className="btn-secondary text-xs px-3 py-1.5"
          >
            Clear
          </button>
        )}
      </div>

      {/* Review Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-gray-300" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="card text-center py-14">
          <MessageSquare size={32} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium text-sm">No reviews yet</p>
          <p className="text-gray-400 text-xs mt-1">
            Add the first review to start generating content
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="btn-primary text-sm px-4 py-2 mt-4 inline-flex items-center gap-2"
          >
            <Plus size={14} />
            Add Review
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              canGenerate={canGenerate}
              generating={generatingId === review.id}
              onMarkUsed={() => handleMarkUsed(review.id)}
              onGenerate={() => handleGenerate(review)}
              onDelete={() => canDelete && handleDelete(review.id)}
            />
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <AddModal
          outlets={outlets}
          onClose={() => setShowAdd(false)}
          onSaved={loadReviews}
        />
      )}

      {/* Generated Content Modal */}
      {genResult && (
        <GeneratedModal
          review={genResult.review}
          content={genResult.content}
          onClose={() => setGenResult(null)}
        />
      )}
    </div>
  );
}
