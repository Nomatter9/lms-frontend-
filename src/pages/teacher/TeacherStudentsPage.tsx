import { useEffect, useState } from "react";
import { Search, Loader2, GraduationCap, RefreshCw, Users, User } from "lucide-react";
import TeacherLayout from "@/components/dashboard/TeacherLayout";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import axiosClient from "@/axiosClient";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTeacherClasses } from "@/hooks/queries";
import type { TeacherClass, TeacherStudent } from "@/types";

type StudentWithParent = TeacherStudent & {
  gender?: string;
  parent?: { user?: { firstName?: string; lastName?: string }; firstName?: string; lastName?: string } | null;
};

export default function TeacherStudentsPage() {
  const { data: classes = [] } = useTeacherClasses();
  const [selectedClass, setSelectedClass] = useState("");
  const [students, setStudents] = useState<StudentWithParent[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (classes.length > 0 && !selectedClass) {
      setSelectedClass(classes[0].id);
    }
  }, [classes]);

  useEffect(() => {
    if (!selectedClass) return;
    setLoading(true);

    Promise.all([
      axiosClient.get(`/teacher/classes/${selectedClass}/students`),
      axiosClient.get("/auth/parents").catch(() => ({ data: [] })),
    ])
      .then(([studentsRes, parentsRes]) => {
        const list: StudentWithParent[] = Array.isArray(studentsRes.data) ? studentsRes.data : [];
        const parents: Array<{ id: string; user?: { firstName?: string; lastName?: string }; firstName?: string; lastName?: string; parentId?: string }> =
          Array.isArray(parentsRes.data) ? parentsRes.data : [];
        const parentMap = new Map(parents.map(p => [p.id, p]));

        setStudents(list.map(s => ({
          ...s,
          parent: (s as StudentWithParent & { parentId?: string }).parentId
            ? (s.parent ?? parentMap.get((s as StudentWithParent & { parentId?: string }).parentId!) ?? null)
            : s.parent ?? null,
        })));
      })
      .catch(() => toast.error("Failed to load students"))
      .finally(() => setLoading(false));
  }, [selectedClass, refreshKey]);

  const maleCount   = students.filter(s => s.gender === "male").length;
  const femaleCount = students.filter(s => s.gender === "female").length;

  const filtered = students.filter((s) =>
    `${s.user?.firstName} ${s.user?.lastName} ${s.regNumber || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  const studentFirst = (s: StudentWithParent) => s.user?.firstName ?? "";
  const studentLast  = (s: StudentWithParent) => s.user?.lastName  ?? "";
  const parentName   = (s: StudentWithParent) => {
    const p = s.parent;
    if (!p) return null;
    const first = p.user?.firstName ?? p.firstName ?? "";
    const last  = p.user?.lastName  ?? p.lastName  ?? "";
    return `${first} ${last}`.trim() || null;
  };
  const initials = (s: StudentWithParent) => `${studentFirst(s)[0] || ""}${studentLast(s)[0] || ""}`.toUpperCase();

  return (
    <TeacherLayout title="My Students" subtitle="View all students in your classes">

      {/* Stats */}
      {!loading && students.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total Students", value: students.length, bg: "linear-gradient(135deg, #10B981, #059669)", icon: GraduationCap },
            { label: "Male",           value: maleCount,       bg: "linear-gradient(135deg, #3B82F6, #06B6D4)", icon: Users },
            { label: "Female",         value: femaleCount,     bg: "linear-gradient(135deg, #EC4899, #DB2777)", icon: User },
          ].filter(s => s.value > 0).map(({ label, value, bg, icon: Icon }) => (
            <div
              key={label}
              className="rounded-2xl p-5 shadow-lg text-white relative overflow-hidden"
              style={{ background: bg }}
            >
              <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
                  <Icon size={22} className="text-white" />
                </div>
                <p className="text-3xl font-extrabold">{value}</p>
                <p className="text-sm text-white/80 mt-1 font-medium">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <Select value={selectedClass} onValueChange={setSelectedClass}>
          <SelectTrigger className="w-52 h-10 border-gray-200 bg-white">
            <SelectValue placeholder="Select class" />
          </SelectTrigger>
          <SelectContent position="popper">
            {classes.map((c: TeacherClass) => (
              <SelectItem key={c.id} value={c.id}>
                {c.grade?.label} {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white border-gray-200 h-10"
          />
        </div>

        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            disabled={loading}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:text-[#6366F1] hover:border-[#6366F1]/30 hover:bg-[#6366F1]/5 transition-all disabled:opacity-40"
            title="Refresh student list"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <GraduationCap size={16} className="text-emerald-500" />
            <span className="font-semibold">{filtered.length}</span> students
          </div>
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
                  <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Parent / Guardian</th>
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
                          <p className="text-xs text-gray-400">{s.user?.email ?? "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-gray-500">{s.regNumber || "—"}</td>
                    <td className="px-6 py-3.5">
                      {s.gender ? (
                        <span className={cn(
                          "text-xs font-semibold px-2.5 py-1 rounded-full capitalize",
                          s.gender === "male" ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700"
                        )}>
                          {s.gender}
                        </span>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-gray-600">
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
    </TeacherLayout>
  );
}
