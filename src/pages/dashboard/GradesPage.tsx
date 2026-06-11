import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Edit2, Trash2, Search, X, Save, Loader2, GraduationCap } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import axiosClient from "@/axiosClient";
import { useQueryClient } from "@tanstack/react-query";
import { useGrades } from "@/hooks/queries";
import { toast } from "sonner";
import type { Grade } from "@/types";
import type { GradeForm } from "@/types/forms";

const EMPTY_FORM: GradeForm = { level: "", label: "" };

export default function GradesPage() {
  const { data: grades = [], isLoading, isSuccess } = useGrades();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Grade | null>(null);
  const [form, setForm] = useState<GradeForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Grade | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openCreate = useCallback(() => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }, []);

  const [searchParams] = useSearchParams();
  useEffect(() => {
    if (isSuccess && searchParams.get("open") === "create") openCreate();
  }, [isSuccess, searchParams, openCreate]);

  const openEdit = (g: Grade) => {
    setEditTarget(g);
    setForm({ level: String(g.level), label: g.label });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.level || !form.label) { toast.error("Level and label are required"); return; }
    const lvl = parseInt(form.level);
    if (isNaN(lvl) || lvl < 1 || lvl > 7) { toast.error("Level must be between 1 and 7"); return; }
    setSaving(true);
    try {
      const payload = { level: lvl, label: form.label };
      if (editTarget) {
        await axiosClient.put(`/grades/${editTarget.id}`, payload);
        toast.success("Grade updated");
      } else {
        await axiosClient.post("/grades", payload);
        toast.success("Grade created");
      }
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["grades"] });
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
      await axiosClient.delete(`/grades/${deleteTarget.id}`);
      toast.success("Grade deleted");
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["grades"] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const filtered = grades
    .filter((g) => `${g.label} ${g.level}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.level - b.level);

  return (
    <DashboardLayout title="Grades" subtitle="Define grade levels for your school">

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search grades..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white border-gray-200 h-10"
          />
        </div>
        <Button onClick={openCreate} className="bg-[#6366F1] hover:bg-[#5558E3] text-white h-10 gap-2 rounded-xl ml-auto">
          <Plus size={16} /> Add Grade
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <TableSkeleton cols={3} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title={search ? "No grades match your search" : "No grades yet"}
            description={search ? "Try a different search term" : "Add your first grade level to get started"}
            actionLabel={search ? undefined : "Add Grade"}
            onAction={search ? undefined : openCreate}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Level</th>
                  <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Label</th>
                  <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((grade) => (
                  <tr key={grade.id} className="hover:bg-[#F4F7FE]/50 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="w-9 h-9 rounded-xl bg-[#6366F1] flex items-center justify-center text-white text-sm font-bold">
                        {grade.level}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-sm font-semibold text-gray-800">{grade.label}</td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(grade)}
                          aria-label={`Edit ${grade.label}`}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6366F1] hover:bg-[#6366F1]/10 transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(grade)}
                          aria-label={`Delete ${grade.label}`}
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">{editTarget ? "Edit Grade" : "Add Grade"}</h3>
          <button onClick={() => setModalOpen(false)} aria-label="Close" className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Level (1–7)</Label>
            <Input
              type="number"
              min={1}
              max={7}
              placeholder="e.g. 3"
              value={form.level}
              onChange={(e) => setForm({ ...form, level: e.target.value })}
              className="border-gray-200 h-10"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Label</Label>
            <Input
              placeholder="e.g. Grade 3"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              className="border-gray-200 h-10"
            />
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <Button variant="outline" onClick={() => setModalOpen(false)} className="flex-1 border-gray-200 h-10 rounded-xl">
            Cancel
          </Button>
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
        title="Delete Grade"
        description={<>Delete <span className="font-semibold text-gray-800">{deleteTarget?.label}</span>? This cannot be undone.</>}
        icon={<Trash2 size={20} className="text-rose-600" />}
      />

    </DashboardLayout>
  );
}
