import { useEffect, useRef, useState } from "react";
import {
  Loader2, Users, ClipboardList, CalendarCheck,
  TrendingUp, ChevronDown, ChevronUp, Award, CheckCircle2,
} from "lucide-react";
import { CardGridSkeleton } from "@/components/ui/TableSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import axiosClient from "@/axiosClient";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useParentChildren } from "@/hooks/queries";
import { useUserStore } from "@/store/useUserStore";

const GRADIENTS = [
  "linear-gradient(135deg, #6366F1, #8B5CF6)",
  "linear-gradient(135deg, #10B981, #059669)",
  "linear-gradient(135deg, #F59E0B, #D97706)",
  "linear-gradient(135deg, #EF4444, #F43F5E)",
];

type Tab = "homework" | "results" | "attendance";

type ChildData = {
  homework?: any[];
  results?: any[];
  attendance?: any[];
};

export default function ParentChildrenPage() {
  const userId = useUserStore(s => s.user?.id ?? "");
  const { data: children = [], isLoading } = useParentChildren(userId);
  const [expanded, setExpanded]   = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Record<string, Tab>>({});
  const [childData, setChildData] = useState<Record<string, ChildData>>({});
  const [tabLoading, setTabLoading] = useState<Record<string, boolean>>({});
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current && children.length > 0) {
      initialized.current = true;
      setExpanded(children[0].id);
      setActiveTab({ [children[0].id]: "homework" });
    }
  }, [children]);

  const fetchTab = async (childId: string, tab: Tab) => {
    if (childData[childId]?.[tab] !== undefined) return;
    setTabLoading(prev => ({ ...prev, [`${childId}-${tab}`]: true }));
    try {
      const endpoint =
        tab === "homework"   ? `/students/${childId}/homework` :
        tab === "results"    ? `/students/${childId}/results`  :
                               `/students/${childId}/attendance`;
      const res = await axiosClient.get(endpoint);
      setChildData(prev => ({
        ...prev,
        [childId]: { ...prev[childId], [tab]: Array.isArray(res.data) ? res.data : [] },
      }));
    } catch {
      toast.error(`Failed to load ${tab}`);
    } finally {
      setTabLoading(prev => ({ ...prev, [`${childId}-${tab}`]: false }));
    }
  };

  const toggleExpand = (childId: string) => {
    if (expanded === childId) { setExpanded(null); return; }
    setExpanded(childId);
    const tab = activeTab[childId] || "homework";
    setActiveTab(prev => ({ ...prev, [childId]: tab }));
    fetchTab(childId, tab);
  };

  const switchTab = (childId: string, tab: Tab) => {
    setActiveTab(prev => ({ ...prev, [childId]: tab }));
    fetchTab(childId, tab);
  };

  useEffect(() => {
    if (expanded) fetchTab(expanded, activeTab[expanded] || "homework");
    // fetchTab intentionally omitted: it reads childData and would recreate on every
    // render, causing an infinite refetch loop. The early-return guard inside
    // fetchTab prevents duplicate fetches.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  return (
    <DashboardLayout title="My Children" subtitle="Monitor your children's academic progress">

      {/* Banner */}
      <div className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] rounded-2xl p-6 text-white mb-6">
        <h2 className="text-xl font-black mb-1">Parent Portal</h2>
        <p className="text-indigo-100/80 text-sm">
          {isLoading
            ? "Loading..."
            : `${children.length} ${children.length === 1 ? "child" : "children"} linked to your account`}
        </p>
      </div>

      {isLoading ? (
        <CardGridSkeleton count={2} />
      ) : children.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <EmptyState icon={Users} title="No children linked to your account" description="Contact the school administrator to link your children" />
        </div>
      ) : (
        <div className="space-y-4">
          {children.map((child: any, idx: number) => {
            const gradient  = GRADIENTS[idx % GRADIENTS.length];
            const firstName = child.user?.firstName ?? child.firstName ?? "";
            const lastName  = child.user?.lastName  ?? child.lastName  ?? "";
            const email     = child.user?.email     ?? child.email     ?? "—";
            const isActive  = child.user?.isActive  ?? child.isActive  ?? false;
            const grade     = child.class?.grade?.label ?? "";
            const cls       = child.class?.name ?? "";
            const isExpanded = expanded === child.id;
            const tab        = activeTab[child.id] || "homework";
            const data       = childData[child.id];

            return (
              <div key={child.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                {/* ── Child header ── */}
                <button
                  onClick={() => toggleExpand(child.id)}
                  className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50/50 transition-colors"
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center font-extrabold text-lg text-white shrink-0"
                    style={{ background: gradient }}
                  >
                    {(firstName[0] || "").toUpperCase()}{(lastName[0] || "").toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 text-base">{firstName} {lastName}</p>
                    <p className="text-sm text-gray-400 mt-0.5">
                      {grade} {cls}{child.regNumber ? ` · Reg: ${child.regNumber}` : ""}
                    </p>
                  </div>
                  <span className={cn(
                    "text-[11px] font-bold px-3 py-1.5 rounded-full shrink-0",
                    isActive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                  )}>
                    {isActive ? "Active" : "Inactive"}
                  </span>
                  {isExpanded
                    ? <ChevronUp size={18} className="text-gray-400 shrink-0" />
                    : <ChevronDown size={18} className="text-gray-400 shrink-0" />}
                </button>

                {/* ── Expanded content ── */}
                {isExpanded && (
                  <div className="border-t border-gray-50">

                    {/* Info grid */}
                    <div className="px-5 pt-4 pb-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { label: "Class",      value: grade && cls ? `${grade} ${cls}` : "—" },
                        { label: "Reg Number", value: child.regNumber ?? "—" },
                        { label: "Gender",     value: child.gender ? child.gender.charAt(0).toUpperCase() + child.gender.slice(1) : "—" },
                        { label: "Email",      value: email },
                      ].map(item => (
                        <div key={item.label} className="p-3 bg-[#F4F7FE] rounded-xl">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.label}</p>
                          <p className="text-xs font-semibold text-gray-700 mt-0.5 truncate">{item.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Tab buttons */}
                    <div className="px-5 pb-3 flex gap-2">
                      {([
                        { key: "homework",   label: "Homework",   icon: ClipboardList },
                        { key: "results",    label: "Results",    icon: TrendingUp },
                        { key: "attendance", label: "Attendance", icon: CalendarCheck },
                      ] as { key: Tab; label: string; icon: any }[]).map(t => (
                        <button
                          key={t.key}
                          onClick={() => switchTab(child.id, t.key)}
                          className={cn(
                            "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors",
                            tab === t.key
                              ? "bg-[#6366F1] text-white"
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                          )}
                        >
                          <t.icon size={12} />
                          {t.label}
                        </button>
                      ))}
                    </div>

                    {/* Tab content */}
                    <div className="px-5 pb-5">
                      {tabLoading[`${child.id}-${tab}`] ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 size={20} className="animate-spin text-[#6366F1]" />
                        </div>
                      ) : tab === "homework" ? (
                        <HomeworkTab data={data?.homework} />
                      ) : tab === "results" ? (
                        <ResultsTab data={data?.results} />
                      ) : (
                        <AttendanceTab data={data?.attendance} />
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}

// ── Homework tab ──────────────────────────────────────────────
function HomeworkTab({ data }: { data?: any[] }) {
  if (!data) return null;
  if (data.length === 0) return (
    <div className="text-center py-8 text-gray-400">
      <ClipboardList size={32} className="mx-auto mb-2 opacity-30" />
      <p className="text-sm font-medium">No homework assigned</p>
    </div>
  );
  return (
    <div className="space-y-2">
      {data.slice(0, 8).map((hw: any, i: number) => {
        const isOverdue = hw.dueDate && new Date(hw.dueDate) < new Date();
        const submitted = hw.submitted || !!hw.submission;
        const subject   = hw.classSubject?.subject?.name ?? hw.subject?.name ?? "—";
        return (
          <div key={hw.id ?? i} className="flex items-center gap-3 p-3 bg-[#F4F7FE] rounded-xl">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
              submitted ? "bg-emerald-100" : isOverdue ? "bg-rose-100" : "bg-amber-100"
            )}>
              {submitted
                ? <CheckCircle2 size={14} className="text-emerald-600" />
                : <ClipboardList size={14} className={isOverdue ? "text-rose-500" : "text-amber-600"} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{hw.title}</p>
              <p className="text-xs text-gray-400">{subject}</p>
            </div>
            <div className="text-right shrink-0">
              <span className={cn(
                "text-xs font-semibold px-2 py-0.5 rounded-full",
                submitted ? "bg-emerald-100 text-emerald-700" : isOverdue ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-700"
              )}>
                {submitted ? "Submitted" : isOverdue ? "Overdue" : "Pending"}
              </span>
              <p className="text-[10px] text-gray-400 mt-0.5">{hw.dueDate?.split("T")[0] ?? "—"}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Results tab ───────────────────────────────────────────────
function ResultsTab({ data }: { data?: any[] }) {
  if (!data) return null;
  if (data.length === 0) return (
    <div className="text-center py-8 text-gray-400">
      <TrendingUp size={32} className="mx-auto mb-2 opacity-30" />
      <p className="text-sm font-medium">No results yet</p>
    </div>
  );

  const avg = Math.round(
    data.reduce((sum, r) => {
      const marks = r.marks ?? r.score ?? 0;
      const max   = r.assessment?.maxMarks ?? r.maxMarks ?? 100;
      return sum + (max > 0 ? (marks / max) * 100 : 0);
    }, 0) / data.length
  );

  const getGrade = (pct: number) => {
    if (pct >= 80) return { grade: "A", color: "bg-emerald-100 text-emerald-700" };
    if (pct >= 70) return { grade: "B", color: "bg-blue-100 text-blue-700" };
    if (pct >= 60) return { grade: "C", color: "bg-amber-100 text-amber-700" };
    if (pct >= 50) return { grade: "D", color: "bg-orange-100 text-orange-700" };
    if (pct >= 40) return { grade: "E", color: "bg-rose-100 text-rose-700" };
    return              { grade: "U", color: "bg-gray-100 text-gray-600" };
  };

  return (
    <div className="space-y-3">
      <div className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] rounded-xl p-4 text-white flex items-center gap-3">
        <Award size={20} className="text-white/80 shrink-0" />
        <div>
          <p className="text-[10px] font-semibold opacity-60 uppercase tracking-widest">Overall Average</p>
          <p className="text-2xl font-extrabold leading-none">{avg}%</p>
          <p className="text-xs opacity-60 mt-0.5">{data.length} assessment{data.length !== 1 ? "s" : ""}</p>
        </div>
      </div>
      {data.slice(0, 6).map((r: any, i: number) => {
        const marks    = r.marks ?? r.score ?? 0;
        const maxMarks = r.assessment?.maxMarks ?? r.maxMarks ?? 100;
        const pct      = maxMarks > 0 ? Math.round((marks / maxMarks) * 100) : 0;
        const title    = r.assessment?.title ?? r.title ?? "—";
        const subject  = r.assessment?.classSubject?.subject?.name ?? r.subject?.name ?? "—";
        const barColor = pct >= 75 ? "bg-emerald-400" : pct >= 50 ? "bg-amber-400" : "bg-rose-400";
        const { grade, color } = getGrade(pct);
        return (
          <div key={r.id ?? i} className="flex items-center gap-3 p-3 bg-[#F4F7FE] rounded-xl">
            <span className={cn("text-xs font-extrabold px-2.5 py-1 rounded-full shrink-0", color)}>{grade}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{title}</p>
              <p className="text-xs text-gray-400">{subject}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="flex-1 h-1 rounded-full bg-gray-200 overflow-hidden">
                  <div className={cn("h-full rounded-full", barColor)} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[10px] font-semibold text-gray-500 shrink-0">{marks}/{maxMarks}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Attendance tab ────────────────────────────────────────────
function AttendanceTab({ data }: { data?: any[] }) {
  if (!data) return null;
  if (data.length === 0) return (
    <div className="text-center py-8 text-gray-400">
      <CalendarCheck size={32} className="mx-auto mb-2 opacity-30" />
      <p className="text-sm font-medium">No attendance records</p>
    </div>
  );

  const present = data.filter(r => r.status === "present").length;
  const absent  = data.filter(r => r.status === "absent").length;
  const late    = data.filter(r => r.status === "late").length;
  const rate    = Math.round(((present + late) / data.length) * 100);

  return (
    <div className="space-y-3">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Present", count: present, gradient: "linear-gradient(135deg, #10B981, #059669)" },
          { label: "Absent",  count: absent,  gradient: "linear-gradient(135deg, #EF4444, #F43F5E)" },
          { label: "Late",    count: late,    gradient: "linear-gradient(135deg, #F59E0B, #D97706)" },
        ].map(s => (
          <div
            key={s.label}
            className="rounded-xl p-3 text-center text-white relative overflow-hidden shadow-sm"
            style={{ background: s.gradient }}
          >
            <div className="absolute -right-2 -top-2 w-10 h-10 rounded-full bg-white/10" />
            <p className="text-2xl font-extrabold relative">{s.count}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/80 mt-0.5 relative">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Rate bar */}
      <div className="flex items-center gap-3 bg-[#F4F7FE] rounded-xl p-3">
        <CalendarCheck size={16} className="text-[#3B82F6] shrink-0" />
        <div className="flex-1">
          <p className="text-xs font-semibold text-gray-600">Attendance Rate</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
              <div className="h-full rounded-full bg-[#3B82F6]" style={{ width: `${rate}%` }} />
            </div>
            <span className="text-xs font-bold text-[#3B82F6]">{rate}%</span>
          </div>
        </div>
      </div>

      {/* Recent records */}
      <div className="space-y-1.5">
        {data.slice(0, 8).map((r: any, i: number) => {
          const status = r.status || "present";
          const badge  =
            status === "present" ? "bg-emerald-100 text-emerald-700" :
            status === "absent"  ? "bg-rose-100 text-rose-600"       :
                                   "bg-amber-100 text-amber-700";
          return (
            <div key={r.id ?? i} className="flex items-center justify-between px-3 py-2 bg-[#F4F7FE] rounded-xl">
              <p className="text-xs font-semibold text-gray-600">
                {r.date
                  ? new Date(r.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                  : "—"}
              </p>
              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full capitalize", badge)}>{status}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
