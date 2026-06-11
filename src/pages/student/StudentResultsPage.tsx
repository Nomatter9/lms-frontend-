import { Award, RefreshCw, Clock } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { cn } from "@/lib/utils";
import { useStudentResults } from "@/hooks/queries";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";

const scoreStyle = (marks: number, max: number) => {
  const pct = max > 0 ? (marks / max) * 100 : 0;
  if (pct >= 75) return { badge: "bg-emerald-100 text-emerald-700", bar: "bg-emerald-400" };
  if (pct >= 50) return { badge: "bg-amber-100 text-amber-700",   bar: "bg-amber-400" };
  return           { badge: "bg-rose-100 text-rose-600",           bar: "bg-rose-400" };
};

const getGrade = (marks: number, max: number) => {
  const pct = max > 0 ? (marks / max) * 100 : 0;
  if (pct >= 80) return { grade: "1A", color: "text-emerald-700 bg-emerald-100" };
  if (pct >= 70) return { grade: "2A", color: "text-emerald-700 bg-emerald-100" };
  if (pct >= 60) return { grade: "3B", color: "text-blue-700 bg-blue-100" };
  if (pct >= 50) return { grade: "4B", color: "text-blue-700 bg-blue-100" };
  if (pct >= 45) return { grade: "5C", color: "text-amber-700 bg-amber-100" };
  if (pct >= 40) return { grade: "6C", color: "text-amber-700 bg-amber-100" };
  if (pct >= 35) return { grade: "7D", color: "text-orange-700 bg-orange-100" };
  if (pct >= 30) return { grade: "8D", color: "text-orange-700 bg-orange-100" };
  if (pct >= 25) return { grade: "9E", color: "text-rose-700 bg-rose-100" };
  return                { grade: "U",  color: "text-gray-700 bg-gray-100" };
};

