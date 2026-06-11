import { useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import axiosClient from "@/axiosClient";
import { useUserStore } from "@/store/useUserStore";

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export default function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const clearUser = useUserStore((s) => s.clearUser);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await axiosClient.post("/auth/logout"); } catch {}
    localStorage.clear();
    clearUser();
    navigate("/login");
  };

  return (
    <div className="flex h-screen">

      <Sidebar
        sidebarOpen={sidebarOpen}
        mobileSidebarOpen={mobileSidebarOpen}
        setMobileSidebarOpen={setMobileSidebarOpen}
        handleLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col overflow-hidden">

        <Navbar
          setSidebarOpen={setSidebarOpen}
          setMobileSidebarOpen={setMobileSidebarOpen}
        />

        <main className="flex-1 p-6 overflow-y-auto bg-[#F4F7FE]">
          {(title || subtitle) && (
            <div className="mb-5">
              {title && <h1 className="text-xl font-bold text-gray-900">{title}</h1>}
              {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
            </div>
          )}
          {children}
        </main>

      </div>
    </div>
  );
}
