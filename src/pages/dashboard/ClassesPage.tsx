import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Search, X, Save, Loader2, Layers } from "lucide-react";
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
import type { ClassItem, Grade, AcademicYear, User } from "@/types";
import type { ClassForm } from "@/types/forms";

type Teacher = Pick<User, 'id' | 'firstName' | 'lastName' | 'role'>;

const EMPTY_FORM: ClassForm = {
  name: "", gradeId: "", academicYearId: "", teacherId: "", capacity: "",
};

const formatCapacity = (capacity?: number) => {
  if (capacity == null) return "—";
  return `${capacity} ${capacity === 1 ? "student" : "students"}`;
};

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ClassItem | null>(null);
  const [form, setForm] = useState<ClassForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ClassItem | null>(null);
  const [deleting, setDeleting] = useState(false);


  const fetchAll = async () => {
    setLoading(true);
    try {
      const [classesRes, gradesRes, yearsRes, staffRes] = await Promise.all([
        axiosClient.get("/classes"),
        axiosClient.get("/grades"),
        axiosClient.get("/academicYear"),
        axiosClient.get("/auth/staff"),
      ]);
      setClasses(classesRes.data);
      setGrades(gradesRes.data);
      setYears(yearsRes.data);
      setTeachers(staffRes.data.filter((s: Teacher) => s.role === "teacher"));
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => {
    setEditTarget(null);
    setForm({ ...EMPTY_FORM, academicYearId: years.find((y) => y.isCurrent)?.id || "" });
    setModalOpen(true);
  };

  const openEdit = (cls: ClassItem) => {
    setEditTarget(cls);
    setForm({
      name: cls.name,
      gradeId: cls.gradeId,
      academicYearId: cls.academicYearId,
      teacherId: cls.teacherId || "",
      capacity: cls.capacity?.toString() || "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.gradeId || !form.academicYearId) {
      toast.error("Class name, grade and academic year are required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        gradeId: form.gradeId,
        academicYearId: form.academicYearId,
        teacherId: form.teacherId || null,
        capacity: form.capacity !== "" ? Number(form.capacity) : null,
      };
      if (editTarget) {
        const res = await axiosClient.put(`/classes/${editTarget.id}`, payload);
        setClasses((prev) => prev.map((c) => c.id === editTarget.id ? res.data : c));
        toast.success("Class updated");
      } else {
        const res = await axiosClient.post("/classes", payload);
        setClasses((prev) => [...prev, res.data]);
        toast.success("Class created");
      }
      setModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save class");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axiosClient.delete(`/classes/${deleteTarget.id}`);
      setClasses((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      toast.success("Class deleted");
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const filtered = classes.filter((c) =>
    `${c.name} ${c.grade?.label || ""} ${c.teacher?.firstName || ""} ${c.teacher?.lastName || ""}`
      .toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout title="Classes" subtitle="Manage school classes and assign teachers">

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search classes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white border-gray-200 h-10"
          />
        </div>
        <Button onClick={openCreate} className="bg-[#6366F1] hover:bg-[#5558E3] text-white h-10 gap-2 rounded-xl ml-auto">
          <Plus size={16} /> Add Class
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-[#6366F1]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Layers size={40} className="mb-3 opacity-30" />
            <p className="font-medium">No classes found</p>
            <p className="text-sm mt-1">Create your first class to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Class", "Grade", "Class Teacher", "Academic Year", "Capacity", "Actions"].map((h) => (
                    <th key={h} className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-6 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((cls) => (
                  <tr key={cls.id} className="hover:bg-[#F4F7FE]/50 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#6366F1]/10 flex items-center justify-center">
                          <Layers size={15} className="text-[#6366F1]" />
                        </div>
                        <span className="text-sm font-bold text-gray-800">
                          {cls.grade?.label} {cls.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                        {cls.grade?.label || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-gray-600">
                      {cls.teacher
                        ? `${cls.teacher.firstName} ${cls.teacher.lastName}`
                        : <span className="text-gray-300 italic text-xs">Unassigned</span>
                      }
                    </td>
                    <td className="px-6 py-3.5 text-sm text-gray-500">
                      {cls.academicYear
                        ? `${cls.academicYear.year}${cls.academicYear.isCurrent ? " (Current)" : ""}`
                        : "—"
                      }
                    </td>
                    <td className="px-6 py-3.5 text-sm text-gray-500">
                      {formatCapacity(cls.capacity)}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(cls)} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6366F1] hover:bg-[#6366F1]/10 transition-colors">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => setDeleteTarget(cls)} className="w-8 h-8 flex items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 transition-colors">
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
{modalOpen && (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-visible">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
        <h3 className="font-bold text-gray-900">
          {editTarget ? "Edit Class" : "Add New Class"}
        </h3>
        <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
          <X size={18} />
        </button>
      </div>

      <div className="p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Grade <span className="text-rose-500">*</span>
            </Label>
            <Select
              value={form.gradeId || undefined}
              onValueChange={(val) => setForm({ ...form, gradeId: val })}
            >
              <SelectTrigger className="h-10 border-gray-200 w-full">
                <SelectValue placeholder="Select grade" />
              </SelectTrigger>
              <SelectContent className="z-[200] bg-white border border-gray-100 shadow-xl max-h-[250px]">
{grades.map(g => (
  <SelectItem key={g.id} value={g.id}>
    {g.label || `Grade ${g.level}`} 
  </SelectItem>
))}
                
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Section <span className="text-rose-500">*</span>
            </Label>
            <Input
              placeholder="e.g. A, B"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value.toUpperCase() })}
              className="border-gray-200 h-10"
            />
          </div>
        </div>

        {/* Live Preview */}
        {form.gradeId && form.name && (
          <div className="bg-[#6366F1]/5 border border-[#6366F1]/10 rounded-xl p-3 flex items-center justify-between">
            <span className="text-xs text-[#6366F1] font-medium">Full Class Name:</span>
            <span className="text-sm font-bold text-[#6366F1]">
              {grades.find(g => g.id === form.gradeId)?.label} {form.name}
            </span>
          </div>
        )}

        {/* Academic Year — locked to current */}
        <div className="space-y-1.5">
          <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Academic Year</Label>
          <div className="relative">
            <Input
              value={years.find(y => y.id === form.academicYearId)?.year?.toString() || "No active year set"}
              disabled
              className="bg-gray-50 border-gray-200 h-10 text-gray-600 font-medium cursor-not-allowed pr-20"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold uppercase">
              Current
            </span>
          </div>
          <p className="text-[10px] text-gray-400 ml-1">
            Classes are automatically assigned to the current academic year.
          </p>
        </div>

        {/* Class Teacher */}
        <div className="space-y-1.5">
          <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            Class Teacher
          </Label>
          <Select
            value={form.teacherId || "unassigned"}
            onValueChange={(val) => setForm({ ...form, teacherId: val === "unassigned" ? "" : val })}
          >
            <SelectTrigger className="h-10 border-gray-200 w-full">
              <SelectValue placeholder="Select teacher" />
            </SelectTrigger>
            <SelectContent className="z-[200] bg-white border border-gray-100 shadow-xl max-h-[250px]">
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {teachers.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.firstName} {t.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Capacity */}
        <div className="space-y-1.5">
          <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            Capacity 
          </Label>
          <Input
            type="number"
            placeholder="e.g. 30"
            min={1}
            value={form.capacity}
            onChange={(e) => setForm({ ...form, capacity: e.target.value })}
            className="border-gray-200 h-10"
          />
        </div>
      </div>

      <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
        <Button variant="outline" onClick={() => setModalOpen(false)} className="flex-1 border-gray-200 text-gray-600 h-10 rounded-xl">
          Cancel
        </Button>
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
            <h3 className="font-bold text-gray-900 text-center mb-1">Delete Class</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Delete <span className="font-semibold text-gray-800">{deleteTarget.grade?.label} {deleteTarget.name}</span>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setDeleteTarget(null)} className="flex-1 border-gray-200 h-10 rounded-xl">Cancel</Button>
              <Button onClick={handleDelete} disabled={deleting} className="flex-1 bg-rose-500 hover:bg-rose-600 text-white h-10 rounded-xl gap-2">
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Delete
              </Button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}