import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users, BookMarked, TrendingUp, UserCheck,
  ArrowUpRight, Clock, ChevronRight, GraduationCap,
  BookOpen, ClipboardList, CalendarCheck, School as SchoolIcon,
  X, Loader2, Send, Upload,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PermissionGate from "@/components/auth/PermissionGate";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import axiosClient from "@/axiosClient";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { AcademicYear, Term } from "@/types";
import type { HeadmasterStats } from "@/types/headmaster";
import type { TeacherData } from "@/types/teacher";
import type { ParentChild } from "@/types/parent";

// ─── Helpers ──────────────────────────────────────────────────
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const pluralize = (count: number, singular: string, plural: string) =>
  `${count} ${count === 1 ? singular : plural}`;

const safeArray = (v: any): any[] => (Array.isArray(v) ? v : []);

// ─── Main Component ───────────────────────────────────────────
export default function DashboardOverview() {
  const { user, school } = useCurrentUser();

  return (
    <DashboardLayout
      title={`${getGreeting()}, ${user?.firstName || "there"} 👋`}
      subtitle={`Welcome back to ${school?.name || "your school"} dashboard`}
    >
      <PermissionGate allowedRoles={["headmaster", "admin"]}>
        <HeadmasterView user={user} school={school} />
      </PermissionGate>

      <PermissionGate allowedRoles={["teacher"]}>
        <TeacherView />
      </PermissionGate>

      <PermissionGate allowedRoles={["parent"]}>
        <ParentView />
      </PermissionGate>

      <PermissionGate allowedRoles={["pupil"]}>
        <StudentView />
      </PermissionGate>
    </DashboardLayout>
  );
}

