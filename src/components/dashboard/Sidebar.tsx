import { Link, useLocation } from "react-router-dom";
import { useUserStore } from "@/store/useUserStore";
import {
  LayoutDashboard, Users, BookOpen, GraduationCap,
  Calendar, Settings, BarChart3, Layers, LogOut,
  School, X, UserCheck, ClipboardList, CalendarCheck,
  TrendingUp, BookMarked, UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveLogoUrl } from "@/lib/logo";

// ─── Nav config per role ──────────────────────────────────────
const NAV_BY_ROLE: Record<string, {
  label: string;
  items: { icon: any; label: string; href: string }[];
}[]> = {

  // ── Headmaster & Admin ──────────────────────────────────────
  headmaster: [
    {
      label: "Main",
      items: [
        { icon: LayoutDashboard, label: "Overview",      href: "/dashboard" },
        { icon: UserCheck,       label: "Staff",         href: "/dashboard/staff" },
        { icon: Users,           label: "Parents",       href: "/dashboard/parents" },
      ],
    },
    {
      label: "Academic",
      items: [
        { icon: GraduationCap,   label: "Students",      href: "/dashboard/students" },
        { icon: Layers,          label: "Classes",       href: "/dashboard/classes" },
        { icon: BookOpen,        label: "Subjects",      href: "/dashboard/subjects" },
        { icon: BookMarked,      label: "Grades",        href: "/dashboard/grades" },
        { icon: Calendar,        label: "Academic Years",href: "/dashboard/academicYear" },
      ],
    },
    {
      label: "System",
      items: [
        { icon: BarChart3,       label: "Reports",       href: "/dashboard/reports" },
        { icon: School,          label: "School Profile",href: "/dashboard/school" },
        { icon: Settings,        label: "Settings",      href: "/dashboard/settings" },
      ],
    },
  ],

  // ── Teacher ─────────────────────────────────────────────────
  teacher: [
    {
      label: "Main",
      items: [
        { icon: LayoutDashboard, label: "Overview",      href: "/dashboard" },
      ],
    },
    {
      label: "My Classroom",
      items: [
        { icon: GraduationCap,   label: "My Students",   href: "/dashboard/teacher/students" },
        { icon: BookOpen,        label: "Lessons",       href: "/dashboard/teacher/lessons" },
        { icon: ClipboardList,   label: "Homework",      href: "/dashboard/teacher/homework" },
        { icon: CalendarCheck,   label: "Attendance",    href: "/dashboard/teacher/attendance" },
        { icon: TrendingUp,      label: "Assessments",   href: "/dashboard/teacher/assessments" },
      ],
    },
    {
      label: "Account",
      items: [
        { icon: UserCircle,      label: "My Profile",    href: "/dashboard/profile" },
      ],
    },
  ],

  // ── Parent ──────────────────────────────────────────────────
  parent: [
    {
      label: "Main",
      items: [
        { icon: LayoutDashboard, label: "Overview",      href: "/dashboard" },
        { icon: GraduationCap,   label: "My Children",   href: "/dashboard/parent/children" },
      ],
    },
    {
      label: "Account",
      items: [
        { icon: UserCircle,      label: "My Profile",    href: "/dashboard/profile" },
      ],
    },
  ],

  // ── Student (pupil) ─────────────────────────────────────────
  pupil: [
    {
      label: "Main",
      items: [
        { icon: LayoutDashboard, label: "Overview",      href: "/dashboard" },
      ],
    },
    {
      label: "My Learning",
      items: [
        { icon: BookOpen,        label: "My Subjects",   href: "/dashboard/student/subjects" },
        { icon: BookMarked,      label: "Lessons",       href: "/dashboard/student/lessons" },
        { icon: ClipboardList,   label: "Homework",      href: "/dashboard/student/homework" },
        { icon: TrendingUp,      label: "My Results",    href: "/dashboard/student/results" },
        { icon: CalendarCheck,   label: "Attendance",    href: "/dashboard/student/attendance" },
      ],
    },
    {
      label: "Account",
      items: [
        { icon: UserCircle,      label: "My Profile",    href: "/dashboard/profile" },
      ],
    },
  ],
};

