import { useEffect, useState } from "react";
import { CalendarCheck, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import axiosClient from "@/axiosClient";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Status = "present" | "absent" | "late";

const statusConfig: Record<Status, { label: string; badge: string; card: string }> = {
  present: { label: "Present", badge: "bg-emerald-100 text-emerald-700", card: "bg-emerald-50 border-emerald-100 text-emerald-700" },
  absent:  { label: "Absent",  badge: "bg-rose-100 text-rose-700",       card: "bg-rose-50 border-rose-100 text-rose-700" },
  late:    { label: "Late",    badge: "bg-amber-100 text-amber-700",     card: "bg-amber-50 border-amber-100 text-amber-700" },
};

export default function StudentAttendancePage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosClient.get("/student/attendance")
      .then(res => setRecords(Array.isArray(res.data) ? res.data : []))
      .catch(() => toast.error("Failed to load attendance"))
      .finally(() => setLoading(false));
  }, []);

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
      {!loading && records.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {(["present", "absent", "late"] as Status[]).map(s => (
            <div key={s} className={cn("rounded-2xl p-4 border text-center", statusConfig[s].card)}>
              <p className="text-2xl font-extrabold">{counts[s]}</p>
              <p className="text-xs font-bold uppercase tracking-wider mt-1">{statusConfig[s].label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Attendance rate banner */}
      {!loading && attendancePct !== null && (
        <div className="bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] rounded-2xl p-4 text-white flex items-center gap-4 mb-5">
          <div className="flex-1">
            <p className="text-[11px] font-semibold opacity-60 uppercase tracking-widest mb-1">Attendance Rate</p>
            <div className="flex items-end gap-3">
              <p className="text-3xl font-extrabold leading-none">{attendancePct}%</p>
              <p className="text-xs opacity-70 pb-0.5">{records.length} total days</p>
            </div>
          </div>
          <div className="w-16 h-16 rounded-full border-4 border-white/30 flex items-center justify-center shrink-0">
            <CalendarCheck size={24} className="text-white" />
          </div>
        </div>
      )}

      {loading ? (
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
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-6 py-3">#</th>
                <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Date</th>
                <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Class</th>
                <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {records.map((r: any, i: number) => {
                const status = (r.status || "present") as Status;
                const grade  = r.class?.grade?.label ?? "";
                const cls    = r.class?.name ?? "";
                const cfg    = statusConfig[status] ?? statusConfig.present;

                return (
                  <tr key={r.id ?? i} className="hover:bg-[#F4F7FE]/50 transition-colors">
                    <td className="px-6 py-3.5 text-sm text-gray-400 font-medium">{i + 1}</td>
                    <td className="px-6 py-3.5 text-sm font-semibold text-gray-700">
                      {r.date
                        ? new Date(r.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                        : "—"}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-gray-500">{grade} {cls || "—"}</td>
                    <td className="px-6 py-3.5">
                      <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full capitalize", cfg.badge)}>
                        {cfg.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