// ═══════════════════════════════════════════════════════════════
// HEADMASTER VIEW
// ═══════════════════════════════════════════════════════════════
function HeadmasterView({ user, school }: { user: any; school: any }) {
  const [stats, setStats] = useState<HeadmasterStats>({
    staff: 0, students: 0, classes: 0, subjects: 0, grades: 0, parents: 0,
  });
  const [currentYear, setCurrentYear] = useState<AcademicYear | null>(null);
  const [currentTerm, setCurrentTerm] = useState<Term | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [staffRes, studentsRes, classesRes, subjectsRes, gradesRes, parentsRes, yearsRes, termsRes] =
          await Promise.allSettled([
            axiosClient.get('/auth/staff'),
            axiosClient.get('/students'),
            axiosClient.get('/classes'),
            axiosClient.get('/subjects'),
            axiosClient.get('/grades'),
            axiosClient.get('/auth/parents'),
            axiosClient.get('/academicYear'),
            axiosClient.get('/terms'),
          ]);

        setStats({
          staff:    staffRes.status    === 'fulfilled' ? safeArray(staffRes.value.data).length    : 0,
          students: studentsRes.status === 'fulfilled' ? safeArray(studentsRes.value.data).length : 0,
          classes:  classesRes.status  === 'fulfilled' ? safeArray(classesRes.value.data).length  : 0,
          subjects: subjectsRes.status === 'fulfilled' ? safeArray(subjectsRes.value.data).length : 0,
          grades:   gradesRes.status   === 'fulfilled' ? safeArray(gradesRes.value.data).length   : 0,
          parents:  parentsRes.status  === 'fulfilled' ? safeArray(parentsRes.value.data).length  : 0,
        });

        if (yearsRes.status === 'fulfilled') {
          const years: AcademicYear[] = safeArray(yearsRes.value.data);
          setCurrentYear(years.find(y => y.isCurrent) || years[0] || null);
        }
        if (termsRes.status === 'fulfilled') {
          const terms = safeArray(termsRes.value.data);
          setCurrentTerm(terms.find((t: Term) => t.isCurrent) || null);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const STAT_CARDS = [
    { key: 'staff'    as const, label: "My Teachers & Staff", singular: "Staff Member", plural: "Staff Members", icon: UserCheck,    bg: "linear-gradient(135deg, #6366F1, #8B5CF6)", href: "/dashboard/staff" },
    { key: 'students' as const, label: "My Students",         singular: "Student",      plural: "Students",      icon: GraduationCap, bg: "linear-gradient(135deg, #10B981, #059669)", href: "/dashboard/students" },
    { key: 'classes'  as const, label: "My Classes",          singular: "Class",        plural: "Classes",       icon: BookMarked,    bg: "linear-gradient(135deg, #F59E0B, #D97706)", href: "/dashboard/classes" },
    { key: 'subjects' as const, label: "My Subjects",         singular: "Subject",      plural: "Subjects",      icon: BookOpen,      bg: "linear-gradient(135deg, #3B82F6, #06B6D4)", href: "/dashboard/subjects" },
    { key: 'grades'   as const, label: "My Grades",           singular: "Grade",        plural: "Grades",        icon: TrendingUp,    bg: "linear-gradient(135deg, #EF4444, #F43F5E)", href: "/dashboard/grades" },
    { key: 'parents'  as const, label: "My Parents",          singular: "Parent",       plural: "Parents",       icon: Users,         bg: "linear-gradient(135deg, #8B5CF6, #6366F1)", href: "/dashboard/parents" },
  ];

  const QUICK_LINKS = [
    { label: "Add Staff Member", href: "/dashboard/staff",        color: "bg-[#6366F1]", icon: UserCheck },
    { label: "Add Student",      href: "/dashboard/students",     color: "bg-[#10B981]", icon: GraduationCap },
    { label: "Create Class",     href: "/dashboard/classes",      color: "bg-[#F59E0B]", icon: BookMarked },
    { label: "Add Subject",      href: "/dashboard/subjects",     color: "bg-[#3B82F6]", icon: BookOpen },
    { label: "Add Parent",       href: "/dashboard/parents",      color: "bg-[#8B5CF6]", icon: Users },
    { label: "Manage Grades",    href: "/dashboard/grades",       color: "bg-[#EF4444]", icon: TrendingUp },
    { label: "Academic Years",   href: "/dashboard/academicYear", color: "bg-[#06B6D4]", icon: Clock },
    { label: "School Profile",   href: "/dashboard/school",       color: "bg-[#059669]", icon: SchoolIcon },
  ];

  const MANAGEMENT_LINKS = [
    { label: "My Staff",       desc: "Manage teachers, headmaster and admin",    href: "/dashboard/staff",        gradient: "linear-gradient(135deg, #6366F1, #8B5CF6)", icon: UserCheck },
    { label: "My Students",    desc: "Enroll and manage student profiles",        href: "/dashboard/students",     gradient: "linear-gradient(135deg, #10B981, #059669)", icon: GraduationCap },
    { label: "My Classes",     desc: "Create classes and assign class teachers",  href: "/dashboard/classes",      gradient: "linear-gradient(135deg, #F59E0B, #D97706)", icon: BookMarked },
    { label: "My Subjects",    desc: "Add and manage subjects per grade",         href: "/dashboard/subjects",     gradient: "linear-gradient(135deg, #3B82F6, #06B6D4)", icon: BookOpen },
    { label: "My Grades",      desc: "Manage grade levels from Grade 1 to 7",    href: "/dashboard/grades",       gradient: "linear-gradient(135deg, #EF4444, #F43F5E)", icon: TrendingUp },
    { label: "My Parents",     desc: "Manage parent and guardian accounts",       href: "/dashboard/parents",      gradient: "linear-gradient(135deg, #8B5CF6, #6366F1)", icon: Users },
    { label: "Academic Years", desc: "Manage academic years and terms",           href: "/dashboard/academicYear", gradient: "linear-gradient(135deg, #06B6D4, #3B82F6)", icon: Clock },
    { label: "School Profile", desc: "Update school information and logo",        href: "/dashboard/school",       gradient: "linear-gradient(135deg, #059669, #10B981)", icon: SchoolIcon },
  ];

  return (
    <div className="space-y-6">

      {/* Stats */}
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">My School Overview</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
          {STAT_CARDS.map(s => (
            <Link key={s.key} to={s.href}
              className="rounded-2xl p-4 shadow-lg text-white relative overflow-hidden hover:scale-[1.02] transition-transform"
              style={{ background: s.bg }}
            >
              <div className="absolute -right-3 -top-3 w-16 h-16 rounded-full bg-white/10" />
              <div className="relative z-10">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                  <s.icon size={18} className="text-white" />
                </div>
                <p className="text-2xl font-extrabold">{loading ? "..." : stats[s.key]}</p>
                <p className="text-[11px] text-white/80 font-semibold mt-0.5 leading-tight">
                  {loading ? "—" : pluralize(stats[s.key], s.singular, s.plural)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Actions + School Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-1">Quick Actions</h2>
          <p className="text-xs text-gray-400 mb-4">Jump to common tasks</p>
          <div className="space-y-2">
            {QUICK_LINKS.map(link => (
              <Link key={link.href} to={link.href}
                className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 hover:border-[#6366F1]/30 hover:bg-[#6366F1]/5 transition-all group"
              >
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", link.color)}>
                  <link.icon size={13} className="text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-[#6366F1]">{link.label}</span>
                <ArrowUpRight size={13} className="ml-auto text-gray-300 group-hover:text-[#6366F1]" />
              </Link>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-gray-900">My School</h2>
              <p className="text-xs text-gray-400">Institution details</p>
            </div>
            <Link to="/dashboard/school" className="text-xs font-semibold text-[#6366F1] hover:underline flex items-center gap-1">
              Edit Profile <ChevronRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            {[
              { label: "School Name", value: school?.name },
              { label: "Email",       value: school?.email },
              { label: "Phone",       value: school?.phone },
              { label: "Province",    value: school?.province },
              { label: "Address",     value: school?.address },
              { label: "Headmaster",  value: `${user?.firstName || ""} ${user?.lastName || ""}`.trim() },
            ].map(item => (
              <div key={item.label} className="p-3 bg-[#F4F7FE] border border-gray-100 rounded-xl">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{item.label}</p>
                <p className="text-sm font-semibold text-gray-800 truncate">{item.value || "—"}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 p-4 bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] rounded-xl text-white flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Clock size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold opacity-60 uppercase tracking-widest mb-0.5">Current Academic Year</p>
              <p className="text-xl font-extrabold leading-none">{currentYear?.year || "—"}</p>
              {currentTerm && (
                <p className="text-xs opacity-60 mt-1">
                  Term {currentTerm.termNumber}
                  {currentTerm.startDate && ` · ${currentTerm.startDate.split('T')[0]}`}
                  {currentTerm.endDate && ` → ${currentTerm.endDate.split('T')[0]}`}
                </p>
              )}
            </div>
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shrink-0",
              currentYear?.isCurrent ? "bg-emerald-400/30 text-emerald-100" : "bg-white/20 text-white/70"
            )}>
              <div className={cn("w-1.5 h-1.5 rounded-full", currentYear?.isCurrent ? "bg-emerald-300 animate-pulse" : "bg-white/50")} />
              {currentYear?.isCurrent ? "Active" : "Inactive"}
            </div>
          </div>
        </div>
      </div>

      {/* Manage My School */}
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Manage My School</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MANAGEMENT_LINKS.map(item => (
            <Link key={item.href} to={item.href}
              className="rounded-2xl p-5 shadow-md hover:shadow-xl transition-all group relative overflow-hidden text-white"
              style={{ background: item.gradient }}
            >
              <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-white/10" />
              <div className="absolute -right-2 -top-4 w-14 h-14 rounded-full bg-white/10" />
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                  <item.icon size={18} className="text-white" />
                </div>
                <p className="font-bold text-white text-sm mb-1">{item.label}</p>
                <p className="text-xs text-white/70 leading-relaxed">{item.desc}</p>
                <div className="flex items-center gap-1 mt-3 text-white/80">
                  <span className="text-xs font-semibold">Go to page</span>
                  <ArrowUpRight size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TEACHER VIEW
// ═══════════════════════════════════════════════════════════════
function TeacherView() {
  const [data, setData] = useState<TeacherData>({ classes: [], subjects: [], students: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [classesRes, subjectsRes] = await Promise.allSettled([
          axiosClient.get('/teacher/classes'),
          axiosClient.get('/teacher/subjects'),
        ]);
        const classes  = classesRes.status  === 'fulfilled' ? safeArray(classesRes.value.data)  : [];
        const subjects = subjectsRes.status === 'fulfilled' ? safeArray(subjectsRes.value.data) : [];

        let students: any[] = [];
        if (classes.length > 0) {
          const studentsRes = await Promise.allSettled(
            classes.map((c: any) => axiosClient.get(`/teacher/classes/${c.id}/students`))
          );
          students = studentsRes
            .filter(r => r.status === 'fulfilled')
            .flatMap((r: any) => safeArray(r.value.data));
        }
        setData({ classes, subjects, students });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const STAT_CARDS = [
    { label: "My Classes",  value: data.classes.length,  icon: BookMarked,    bg: "linear-gradient(135deg, #6366F1, #8B5CF6)", singular: "Class",   plural: "Classes" },
    { label: "My Subjects", value: data.subjects.length, icon: BookOpen,      bg: "linear-gradient(135deg, #3B82F6, #06B6D4)", singular: "Subject", plural: "Subjects" },
    { label: "My Students", value: data.students.length, icon: GraduationCap, bg: "linear-gradient(135deg, #10B981, #059669)", singular: "Student", plural: "Students" },
  ];

  const QUICK_LINKS = [
    { label: "My Students", href: "/dashboard/teacher/students",    color: "bg-[#10B981]", icon: GraduationCap },
    { label: "Lessons",     href: "/dashboard/teacher/lessons",     color: "bg-[#6366F1]", icon: BookOpen },
    { label: "Homework",    href: "/dashboard/teacher/homework",    color: "bg-[#F59E0B]", icon: ClipboardList },
    { label: "Attendance",  href: "/dashboard/teacher/attendance",  color: "bg-[#3B82F6]", icon: CalendarCheck },
    { label: "Assessments", href: "/dashboard/teacher/assessments", color: "bg-[#8B5CF6]", icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
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
                <p className="text-3xl font-extrabold">{loading ? "..." : s.value}</p>
                <p className="text-sm text-white/80 mt-1 font-medium">
                  {loading ? "—" : pluralize(s.value, s.singular, s.plural)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <h2 className="font-bold text-gray-900 mb-4">Quick Navigation</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {QUICK_LINKS.map(link => (
            <Link key={link.href} to={link.href}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-[#6366F1]/30 hover:bg-[#6366F1]/5 transition-all group text-center"
            >
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", link.color)}>
                <link.icon size={18} className="text-white" />
              </div>
              <span className="text-xs font-semibold text-gray-600 group-hover:text-[#6366F1]">{link.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {!loading && data.classes.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">My Classes</h2>
            <Link to="/dashboard/teacher/students" className="text-xs font-semibold text-[#6366F1] hover:underline flex items-center gap-1">
              View Students <ChevronRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.classes.map((cls: any) => (
              <div key={cls.id} className="p-4 bg-[#F4F7FE] rounded-xl border border-gray-100">
                <p className="font-bold text-gray-800 text-sm">{cls.grade?.label} {cls.name}</p>
                <p className="text-xs text-gray-400 mt-1">{pluralize(cls.students?.length || 0, "student", "students")}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && data.subjects.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-4">My Subjects</h2>
          <div className="flex flex-wrap gap-2">
            {data.subjects.map((sub: any) => (
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

// ═══════════════════════════════════════════════════════════════
// PARENT VIEW
// ═══════════════════════════════════════════════════════════════
function ParentView() {
  const [children, setChildren] = useState<ParentChild[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = storedUser?.id;
        if (!userId) { setLoading(false); return; }

        const res = await axiosClient.get(`/students?parentId=${userId}`);
        setChildren(safeArray(res.data));
      } catch {
        toast.error("Failed to load children");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] rounded-2xl p-6 text-white">
        <h2 className="text-xl font-black mb-1">Parent Portal</h2>
        <p className="text-indigo-100/80 text-sm">
          Track your {children.length === 1 ? "child's" : "children's"} academic progress
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-[#6366F1]" />
        </div>
      ) : children.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
          <GraduationCap size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No children linked to your account</p>
          <p className="text-sm mt-1">Please contact the school administrator</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {children.map((child: any) => {
            const firstName = child.user?.firstName ?? child.firstName ?? "";
            const lastName  = child.user?.lastName  ?? child.lastName  ?? "";
            const email     = child.user?.email     ?? child.email     ?? "—";
            const isActive  = child.user?.isActive  ?? child.isActive  ?? false;
            const grade     = child.class?.grade?.label ?? "";
            const className = child.class?.name ?? "";

            return (
              <div key={child.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#6366F1]/10 flex items-center justify-center text-[#6366F1] font-extrabold text-lg shrink-0">
                    {firstName[0]}{lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 text-base">{firstName} {lastName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {grade} {className} {child.regNumber ? `· Reg: ${child.regNumber}` : ""}
                    </p>
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0",
                    isActive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                  )}>
                    {isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Class",       value: grade && className ? `${grade} ${className}` : "—" },
                    { label: "Reg Number",  value: child.regNumber ?? "—" },
                    { label: "Gender",      value: child.gender ? (child.gender.charAt(0).toUpperCase() + child.gender.slice(1)) : "—" },
                    { label: "Date of Birth", value: child.dateOfBirth ? child.dateOfBirth.split('T')[0] : "—" },
                    { label: "Email",       value: email },
                    { label: "School ID",   value: child.userId ?? "—" },
                  ].map(item => (
                    <div key={item.label} className="p-2.5 bg-[#F4F7FE] rounded-xl">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.label}</p>
                      <p className="text-xs font-semibold text-gray-700 mt-0.5 truncate">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// STUDENT VIEW
// ═══════════════════════════════════════════════════════════════
function StudentView() {
  const [homework, setHomework]   = useState<any[]>([]);
  const [lessons, setLessons]     = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);

  const [submitModal, setSubmitModal]   = useState<any>(null);
  const [submitFile, setSubmitFile]     = useState<File | null>(null);
  const [submitComment, setSubmitComment] = useState("");
  const [submitting, setSubmitting]     = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [hwRes, lessonRes] = await Promise.allSettled([
          axiosClient.get('/student/homework'),
          axiosClient.get('/student/lessons'),
        ]);
        setHomework(hwRes.status     === 'fulfilled' ? safeArray(hwRes.value.data)     : []);
        setLessons(lessonRes.status  === 'fulfilled' ? safeArray(lessonRes.value.data) : []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const closeSubmitModal = () => {
    setSubmitModal(null);
    setSubmitFile(null);
    setSubmitComment("");
  };

  const handleSubmit = async () => {
    if (!submitModal) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      if (submitComment.trim()) fd.append("comment", submitComment.trim());
      if (submitFile) fd.append("file", submitFile);
      await axiosClient.post(`/student/homework/${submitModal.id}/submit`, fd);
      toast.success("Homework submitted!");
      closeSubmitModal();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  const QUICK_LINKS = [
    { label: "My Subjects", href: "/dashboard/student/subjects",  color: "bg-[#6366F1]", icon: BookOpen },
    { label: "Homework",    href: "/dashboard/student/homework",  color: "bg-[#F59E0B]", icon: ClipboardList },
    { label: "My Results",  href: "/dashboard/student/results",   color: "bg-[#EF4444]", icon: TrendingUp },
    { label: "Attendance",  href: "/dashboard/student/attendance",color: "bg-[#3B82F6]", icon: CalendarCheck },
  ];

  return (
    <div className="space-y-6">

      {/* Banner */}
      <div className="bg-gradient-to-r from-[#10B981] to-[#059669] rounded-2xl p-6 text-white">
        <h2 className="text-xl font-black mb-1">Student Portal</h2>
        <p className="text-emerald-100/80 text-sm">View your lessons, homework and submit assignments</p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {QUICK_LINKS.map(link => (
          <Link key={link.href} to={link.href}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 bg-white hover:border-[#6366F1]/30 hover:bg-[#6366F1]/5 transition-all group text-center"
          >
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", link.color)}>
              <link.icon size={18} className="text-white" />
            </div>
            <span className="text-xs font-semibold text-gray-600 group-hover:text-[#6366F1]">{link.label}</span>
          </Link>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-10">
          <Loader2 size={24} className="animate-spin text-emerald-500" />
        </div>
      )}

      {/* Published Lessons */}
      {!loading && lessons.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-4">Recent Lessons</h2>
          <div className="space-y-2">
            {lessons.slice(0, 6).map((lesson: any) => (
              <div key={lesson.id} className="flex items-center gap-3 p-3 bg-[#F4F7FE] rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                  <BookOpen size={14} className="text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{lesson.title}</p>
                  <p className="text-xs text-gray-400">
                    {lesson.classSubject?.subject?.name ?? lesson.subject?.name ?? "—"}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {lesson.fileUrl && (
                    <a
                      href={`http://localhost:5000${lesson.fileUrl}`}
                      target="_blank" rel="noreferrer"
                      className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 font-semibold hover:bg-blue-200 transition-colors"
                    >
                      📎 File
                    </a>
                  )}
                  {lesson.videoUrl && (
                    <a
                      href={lesson.videoUrl}
                      target="_blank" rel="noreferrer"
                      className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-600 font-semibold hover:bg-purple-200 transition-colors"
                    >
                      🔗 Link
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Homework + Submit */}
      {!loading && homework.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-4">Pending Homework</h2>
          <div className="space-y-2">
            {homework.slice(0, 6).map((hw: any) => {
              const isOverdue = hw.dueDate && new Date(hw.dueDate) < new Date();
              return (
                <div key={hw.id} className="flex items-center gap-3 p-3 bg-[#F4F7FE] rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                    <ClipboardList size={14} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{hw.title}</p>
                    <p className={cn("text-xs", isOverdue ? "text-rose-500 font-semibold" : "text-gray-400")}>
                      Due: {hw.dueDate?.split('T')[0] ?? "—"} {isOverdue ? "(overdue)" : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => setSubmitModal(hw)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors flex items-center gap-1 shrink-0"
                  >
                    <Send size={10} /> Submit
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!loading && homework.length === 0 && lessons.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-gray-400">
          <GraduationCap size={36} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No content yet</p>
          <p className="text-sm mt-1">Your teacher hasn't published any lessons or homework yet</p>
        </div>
      )}

      {/* ── Submission Modal ── */}
      {submitModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900">Submit Homework</h3>
                <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[280px]">{submitModal.title}</p>
              </div>
              <button onClick={closeSubmitModal} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block">
                  Comment <span className="text-gray-400 normal-case font-normal">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Add a note for your teacher..."
                  value={submitComment}
                  onChange={e => setSubmitComment(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/30 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block">
                  Attachment <span className="text-gray-400 normal-case font-normal">(optional)</span>
                </label>
                <label className={cn(
                  "flex items-center gap-3 p-3.5 rounded-xl border-2 border-dashed cursor-pointer transition-colors group",
                  submitFile ? "border-emerald-400 bg-emerald-50" : "border-gray-200 hover:border-emerald-300"
                )}>
                  <Upload size={16} className={cn("shrink-0", submitFile ? "text-emerald-600" : "text-gray-400 group-hover:text-emerald-500")} />
                  <span className={cn("text-sm truncate", submitFile ? "text-emerald-700 font-semibold" : "text-gray-400")}>
                    {submitFile ? submitFile.name : "Click to select a file"}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip"
                    onChange={e => setSubmitFile(e.target.files?.[0] ?? null)}
                  />
                </label>
                {submitFile && (
                  <button onClick={() => setSubmitFile(null)} className="text-xs text-rose-500 hover:underline ml-1">
                    Remove file
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <Button variant="outline" onClick={closeSubmitModal} className="flex-1 h-10 rounded-xl">
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white h-10 rounded-xl gap-2"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {submitting ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