// admin uses same nav as headmaster
NAV_BY_ROLE['admin'] = NAV_BY_ROLE['headmaster'];

// ─── Sidebar label per role ───────────────────────────────────
const PORTAL_LABEL: Record<string, string> = {
  headmaster: "Admin Portal",
  admin:      "Admin Portal",
  teacher:    "Teacher Portal",
  parent:     "Parent Portal",
  pupil:      "Student Portal",
};

// ─── Component ────────────────────────────────────────────────
interface SidebarProps {
  sidebarOpen: boolean;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
  handleLogout: () => void;
}

export default function Sidebar({
  sidebarOpen,
  mobileSidebarOpen,
  setMobileSidebarOpen,
  handleLogout,
}: SidebarProps) {
  const location = useLocation();
  const role = useUserStore((s) => s.user?.role) ?? localStorage.getItem("role") ?? "headmaster";
  const navGroups = NAV_BY_ROLE[role] ?? NAV_BY_ROLE['headmaster'];
  const portalLabel = PORTAL_LABEL[role] || "Portal";

  const school = useUserStore((s) => s.user?.school ?? null);


  return (
    <aside className={cn(
      "fixed lg:relative z-30 flex flex-col h-full bg-[#1B2559] transition-all duration-300 ease-in-out border-r border-white/5",
      sidebarOpen ? "w-[260px]" : "w-[80px]",
      mobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
    )}>

      {/* ── Header / Logo ── */}
      <div className={cn(
        "flex items-center h-20 px-5 mb-4",
        !sidebarOpen && "justify-center px-0"
      )}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20 overflow-hidden">
            {school?.logoUrl
              ? <img src={`${resolveLogoUrl(school.logoUrl)}?t=${school.logoUpdatedAt ?? 0}`} alt="logo" className="w-full h-full object-cover" />
              : <School size={20} className="text-white" />
            }
          </div>

          {sidebarOpen && (
            <div className="flex flex-col min-w-0 animate-in fade-in slide-in-from-left-2 duration-300">
              <p className="text-white font-bold text-sm truncate leading-tight">
                {school?.name || "School LMS"}
              </p>
              <p className="text-[10px] font-medium text-indigo-200/50 uppercase tracking-widest mt-0.5">
                {portalLabel}
              </p>
            </div>
          )}
        </div>

        {mobileSidebarOpen && (
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="ml-auto p-2 text-white/50 hover:text-white lg:hidden"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto px-4 custom-scrollbar">
        <div className="space-y-8">
          {navGroups.map((group) => (
            <div key={group.label} className="space-y-1.5">
              {sidebarOpen && (
                <p className="text-[10px] font-bold text-white/30 px-3 mb-3 uppercase tracking-[2px]">
                  {group.label}
                </p>
              )}
              <div className="space-y-1">
                {group.items.map(({ icon: Icon, label, href }) => {
                  const active = location.pathname === href;
                  return (
                    <Link
                      key={href}
                      to={href}
                      className={cn(
                        "group relative flex items-center gap-3 px-3 py-3 rounded-2xl text-sm font-medium transition-all duration-200",
                        active
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                          : "text-[#A3AED0] hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <Icon
                        size={20}
                        className={cn(
                          "shrink-0 transition-transform duration-200",
                          active ? "scale-110" : "group-hover:scale-110"
                        )}
                      />
                      {sidebarOpen && (
                        <span className="truncate animate-in fade-in duration-300">
                          {label}
                        </span>
                      )}
                      {active && !sidebarOpen && (
                        <div className="absolute right-0 w-1 h-6 bg-white rounded-l-full" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* ── Footer / Logout ── */}
      <div className={cn(
        "p-4 mt-auto border-t border-white/5",
        !sidebarOpen && "flex justify-center"
      )}>
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 w-full p-3 rounded-2xl text-[#A3AED0] hover:bg-rose-500/10 hover:text-rose-400 transition-colors duration-200",
            !sidebarOpen && "justify-center"
          )}
        >
          <LogOut size={20} className="shrink-0" />
          {sidebarOpen && <span className="text-sm font-bold">Log Out</span>}
        </button>
      </div>
    </aside>
  );
}