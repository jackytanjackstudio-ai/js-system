"use client";
import { useState } from "react";
import { useData, apiFetch } from "@/hooks/useData";
import { CheckSquare, Clock, AlertCircle, PlusCircle, CheckCircle2, Flame, Timer, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/context/LangContext";

type Task = { id: string; title: string; type: string; assignee: string; due: string; status: string; result: string | null; };
type TaskStatus = "Completed" | "In Progress" | "Not Started";

const typeColor: Record<string, string> = {
  Creator:  "bg-purple-100 text-purple-700",
  Store:    "bg-brand-100 text-brand-700",
  Campaign: "bg-pink-100 text-pink-700",
};

function getDuePressure(due: string, status: string) {
  if (status === "Completed") return { label: "", className: "", urgent: false };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(due);
  const days = Math.ceil((dueDate.getTime() - today.getTime()) / 86400000);
  if (days < 0)  return { label: "OVERDUE",   className: "bg-red-100 text-red-700 animate-pulse", urgent: true };
  if (days === 0) return { label: "TODAY",     className: "bg-red-50 text-red-600",                urgent: true };
  if (days === 1) return { label: "TOMORROW",  className: "bg-amber-100 text-amber-700",            urgent: true };
  return { label: `${days}d left`, className: "bg-gray-100 text-gray-500", urgent: false };
}

export default function Execution() {
  const { t } = useLang();
  const { data: tasks, loading, refetch } = useData<Task[]>("/api/tasks");
  const [updating, setUpdating] = useState<string | null>(null);

  const statusConfig = {
    "Completed":   { labelKey: "status_completed",  color: "text-green-700", bg: "bg-green-100" },
    "In Progress": { labelKey: "status_inprogress",  color: "text-blue-700",  bg: "bg-blue-100"  },
    "Not Started": { labelKey: "status_notstarted",  color: "text-gray-500",  bg: "bg-gray-100"  },
  } as const;

  async function cycle(task: Task) {
    const order: TaskStatus[] = ["Not Started", "In Progress", "Completed"];
    const cur = order.indexOf(task.status as TaskStatus);
    const next = order[(cur + 1) % 3];
    setUpdating(task.id);
    try {
      await apiFetch(`/api/tasks/${task.id}`, { method: "PATCH", body: JSON.stringify({ status: next }) });
      refetch();
    } finally {
      setUpdating(null);
    }
  }

  const list = tasks ?? [];
  const sorted = [...list].sort((a, b) => {
    const score = (t: Task) => {
      if (t.status === "Completed") return 99;
      const p = getDuePressure(t.due, t.status);
      if (p.label === "OVERDUE")  return 0;
      if (p.label === "TODAY")    return 1;
      if (p.label === "TOMORROW") return 2;
      if (t.status === "In Progress") return 3;
      return 4;
    };
    return score(a) - score(b);
  });

  const done    = list.filter(t => t.status === "Completed").length;
  const total   = list.length;
  const overdue = list.filter(t => getDuePressure(t.due, t.status).label === "OVERDUE").length;

  const checks = [t("ex_check1"), t("ex_check2"), t("ex_check3"), t("ex_check4"), t("ex_check5")];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">{t("ex_title")}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{t("ex_subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          {overdue > 0 && (
            <span className="flex items-center gap-1.5 bg-red-100 text-red-700 text-sm font-semibold px-3 py-1.5 rounded-full animate-pulse">
              <Flame size={14} /> {overdue} {t("sf_overdue")}
            </span>
          )}
          <button className="btn-primary flex items-center gap-2">
            <PlusCircle size={14} /> {t("ex_add")}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gray-300" /></div>
      ) : (
        <>
          {/* Progress */}
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">{t("ex_progress")}</span>
              <span className="text-sm font-bold text-brand-600">{done} / {total} {t("ex_done")}</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-brand-500 rounded-full transition-all duration-500"
                style={{ width: total ? `${(done / total) * 100}%` : "0%" }} />
            </div>
            <div className="flex gap-4 mt-3">
              {(["Completed", "In Progress", "Not Started"] as TaskStatus[]).map((s) => {
                const count = list.filter(task => task.status === s).length;
                const sc = statusConfig[s];
                return (
                  <div key={s} className="flex items-center gap-1.5">
                    <span className={cn("w-2 h-2 rounded-full", sc.bg)} />
                    <span className="text-xs text-gray-500">{t(sc.labelKey)}: <strong>{count}</strong></span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Task list */}
          <div className="space-y-3">
            {sorted.map((task) => {
              const sc = statusConfig[task.status as TaskStatus] ?? statusConfig["Not Started"];
              const due = getDuePressure(task.due, task.status);
              return (
                <div key={task.id} className={cn("card flex gap-4 items-start transition-all",
                  task.status === "Completed" && "opacity-60",
                  due.label === "OVERDUE" && "border-l-4 border-red-400")}>
                  <button onClick={() => cycle(task)}
                    disabled={updating === task.id}
                    className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
                      task.status === "Completed" ? "bg-green-100" : task.status === "In Progress" ? "bg-blue-100" : "bg-gray-100")}>
                    {updating === task.id ? <Loader2 size={16} className="animate-spin text-gray-400" /> :
                     task.status === "Completed" ? <CheckCircle2 size={18} className="text-green-600" /> :
                     task.status === "In Progress" ? <Clock size={18} className="text-blue-500" /> :
                     <AlertCircle size={18} className="text-gray-400" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn("font-semibold text-sm", task.status === "Completed" && "line-through text-gray-400")}>
                        {task.title}
                      </span>
                      <span className={cn("badge", typeColor[task.type] ?? "bg-gray-100 text-gray-600")}>{task.type}</span>
                      {due.label && (
                        <span className={cn("badge font-bold text-[10px] flex items-center gap-1", due.className)}>
                          <Timer size={9} />
                          {due.label === "OVERDUE" ? t("sf_overdue") :
                           due.label === "TODAY" ? t("sf_today") :
                           due.label === "TOMORROW" ? t("sf_tomorrow") :
                           `${due.label.replace("d left", "")} ${t("sf_days")}`}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                      <span>{t("ex_assignee")} <strong className="text-gray-600">{task.assignee}</strong></span>
                      <span>{t("ex_due")} <strong className={cn(due.urgent && task.status !== "Completed" ? "text-red-600" : "text-gray-600")}>{task.due}</strong></span>
                    </div>
                    {task.result && (
                      <div className="mt-2 bg-green-50 border border-green-100 rounded-lg px-3 py-1.5 text-xs text-green-700 font-semibold">
                        {t("ex_result")} {task.result}
                      </div>
                    )}
                  </div>
                  <span className={cn("status-pill flex-shrink-0", sc.bg, sc.color)}>{t(sc.labelKey)}</span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Weekly checklist */}
      <div className="card space-y-4 border-l-4 border-brand-400">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <CheckSquare size={16} className="text-brand-500" />
          {t("ex_checklist")}
        </h2>
        <div className="space-y-2">
          {checks.map((item, i) => (
            <label key={i} className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" className="w-4 h-4 accent-brand-500 cursor-pointer" />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">{item}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
