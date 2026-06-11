import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen, Users, ClipboardList, GraduationCap,
  ArrowUpRight, CalendarDays,
} from "lucide-react";
import TeacherLayout from "@/components/dashboard/TeacherLayout";
import axiosClient from "@/axiosClient";
import { toast } from "sonner";

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

interface OverviewData {
  myClasses: number;
  mySubjects: number;
  totalStudents: number;
  pendingHomework: number;
  classes: Array<{
    id: string;
    name: string;
    grade?: { label: string };
    academicYear?: { year: string };
    students?: { id: string }[];
  }>;
  subjects: Array<{
    id: string;
    subject?: { name: string };
    class?: { grade?: { label: string }; name?: string };
  }>;
}

export default function TeacherOverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    axiosClient.get("/teacher/overview")
      .then(res => setData(res.data))
      .catch(() => toast.error("Failed to load overview"))
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: "My Classes", value: data?.myClasses ?? "—", icon: BookOpen, gradient: "linear-gradient(135deg, #6366F1, #8B5CF6)" },
    { label: "My Subjects", value: data?.mySubjects ?? "—", icon: GraduationCap, gradient: "linear-gradient(135deg, #10B981, #059669)" },
    { label: "Total Students", value: data?.totalStudents ?? "—", icon: Users, gradient: "linear-gradient(135deg, #F59E0B, #EF4444)" },
    { label: "Active Homework", value: data?.pendingHomework ?? "—", icon: ClipboardList, gradient: "linear-gradient(135deg, #3B82F6, #06B6D4)" },
  ];

  const CARD_COLORS = [
    "linear-gradient(135deg, #6366F1, #8B5CF6)",
    "linear-gradient(135deg, #10B981, #059669)",
    "linear-gradient(135deg, #3B82F6, #06B6D4)",
    "linear-gradient(135deg, #F59E0B, #D97706)",
    "linear-gradient(135deg, #EC4899, #DB2777)",
    "linear-gradient(135deg, #8B5CF6, #7C3AED)",
  ];

  const quickLinks = [
    { label: "My Students", href: "/dashboard/teacher/students", icon: Users, color: "#6366F1", desc: "View your class roster" },
    { label: "Lessons", href: "/dashboard/teacher/lessons", icon: BookOpen, color: "#10B981", desc: "Create and manage lessons" },
    { label: "Homework", href: "/dashboard/teacher/homework", icon: ClipboardList, color: "#F59E0B", desc: "Assign and grade homework" },
    { label: "Attendance", href: "/dashboard/teacher/attendance", icon: CalendarDays, color: "#3B82F6", desc: "Mark daily attendance" },
    { label: "Assessments", href: "/dashboard/teacher/assessments", icon: GraduationCap, color: "#EF4444", desc: "Create tests and record marks" },
  ];

  return (
    <TeacherLayout
      title={`${getGreeting()}, ${user?.firstName} 👋`}
      subtitle="Welcome to your Teacher Dashboard"
    >
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl p-5 shadow-lg text-white relative overflow-hidden"
            style={{ background: s.gradient }}
          >
            <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
            <div className="absolute -right-2 -bottom-6 w-20 h-20 rounded-full bg-white/10" />
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
                <s.icon size={22} className="text-white" />
              </div>
              <p className="text-3xl font-extrabold">{loading ? "..." : s.value}</p>
              <p className="text-sm text-white/80 mt-1 font-medium">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">

        {/* Quick Links */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${link.color}15` }}>
                  <link.icon size={15} style={{ color: link.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-emerald-700">{link.label}</p>
                  <p className="text-xs text-gray-400">{link.desc}</p>
                </div>
                <ArrowUpRight size={14} className="text-gray-300 group-hover:text-emerald-600 shrink-0" />
              </Link>
            ))}
          </div>
        </div>

        {/* My Classes */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">My Classes</h2>
            <Link to="/dashboard/teacher/students" className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1">
              View all <ArrowUpRight size={12} />
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !data?.classes?.length ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <BookOpen size={32} className="mb-2 opacity-30" />
              <p className="text-sm">No classes assigned yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.classes.map((cls, i: number) => (
                <Link
                  key={cls.id}
                  to={`/dashboard/teacher/students?classId=${cls.id}`}
                  className="p-4 rounded-xl relative overflow-hidden text-white shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
                  style={{ background: CARD_COLORS[i % CARD_COLORS.length] }}
                >
                  <div className="absolute -right-3 -top-3 w-16 h-16 rounded-full bg-white/10" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                        <BookOpen size={15} className="text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{cls.grade?.label} {cls.name}</p>
                        <p className="text-xs text-white/70">{cls.academicYear?.year}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-white/70">
                      <Users size={11} />
                      <span>{cls.students?.length || 0} students</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* My Subjects */}
      {data?.subjects && data.subjects.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-4">My Subjects</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {data.subjects.map((s, i: number) => (
              <div
                key={s.id}
                className="p-4 rounded-xl relative overflow-hidden text-white shadow-md"
                style={{ background: CARD_COLORS[i % CARD_COLORS.length] }}
              >
                <div className="absolute -right-3 -top-3 w-14 h-14 rounded-full bg-white/10" />
                <p className="text-sm font-bold text-white relative z-10">{s.subject?.name}</p>
                <p className="text-xs text-white/70 mt-1 relative z-10">
                  {s.class?.grade?.label} {s.class?.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </TeacherLayout>
  );
}