"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login failed");
        setLoading(false);
        return;
      }
      // Hard redirect — forces full page reload so middleware sees the new cookie
      window.location.href = "/";
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    // Full-screen overlay — covers sidebar from root layout
    <div className="fixed inset-0 z-[9999] bg-stone-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-600 mb-4">
            <span className="text-2xl font-black text-white">JS</span>
          </div>
          <h1 className="text-2xl font-bold text-white">JackStudio OS</h1>
          <p className="text-stone-400 text-sm mt-1">Business Operating System</p>
        </div>

        {/* Card */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2.5 text-white placeholder-stone-500 focus:outline-none focus:border-brand-500 text-sm"
                placeholder="you@jackstudio.my"
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2.5 text-white placeholder-stone-500 focus:outline-none focus:border-brand-500 text-sm"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="bg-red-950 border border-red-800 text-red-300 rounded-lg px-3 py-2 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center text-stone-500 text-sm mt-5">
          New staff?{" "}
          <Link href="/register" className="text-brand-400 hover:text-brand-300 font-medium">
            Create an account
          </Link>
        </p>
        <p className="text-center text-stone-600 text-xs mt-3">
          JackStudio OS · Internal Use Only
        </p>
      </div>
    </div>
  );
}
