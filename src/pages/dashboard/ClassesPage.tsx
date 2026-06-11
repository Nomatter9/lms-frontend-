import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Edit2, Trash2, Search, X, Save, Loader2, Layers, AlertTriangle, RefreshCw } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import axiosClient from "@/axiosClient";
import { useQueryClient } from "@tanstack/react-query";
import { useClasses, useGrades, useAcademicYears, useStaff } from "@/hooks/queries";
import { toast } from "sonner";
import type { ClassItem, User } from "@/types";
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
  const { data: classes = [], isLoading: classesLoading, isSuccess, isError: classesError, error: classesFetchError, refetch: refetchClasses } = useClasses();
  const { data: grades = [], isLoading: gradesLoading } = useGrades();
  const { data: years = [], isLoading: yearsLoading } = useAcademicYears();
  const { data: staff = [], isLoading: staffLoading } = useStaff();
  const teachers = (staff as Teacher[]).filter((s) => s.role === "teacher");
  const isLoading = classesLoading || gradesLoading || yearsLoading || staffLoading;
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ClassItem | null>(null);
  const [form, setForm] = useState<ClassForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ClassItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openCreate = useCallback(() => {
    setEditTarget(null);
    setForm({ ...EMPTY_FORM, academicYearId: years.find((y) => y.isCurrent)?.id || "" });
    setModalOpen(true);
  }, [years]);

  const [searchParams] = useSearchParams();
  useEffect(() => {
    if (isSuccess && searchParams.get("open") === "create") openCreate();
  }, [isSuccess, searchParams, openCreate]);

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
      const newTeacherId = form.teacherId || null;
      const prevTeacherId = editTarget?.teacherId || null;

      let classId: string;
      if (editTarget) {
        await axiosClient.put(`/classes/${editTarget.id}`, payload);
        classId = editTarget.id;
        toast.success("Class updated");
      } else {
        const res = await axiosClient.post("/classes", payload);
        classId = res.data.id;
        toast.success("Class created");
      }

      if (newTeacherId !== prevTeacherId) {
        if (prevTeacherId) {
          axiosClient.put(`/auth/staff/${prevTeacherId}`, { classId: null }).catch(() => {});
        }
        if (newTeacherId) {
          axiosClient.put(`/auth/staff/${newTeacherId}`, { classId }).catch(() => {});
        }
      }

      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["classes"] });
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
      toast.success("Class deleted");
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["classes"] });
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
    <DashboardLayout
      title="Classes"
      subtitle={`Manage school classes and assign teachers${!isLoading && !classesError ? ` · ${classes.length} loaded` : ""}`}
    >

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

      {classesError && (
        <div className="mb-4 flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700">
          <AlertTriangle size={18} className="shrink-0" />
          <p className="text-sm font-medium flex-1">
            Failed to load classes: {(classesFetchError as any)?.response?.data?.message || (classesFetchError as any)?.message || "Network error"}
          </p>
          <button onClick={() => refetchClasses()} className="flex items-center gap-1.5 text-xs font-semibold hover:text-rose-900 transition-colors">
            <RefreshCw size={13} /> Retry
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <TableSkeleton cols={6} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Layers}
            title={search ? "No classes match your search" : "No classes yet"}
            description={search ? "Try a different search term" : "Create your first class to get started"}
            actionLabel={search ? undefined : "Add Class"}
            onAction={search ? undefined : openCreate}
          />
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
                        <span className="text-sm font-bold text-gray-800">{cls.grade?.label} {cls.name}</span>
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
                    <td className="px-6 py-3.5 text-sm text-gray-500">{formatCapacity(cls.capacity)}</td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(cls)}
                          aria-label={`Edit ${cls.grade?.label} ${cls.name}`}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6366F1] hover:bg-[#6366F1]/10 transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(cls)}
                          aria-label={`Delete ${cls.grade?.label} ${cls.name}`}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-bold text-gray-900">{editTarget ? "Edit Class" : "Add New Class"}</h3>
          <button onClick={() => setModalOpen(false)} aria-label="Close" className="text-gray-400 hover:text-gray-600 transition-colors">
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
                    <SelectItem key={g.id} value={g.id}>{g.label || `Grade ${g.level}`}</SelectItem>
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

          {form.gradeId && form.name && (
            <div className="bg-[#6366F1]/5 border border-[#6366F1]/10 rounded-xl p-3 flex items-center justify-between">
              <span className="text-xs text-[#6366F1] font-medium">Full Class Name:</span>
              <span className="text-sm font-bold text-[#6366F1]">
                {grades.find(g => g.id === form.gradeId)?.label} {form.name}
              </span>
            </div>
          )}

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
            <p className="text-[10px] text-gray-400 ml-1">Classes are automatically assigned to the current academic year.</p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Class Teacher</Label>
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
                  <SelectItem key={t.id} value={t.id}>{t.firstName} {t.lastName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Capacity</Label>
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
          <Button variant="outline" onClick={() => setModalOpen(false)} className="flex-1 border-gray-200 text-gray-600 h-10 rounded-xl">Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1 bg-[#6366F1] hover:bg-[#5558E3] text-white h-10 rounded-xl gap-2">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {editTarget ? "Update" : "Create"}
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        confirming={deleting}
        title="Delete Class"
        description={<>Delete <span className="font-semibold text-gray-800">{deleteTarget?.grade?.label} {deleteTarget?.name}</span>? This cannot be undone.</>}
        icon={<Trash2 size={20} className="text-rose-600" />}
      />

    </DashboardLayout>
  );
}
