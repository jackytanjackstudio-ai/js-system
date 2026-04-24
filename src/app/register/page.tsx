"use client";
import { useState, useEffect } from "react";
import { Loader2, Eye, EyeOff, CheckCircle } from "lucide-react";
import Link from "next/link";

type Outlet = { id: string; name: string; city: string };

export default function RegisterPage() {
  const [name,       setName]       = useState("");
  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [confirm,    setConfirm]    = useState("");
  const [outletId,   setOutletId]   = useState("");
  const [phone,      setPhone]      = useState("");
  const [showPw,     setShowPw]     = useState(false);
  const [error,      setError]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [outlets,    setOutlets]    = useState<Outlet[]>([]);

  useEffect(() => {
    fetch("/api/outlets")
      .then(r => r.json())
      .then(d => setOutlets(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const pwMatch  = confirm && password !== confirm;
  const pwStrong = password.length >= 6;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Passwords do not match"); return; }
    if (!pwStrong)             { setError("Password must be at least 6 characters"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name, email, password, outletId: outletId || null, phone: phone || null }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Registration failed"); return; }
      window.location.href = "/";
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-stone-950 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-sm my-auto">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-600 mb-4">
            <span className="text-2xl font-black text-white">JS</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="text-stone-400 text-sm mt-1">JackStudio OS · Staff Registration</p>
        </div>

        {/* Card */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1.5">Full Name *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2.5 text-white placeholder-stone-500 focus:outline-none focus:border-brand-500 text-sm"
                placeholder="e.g. Ahmad Faiz"
                required
                autoFocus
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1.5">Email *</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2.5 text-white placeholder-stone-500 focus:outline-none focus:border-brand-500 text-sm"
                placeholder="you@email.com"
                required
                autoComplete="email"
              />
            </div>

            {/* Outlet */}
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1.5">Your Outlet / Store *</label>
              <select
                value={outletId}
                onChange={e => setOutletId(e.target.value)}
                required
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-brand-500 text-sm"
              >
                <option value="">Select your outlet…</option>
                {outlets.map(o => (
                  <option key={o.id} value={o.id}>{o.name} · {o.city}</option>
                ))}
              </select>
            </div>

            {/* Phone (optional) */}
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1.5">
                Phone <span className="text-stone-500 font-normal">(optional)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2.5 text-white placeholder-stone-500 focus:outline-none focus:border-brand-500 text-sm"
                placeholder="01x-xxxxxxx"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1.5">Password *</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2.5 text-white placeholder-stone-500 focus:outline-none focus:border-brand-500 text-sm pr-10"
                  placeholder="Min. 6 characters"
                  required
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {password && (
                <div className={`flex items-center gap-1 mt-1 text-xs ${pwStrong ? "text-green-400" : "text-amber-400"}`}>
                  <CheckCircle size={11} />
                  {pwStrong ? "Strong enough" : "Too short — need 6+ characters"}
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1.5">Confirm Password *</label>
              <input
                type={showPw ? "text" : "password"}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className={`w-full bg-stone-800 border rounded-lg px-3 py-2.5 text-white placeholder-stone-500 focus:outline-none text-sm ${
                  pwMatch ? "border-red-600 focus:border-red-500" : "border-stone-700 focus:border-brand-500"
                }`}
                placeholder="Re-enter password"
                required
                autoComplete="new-password"
              />
              {pwMatch && <p className="text-xs text-red-400 mt-1">Passwords do not match</p>}
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-950 border border-red-800 text-red-300 rounded-lg px-3 py-2 text-sm">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !!pwMatch || !pwStrong}
              className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Creating account…" : "Create Account & Sign In"}
            </button>
          </form>
        </div>

        {/* Login link */}
        <p className="text-center text-stone-500 text-sm mt-5">
          Already have an account?{" "}
          <Link href="/login" className="text-brand-400 hover:text-brand-300 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