export default function StudentResultsPage() {
  const { data: results = [], isLoading, isFetching, refetch } = useStudentResults();

  const gradedResults = (results as any[]).filter(r => (r.marks ?? r.score ?? r.result?.marks) != null);
  const pendingCount  = results.length - gradedResults.length;
  const avg = gradedResults.length > 0
    ? Math.round(
        gradedResults.reduce((sum: number, r: any) => {
          const marks = Number(r.marks ?? r.score ?? r.result?.marks);
          const max   = r.assessment?.maxMarks ?? r.maxMarks ?? r.assessment?.totalMarks ?? r.totalMarks ?? 100;
          return sum + (max > 0 ? (marks / max) * 100 : 0);
        }, 0) / gradedResults.length
      )
    : null;

  return (
    <DashboardLayout title="My Results" subtitle="View your assessment scores and marks">

      {/* Summary banner */}
      {!isLoading && results.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          {avg !== null && (
            <div className="flex-1 bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] rounded-2xl p-5 text-white flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                <Award size={26} className="text-white" />
              </div>
              <div>
                <p className="text-[11px] font-semibold opacity-60 uppercase tracking-widest">Overall Average</p>
                <p className="text-3xl font-extrabold leading-none">{avg}%</p>
                <p className="text-xs opacity-70 mt-1">{gradedResults.length} assessment{gradedResults.length !== 1 ? "s" : ""} graded</p>
              </div>
            </div>
          )}
          {pendingCount > 0 && (
            <div className="sm:w-64 bg-amber-50 border border-amber-100 rounded-2xl p-5 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
                <Clock size={24} className="text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-amber-500 uppercase tracking-widest">Awaiting Mark</p>
                <p className="text-2xl font-extrabold leading-none text-amber-700">{pendingCount}</p>
                <p className="text-xs text-amber-500 mt-1">assessment{pendingCount !== 1 ? "s" : ""} pending</p>
              </div>
              <button
                onClick={() => refetch()}
                disabled={isFetching}
                className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-900 transition-colors disabled:opacity-50"
                title="Refresh results"
              >
                <RefreshCw size={14} className={cn(isFetching && "animate-spin")} />
                Refresh
              </button>
            </div>
          )}
          {pendingCount === 0 && (
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="self-center flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              title="Refresh results"
            >
              <RefreshCw size={13} className={cn(isFetching && "animate-spin")} />
              Refresh
            </button>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <TableSkeleton cols={8} />
        </div>
      ) : results.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <EmptyState icon={Award} title="No results yet" description="Your results will appear here once assessments are graded" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* ── Mobile card list ── */}
          <div className="sm:hidden divide-y divide-gray-50">
            {results.map((r: any, i: number) => {
              const rawMarks = r.marks ?? r.score ?? r.result?.marks;
              const hasMarks = rawMarks != null;
              const marks    = hasMarks ? Number(rawMarks) : 0;
              const maxMarks = r.assessment?.maxMarks ?? r.maxMarks ?? r.assessment?.totalMarks ?? r.totalMarks ?? 100;
              const pct      = maxMarks > 0 ? Math.round((marks / maxMarks) * 100) : 0;
              const subject  = r.assessment?.classSubject?.subject?.name ?? r.classSubject?.subject?.name ?? r.subject?.name ?? r.assessment?.subject?.name ?? "—";
              const title    = r.assessment?.title ?? r.title ?? "—";
              const date     = r.assessment?.date ?? r.date ?? r.assessment?.createdAt ?? null;
              const type     = r.assessment?.type ?? r.type ?? null;
              const style    = scoreStyle(marks, maxMarks);
              const { grade, color } = getGrade(marks, maxMarks);
              return (
                <div key={r.id ?? i} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{subject}{date ? ` · ${date.split("T")[0]}` : ""}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {type && <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full uppercase", type === "ca" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700")}>{type}</span>}
                      {hasMarks && <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", color)}>{grade}</span>}
                    </div>
                  </div>
                  {hasMarks ? (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full", style.badge)}>{marks} / {maxMarks}</span>
                        <span className="text-xs font-semibold text-gray-500">{pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className={cn("h-full rounded-full", style.bar)} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 inline-flex items-center gap-1">
                      <Clock size={9} /> Awaiting mark
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Desktop table ── */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["#", "Assessment", "Subject", "Type", "Date", "Score", "Grade", "Progress"].map(h => (
                    <th key={h} className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-6 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {results.map((r: any, i: number) => {
                  const rawMarks = r.marks ?? r.score ?? r.result?.marks;
                  const hasMarks = rawMarks != null;
                  const marks    = hasMarks ? Number(rawMarks) : 0;
                  const maxMarks = r.assessment?.maxMarks ?? r.maxMarks ?? r.assessment?.totalMarks ?? r.totalMarks ?? 100;
                  const pct      = maxMarks > 0 ? Math.round((marks / maxMarks) * 100) : 0;
                  const subject  = r.assessment?.classSubject?.subject?.name ?? r.classSubject?.subject?.name ?? r.subject?.name ?? r.assessment?.subject?.name ?? "—";
                  const title    = r.assessment?.title ?? r.title ?? "—";
                  const date     = r.assessment?.date ?? r.date ?? r.assessment?.createdAt ?? null;
                  const type     = r.assessment?.type ?? r.type ?? null;
                  const style    = scoreStyle(marks, maxMarks);
                  const { grade, color } = getGrade(marks, maxMarks);

                  return (
                    <tr key={r.id ?? i} className="hover:bg-[#F4F7FE]/50 transition-colors">
                      <td className="px-6 py-3.5 text-sm text-gray-400 font-medium">{i + 1}</td>
                      <td className="px-6 py-3.5"><p className="text-sm font-semibold text-gray-800">{title}</p></td>
                      <td className="px-6 py-3.5 text-sm text-gray-500">{subject}</td>
                      <td className="px-6 py-3.5">
                        {type
                          ? <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full uppercase", type === "ca" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700")}>{type}</span>
                          : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-gray-500">{date ? date.split("T")[0] : "—"}</td>
                      <td className="px-6 py-3.5">
                        {hasMarks
                          ? <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full", style.badge)}>{marks} / {maxMarks}</span>
                          : <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 inline-flex items-center gap-1"><Clock size={9} /> Awaiting mark</span>}
                      </td>
                      <td className="px-6 py-3.5">
                        {hasMarks
                          ? <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full", color)}>{grade}</span>
                          : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                      <td className="px-6 py-3.5">
                        {hasMarks ? (
                          <div className="flex items-center gap-2.5">
                            <div className="w-20 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                              <div className={cn("h-full rounded-full transition-all", style.bar)} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs font-semibold text-gray-500 w-8">{pct}%</span>
                          </div>
                        ) : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
