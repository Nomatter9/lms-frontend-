import { useEffect, useState } from "react";
import { useTeacherClasses } from "@/hooks/queries";
import { Save, Loader2, CalendarDays, CheckCircle2, RefreshCw, XCircle, Clock } from "lucide-react";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import TeacherLayout from "@/components/dashboard/TeacherLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import axiosClient from "@/axiosClient";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Status = "present" | "absent" | "late";

const statusConfig: Record<Status, { label: string; active: string; inactive: string }> = {
  present: { label: "Present", active: "bg-emerald-100 text-emerald-700 border-emerald-200", inactive: "bg-gray-50 text-gray-400 border-gray-200 hover:border-emerald-200" },
  absent:  { label: "Absent",  active: "bg-rose-100 text-rose-700 border-rose-200",         inactive: "bg-gray-50 text-gray-400 border-gray-200 hover:border-rose-200" },
  late:    { label: "Late",    active: "bg-amber-100 text-amber-700 border-amber-200",       inactive: "bg-gray-50 text-gray-400 border-gray-200 hover:border-amber-200" },
};

const studentFirst = (s: any) => s.user?.firstName ?? s.firstName ?? "";
const studentLast  = (s: any) => s.user?.lastName  ?? s.lastName  ?? "";

export default function TeacherAttendancePage() {
  const { data: classes = [] } = useTeacherClasses();
  const [selectedClass, setSelectedClass] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, Status>>({});
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (classes.length > 0 && !selectedClass) {
      setSelectedClass(classes[0].id);
    }
  }, [classes, selectedClass]);

  useEffect(() => {
    if (!selectedClass) return;
    setLoading(true);
    setSaved(false);
    Promise.all([
      axiosClient.get(`/teacher/classes/${selectedClass}/students`),
      axiosClient.get(`/teacher/attendance/${selectedClass}`, { params: { date } }),
    ])
      .then(([studRes, attRes]) => {
        const studs = Array.isArray(studRes.data) ? studRes.data : [];
        const att   = Array.isArray(attRes.data)  ? attRes.data  : [];
        setStudents(studs);
        const map: Record<string, Status> = {};
        studs.forEach((s: any) => { map[s.id] = "present"; });
        att.forEach((r: any) => { map[r.pupilId] = r.status; });
        setAttendance(map);
      })
      .catch(() => toast.error("Failed to load"))
      .finally(() => setLoading(false));
  }, [selectedClass, date, refreshKey]);

  const markAll = (status: Status) => {
    const updated: Record<string, Status> = {};
    students.forEach(s => { updated[s.id] = status; });
    setAttendance(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const records = students.map(s => ({ pupilId: s.id, status: attendance[s.id] || "present" }));
      await axiosClient.post("/teacher/attendance", { classId: selectedClass, date, records });
      toast.success("Attendance saved");
      setSaved(true);
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const counts = {
    present: students.filter(s => attendance[s.id] === "present").length,
    absent:  students.filter(s => attendance[s.id] === "absent").length,
    late:    students.filter(s => attendance[s.id] === "late").length,
  };

  return (
    <TeacherLayout title="Attendance" subtitle="Mark and track daily student attendance">

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <Select value={selectedClass} onValueChange={v => { setSelectedClass(v); setSaved(false); }}>
          <SelectTrigger className="w-52 h-10 border-gray-200 bg-white">
            <SelectValue placeholder="Select class" />
          </SelectTrigger>
          <SelectContent position="popper">
            {classes.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.grade?.label} {c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="date"
          value={date}
          max={new Date().toISOString().split("T")[0]}
          onChange={e => { setDate(e.target.value); setSaved(false); }}
          className="bg-white border-gray-200 h-10 w-48"
        />

        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => { setRefreshKey(k => k + 1); setSaved(false); }}
            disabled={loading}
            className="w-9 h-10 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:text-[#3B82F6] hover:border-[#3B82F6]/30 hover:bg-[#3B82F6]/5 transition-all disabled:opacity-40"
            title="Refresh student list"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
          <Button variant="outline" onClick={() => markAll("present")} className="h-10 text-emerald-700 border-emerald-200 hover:bg-emerald-50 rounded-xl text-xs font-semibold">✓ All Present</Button>
          <Button variant="outline" onClick={() => markAll("absent")}  className="h-10 text-rose-700 border-rose-200 hover:bg-rose-50 rounded-xl text-xs font-semibold">✗ All Absent</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {([
          { status: "present" as Status, bg: "linear-gradient(135deg, #10B981, #059669)", icon: CheckCircle2 },
          { status: "absent"  as Status, bg: "linear-gradient(135deg, #EF4444, #DC2626)", icon: XCircle },
          { status: "late"    as Status, bg: "linear-gradient(135deg, #F59E0B, #D97706)", icon: Clock },
        ]).map(({ status, bg, icon: Icon }) => (
          <div
            key={status}
            className="rounded-2xl p-5 shadow-lg text-white relative overflow-hidden"
            style={{ background: bg }}
          >
            <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
                <Icon size={22} className="text-white" />
              </div>
              <p className="text-3xl font-extrabold">{counts[status]}</p>
              <p className="text-sm text-white/80 mt-1 font-medium">{statusConfig[status].label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
        {loading ? (
          <TableSkeleton cols={4} />
        ) : students.length === 0 ? (
          <EmptyState icon={CalendarDays} title="No students in this class" />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-6 py-3">#</th>
                <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Student</th>
                <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Reg No.</th>
                <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Attendance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {students.map((s, i) => (
                <tr key={s.id} className="hover:bg-[#F4F7FE]/50 transition-colors">
                  <td className="px-6 py-3.5 text-sm text-gray-400 font-medium">{i + 1}</td>
                  <td className="px-6 py-3.5">
                    <p className="text-sm font-semibold text-gray-800">
                      {studentFirst(s)} {studentLast(s)}
                    </p>
                  </td>
                  <td className="px-6 py-3.5 text-sm text-gray-500">{s.regNumber ?? s.reg_number ?? "—"}</td>
                  <td className="px-6 py-3.5">
                    <div className="flex gap-2">
                      {(["present", "absent", "late"] as Status[]).map(status => (
                        <button
                          key={status}
                          onClick={() => setAttendance(prev => ({ ...prev, [s.id]: status }))}
                          className={cn(
                            "text-xs font-semibold px-3 py-1 rounded-full border transition-all capitalize",
                            attendance[s.id] === status ? statusConfig[status].active : statusConfig[status].inactive
                          )}
                        >
                          {statusConfig[status].label}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving || students.length === 0}
          className={cn(
            "h-11 px-8 rounded-xl gap-2 font-bold text-white",
            saved ? "bg-emerald-500 hover:bg-emerald-600" : "bg-[#3B82F6] hover:bg-[#2563EB]"
          )}
        >
          {saving  ? <><Loader2 size={16} className="animate-spin" /> Saving...</>
           : saved ? <><CheckCircle2 size={16} /> Saved!</>
           :          <><Save size={16} /> Save Attendance</>}
        </Button>
      </div>
    </TeacherLayout>
  );
}
