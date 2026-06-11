import { Bell, Loader2, Menu, Search } from "lucide-react";
import { resolveLogoUrl } from "@/lib/logo";
import { Link } from "react-router-dom";
import { Input } from "../ui/input";
import { getUserAvatarSrc } from "@/lib/avatar";
import { useUserStore } from "@/store/useUserStore";
import { useOwnAvatarUpload } from "@/hooks/useOwnAvatarUpload";

export default function Navbar({
  setSidebarOpen,
  setMobileSidebarOpen,
}: {
  setSidebarOpen: (fn: (prev: boolean) => boolean) => void;
  setMobileSidebarOpen: (val: boolean) => void;
  user?: any;
  school?: any;
}) {
  const user   = useUserStore((s) => s.user);
  const school = user?.school ?? null;

  const avatarSrc     = getUserAvatarSrc(user);
  const initials      = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase() || "?";
  const isAdmin       = user?.role === "admin" || user?.role === "headmaster";
  const schoolLogoSrc = isAdmin && school?.logoUrl
    ? `${resolveLogoUrl(school.logoUrl)}?t=${school.logoUpdatedAt ?? 0}`
    : null;

  const { uploading, fileRef, handleChange } = useOwnAvatarUpload();

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 h-20 flex items-center px-10">

      <div className="flex items-center gap-6">
        <button
          onClick={() => setSidebarOpen((prev) => !prev)}
          className="hidden lg:flex p-2.5 rounded-xl hover:bg-gray-50 text-gray-500 hover:text-indigo-600 transition-all active:scale-95"
        >
          <Menu size={22} />
        </button>

        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="lg:hidden p-2.5 rounded-xl hover:bg-gray-50 text-gray-500 transition-all"
        >
          <Menu size={22} />
        </button>

        <div className="hidden md:flex items-center gap-3 bg-gray-50/50 border border-gray-100 focus-within:bg-white focus-within:border-indigo-100 px-5 py-2.5 rounded-2xl transition-all w-72">
          <Search size={18} className="text-gray-400" />
          <Input
            type="text"
            placeholder="Search anything..."
            className="bg-transparent text-sm placeholder:text-gray-400 w-full border-gray-300 rounded-xl outline-none"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-8">

        <button className="p-2.5 rounded-xl hover:bg-gray-50 text-gray-500 hover:text-indigo-600 transition-all relative">
          <Bell size={22} />
          <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full" />
        </button>

        <div className="h-10 w-[1px] bg-gray-100 hidden sm:block" />

        <div className="flex items-center gap-4">
          <Link to="/dashboard/profile" className="text-right hidden sm:block group">
            <p className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors leading-tight">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
              {user?.role || "Administrator"}
            </p>
          </Link>

          {/* Avatar — click to upload */}
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleChange}
          />
          <div
            className="relative cursor-pointer group"
            onClick={() => fileRef.current?.click()}
            title="Change profile photo"
          >
            {uploading ? (
              <div className="w-11 h-11 rounded-2xl bg-indigo-100 flex items-center justify-center shadow-lg">
                <Loader2 size={18} className="animate-spin text-indigo-500" />
              </div>
            ) : schoolLogoSrc ? (
              <img
                src={schoolLogoSrc}
                className="w-11 h-11 rounded-2xl object-cover ring-2 ring-transparent group-hover:ring-indigo-300 transition-all shadow-sm"
                alt="School"
              />
            ) : avatarSrc ? (
              <img
                src={avatarSrc}
                className="w-11 h-11 rounded-2xl object-cover ring-2 ring-transparent group-hover:ring-indigo-300 transition-all shadow-sm"
                alt="Profile"
              />
            ) : (
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-black shadow-lg group-hover:ring-2 group-hover:ring-indigo-300 transition-all">
                {initials}
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
          </div>
        </div>
      </div>
    </header>
  );
}
