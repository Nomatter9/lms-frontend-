import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard, Users, BookOpen, ClipboardList,
  CalendarDays, GraduationCap, LogOut, Menu, X,
  School, ChevronDown, Bell, Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import axiosClient from "@/axiosClient";

const NAV_GROUPS = [
  {
    label: "Main",
    items: [
      { icon: LayoutDashboard, label: "Overview", href: "/dashboard/teacher" },
      { icon: Users, label: "My Students", href: "/dashboard/teacher/students" },
    ]
  },
  {
    label: "Teaching",
    items: [
      { icon: BookOpen, label: "Lessons", href: "/dashboard/teacher/lessons" },
      { icon: ClipboardList, label: "Homework", href: "/dashboard/teacher/homework" },
      { icon: CalendarDays, label: "Attendance", href: "/dashboard/teacher/attendance" },
      { icon: GraduationCap, label: "Assessments", href: "/dashboard/teacher/assessments" },
    ]
  },
];

interface TeacherLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function TeacherLayout({ children, title, subtitle }: TeacherLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user") || "{}"));
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleUpdate = () => setUser(JSON.parse(localStorage.getItem("user") || "{}"));
    window.addEventListener("user-updated", handleUpdate);
    return () => window.removeEventListener("user-updated", handleUpdate);
  }, []);

  const school = user?.school;
  const initials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase();

  const handleLogout = async () => {
    try { await axiosClient.post("/auth/logout"); } catch {}
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-[#F4F7FE] overflow-hidden">

      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={cn(
        "fixed lg:relative z-30 flex flex-col h-full bg-[#1B2559] transition-all duration-300 shrink-0",
        sidebarOpen ? "w-[240px]" : "w-[70px]",
        mobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>

        {/* Logo */}
        <div className={cn(
          "flex items-center gap-3 h-16 border-b border-white/10 shrink-0 px-4",
          !sidebarOpen && "justify-center px-0"
        )}>
          <div className="w-9 h-9 rounded-xl bg-[#10B981] flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/30">
            <School size={18} className="text-white" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="font-bold text-white text-sm leading-tight truncate">
                {school?.name || "School LMS"}
              </p>
              <p className="text-[10px] text-[#A3AED0] uppercase tracking-wider">Teacher Portal</p>
            </div>
          )}
          {mobileSidebarOpen && (
            <button onClick={() => setMobileSidebarOpen(false)} className="ml-auto lg:hidden text-[#A3AED0]">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              {sidebarOpen && (
                <p className="text-[10px] font-bold text-[#A3AED0]/50 uppercase tracking-widest px-3 mb-2">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map(({ icon: Icon, label, href }) => {
                  const active = location.pathname === href;
                  return (
                    <Link
                      key={href}
                      to={href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                        active
                          ? "bg-[#10B981] text-white shadow-lg shadow-emerald-500/30"
                          : "text-[#A3AED0] hover:bg-white/10 hover:text-white",
                        !sidebarOpen && "justify-center px-0"
                      )}
                      title={!sidebarOpen ? label : undefined}
                    >
                      <Icon size={18} className="shrink-0" />
                      {sidebarOpen && <span className="truncate">{label}</span>}
                      {sidebarOpen && active && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User */}
        <div className={cn("p-3 border-t border-white/10 shrink-0", !sidebarOpen && "px-2")}>
          {sidebarOpen ? (
            <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-colors cursor-pointer">
              <div className="w-8 h-8 rounded-xl bg-[#10B981] flex items-center justify-center text-white text-xs font-bold shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[11px] text-[#A3AED0] capitalize">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="text-[#A3AED0] hover:text-rose-400 transition-colors p-1 rounded-lg hover:bg-rose-500/10"
                title="Logout"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center p-2.5 rounded-xl text-[#A3AED0] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <header className="bg-white border-b border-gray-100 h-16 px-6 flex items-center gap-4 shrink-0 shadow-sm">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex items-center justify-center w-9 h-9 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Menu size={18} />
          </button>
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl text-gray-400 hover:bg-gray-100"
          >
            <Menu size={18} />
          </button>

          <div className="flex-1 max-w-sm relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 bg-[#F4F7FE] rounded-xl text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 border border-transparent focus:border-[#10B981]/30 transition-all"
            />
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
              <Bell size={17} className="text-gray-500" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#10B981] rounded-full ring-2 ring-white" />
            </button>
            <div className="h-8 w-px bg-gray-200" />
            <div className="flex items-center gap-2.5 cursor-pointer">
              <div className="w-9 h-9 rounded-xl bg-[#10B981] flex items-center justify-center text-white text-xs font-bold shadow-md shadow-emerald-500/20">
                {initials}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-gray-800 leading-tight">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[11px] text-gray-400 capitalize">{user?.role}</p>
              </div>
              <ChevronDown size={14} className="text-gray-400 hidden sm:block" />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {(title || subtitle) && (
            <div className="px-6 pt-6 pb-2">
              {title && <h1 className="text-xl font-bold text-gray-900">{title}</h1>}
              {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
            </div>
          )}
          <div className="p-6 pt-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}