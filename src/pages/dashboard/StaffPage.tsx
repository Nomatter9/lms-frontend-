import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Search, X, Save, Loader2, UserCheck } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import axiosClient from "@/axiosClient";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { StaffMember } from "@/types";
import type { StaffForm } from "@/types/forms";
import AvatarUpload from "@/components/ui/AvatarUpload";
import { getInitials } from "@/lib/avatar";

const ROLES = ["teacher", "headmaster", "admin"] as const;

const EMPTY_FORM: StaffForm = {
  firstName: "", lastName: "", email: "", classId: "", phone: "", role: "teacher",
};

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StaffMember | null>(null);
  const [form, setForm] = useState<StaffForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StaffMember | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get("/auth/staff");
      setStaff(res.data);
    } catch {
      toast.error("Failed to load staff");
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
  try {
    const res = await axiosClient.get("/classes");
    setClasses(res.data);
  } catch {
    toast.error("Failed to load classes");
  }
};
  useEffect(() => { 
    fetchStaff();
    fetchClasses()
   }, []);

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
     setAvatarFile(null);      // ✅ add
   setAvatarPreview(null); 
    setModalOpen(true);
  };

  const openEdit = (member: StaffMember) => {
    setEditTarget(member);
      setAvatarFile(null);        // ✅ add
  setAvatarPreview(null)
    setForm({
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      classId: member.classId ? String(member.classId) : "",
      phone: member.phone || "",
      role: member.role,
    });
    setModalOpen(true);
  };

