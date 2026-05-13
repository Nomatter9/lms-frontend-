import { useEffect, useState } from "react";
import { Search, Loader2, GraduationCap } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import axiosClient from "@/axiosClient";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function TeacherStudentsPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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
    axiosClient.get(`/teacher/classes/${selectedClass}/students`)
      .then(res => setStudents(Array.isArray(res.data) ? res.data : []))
      .catch(() => toast.error("Failed to load students"))
      .finally(() => setLoading(false));
  }, [selectedClass]);

  const filtered = students.filter((s) =>
    `${s.user?.firstName} ${s.user?.lastName} ${s.regNumber || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  const studentFirst = (s: any) => s.user?.firstName ?? s.firstName ?? "";
  const studentLast  = (s: any) => s.user?.lastName  ?? s.lastName  ?? "";
  const parentName   = (s: any) => {
    const p = s.parent;
    if (!p) return null;
    const first = p.user?.firstName ?? p.firstName ?? "";
    const last  = p.user?.lastName  ?? p.lastName  ?? "";
    return `${first} ${last}`.trim() || null;
  };
  const initials = (s: any) => `${studentFirst(s)[0] || ""}${studentLast(s)[0] || ""}`.toUpperCase();

  return (
    <DashboardLayout title="My Students" subtitle="View all students in your classes">

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <Select value={selectedClass} onValueChange={setSelectedClass}>
          <SelectTrigger className="w-52 h-10 border-gray-200 bg-white">
            <SelectValue placeholder="Select class" />
          </SelectTrigger>
          <SelectContent position="popper">
            {classes.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.grade?.label} {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Search students..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-white border-gray-200 h-10" />
        </div>

        <div className="ml-auto flex items-center gap-2 text-sm text-gray-500">
          <GraduationCap size={16} className="text-emerald-500" />
          <span className="font-semibold">{filtered.length}</span> students
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-emerald-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <GraduationCap size={40} className="mb-3 opacity-30" />
            <p className="font-medium">No students found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-6 py-3">#</th>
                  <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Student</th>
                  <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Reg No.</th>
                  <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Gender</th>
                  <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Parent</th>
                  <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((s, i) => (
                  <tr key={s.id} className="hover:bg-[#F4F7FE]/50 transition-colors">
                    <td className="px-6 py-3.5 text-sm text-gray-400 font-medium">{i + 1}</td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold shrink-0">
                          {initials(s)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{studentFirst(s)} {studentLast(s)}</p>
                          <p className="text-xs text-gray-400">{s.user?.email ?? s.email ?? "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-gray-500">{s.regNumber || s.reg_number || "—"}</td>
                    <td className="px-6 py-3.5">
                      {s.gender ? (
                        <span className={cn(
                          "text-xs font-semibold px-2.5 py-1 rounded-full capitalize",
                          s.gender === "male" ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700"
                        )}>
                          {s.gender}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-gray-500">
                      {parentName(s)
                        ? parentName(s)
                        : <span className="text-gray-300 italic text-xs">—</span>
                      }
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={cn(
                        "text-xs font-semibold px-2.5 py-1 rounded-full",
                        s.user?.isActive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                      )}>
                        {s.user?.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
