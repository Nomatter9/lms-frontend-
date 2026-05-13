import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import axiosClient from "@/axiosClient";

export default function DashboardLayout({ children }: any) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // ✅ Read user reactively from localStorage
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("user") || "{}")
  );

  const navigate = useNavigate();

  // ✅ Listen for updates dispatched after school profile save
  useEffect(() => {
    const handleUserUpdated = () => {
      setUser(JSON.parse(localStorage.getItem("user") || "{}"));
    };
    window.addEventListener("user-updated", handleUserUpdated);
    return () => window.removeEventListener("user-updated", handleUserUpdated);
  }, []);

  const school = user?.school;

  const handleLogout = async () => {
    try {
      await axiosClient.post("/auth/logout");
    } catch {}
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="flex h-screen">

      <Sidebar
        sidebarOpen={sidebarOpen}
        mobileSidebarOpen={mobileSidebarOpen}
        setMobileSidebarOpen={setMobileSidebarOpen}
        handleLogout={handleLogout}
        user={user}
        school={school}
      />

      <div className="flex-1 flex flex-col overflow-hidden">

        <Navbar
          setSidebarOpen={setSidebarOpen}
          setMobileSidebarOpen={setMobileSidebarOpen}
          user={user}
          school={school}
        />

        <main className="flex-1 p-6 overflow-y-auto bg-[#F4F7FE]">
          {children}
        </main>

      </div>
    </div>
  );
}