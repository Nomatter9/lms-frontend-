import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Search, X, Save, Loader2, BookOpen } from "lucide-react";
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
import type { Subject, Grade } from "@/types";
import type { SubjectForm } from "@/types/forms";

const EMPTY_FORM: SubjectForm = { name: "", code: "", gradeId: "", classId: "" };

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Subject | null>(null);
  const [form, setForm] = useState<SubjectForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Subject | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [subjectsRes, gradesRes, classesRes] = await Promise.all([
        axiosClient.get("/subjects"),
        axiosClient.get("/grades"),
        axiosClient.get("/classes"),
      ]);
      setSubjects(subjectsRes.data);
      setGrades(gradesRes.data);
      setClasses(classesRes.data);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (s: Subject) => {
    setEditTarget(s);
    setForm({
      name: s.name,
      code: s.code ?? "",
      gradeId: s.gradeId,
      classId: (s as any).classId || "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.code || !form.gradeId) {
      toast.error("Name, code and grade are required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        code: form.code,
        gradeId: form.gradeId,
        classId: form.classId || null,   // ✅ send classId
      };

      if (editTarget) {
        await axiosClient.put(`/subjects/${editTarget.id}`, payload);
        toast.success("Subject updated");
      } else {
        await axiosClient.post(`/subjects`, payload);
        toast.success("Subject created");
      }
      setModalOpen(false);
      fetchAll();
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
      await axiosClient.delete(`/subjects/${deleteTarget.id}`);
      toast.success("Subject deleted");
      setDeleteTarget(null);
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  // ✅ Classes filtered by selected grade
  const filteredClasses = classes.filter(c =>
    !form.gradeId || c.gradeId === form.gradeId
  ).sort((a, b) => (a.grade?.level || 0) - (b.grade?.level || 0));

  const filtered = subjects.filter((s) =>
    `${s.name} ${s.code} ${s.grade?.label || ""}`
      .toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout title="Subjects" subtitle="Manage subjects per grade level">

      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search subjects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white border-gray-200 h-10"
          />
        </div>
        <Button onClick={openCreate} className="bg-[#6366F1] hover:bg-[#5558E3] text-white h-10 gap-2 rounded-xl ml-auto">
          <Plus size={16} /> Add Subject
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
            <BookOpen size={40} className="mb-3 opacity-30" />
            <p className="font-medium">No subjects found</p>
            <p className="text-sm mt-1">Add your first subject to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Subject", "Code", "Grade", "Class", "Actions"].map((h) => (
                    <th key={h} className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-6 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((subject) => (
                  <tr key={subject.id} className="hover:bg-[#F4F7FE]/50 transition-colors">

                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                          <BookOpen size={15} className="text-amber-600" />
                        </div>
                        <span className="text-sm font-bold text-gray-800">{subject.name}</span>
                      </div>
                    </td>

                    <td className="px-6 py-3.5">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-mono">
                        {subject.code}
                      </span>
                    </td>

                    <td className="px-6 py-3.5">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#6366F1]/10 text-[#6366F1]">
                        {subject.grade?.label || "—"}
                      </span>
                    </td>

                    {/* ✅ Class column */}
                    <td className="px-6 py-3.5">
                      {(subject as any).classId ? (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
                          {(subject as any).class?.grade?.label} {(subject as any).class?.name || "—"}
                        </span>
                      ) : (
                        <span className="text-gray-300 italic text-xs">No class</span>
                      )}
                    </td>

                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(subject)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6366F1] hover:bg-[#6366F1]/10 transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(subject)}
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

      {/* ── Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">
                {editTarget ? "Edit Subject" : "Add Subject"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Subject Name</Label>
                <Input
                  placeholder="e.g. Mathematics"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="border-gray-200 rounded-xl h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Code</Label>
                <Input
                  placeholder="e.g. MATH"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="border-gray-200 rounded-xl h-10 font-mono"
                />
              </div>

              {/* Grade */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Grade</Label>
                <Select
                  value={form.gradeId}
                  onValueChange={(val) => setForm({ ...form, gradeId: val, classId: "" })}
                >
                  <SelectTrigger className="h-10 border-gray-200 rounded-xl w-full">
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent className="z-[200] bg-white border border-gray-100 shadow-xl max-h-[250px]">
                    {grades.sort((a, b) => a.level - b.level).map((g) => (
                      <SelectItem key={g.id} value={String(g.id)}>
                        {g.label || `Grade ${g.level}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* ✅ Class — filtered by grade, clears when grade changes */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Assign to Class
                </Label>
                <Select
                  value={form.classId || "none"}
                  onValueChange={(val) => setForm({ ...form, classId: val === "none" ? "" : val })}
                >
                  <SelectTrigger className="h-10 border-gray-200 rounded-xl w-full">
                    <SelectValue placeholder="Select class (optional)" />
                  </SelectTrigger>
                  <SelectContent className="z-[200] bg-white border border-gray-100 shadow-xl max-h-[250px]">
                    <SelectItem value="none" className="text-gray-400 italic">
                      No class assigned
                    </SelectItem>
                    {filteredClasses.length === 0 ? (
                      <div className="p-3 text-xs text-gray-400 text-center">
                        {form.gradeId ? "No classes for this grade" : "Select a grade first"}
                      </div>
                    ) : (
                      filteredClasses.map(c => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{c.grade?.label || `Grade ${c.grade?.level}`}</span>
                            <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-bold">
                              {c.name}
                            </span>
                            {c.teacherId && (
                              <span className="text-[10px] text-emerald-600">● Has teacher</span>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-gray-400 ml-1">
                  The teacher assigned to this class will see this subject
                </p>
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
          </div>
        </div>
      )}

      {/* ── Delete ── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={20} className="text-rose-600" />
            </div>
            <h3 className="font-bold text-gray-900 text-center mb-1">Delete Subject</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Delete <span className="font-semibold text-gray-800">{deleteTarget.name}</span>? This cannot be undone.
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