import { CalendarCheck, Loader2, RefreshCw } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { cn } from "@/lib/utils";
import { useStudentAttendance } from "@/hooks/queries";

type Status = "present" | "absent" | "late";

const statusConfig: Record<Status, { label: string; badge: string; gradient: string }> = {
  present: { label: "Present", badge: "bg-emerald-100 text-emerald-700", gradient: "linear-gradient(135deg, #10B981, #059669)" },
  absent:  { label: "Absent",  badge: "bg-rose-100 text-rose-700",       gradient: "linear-gradient(135deg, #EF4444, #F43F5E)" },
  late:    { label: "Late",    badge: "bg-amber-100 text-amber-700",     gradient: "linear-gradient(135deg, #F59E0B, #D97706)" },
};

export default function StudentAttendancePage() {
  const { data: records = [], isLoading, isFetching, refetch } = useStudentAttendance();

  const counts = {
    present: records.filter(r => r.status === "present").length,
    absent:  records.filter(r => r.status === "absent").length,
    late:    records.filter(r => r.status === "late").length,
  };

  const attendancePct = records.length > 0
    ? Math.round(((counts.present + counts.late) / records.length) * 100)
    : null;

  return (
    <DashboardLayout title="My Attendance" subtitle="Your daily attendance record">

      {/* Summary cards */}
      {!isLoading && records.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {(["present", "absent", "late"] as Status[]).map(s => (
            <div
              key={s}
              className="rounded-2xl p-4 text-center text-white relative overflow-hidden shadow-md"
              style={{ background: statusConfig[s].gradient }}
            >
              <div className="absolute -right-3 -top-3 w-14 h-14 rounded-full bg-white/10" />
              <div className="relative z-10">
                <p className="text-3xl font-extrabold">{counts[s]}</p>
                <p className="text-xs font-bold uppercase tracking-wider mt-1 text-white/80">{statusConfig[s].label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Attendance rate banner */}
      {!isLoading && attendancePct !== null && (
        <div className="bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] rounded-2xl p-4 text-white flex items-center gap-4 mb-5">
          <div className="flex-1">
            <p className="text-[11px] font-semibold opacity-60 uppercase tracking-widest mb-1">Attendance Rate</p>
            <div className="flex items-end gap-3">
              <p className="text-3xl font-extrabold leading-none">{attendancePct}%</p>
              <p className="text-xs opacity-70 pb-0.5">{records.length} total days recorded</p>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 text-xs font-semibold text-white/80 hover:text-white transition-colors disabled:opacity-50"
            title="Refresh attendance"
          >
            <RefreshCw size={14} className={cn(isFetching && "animate-spin")} />
            Refresh
          </button>
          <div className="w-14 h-14 rounded-full border-4 border-white/30 flex items-center justify-center shrink-0">
            <CalendarCheck size={22} className="text-white" />
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-[#3B82F6]" />
        </div>
      ) : records.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <CalendarCheck size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="font-semibold text-gray-500">No attendance records found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

          {/* ── Mobile card list ── */}
          <div className="sm:hidden divide-y divide-gray-50">
            {records.map((r: any, i: number) => {
              const status = (r.status || "present") as Status;
              const grade  = r.class?.grade?.label ?? "";
              const cls    = r.class?.name ?? "";
              const cfg    = statusConfig[status] ?? statusConfig.present;
              const dateObj = r.date ? new Date(r.date) : null;

              return (
                <div key={r.id ?? i} className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white text-xs font-bold"
                    style={{ background: cfg.gradient }}>
                    {dateObj ? dateObj.toLocaleDateString("en-GB", { day: "2-digit" }) : "—"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">
                      {dateObj
                        ? dateObj.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
                        : "—"}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{grade} {cls || "—"}</p>
                  </div>
                  <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full shrink-0", cfg.badge)}>
                    {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* ── Desktop table ── */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["#", "Date", "Day", "Class", "Status", "Notes"].map(h => (
                    <th key={h} className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-6 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {records.map((r: any, i: number) => {
                  const status  = (r.status || "present") as Status;
                  const grade   = r.class?.grade?.label ?? "";
                  const cls     = r.class?.name ?? "";
                  const cfg     = statusConfig[status] ?? statusConfig.present;
                  const dateObj = r.date ? new Date(r.date) : null;

                  return (
                    <tr key={r.id ?? i} className="hover:bg-[#F4F7FE]/50 transition-colors">
                      <td className="px-6 py-3.5 text-sm text-gray-400 font-medium">{i + 1}</td>
                      <td className="px-6 py-3.5 text-sm font-semibold text-gray-700">
                        {dateObj
                          ? dateObj.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                          : "—"}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-gray-400">
                        {dateObj
                          ? dateObj.toLocaleDateString("en-GB", { weekday: "long" })
                          : "—"}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-gray-500">{grade} {cls || "—"}</td>
                      <td className="px-6 py-3.5">
                        <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", cfg.badge)}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-gray-400 max-w-xs">
                        {r.notes
                          ? <span className="italic">{r.notes}</span>
                          : <span className="text-gray-200">—</span>}
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
