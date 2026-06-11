import { Link } from "react-router-dom";
import {
  BookMarked, TrendingUp, GraduationCap,
  BookOpen, ClipboardList, CalendarCheck, ArrowUpRight, AlertCircle,
} from "lucide-react";
import { useTeacherClasses, useTeacherSubjects } from "@/hooks/queries";
import type { TeacherClass, TeacherSubject } from "@/types";

const pluralize = (n: number, s: string, p: string) => `${n} ${n === 1 ? s : p}`;

export default function TeacherDashboard() {
  const { data: classes = [], isLoading: classesLoading, isError: classesError } = useTeacherClasses();
  const { data: subjects = [], isLoading: subjectsLoading, isError: subjectsError } = useTeacherSubjects();

  const isLoading = classesLoading || subjectsLoading;
  const isError   = classesError   || subjectsError;

  const studentCount = classes.reduce((acc, c) => acc + (c.students?.length ?? 0), 0);

  const STAT_CARDS = [
    { label: "My Classes",  value: classes.length,  icon: BookMarked,    bg: "linear-gradient(135deg, #6366F1, #8B5CF6)", singular: "Class",   plural: "Classes" },
    { label: "My Subjects", value: subjects.length, icon: BookOpen,      bg: "linear-gradient(135deg, #3B82F6, #06B6D4)", singular: "Subject", plural: "Subjects" },
    { label: "My Students", value: studentCount,    icon: GraduationCap, bg: "linear-gradient(135deg, #10B981, #059669)", singular: "Student", plural: "Students" },
  ];

  const QUICK_LINKS = [
    { label: "My Students",  href: "/dashboard/teacher/students",                bg: "linear-gradient(135deg, #10B981, #059669)", icon: GraduationCap },
    { label: "Add Lesson",   href: "/dashboard/teacher/lessons?open=create",     bg: "linear-gradient(135deg, #6366F1, #8B5CF6)", icon: BookOpen },
    { label: "Add Homework", href: "/dashboard/teacher/homework?open=create",    bg: "linear-gradient(135deg, #F59E0B, #D97706)", icon: ClipboardList },
    { label: "Attendance",   href: "/dashboard/teacher/attendance",              bg: "linear-gradient(135deg, #3B82F6, #06B6D4)", icon: CalendarCheck },
    { label: "Assessment",   href: "/dashboard/teacher/assessments?open=create", bg: "linear-gradient(135deg, #8B5CF6, #7C3AED)", icon: TrendingUp },
  ];

  const CLASS_COLORS = [
    "linear-gradient(135deg, #6366F1, #8B5CF6)",
    "linear-gradient(135deg, #10B981, #059669)",
    "linear-gradient(135deg, #3B82F6, #06B6D4)",
    "linear-gradient(135deg, #F59E0B, #D97706)",
    "linear-gradient(135deg, #EC4899, #DB2777)",
    "linear-gradient(135deg, #8B5CF6, #7C3AED)",
  ];

  if (isError) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
        <AlertCircle size={36} className="mx-auto mb-3 text-rose-400" />
        <p className="font-medium text-gray-700">Failed to load dashboard data</p>
        <p className="text-sm text-gray-400 mt-1">Please refresh the page to try again</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Stat cards */}
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">My Overview</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {STAT_CARDS.map(s => (
            <div key={s.label} className="rounded-2xl p-5 shadow-lg text-white relative overflow-hidden" style={{ background: s.bg }}>
              <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
                  <s.icon size={22} className="text-white" />
                </div>
                <p className="text-3xl font-extrabold">{isLoading ? "..." : s.value}</p>
                <p className="text-sm text-white/80 mt-1 font-medium">
                  {isLoading ? "—" : pluralize(s.value, s.singular, s.plural)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick navigation */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <h2 className="font-bold text-gray-900 mb-4">Quick Navigation</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {QUICK_LINKS.map(link => (
            <Link
              key={link.href}
              to={link.href}
              className="flex flex-col items-center gap-2.5 p-4 rounded-xl text-center text-white shadow-md hover:shadow-lg hover:scale-[1.03] transition-all relative overflow-hidden"
              style={{ background: link.bg }}
            >
              <div className="absolute -right-3 -top-3 w-16 h-16 rounded-full bg-white/10" />
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/20 relative z-10">
                <link.icon size={18} className="text-white" />
              </div>
              <span className="text-xs font-semibold text-white/90 relative z-10">{link.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* My Classes */}
      {!isLoading && classes.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">My Classes</h2>
            <Link to="/dashboard/teacher/students" className="text-xs font-semibold text-[#6366F1] hover:underline flex items-center gap-1">
              View Students <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {classes.map((cls: TeacherClass, i: number) => (
              <div
                key={cls.id}
                className="p-4 rounded-xl relative overflow-hidden shadow-sm text-white"
                style={{ background: CLASS_COLORS[i % CLASS_COLORS.length] }}
              >
                <div className="absolute -right-3 -top-3 w-16 h-16 rounded-full bg-white/10" />
                <p className="font-bold text-sm relative z-10">{cls.grade?.label} {cls.name}</p>
                <p className="text-xs mt-1 text-white/70 relative z-10">{pluralize(cls.students?.length || 0, "student", "students")}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Subjects */}
      {!isLoading && subjects.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-4">My Subjects</h2>
          <div className="flex flex-wrap gap-2">
            {subjects.map((sub: TeacherSubject) => (
              <span key={sub.id} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#6366F1]/10 text-[#6366F1] border border-[#6366F1]/20">
                {sub.subject?.name || sub.name}
                {sub.class && ` — ${sub.class?.grade?.label || ""} ${sub.class?.name || ""}`}
              </span>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
