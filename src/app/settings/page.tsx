"use client";
import { useState } from "react";
import { Settings, Users, Bell, Shield, Database, KeyRound, Loader2, CheckCircle2 } from "lucide-react";
import { useLang } from "@/context/LangContext";
import { apiFetch } from "@/hooks/useData";

function ChangePasswordCard() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.newPassword !== form.confirm) { setMsg({ type: "err", text: "New passwords do not match." }); return; }
    if (form.newPassword.length < 6) { setMsg({ type: "err", text: "Password must be at least 6 characters." }); return; }
    setSaving(true); setMsg(null);
    try {
      await apiFetch("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
      });
      setMsg({ type: "ok", text: "Password changed successfully!" });
      setForm({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (err: unknown) {
      const e = err as { message?: string };
      setMsg({ type: "err", text: e?.message ?? "Failed. Check your current password." });
    } finally { setSaving(false); }
  }

  return (
    <div className="card space-y-4">
      <h2 className="font-semibold text-gray-800 flex items-center gap-2">
        <KeyRound size={16} className="text-gray-500" /> Change Password
      </h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Current Password</label>
          <input type="password" required className="input w-full"
            value={form.currentPassword} onChange={e => setForm(f => ({ ...f, currentPassword: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">New Password</label>
          <input type="password" required minLength={6} className="input w-full"
            value={form.newPassword} onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Confirm New Password</label>
          <input type="password" required className="input w-full"
            value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} />
        </div>
        {msg && (
          <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-xl ${msg.type === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
            {msg.type === "ok" && <CheckCircle2 size={14} />}
            {msg.text}
          </div>
        )}
        <button type="submit" disabled={saving}
          className="btn-primary flex items-center gap-2 text-sm px-4 py-2 disabled:opacity-60">
          {saving && <Loader2 size={13} className="animate-spin" />}
          Update Password
        </button>
      </form>
    </div>
  );
}

export default function SettingsPage() {
  const { t } = useLang();

  const notifItems = [
    t("ex_check3"),
    t("ex_check4"),
    t("ex_check5"),
    "Execution task overdue warning",
    "New customer input logged",
  ];

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="page-title flex items-center gap-2">
          <Settings size={20} className="text-gray-500" />
          {t("set_title")}
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">{t("set_subtitle")}</p>
      </div>

      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <Users size={16} className="text-gray-500" /> {t("set_team")}
        </h2>
        <div className="space-y-2">
          {members.map((m, i) => (
            <div key={i} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold text-sm flex items-center justify-center">
                {m.label[0]}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-800">{m.label}</div>
                <div className="text-xs text-gray-400">{m.role}</div>
              </div>
              <span className="badge bg-green-100 text-green-700">{m.status}</span>
              <button className="text-xs text-gray-400 hover:text-gray-600">{t("set_edit")}</button>
            </div>
          ))}
        </div>
        <button className="btn-secondary text-sm">{t("set_invite")}</button>
      </div>

      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <Bell size={16} className="text-gray-500" /> {t("set_notif")}
        </h2>
        {notifItems.map((label, i) => (
          <div key={i} className="flex items-center justify-between">
            <span className="text-sm text-gray-700">{label}</span>
            <div className={`w-11 h-6 rounded-full transition-colors cursor-pointer ${i < 4 ? "bg-brand-500" : "bg-gray-200"} relative`}>
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow transition-all ${i < 4 ? "right-0.5" : "left-0.5"}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <Database size={16} className="text-gray-500" /> {t("set_data")}
        </h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t("set_week_start")}</label>
            <select className="select">
              <option>Monday</option>
              <option>Sunday</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t("set_currency")}</label>
            <select className="select">
              <option>MYR (RM)</option>
              <option>USD ($)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t("set_rev_target")}</label>
            <input type="number" className="input" defaultValue={80000} />
          </div>
        </div>
      </div>

      <div className="card space-y-3">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <Shield size={16} className="text-gray-500" /> {t("set_security")}
        </h2>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between items-center p-2.5 bg-gray-50 rounded-xl">
            <span>2-Factor Authentication</span>
            <span className="badge bg-red-100 text-red-600">Off</span>
          </div>
          <div className="flex justify-between items-center p-2.5 bg-gray-50 rounded-xl">
            <span>Data Export Log</span>
            <span className="badge bg-green-100 text-green-700">Enabled</span>
          </div>
        </div>
      </div>

      <ChangePasswordCard />

      <button className="btn-primary w-full py-3">{t("set_save")}</button>
    </div>
  );
}
