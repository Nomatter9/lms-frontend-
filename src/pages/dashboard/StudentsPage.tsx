import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Search, X, Save, Loader2, GraduationCap } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import AvatarUpload from "@/components/ui/AvatarUpload";
import axiosClient from "@/axiosClient";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/avatar";
import { validateStudentAge, getMaxDOB } from "@/lib/ageValidation";
import type { StudentItem, StudentParent } from "@/types";
import type { StudentForm } from "@/types/forms";

interface ClassOption {
  id: string;
  name: string;
  grade?: { id: string; label: string; level: number };
}

const EMPTY_FORM: StudentForm = {
  firstName: "", lastName: "", email: "", phone: "",
  regNumber: "", dateOfBirth: "", gender: "",
  classId: "", parentId: "",avatarUrl: ""
};

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [parents, setParents] = useState<StudentParent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StudentItem | null>(null);
  const [form, setForm] = useState<StudentForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StudentItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
const [avatarPreview, setAvatarPreview] = useState<string | null>(null);



  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [studentsRes, classesRes, parentsRes] = await Promise.all([
        axiosClient.get("/students"),
        axiosClient.get("/classes"),
        axiosClient.get("/auth/parents"),
      ]);
      setStudents(studentsRes.data);
      setClasses(classesRes.data);
      setParents(parentsRes.data);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };


  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
      setAvatarFile(null);       
  setAvatarPreview(null); 
    setModalOpen(true);
  };

 const openEdit = (student: StudentItem) => {
  setEditTarget(student);
  setAvatarFile(null);
  setAvatarPreview(null);
  setForm({
    firstName: student.user.firstName,
    lastName: student.user.lastName,
    email: student.user.email,
    phone: student.user.phone || "",
    regNumber: student.regNumber || "",
    dateOfBirth: student.dateOfBirth?.split('T')[0] || "",
    gender: student.gender || "",
    classId: student.classId || "",
    parentId: student.parentId || "",
  });
  setModalOpen(true);
};
  // Get the grade level for the selected class
  const getSelectedGradeLevel = (): number | null => {
    const cls = classes.find(c => c.id === form.classId);
    return cls?.grade?.level ?? null;
  };

  const handleSave = async () => {
    if (!form.firstName || !form.lastName || !form.email) {
      toast.error("First name, last name and email are required");
      return;
    }
    if (!form.classId) {
      toast.error("Class is required");
      return;
    }

    // Age validation
    if (form.dateOfBirth) {
      const dob = new Date(form.dateOfBirth);
      if (dob > new Date()) {
        toast.error("Date of birth cannot be in the future");
        return;
      }
      const gradeLevel = getSelectedGradeLevel();
      if (gradeLevel) {
        const { valid, message } = validateStudentAge(form.dateOfBirth, gradeLevel);
        if (!valid) {
          toast.error(message);
          return;
        }
      }
    }

    setSaving(true);
  try {
    const payload = {
      ...form,
      classId: form.classId || null,
      parentId: form.parentId || null,
      dateOfBirth: form.dateOfBirth || null,
      gender: form.gender || null,
      regNumber: form.regNumber || null,
      phone: form.phone || null,
    };

    if (editTarget) {
      const res = await axiosClient.put(`/students/${editTarget.id}`, payload);
      setStudents(prev => prev.map(s => s.id === editTarget.id ? res.data : s));
      toast.success("Student updated");
    } else {
      const res = await axiosClient.post("/students", payload);
      let newStudent = res.data;

      // ✅ Upload avatar immediately after creation if file was selected
      if (avatarFile) {
        try {
          const fd = new FormData();
          fd.append("avatar", avatarFile);
          const avatarRes = await axiosClient.put(
            `/auth/students/${newStudent.id}/avatar`, fd
          );
          // Merge avatarUrl into the new student's user object
          newStudent = {
            ...newStudent,
            user: { ...newStudent.user, avatarUrl: avatarRes.data.avatarUrl },
          };
        } catch {
          // Avatar failed but student was created — non-critical
          console.warn("Avatar upload failed after student creation");
        }
      }

      setStudents(prev => [...prev, newStudent]);
      toast.success("Student created — credentials sent via email");
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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axiosClient.delete(`/students/${deleteTarget.id}`);
      setStudents(prev => prev.filter(s => s.id !== deleteTarget.id));
      toast.success("Student removed");
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusChange = async (studentId: string, isActive: boolean) => {
    try {
      await axiosClient.put(`/students/${studentId}`, { isActive });
      setStudents(prev => prev.map(s =>
        s.id === studentId ? { ...s, user: { ...s.user, isActive } } : s
      ));
      toast.success(`Student ${isActive ? "activated" : "deactivated"}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const filtered = students.filter(s =>
    `${s.user.firstName} ${s.user.lastName} ${s.user.email} ${s.regNumber || ""} ${s.class?.name || ""}`
      .toLowerCase().includes(search.toLowerCase())
  );

  // ── Class label helper ────────────────────────────────────
 const classLabel = (classId?: string) => {
  const cls = classes.find(c => c.id === classId);
  if (!cls) return null;

  return {
    grade: cls.grade?.label,
    badge: `${cls.grade?.level}${cls.name}`
  };
};

  return (
    <DashboardLayout title="Students" subtitle="Manage all school students">

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Search students..." value={search}
            onChange={e => setSearch(e.target.value)} className="pl-10 bg-white border-gray-200 h-10" />
        </div>
        <Button onClick={openCreate} className="bg-[#6366F1] hover:bg-[#5558E3] text-white h-10 gap-2 rounded-xl ml-auto">
          <Plus size={16} /> Add Student
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-[#6366F1]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <GraduationCap size={40} className="mb-3 opacity-30" />
            <p className="font-medium">No students found</p>
            <p className="text-sm mt-1">Add your first student to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["", "Student", "Reg No.", "Class", "Parent", "Gender", "Status", "Actions"].map(h => (
                    <th key={h} className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-6 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(student => (
                  <tr key={student.id} className="hover:bg-[#F4F7FE]/50 transition-colors">

                    {/* Avatar */}
                    <td className="px-4 py-3">
                      <AvatarUpload
                        userId={student.id}
                        currentUrl={student.user?.avatarUrl}
                        initials={getInitials(student.user.firstName, student.user.lastName)}
                        endpoint="/auth/students/:id/avatar"
                        size="sm"
                        onUpdated={newUrl => setStudents(prev => prev.map(s =>
                          s.id === student.id ? { ...s, user: { ...s.user, avatarUrl: newUrl } } : s
                        ))}
                      />
                    </td>

                    {/* Name + email */}
                    <td className="px-6 py-3.5">
                      <p className="text-sm font-semibold text-gray-800">
                        {student.user.firstName} {student.user.lastName}
                      </p>
                      <p className="text-xs text-gray-400">{student.user.email}</p>
                    </td>

                    <td className="px-6 py-3.5 text-sm text-gray-500">
                      {student.regNumber || <span className="text-gray-300 italic text-xs">—</span>}
                    </td>

                    {/* Class — shows Grade + Section */}
                  <td className="px-6 py-3.5">
  {student.classId ? (
    (() => {
      const clsData = classLabel(student.classId);
      if (!clsData) return "—";

      return (
        <div className="flex items-center gap-2">
          {/* <span className="text-sm text-gray-700 font-medium">
            {clsData.grade}
          </span> */}
          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
            {clsData.badge}
          </span>
        </div>
      );
    })()
  ) : (
    <span className="text-gray-300 italic text-xs">Unassigned</span>
  )}
</td>

                    <td className="px-6 py-3.5 text-sm text-gray-500">
                      {student.parent
                        ? `${student.parent.firstName} ${student.parent.lastName}`
                        : <span className="text-gray-300 italic text-xs">—</span>
                      }
                    </td>

                    <td className="px-6 py-3.5">
                      {student.gender ? (
                        <span className={cn(
                          "text-xs font-semibold px-2.5 py-1 rounded-full capitalize",
                          student.gender === 'male' ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700"
                        )}>{student.gender}</span>
                      ) : <span className="text-gray-300 italic text-xs">—</span>}
                    </td>

                    <td className="px-6 py-3.5 w-[150px]">
                      <Select
                        value={student.user.isActive ? "active" : "inactive"}
                        onValueChange={v => handleStatusChange(student.id, v === "active")}
                      >
                        <SelectTrigger className={cn(
                          "h-8 text-xs font-semibold rounded-full border px-3",
                          student.user.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        )}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          <SelectItem value="active" className="text-emerald-600">Active</SelectItem>
                          <SelectItem value="inactive" className="text-rose-600">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>

                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(student)} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6366F1] hover:bg-[#6366F1]/10">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => setDeleteTarget(student)} className="w-8 h-8 flex items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50">
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
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="font-bold text-gray-900">
                {editTarget ? "Edit Student" : "Add Student"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">

              {/* ── Avatar in modal (edit only) ── */}
           {/* ── Avatar upload — both create and edit ── */}
<div className="flex flex-col items-center gap-2 pb-2">
  {editTarget ? (
    // Edit — upload directly via AvatarUpload component
    <AvatarUpload
      userId={editTarget.id}
      currentUrl={editTarget.user?.avatarUrl}
      initials={getInitials(editTarget.user.firstName, editTarget.user.lastName)}
      endpoint="/auth/students/:id/avatar"
      size="lg"
      onUpdated={newUrl => {
        setStudents(prev => prev.map(s =>
          s.id === editTarget.id ? { ...s, user: { ...s.user, avatarUrl: newUrl } } : s
        ));
        setEditTarget(prev => prev
          ? { ...prev, user: { ...prev.user, avatarUrl: newUrl } }
          : prev
        );
      }}
    />
  ) : (
    // Create — local preview, actual upload happens after student is created
    <div
      className={cn(
        "relative group w-24 h-24 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden cursor-pointer transition-all",
        avatarPreview
          ? "border-solid border-[#6366F1]"
          : "border-gray-200 bg-gray-50 hover:border-[#6366F1] hover:bg-[#6366F1]/5"
      )}
      onClick={() => document.getElementById('create-avatar-input')?.click()}
      onDragOver={e => e.preventDefault()}
      onDrop={e => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) { toast.error("Images only"); return; }
        if (file.size > 2 * 1024 * 1024) { toast.error("Max 2MB"); return; }
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
      }}
    >
      <input
        id="create-avatar-input"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (!file) return;
          if (!file.type.startsWith("image/")) { toast.error("Images only"); return; }
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
          <Plus size={20} />
          <span className="text-[9px] font-bold uppercase mt-1">Photo</span>
        </div>
      )}
    </div>
  )}
  <p className="text-[10px] text-gray-400">
    {editTarget ? "Click or drag to change photo" : "Add profile photo (optional)"}
  </p>
</div>

              {/* Personal Info */}
              <div>
                <p className="text-[#6366F1] text-xs font-bold uppercase tracking-widest mb-3">
                  Personal Information
                </p>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">First Name</Label>
                      <Input placeholder="Tafara" value={form.firstName}
                        onChange={e => setForm({ ...form, firstName: e.target.value })} className="border-gray-200 rounded-xl h-10" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Last Name</Label>
                      <Input placeholder="Moyo" value={form.lastName}
                        onChange={e => setForm({ ...form, lastName: e.target.value })} className="border-gray-200 rounded-xl h-10" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</Label>
                    <Input type="email" placeholder="tafara.moyo@school.ac.zw" value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      className="border-gray-200 rounded-xl h-10" disabled={!!editTarget} />
                    {!!editTarget && (
                      <p className="text-[10px] text-gray-400 ml-1">Email cannot be changed after creation</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Phone </Label>
                      <Input placeholder="+263 712 345 678" value={form.phone}
                        onChange={e => setForm({ ...form, phone: e.target.value })} className="border-gray-200 rounded-xl h-10" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Gender</Label>
                      <Select value={form.gender} onValueChange={val => setForm({ ...form, gender: val })}>
                        <SelectTrigger className="h-10 border-gray-200 w-full">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent className="z-[200] bg-white border border-gray-100 shadow-xl max-h-[250px]">
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Date of Birth</Label>
                      <Input
                        type="date"
                        value={form.dateOfBirth}
                        max={getMaxDOB()}
                        onChange={e => setForm({ ...form, dateOfBirth: e.target.value })}
                        className="border-gray-200 rounded-xl h-10"
                      />
                      {/* Age hint based on selected class */}
                      {form.classId && (() => {
                        const cls = classes.find(c => c.id === form.classId);
                        const level = cls?.grade?.level;
                        if (!level) return null;
                        const rules: Record<number, string> = {
                          1: "6–7 yrs", 2: "7–8 yrs", 3: "8–9 yrs",
                          4: "9–10 yrs", 5: "10–11 yrs", 6: "11–12 yrs", 7: "12–13 yrs"
                        };
                        return <p className="text-[10px] text-gray-400 ml-1">Grade {level} age: {rules[level]}</p>;
                      })()}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Reg Number</Label>
                      <Input placeholder="REG001" value={form.regNumber}
                        onChange={e => setForm({ ...form, regNumber: e.target.value })} className="border-gray-200 rounded-xl h-10" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Academic Info */}
              <div>
                <p className="text-[#6366F1] text-xs font-bold uppercase tracking-widest mb-3">
                  Academic Information
                </p>
                <div className="space-y-3">

                  {/* Class — shows Grade + Section e.g. "Grade 3 A" */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Class <span className="text-rose-500">*</span>
                    </Label>
                    <Select
                      value={form.classId || "none"}
                      onValueChange={val => setForm({ ...form, classId: val === "none" ? "" : val })}
                    >
                      <SelectTrigger className="h-10 border-gray-200 rounded-xl w-full">
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent className="z-[200] bg-white border border-gray-100 shadow-xl max-h-[250px]">
                        <SelectItem value="none" className="text-gray-400 italic">
                          Unassigned
                        </SelectItem>
                        {[...classes]
                          .sort((a, b) => (a.grade?.level || 0) - (b.grade?.level || 0))
                          .map(cls => (
                            <SelectItem key={cls.id} value={cls.id}>
                  <div className="flex items-center gap-2">
                    {/* Keep full grade text */}
                    <span className="font-semibold text-gray-700">
                      {cls.grade?.label}
                    </span>

                    {/* Badge should be 7A instead of A */}
                    <span className="text-xs font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded uppercase">
                      {cls.grade?.level}{cls.name}
                    </span>
                  </div>
                </SelectItem>
                                          ))
                        }
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Parent */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Parent / Guardian (Optional)
                    </Label>
                    <Select
                      value={form.parentId || "none"}
                      onValueChange={val => setForm({ ...form, parentId: val === "none" ? "" : val })}
                    >
                      <SelectTrigger className="h-10 border-gray-200  rounded-xl w-full">
                        <SelectValue placeholder="Select parent" />
                      </SelectTrigger>
                      <SelectContent className="z-[200] bg-white border border-gray-100 shadow-xl max-h-[250px]">
                        <SelectItem value="none">None</SelectItem>
                        {parents.map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.firstName} {p.lastName} ({p.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white">
              <Button variant="outline" onClick={() => setModalOpen(false)} className="flex-1 border-gray-200 text-gray-600 h-10 rounded-xl">Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="flex-1 bg-[#6366F1] hover:bg-[#5558E3] text-white h-10 rounded-xl gap-2">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {editTarget ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={20} className="text-rose-600" />
            </div>
            <h3 className="font-bold text-gray-900 text-center mb-1">Remove Student</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Remove <span className="font-semibold text-gray-800">
                {deleteTarget.user.firstName} {deleteTarget.user.lastName}
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