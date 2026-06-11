import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users, BookMarked, TrendingUp, UserCheck,
  ArrowUpRight, Clock, ChevronRight,
  GraduationCap, BookOpen, School,
} from "lucide-react";
import axiosClient from "@/axiosClient";
import { cn } from "@/lib/utils";
import type { AcademicYear, Term } from "@/types";
import type { HeadmasterStats } from "@/types/headmaster";

const safeArray = (v: any): any[] => (Array.isArray(v) ? v : []);
const pluralize  = (n: number, s: string, p: string) => `${n} ${n === 1 ? s : p}`;

export default function HeadmasterDashboard({ user, school }: { user: any; school: any }) {
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
    { label: "Add Staff Member", href: "/dashboard/staff?open=create",        color: "bg-[#6366F1]", icon: UserCheck },
    { label: "Add Student",      href: "/dashboard/students?open=create",     color: "bg-[#10B981]", icon: GraduationCap },
    { label: "Create Class",     href: "/dashboard/classes?open=create",      color: "bg-[#F59E0B]", icon: BookMarked },
    { label: "Add Subject",      href: "/dashboard/subjects?open=create",     color: "bg-[#3B82F6]", icon: BookOpen },
    { label: "Add Parent",       href: "/dashboard/parents?open=create",      color: "bg-[#8B5CF6]", icon: Users },
    { label: "Add Grade",        href: "/dashboard/grades?open=create",       color: "bg-[#EF4444]", icon: TrendingUp },
    { label: "Academic Years",   href: "/dashboard/academicYear?open=create", color: "bg-[#06B6D4]", icon: Clock },
  ];

  const MANAGEMENT_LINKS = [
    { label: "My Staff",       desc: "Manage teachers, headmaster and admin",   href: "/dashboard/staff",        gradient: "linear-gradient(135deg, #6366F1, #8B5CF6)", icon: UserCheck },
    { label: "My Students",    desc: "Enroll and manage student profiles",       href: "/dashboard/students",     gradient: "linear-gradient(135deg, #10B981, #059669)", icon: GraduationCap },
    { label: "My Classes",     desc: "Create classes and assign class teachers", href: "/dashboard/classes",      gradient: "linear-gradient(135deg, #F59E0B, #D97706)", icon: BookMarked },
    { label: "My Subjects",    desc: "Add and manage subjects per grade",        href: "/dashboard/subjects",     gradient: "linear-gradient(135deg, #3B82F6, #06B6D4)", icon: BookOpen },
    { label: "My Grades",      desc: "Manage grade levels from Grade 1 to 7",   href: "/dashboard/grades",       gradient: "linear-gradient(135deg, #EF4444, #F43F5E)", icon: TrendingUp },
    { label: "My Parents",     desc: "Manage parent and guardian accounts",      href: "/dashboard/parents",      gradient: "linear-gradient(135deg, #8B5CF6, #6366F1)", icon: Users },
    { label: "Academic Years", desc: "Manage academic years and terms",          href: "/dashboard/academicYear", gradient: "linear-gradient(135deg, #06B6D4, #3B82F6)", icon: Clock },
    { label: "School Profile", desc: "Update school information and logo",       href: "/dashboard/school",       gradient: "linear-gradient(135deg, #059669, #10B981)", icon: School },
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
