import { useEffect, useState } from "react";
import { Save, Loader2, CalendarDays, CheckCircle2 } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
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
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, Status>>({});
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    axiosClient.get("/teacher/classes")
      .then(res => {
        const list = Array.isArray(res.data) ? res.data : [];
        setClasses(list);
        if (list.length > 0) {
          setSelectedClass(list[0].id);
        } else {
          setLoading(false);
        }
      })
      .catch(() => {
        toast.error("Failed to load classes");
        setLoading(false);
      });
  }, []);

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
  }, [selectedClass, date]);

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
    <DashboardLayout title="Attendance" subtitle="Mark and track daily student attendance">

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
          onChange={e => { setDate(e.target.value); setSaved(false); }}
          className="bg-white border-gray-200 h-10 w-48"
        />

        <div className="flex gap-2 ml-auto">
          <Button variant="outline" onClick={() => markAll("present")} className="h-10 text-emerald-700 border-emerald-200 hover:bg-emerald-50 rounded-xl text-xs font-semibold">✓ All Present</Button>
          <Button variant="outline" onClick={() => markAll("absent")}  className="h-10 text-rose-700 border-rose-200 hover:bg-rose-50 rounded-xl text-xs font-semibold">✗ All Absent</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {(Object.entries(counts) as [Status, number][]).map(([status, count]) => (
          <div key={status} className={cn("rounded-2xl p-4 border text-center", statusConfig[status].active)}>
            <p className="text-2xl font-extrabold">{count}</p>
            <p className="text-xs font-bold uppercase tracking-wider mt-1">{statusConfig[status].label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-blue-500" />
          </div>
        ) : students.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <CalendarDays size={40} className="mb-3 opacity-30" />
            <p className="font-medium">No students in this class</p>
          </div>
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
    </DashboardLayout>
  );
}
