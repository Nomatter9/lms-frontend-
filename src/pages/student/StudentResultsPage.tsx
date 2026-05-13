import { useEffect, useState } from "react";
import { Loader2, Award } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import axiosClient from "@/axiosClient";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const scoreStyle = (marks: number, max: number) => {
  const pct = max > 0 ? (marks / max) * 100 : 0;
  if (pct >= 75) return { badge: "bg-emerald-100 text-emerald-700", bar: "bg-emerald-400" };
  if (pct >= 50) return { badge: "bg-amber-100 text-amber-700",   bar: "bg-amber-400" };
  return           { badge: "bg-rose-100 text-rose-600",           bar: "bg-rose-400" };
};

export default function StudentResultsPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosClient.get("/student/results")
      .then(res => setResults(Array.isArray(res.data) ? res.data : []))
      .catch(() => toast.error("Failed to load results"))
      .finally(() => setLoading(false));
  }, []);

  const avg = results.length > 0
    ? Math.round(
        results.reduce((sum, r) => {
          const marks  = r.marks ?? r.score ?? 0;
          const max    = r.assessment?.maxMarks ?? r.maxMarks ?? 100;
          return sum + (max > 0 ? (marks / max) * 100 : 0);
        }, 0) / results.length
      )
    : null;

  return (
    <DashboardLayout title="My Results" subtitle="View your assessment scores and marks">

      {/* Summary banner */}
      {!loading && results.length > 0 && avg !== null && (
        <div className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] rounded-2xl p-5 text-white flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <Award size={26} className="text-white" />
          </div>
          <div>
            <p className="text-[11px] font-semibold opacity-60 uppercase tracking-widest">Overall Average</p>
            <p className="text-3xl font-extrabold leading-none">{avg}%</p>
            <p className="text-xs opacity-70 mt-1">{results.length} assessment{results.length !== 1 ? "s" : ""} graded</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-[#EF4444]" />
        </div>
      ) : results.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <Award size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="font-semibold text-gray-500">No results yet</p>
          <p className="text-sm text-gray-400 mt-1">Your results will appear here once assessments are graded</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-6 py-3">#</th>
                  <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Assessment</th>
                  <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Subject</th>
                  <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Date</th>
                  <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Score</th>
                  <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {results.map((r: any, i: number) => {
                  const marks   = r.marks ?? r.score ?? 0;
                  const maxMarks = r.assessment?.maxMarks ?? r.maxMarks ?? 100;
                  const pct     = maxMarks > 0 ? Math.round((marks / maxMarks) * 100) : 0;
                  const subject = r.assessment?.classSubject?.subject?.name ?? r.classSubject?.subject?.name ?? r.subject?.name ?? "—";
                  const title   = r.assessment?.title ?? r.title ?? "—";
                  const date    = r.assessment?.date ?? r.date ?? null;
                  const style   = scoreStyle(marks, maxMarks);

                  return (
                    <tr key={r.id ?? i} className="hover:bg-[#F4F7FE]/50 transition-colors">
                      <td className="px-6 py-3.5 text-sm text-gray-400 font-medium">{i + 1}</td>
                      <td className="px-6 py-3.5">
                        <p className="text-sm font-semibold text-gray-800">{title}</p>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-gray-500">{subject}</td>
                      <td className="px-6 py-3.5 text-sm text-gray-500">
                        {date ? date.split("T")[0] : "—"}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full", style.badge)}>
                          {marks} / {maxMarks}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-20 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className={cn("h-full rounded-full transition-all", style.bar)}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-500 w-8">{pct}%</span>
                        </div>
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