const handleSave = async () => {
  if (!form.firstName || !form.lastName || !form.email) {
    toast.error("First name, last name and email are required");
    return;
  }

  setSaving(true);

  try {
    if (editTarget) {
      // ✅ FIX: store response
      const res = await axiosClient.put(`/auth/staff/${editTarget.id}`, {
        ...form,
        classId: form.classId || null,
      });

      // ✅ FIX: use returned updated staff data
      setStaff(prev =>
        prev.map(s =>
          s.id === editTarget.id ? { ...s, ...res.data } : s
        )
      );

      toast.success("Staff member updated");
    } else {
      const res = await axiosClient.post("/auth/staff", form);

      // ✅ Optional avatar upload after creation
      if (avatarFile) {
        try {
          const fd = new FormData();
          fd.append("avatar", avatarFile);

          const avatarRes = await axiosClient.put(
            `/auth/staff/${res.data.id}/avatar`,
            fd
          );

          res.data.avatarUrl = avatarRes.data.avatarUrl;
        } catch {
          console.warn("Avatar upload failed");
        }
      }

      setStaff(prev => [...prev, res.data]);

      toast.success("Staff member created — credentials sent via email");
    }

    setModalOpen(false);
    setAvatarFile(null);
    setAvatarPreview(null);

    // ✅ Refresh latest backend state
    await fetchStaff();

  } catch (err: any) {
    toast.error(err.response?.data?.message || "Failed to save");
  } finally {
    setSaving(false);
  }
};
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axiosClient.delete(`/auth/staff/${deleteTarget.id}`);
      toast.success("Staff member removed");
      setDeleteTarget(null);
      fetchStaff();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const filtered = staff.filter((s) =>
    `${s.firstName} ${s.lastName} ${s.email} ${s.role}`
      .toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout title="Staff Management" subtitle="Manage all school staff members">

      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search staff..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white border-gray-200 h-10"
          />
        </div>
        <Button
          onClick={openCreate}
          className="bg-[#6366F1] hover:bg-[#5558E3] text-white h-10 gap-2 rounded-xl ml-auto"
        >
          <Plus size={16} /> Add Staff Member
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-[#6366F1]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <UserCheck size={40} className="mb-3 opacity-30" />
            <p className="font-medium">No staff members found</p>
            <p className="text-sm mt-1">Add your first staff member to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Image","Name", "Email","Class", "Phone", "Role", "Status","Actions", ""].map((h) => (
                    <th key={h} className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-6 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((member) => (
                  <tr key={member.id} className="hover:bg-[#F4F7FE]/50 transition-colors">
                 
<td className="px-6 py-3.5">
  <AvatarUpload
    userId={member.id}
    currentUrl={member.avatarUrl}
    initials={getInitials(member.firstName, member.lastName)}
    endpoint="/auth/staff/:id/avatar"
    size="sm"
    onUpdated={newUrl => setStaff(prev => prev.map(s =>
      s.id === member.id ? { ...s, avatarUrl: newUrl } : s
    ))}
  />
</td>
                                    <td>
  <p className="text-sm font-semibold text-gray-800">
      {member.firstName} {member.lastName}
    </p>
 </td>
  


<td className="px-6 py-3.5 text-sm text-gray-500">{member.email}</td>
<td className="px-6 py-3.5">
  {member.classId ? (
    (() => {
      const cls = classes.find(c => String(c.id) === String(member.classId));
 const label = cls
  ? `${cls.grade?.label?.split(" ").pop() || ""}${cls.name}`
  : member.class?.name || "—";
      return (
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
          {label}
        </span>
      );
    })()
  ) : (
    <span className="text-gray-600 italic text-xs">No class</span>
  )}
</td>
                           <td className="px-6 py-3.5 text-sm text-gray-500">{member.phone || "—"}</td>
                    <td className="px-6 py-3.5">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#6366F1]/10 text-[#6366F1] capitalize">
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={cn(
                        "text-xs font-semibold px-2.5 py-1 rounded-full",
                        member.isActive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                      )}>
                        {member.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(member)}
                          disabled={member.role === 'admin'}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6366F1] hover:bg-[#6366F1]/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(member)}
                          disabled={member.role === 'headmaster' || member.role === 'admin'}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Create/Edit Modal ── */}
    {modalOpen && (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-visible">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
        <h3 className="font-bold text-gray-900">
          {editTarget ? "Edit Staff Member" : "Add Staff Member"}
        </h3>
        <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
          <X size={18} />
        </button>
      </div>

<div className="flex justify-center py-4 border-b border-gray-50">
  {editTarget ? (
    <AvatarUpload
      userId={editTarget.id}
      currentUrl={editTarget.avatarUrl}
      initials={getInitials(editTarget.firstName, editTarget.lastName)}
      endpoint="/auth/staff/:id/avatar"
      size="lg"
      onUpdated={newUrl => {
        setStaff(prev => prev.map(s =>
          s.id === editTarget.id ? { ...s, avatarUrl: newUrl } : s
        ));
        setEditTarget(prev => prev ? { ...prev, avatarUrl: newUrl } : prev);
      }}
    />
  ) : (
    <div className="flex flex-col items-center gap-2">
      <div
        className={cn(
          "relative group w-20 h-20 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden cursor-pointer transition-all",
          avatarPreview
            ? "border-solid border-[#6366F1]"
            : "border-gray-200 bg-gray-50 hover:border-[#6366F1] hover:bg-[#6366F1]/5"
        )}
        onClick={() => document.getElementById('staff-avatar-input')?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (!file || !file.type.startsWith("image/")) return;
          if (file.size > 2 * 1024 * 1024) { toast.error("Max 2MB"); return; }
          setAvatarFile(file);
          setAvatarPreview(URL.createObjectURL(file));
        }}
      >
        <input
          id="staff-avatar-input"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (file.size > 2 * 1024 * 1024) { toast.error("Max 2MB"); return; }
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
            e.target.value = "";
          }}
        />
        {avatarPreview ? (
          <>
            <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Edit2 size={14} className="text-white" />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center text-gray-400 group-hover:text-[#6366F1] transition-colors">
            <Plus size={18} />
            <span className="text-[9px] font-bold uppercase mt-1">Photo</span>
          </div>
        )}
      </div>
      <p className="text-[10px] text-gray-400">Add profile photo (optional)</p>
    </div>
  )}
</div>
      <div className="p-6 space-y-5">
        {/* Name Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">First Name</Label>
            <Input 
              placeholder="John" 
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })} 
              className="border-gray-200 focus:ring-[#6366F1] h-10" 
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Last Name</Label>
            <Input 
              placeholder="Moyo" 
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })} 
              className="border-gray-200 focus:ring-[#6366F1] h-10" 
            />
          </div>
        </div>

        {/* Email - Full Width */}
        <div className="space-y-1.5">
          <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Email Address</Label>
          <Input 
            type="email" 
            placeholder="john.moyo@school.ac.zw" 
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} 
            className="border-gray-200 focus:ring-[#6366F1] h-10"
            disabled={!!editTarget} 
          />
          {!!editTarget && (
            <p className="text-[10px] text-gray-400 italic mt-1">Email cannot be changed after creation</p>
          )}
        </div>

        {/* Assignments Grid: Class and Role */}
        <div className="grid grid-cols-2 gap-4">
         <div className="space-y-1.5">
  <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
    Assign Class
  </Label>
  
  <Select
  // Use a combined key to force refresh on modal open/edit
  key={`${editTarget?.id || 'new'}-${classes.length}`}
  value={form.classId ? String(form.classId) : "none"}
  onValueChange={(val) =>
    setForm({ ...form, classId: val === "none" ? "" : val })
  }
>
  <SelectTrigger className="h-10 border-gray-200 focus:ring-[#6366F1] w-full">
    <SelectValue placeholder="Select class" />
  </SelectTrigger>

  <SelectContent 
    position="popper" 
    sideOffset={5} 
    className="z-[200] w-[--radix-select-trigger-width] bg-white border border-gray-100 shadow-xl max-h-[250px]"
  >
    <SelectItem value="none" className="text-gray-500 italic">
      No class (Unassigned)
    </SelectItem>
    {classes.map((cls) => (
      <SelectItem key={cls.id} value={String(cls.id)}>
  <div className="flex flex-col">
    <span className="font-medium">{cls.grade?.label}</span>
    <span className="text-gray-400 text-xs uppercase">
      Class {cls.name}
    </span>
  </div>
</SelectItem>
    ))}
  </SelectContent>
</Select>
</div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">User Role</Label>
            <Select value={form.role} onValueChange={(val) => setForm({ ...form, role: val })}>
              <SelectTrigger className="h-10 border-gray-200 focus:ring-[#6366F1]">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent  className="z-[200] w-[--radix-select-trigger-width] bg-white border border-gray-100 shadow-xl max-h-[250px]">
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Phone Number (Optional)</Label>
          <Input 
            placeholder="+263 712 345 678" 
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })} 
            className="border-gray-200 h-10" 
          />
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/30">
        <Button 
          variant="outline" 
          onClick={() => setModalOpen(false)} 
          className="flex-1 border-gray-200 text-gray-600 h-10 rounded-xl hover:bg-gray-100"
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          disabled={saving} 
          className="flex-1 bg-[#6366F1] hover:bg-[#5558E3] text-white h-10 rounded-xl gap-2 shadow-md shadow-indigo-100"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {editTarget ? "Update Staff" : "Create Staff"}
        </Button>
      </div>
    </div>
  </div>
)}

      {/* ── Delete Confirm ── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={20} className="text-rose-600" />
            </div>
            <h3 className="font-bold text-gray-900 text-center mb-1">Remove Staff Member</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Are you sure you want to remove{" "}
              <span className="font-semibold text-gray-800">
                {deleteTarget.firstName} {deleteTarget.lastName}
              </span>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setDeleteTarget(null)} className="flex-1 border-gray-200 h-10 rounded-xl">Cancel</Button>
              <Button onClick={handleDelete} disabled={deleting} className="flex-1 bg-rose-500 hover:bg-rose-600 text-white h-10 rounded-xl gap-2">
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Remove
              </Button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}