import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Search, X, Save, Loader2, Users } from "lucide-react";
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
import type { Parent } from "@/types";
import type { ParentForm } from "@/types/forms";
import AvatarUpload from "@/components/ui/AvatarUpload";
import { getInitials } from "@/lib/avatar";

const EMPTY_FORM: ParentForm = {
  firstName: "", lastName: "", email: "",schoolId: "", phone: "",
};

export default function ParentsPage() {
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Parent | null>(null);
  const [form, setForm] = useState<ParentForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Parent | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const fetchParents = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get("/auth/parents");
      setParents(res.data);
    } catch {
      toast.error("Failed to load parents");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchParents();
  }, []);

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
     setAvatarFile(null);      // ✅ add
     setAvatarPreview(null); 
    setModalOpen(true);
  };

  const openEdit = (parent: Parent) => {
    setEditTarget(parent);
    setForm({
      firstName: parent.firstName,
      lastName: parent.lastName,
      email: parent.email,
      schoolId: parent.schoolId || "",
      phone: parent.phone || "",
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
      const res = await axiosClient.put(`/auth/parents/${editTarget.id}`, form);
      setParents(prev => prev.map(p =>
        p.id === editTarget.id ? { ...res.data, children: editTarget.children } : p
      ));
      toast.success("Parent updated");
    } else {
      const res = await axiosClient.post("/auth/parents", form);
      let newParent = { ...res.data, children: [] };
      // ✅ Upload avatar right after creation
      if (avatarFile) {
        try {
          const fd = new FormData();
          fd.append("avatar", avatarFile);
          const avatarRes = await axiosClient.put(`/auth/parents/${res.data.id}/avatar`, fd);
          newParent = { ...newParent, avatarUrl: avatarRes.data.avatarUrl };
        } catch {
          console.warn("Avatar upload failed");
        }
      }
      setParents(prev => [...prev, newParent]);
      toast.success("Parent created — credentials sent via email");
    }
    setModalOpen(false);
    setAvatarFile(null);
    setAvatarPreview(null);
  } catch (err: any) {
    toast.error(err.response?.data?.message || "Failed to save");
  } finally {
    setSaving(false);
  }
};

  const handleStatusChange = async (id: string, isActive: boolean) => {
    try {
      const res = await axiosClient.put(`/auth/parents/${id}`, { isActive });
      setParents((prev) => prev.map((p) =>
        p.id === id ? { ...res.data, children: p.children } : p
      ));
      toast.success(`Parent ${isActive ? "activated" : "deactivated"}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axiosClient.delete(`/auth/parents/${deleteTarget.id}`);
      setParents((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      toast.success("Parent removed");
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const filtered = parents.filter((p) =>
    `${p.firstName} ${p.lastName} ${p.email} ${p.phone || ""}`
      .toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout title="Parents" subtitle="Manage all school parents and guardians">

      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search parents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white border-gray-200 h-10"
          />
        </div>
        <Button
          onClick={openCreate}
          className="bg-[#6366F1] hover:bg-[#5558E3] text-white h-10 gap-2 rounded-xl ml-auto"
        >
          <Plus size={16} /> Add Parent
        </Button>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-[#6366F1]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Users size={40} className="mb-3 opacity-30" />
            <p className="font-medium">No parents found</p>
            <p className="text-sm mt-1">Add your first parent to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["image","Parent", "Email", "ID Number","Phone", "Children", "Verified", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-6 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((parent) => (
                  <tr key={parent.id} className="hover:bg-[#F4F7FE]/50 transition-colors">

                    {/* Name */}
 <td className="px-6 py-3.5">
  {/* <div className="flex justify-center py-4 border-b border-gray-50"> */}
<td className="px-6 py-3.5">
  <AvatarUpload
    userId={parent.id}
    currentUrl={parent.avatarUrl}
    initials={getInitials(parent.firstName, parent.lastName)}
    endpoint="/auth/parents/:id/avatar"
    size="sm"
    onUpdated={newUrl => setParents(prev => prev.map(p =>
      p.id === parent.id ? { ...p, avatarUrl: newUrl } : p
    ))}
  />
</td>
{/* </div> */}
</td>
{/* </div> */}
<td>
  <p className="text-sm font-semibold text-gray-800">
                          {parent.firstName} {parent.lastName}
                        </p>
</td>
                      
                      {/* </div>
                    </td> */}

                    <td className="px-6 py-3.5 text-sm text-gray-500">{parent.email}</td>
                    <td className="px-6 py-3.5 text-sm font-mono text-gray-500">
                      {parent.schoolId || "—"}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-gray-500">{parent.phone || "—"}</td>

                    {/* Children */}
                    <td className="px-6 py-3.5">
                      {parent.children && parent.children.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {parent.children.map((child) => (
                            <span
                              key={child.id}
                              className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#6366F1]/10 text-[#6366F1] whitespace-nowrap"
                            >
                              {child.user?.firstName} {child.user?.lastName}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-300 italic text-xs">No children linked</span>
                      )}
                    </td>

                    {/* Verified */}
                    <td className="px-6 py-3.5">
                      <span className={cn(
                        "text-xs font-semibold px-2.5 py-1 rounded-full",
                        parent.isVerified
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      )}>
                        {parent.isVerified ? "Verified" : "Pending"}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-3.5 w-[160px]">
                      <Select
                        value={parent.isActive ? "active" : "inactive"}
                        onValueChange={(value) => handleStatusChange(parent.id, value === "active")}
                      >
                        <SelectTrigger className={cn(
                          "h-8 text-xs font-semibold rounded-full border px-3",
                          parent.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        )}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-[200] w-[--radix-select-trigger-width] bg-white border border-gray-100 shadow-xl max-h-[250px]">
                          <SelectItem value="active" className="text-emerald-600">Active</SelectItem>
                          <SelectItem value="inactive" className="text-rose-600">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(parent)} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6366F1] hover:bg-[#6366F1]/10 transition-colors">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => setDeleteTarget(parent)} className="w-8 h-8 flex items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 transition-colors">
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-100 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">
                {editTarget ? "Edit Parent" : "Add Parent"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
{/* ── Avatar in modal ── */}
{/* ── Avatar in modal — both create and edit ── */}
<div className="flex justify-center py-4 border-b border-gray-50">
  {editTarget ? (
    <AvatarUpload
      userId={editTarget.id}
      currentUrl={editTarget.avatarUrl}
      initials={getInitials(editTarget.firstName, editTarget.lastName)}
      endpoint="/auth/parents/:id/avatar"
      size="lg"
      onUpdated={newUrl => {
        setParents(prev => prev.map(p =>
          p.id === editTarget.id ? { ...p, avatarUrl: newUrl } : p
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
        onClick={() => document.getElementById('parent-avatar-input')?.click()}
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
          id="parent-avatar-input"
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
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">First Name</Label>
                  <Input placeholder="John" value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="border-gray-400 rounded-xl h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Last Name</Label>
                  <Input placeholder="Moyo" value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="border-gray-400 rounded-xl h-10" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Email</Label>
                <Input type="email" placeholder="john.moyo@email.com" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="border-gray-400 rounded-xl h-10" disabled={!!editTarget} />
                {!!editTarget && (
                  <p className="text-[10px] text-gray-500 ml-1">Email cannot be changed after creation</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Phone (Optional)</Label>
                <Input placeholder="+263 712 345 678" value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })} className="border-gray-400 rounded-xl h-10" />
              </div>

              {/* Linked children — read only on edit */}
           {editTarget && editTarget.children && editTarget.children.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Linked Children</Label>
                  <div className="flex flex-wrap gap-1.5 p-3 bg-[#F4F7FE] rounded-xl">
                    {editTarget.children.map((child) => (
                      <span key={child.id} className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#6366F1]/10 text-[#6366F1]">
                        {child.user?.firstName} {child.user?.lastName}
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-500 ml-1">Manage child links from the Students page</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <Button variant="outline" onClick={() => setModalOpen(false)} className="flex-1 border-gray-200 text-gray-600 h-10 rounded-xl">Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="flex-1 bg-[#6366F1] hover:bg-[#5558E3] text-white h-10 rounded-xl gap-2">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {editTarget ? "Update" : "Create"}
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
            <h3 className="font-bold text-gray-900 text-center mb-1">Remove Parent</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Are you sure you want to remove{" "}
              <span className="font-semibold text-gray-800">
                {deleteTarget.firstName} {deleteTarget.lastName}
              </span>?
              {deleteTarget.children && deleteTarget.children.length > 0 && (
                <span className="block mt-2 text-amber-600 font-medium text-xs">
                  ⚠️ This parent is linked to {deleteTarget.children.length} student(s).
                </span>
              )}
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