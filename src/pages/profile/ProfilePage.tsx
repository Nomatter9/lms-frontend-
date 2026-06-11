import { useEffect, useRef, useState } from "react";
import { Loader2, Save, Upload } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import TeacherLayout from "@/components/dashboard/TeacherLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axiosClient from "@/axiosClient";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getUserAvatarSrc, getInitials } from "@/lib/avatar";
import { useUserStore } from "@/store/useUserStore";

export default function ProfilePage() {
  const user = useUserStore((s) => s.user);
  const setUser = useUserStore((s) => s.setUser);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [saving, setSaving] = useState(false);

  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [changingPw, setChangingPw] = useState(false);

  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [pendingAvatar, setPendingAvatar] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setForm({
      firstName: user?.firstName ?? "",
      lastName:  user?.lastName  ?? "",
      email:     user?.email     ?? "",
      phone:     user?.phone     ?? "",
    });
  }, [user]);

  const stageAvatar = (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5 MB"); return; }
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    setPendingAvatar(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) stageAvatar(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) stageAvatar(file);
  };

  const handleSaveProfile = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error("First and last name are required");
      return;
    }
    setSaving(true);
    try {
      // Save profile fields
      const res = await axiosClient.put("/auth/me", {
        firstName: form.firstName.trim(),
        lastName:  form.lastName.trim(),
        phone:     form.phone.trim(),
      });

      let avatarUrl = res.data.avatarUrl || user.avatarUrl;

      // Upload avatar if one was staged
      if (pendingAvatar) {
        const fd = new FormData();
        fd.append("avatar", pendingAvatar);
        const avatarRes = await axiosClient.put("/auth/me/avatar", fd, {
          headers: { "Content-Type": undefined },
        });
        avatarUrl = avatarRes.data.avatarUrl ?? avatarRes.data.user?.avatarUrl ?? avatarUrl;
        setPendingAvatar(null);
      }

      const updated = {
        ...user,
        ...res.data,
        firstName: form.firstName.trim(),
        lastName:  form.lastName.trim(),
        phone:     form.phone.trim(),
        avatarUrl,
        avatarUpdatedAt: pendingAvatar ? Date.now() : user.avatarUpdatedAt,
      };
      setUser(updated);
      toast.success("Profile updated");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!pwForm.current || !pwForm.next) {
      toast.error("Fill in current and new password");
      return;
    }
    if (pwForm.next !== pwForm.confirm) {
      toast.error("New passwords do not match");
      return;
    }
    if (pwForm.next.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setChangingPw(true);
    try {
      await axiosClient.put("/auth/me/password", {
        currentPassword: pwForm.current,
        newPassword:     pwForm.next,
      });
      toast.success("Password changed successfully");
      setPwForm({ current: "", next: "", confirm: "" });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setChangingPw(false);
    }
  };

  const avatarSrc = preview ?? getUserAvatarSrc(user);
  const initials = getInitials(user?.firstName ?? "", user?.lastName ?? "");

  const isTeacher = user?.role === "teacher";
  const Layout = isTeacher ? TeacherLayout : DashboardLayout;

  return (
    <Layout title="My Profile" subtitle="Manage your account details">
      <div className="max-w-2xl space-y-5">

        {/* ── Avatar ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-4">Profile Photo</h2>

          <div className="flex items-center gap-6">
            {/* Current avatar */}
            <div className="relative shrink-0">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt="Avatar"
                  className="w-20 h-20 rounded-full object-cover ring-2 ring-[#6366F1]/20"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-white text-2xl font-bold">
                  {initials}
                </div>
              )}
              {pendingAvatar && (
                <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow">
                  pending
                </div>
              )}
            </div>

            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "flex-1 border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors",
                pendingAvatar
                  ? "border-amber-400 bg-amber-50"
                  : dragOver
                  ? "border-[#6366F1] bg-[#6366F1]/5"
                  : "border-gray-200 hover:border-[#6366F1]/50 hover:bg-gray-50"
              )}
            >
              <Upload size={20} className={cn("transition-colors", pendingAvatar ? "text-amber-500" : dragOver ? "text-[#6366F1]" : "text-gray-400")} />
              <p className="text-sm font-medium text-gray-700 text-center">
                {pendingAvatar ? `${pendingAvatar.name} — will save with profile` : dragOver ? "Drop to upload" : "Drag & drop or click to upload"}
              </p>
              <p className="text-xs text-gray-400">PNG, JPG, WEBP — max 5 MB</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileInput}
            />
          </div>
        </div>

        {/* ── Personal info ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-4">Personal Information</h2>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  First Name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  value={form.firstName}
                  onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                  className="border-gray-200 h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Last Name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  value={form.lastName}
                  onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                  className="border-gray-200 h-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</Label>
              <Input
                value={form.email}
                disabled
                className="border-gray-200 h-10 bg-gray-50 text-gray-400 cursor-not-allowed"
              />
              <p className="text-[10px] text-gray-400 ml-1">Email cannot be changed. Contact the administrator.</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Phone</Label>
              <Input
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="e.g. +263 77 123 4567"
                className="border-gray-200 h-10"
              />
            </div>

            <Button
              onClick={handleSaveProfile}
              disabled={saving}
              className="w-full bg-[#6366F1] hover:bg-[#4F46E5] text-white h-10 rounded-xl gap-2"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* ── Change Password ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-1">Change Password</h2>
          <p className="text-xs text-gray-400 mb-4">Leave blank if you don't want to change it</p>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Current Password</Label>
              <Input
                type="password"
                value={pwForm.current}
                onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))}
                placeholder="Enter current password"
                className="border-gray-200 h-10"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">New Password</Label>
                <Input
                  type="password"
                  value={pwForm.next}
                  onChange={e => setPwForm(p => ({ ...p, next: e.target.value }))}
                  placeholder="New password"
                  className="border-gray-200 h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Confirm New</Label>
                <Input
                  type="password"
                  value={pwForm.confirm}
                  onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                  placeholder="Confirm new password"
                  className={cn(
                    "border-gray-200 h-10",
                    pwForm.confirm && pwForm.next !== pwForm.confirm && "border-rose-300 focus:ring-rose-300/30"
                  )}
                />
              </div>
            </div>
            {pwForm.confirm && pwForm.next !== pwForm.confirm && (
              <p className="text-xs text-rose-500 font-medium">Passwords do not match</p>
            )}
            <Button
              onClick={handleChangePassword}
              disabled={changingPw}
              variant="outline"
              className="w-full h-10 rounded-xl gap-2 border-[#6366F1]/30 text-[#6366F1] hover:bg-[#6366F1]/5"
            >
              {changingPw ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {changingPw ? "Changing..." : "Change Password"}
            </Button>
          </div>
        </div>

      </div>
    </Layout>
  );
}
