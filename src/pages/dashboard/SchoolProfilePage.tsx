import { useEffect, useRef, useState } from "react";
import {
  School, Mail, Phone, MapPin, Map,
  Upload, Save, Loader2, CheckCircle2, ShieldAlert, X
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axiosClient from "@/axiosClient";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { resolveLogoUrl } from "@/lib/logo";
import type { School as SchoolType } from "@/types";
import type { SchoolProfileForm } from "@/types/forms";

const EMPTY_FORM: SchoolProfileForm = {
  name: "", email: "", phone: "", address: "", province: "",
};

export default function SchoolProfilePage() {
  const [school, setSchool] = useState<SchoolType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [form, setForm] = useState<SchoolProfileForm>(EMPTY_FORM);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Prevent browser default drag/drop ───────────────────
  useEffect(() => {
    const preventDefault = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener("dragover", preventDefault);
    window.addEventListener("drop", preventDefault);
    return () => {
      window.removeEventListener("dragover", preventDefault);
      window.removeEventListener("drop", preventDefault);
    };
  }, []);

  // ─── Fetch school ─────────────────────────────────────────
  const fetchSchool = async () => {
    try {
      const res = await axiosClient.get("/auth/school/me");
      const data: SchoolType = res.data;
      setSchool(data);
      setForm({
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
        province: data.province || "",
      });
      if (data.logoUrl) setLogoPreview(resolveLogoUrl(data.logoUrl));
    } catch {
      toast.error("Failed to load school profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSchool(); }, []);

  // ─── Cleanup blob URLs on unmount ─────────────────────────
  useEffect(() => {
    return () => {
      if (logoPreview?.startsWith("blob:")) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  // ─── File validation ──────────────────────────────────────
  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Max file size is 2MB");
      return;
    }
    if (logoPreview?.startsWith("blob:")) URL.revokeObjectURL(logoPreview);
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  // ─── Drag & drop handlers ─────────────────────────────────
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(true);
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragActive(false);
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  // ─── Save ─────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.name || !form.email || !form.phone || !form.address || !form.province) {
      setErrorMessage("All fields are required");
      return;
    }
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => formData.append(key, value));
      if (logoFile) formData.append("logo", logoFile);

      const res = await axiosClient.put("/auth/school/me", formData);
      const updatedSchool: SchoolType = res.data;

      const user = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...user, school: updatedSchool }));
      window.dispatchEvent(new Event("user-updated"));

      setSchool(updatedSchool);
      if (updatedSchool.logoUrl) {
        setLogoPreview(resolveLogoUrl(updatedSchool.logoUrl));
        setLogoFile(null);
      }
      setSuccessMessage("School profile updated successfully!");
      toast.success("Profile updated!");
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to update profile";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="School Profile">
        <div className="flex items-center justify-center py-24">
          <Loader2 size={32} className="animate-spin text-[#6366F1]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="School Profile" subtitle="View and manage your school information">
      <div className="max-w-4xl mx-auto space-y-6 pb-12">

        {/* ── Alerts ── */}
        {successMessage && (
          <div className="flex items-center gap-2 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
            <CheckCircle2 size={16} />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="flex items-center gap-2 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
            <ShieldAlert size={16} />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* ── Banner ── */}
        <div className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] rounded-3xl p-8 text-white relative shadow-xl shadow-indigo-100">
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">

            {/* Logo drop zone */}
            <div
              onClick={() => !logoPreview && fileInputRef.current?.click()}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "relative w-28 h-28 rounded-2xl border-2 border-dashed shrink-0 transition-all duration-200 group",
                !logoPreview && "cursor-pointer",
                dragActive
                  ? "border-white bg-white/30 scale-105"
                  : "border-white/30 bg-white/10 hover:bg-white/20"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                  e.target.value = "";
                }}
              />

              {logoPreview ? (
                <>
                  <img
                    src={logoPreview}
                    alt="School Logo"
                    className="w-full h-full object-cover rounded-2xl pointer-events-none"
                  />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setLogoPreview(null); setLogoFile(null); }}
                    className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center hover:bg-rose-600 transition-colors z-10 shadow-md opacity-0 group-hover:opacity-100"
                  >
                    <X size={12} className="text-white" />
                  </button>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 pointer-events-none">
                  <Upload size={24} className="text-white/70" />
                  <span className="text-[10px] text-white/60 text-center leading-tight px-1 font-medium">
                    {dragActive ? "Drop here!" : "Drop or click"}
                  </span>
                </div>
              )}
            </div>

            {/* School info */}
            <div className="text-center md:text-left space-y-1">
              <h2 className="text-2xl font-black tracking-tight">{school?.name || "Your School"}</h2>
              <p className="text-indigo-100/80 font-medium">{school?.email}</p>
              <div className="flex items-center justify-center md:justify-start gap-3 mt-3 flex-wrap">
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                  school?.isVerified
                    ? "bg-emerald-500/20 border-emerald-400/30 text-emerald-200"
                    : "bg-amber-500/20 border-amber-400/30 text-amber-200"
                )}>
                  {school?.isVerified ? "● Verified" : "● Pending Verification"}
                </span>
                <span className="text-indigo-200/60 text-[11px] font-medium">
                  Since {school?.createdAt ? new Date(school.createdAt).getFullYear() : "—"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Form ── */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <School size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Institution Details</h3>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-tight">Manage public information</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="md:col-span-2 space-y-2">
              <Label className="text-xs font-bold text-gray-500 ml-1">SCHOOL NAME</Label>
              <div className="relative group">
                <School className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" size={18} />
                <Input className="pl-12 h-14 bg-[#F4F7FE] border border-gray-200 focus:bg-white rounded-2xl"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Hillside Primary School" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-500 ml-1">OFFICIAL EMAIL</Label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" size={18} />
                <Input className="pl-12 h-14 bg-[#F4F7FE] border border-gray-200 focus:bg-white rounded-2xl"
                  type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="info@school.ac.zw" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-500 ml-1">CONTACT PHONE</Label>
              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" size={18} />
                <Input className="pl-12 h-14 bg-[#F4F7FE] border border-gray-200 focus:bg-white rounded-2xl"
                  value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+263 712 345 678" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-500 ml-1">STREET ADDRESS</Label>
              <div className="relative group">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" size={18} />
                <Input className="pl-12 h-14 bg-[#F4F7FE] border border-gray-200 focus:bg-white rounded-2xl"
                  value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="123 Main Street, Harare" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-500 ml-1">PROVINCE / REGION</Label>
              <div className="relative group">
                <Map className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" size={18} />
                <Input className="pl-12 h-14 bg-[#F4F7FE] border border-gray-200 focus:bg-white rounded-2xl"
                  value={form.province} onChange={e => setForm({ ...form, province: e.target.value })} placeholder="Harare" />
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-gray-50 flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 h-14 rounded-2xl font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95"
            >
              {saving
                ? <><Loader2 className="animate-spin mr-2" size={18} /> Saving...</>
                : <><Save className="mr-2" size={18} /> Update Profile</>
              }
            </Button>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}