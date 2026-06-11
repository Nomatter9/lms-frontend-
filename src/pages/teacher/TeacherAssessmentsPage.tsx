import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTeacherAssessments, useTeacherSubjects, useTerms } from "@/hooks/queries";
import { useSearchParams } from "react-router-dom";
import type { Assessment, TeacherStudent } from "@/types";
import type { AssessmentForm } from "@/types/forms/teaching";
import {
  Plus, Edit2, Trash2, Search, X, Save, Loader2,
  GraduationCap, ClipboardList, TrendingUp, BookOpen,
} from "lucide-react";
import TeacherLayout from "@/components/dashboard/TeacherLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import axiosClient from "@/axiosClient";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const studentFirst = (s: TeacherStudent) => s.user?.firstName ?? "";
const studentLast  = (s: TeacherStudent) => s.user?.lastName  ?? "";

export default function TeacherAssessmentsPage() {
  const { data: assessments = [], isLoading } = useTeacherAssessments();
  const { data: subjects = [] } = useTeacherSubjects();
  const { data: terms = [] } = useTerms();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Assessment | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Assessment | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [resultsModal, setResultsModal] = useState<Assessment | null>(null);
  const [students, setStudents] = useState<TeacherStudent[]>([]);
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [savingResults, setSavingResults] = useState(false);

  const [form, setForm] = useState<AssessmentForm>({
    classSubjectId: "", termId: "", title: "",
    type: "ca", maxMarks: "100", weightPercent: "", date: "",
  });

  const openCreate = useCallback(() => {
    setEditTarget(null);
    setForm({ classSubjectId: "", termId: "", title: "", type: "ca" as const, maxMarks: "100", weightPercent: "", date: "" });
    setModalOpen(true);
  }, []);

  const [searchParams] = useSearchParams();
  useEffect(() => {
    if (!isLoading && searchParams.get("open") === "create") openCreate();
  }, [isLoading, searchParams, openCreate]);

  const openEdit = (a: Assessment) => {
    setEditTarget(a);
    setForm({
      classSubjectId: a.classSubjectId ?? a.classSubject?.id ?? "",
      termId:         a.termId         ?? a.term?.id         ?? "",
      title:          a.title,
      type:           a.type,
      maxMarks:       a.maxMarks?.toString() || "100",
      weightPercent:  a.weightPercent?.toString() || "",
      date:           a.date || "",
    });
    setModalOpen(true);
  };

  const openResults = async (assessment: Assessment) => {
    setResultsModal(assessment);
    setStudents([]);
    setMarks({});
    try {
      const csId = assessment.classSubjectId ?? assessment.classSubject?.id;
      const cs = subjects.find(s => s.id === csId);
      const classId = cs?.class?.id;
      if (classId) {
        const res = await axiosClient.get(`/teacher/classes/${classId}/students`);
        const studs = Array.isArray(res.data) ? res.data : [];
        setStudents(studs);
        const existingMarks: Record<string, string> = {};
        assessment.results?.forEach(r => { existingMarks[r.pupilId] = r.marks?.toString() || ""; });
        setMarks(existingMarks);
      }
    } catch {
      toast.error("Failed to load students");
    }
  };

  const handleSave = async () => {
    if (!form.classSubjectId || !form.termId || !form.title) {
      toast.error("Subject, term and title are required");
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, maxMarks: parseInt(form.maxMarks) || 100 };
      if (editTarget) {
        await axiosClient.put(`/teacher/assessments/${editTarget.id}`, payload);
        toast.success("Assessment updated");
      } else {
        await axiosClient.post("/teacher/assessments", payload);
        toast.success("Assessment created");
      }
      queryClient.invalidateQueries({ queryKey: ["teacher/assessments"] });
      setModalOpen(false);
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
      await axiosClient.delete(`/teacher/assessments/${deleteTarget.id}`);
      queryClient.invalidateQueries({ queryKey: ["teacher/assessments"] });
      toast.success("Assessment deleted");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveResults = async () => {
    if (!resultsModal) return;
    setSavingResults(true);
    try {
      const results = students.map(s => ({
        pupilId: s.id,
        marks: parseInt(marks[s.id] || "0"),
        remarks: "",
      }));
      await axiosClient.post(`/teacher/assessments/${resultsModal.id}/results`, { results });
      queryClient.invalidateQueries({ queryKey: ["teacher/assessments"] });
      toast.success("Results saved successfully");
      setResultsModal(null);
    } catch {
      toast.error("Failed to save results");
    } finally {
      setSavingResults(false);
    }
  };

  const getGrade = (m: number, max: number) => {
    const pct = (m / max) * 100;
    if (pct >= 80) return { grade: "1A", color: "text-emerald-700 bg-emerald-100" };
    if (pct >= 70) return { grade: "2A", color: "text-emerald-600 bg-emerald-50" };
    if (pct >= 60) return { grade: "3B", color: "text-blue-700 bg-blue-100" };
    if (pct >= 50) return { grade: "4B", color: "text-blue-600 bg-blue-50" };
    if (pct >= 45) return { grade: "5C", color: "text-amber-700 bg-amber-100" };
    if (pct >= 40) return { grade: "6C", color: "text-amber-600 bg-amber-50" };
    if (pct >= 35) return { grade: "7D", color: "text-orange-700 bg-orange-100" };
    if (pct >= 30) return { grade: "8D", color: "text-orange-600 bg-orange-50" };
    if (pct >= 25) return { grade: "9E", color: "text-rose-700 bg-rose-100" };
    return         { grade: "U",  color: "text-gray-600 bg-gray-100" };
  };

  const filtered = assessments.filter(a =>
    `${a.title} ${a.classSubject?.subject?.name || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  const caCount   = assessments.filter(a => a.type === "ca").length;
  const examCount = assessments.filter(a => a.type === "exam").length;

  return (
    <TeacherLayout title="Assessments" subtitle="Create tests, record marks and track student performance">

      {/* ── Stats ── */}
      {!isLoading && assessments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total Assessments", value: assessments.length, bg: "linear-gradient(135deg, #6366F1, #8B5CF6)", icon: ClipboardList },
            { label: "CA Tests",          value: caCount,            bg: "linear-gradient(135deg, #3B82F6, #06B6D4)", icon: BookOpen },
            { label: "Exams",             value: examCount,          bg: "linear-gradient(135deg, #8B5CF6, #7C3AED)", icon: TrendingUp },
          ].filter(s => s.value > 0).map(s => (
            <div
              key={s.label}
              className="rounded-2xl p-5 shadow-lg text-white relative overflow-hidden"
              style={{ background: s.bg }}
            >
              <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
                  <s.icon size={22} className="text-white" />
                </div>
                <p className="text-3xl font-extrabold">{s.value}</p>
                <p className="text-sm text-white/80 mt-1 font-medium">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search assessments..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 bg-white border-gray-200 h-10"
          />
        </div>
        <Button onClick={openCreate} className="bg-[#10B981] hover:bg-[#059669] text-white h-10 gap-2 rounded-xl ml-auto">
          <Plus size={16} /> Add Assessment
        </Button>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <TableSkeleton cols={7} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title={search ? "No assessments match your search" : "No assessments yet"}
            description={search ? undefined : "Create your first assessment to start recording marks"}
            actionLabel={search ? undefined : "Add Assessment"}
            onAction={search ? undefined : openCreate}
          />
        ) : (
          <>
            {/* ── Mobile cards ── */}
            <div className="sm:hidden divide-y divide-gray-50">
              {filtered.map(a => {
                const cs = subjects.find(s => s.id === (a.classSubjectId ?? a.classSubject?.id)) ?? a.classSubject;
                const subjectName = cs?.subject?.name ?? a.classSubject?.subject?.name ?? "—";
                const resultCount = a.results?.length || 0;
                return (
                  <div key={a.id} className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={cn(
                          "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                          a.type === "ca" ? "bg-blue-100" : "bg-purple-100"
                        )}>
                          {a.type === "ca"
                            ? <BookOpen size={14} className="text-blue-600" />
                            : <TrendingUp size={14} className="text-purple-600" />
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{a.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{subjectName}</p>
                        </div>
                      </div>
                      <span className={cn(
                        "text-[10px] font-bold px-2.5 py-1 rounded-full uppercase shrink-0",
                        a.type === "ca" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                      )}>
                        {a.type === "ca" ? "CA" : "Exam"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-gray-500">{a.maxMarks} marks</span>
                      {a.date && <span className="text-xs text-gray-400">{new Date(a.date).toLocaleDateString("en-GB")}</span>}
                      <button
                        onClick={() => openResults(a)}
                        className={cn(
                          "text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 transition-colors",
                          resultCount > 0
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        )}
                      >
                        <ClipboardList size={10} /> {resultCount} result{resultCount !== 1 ? "s" : ""}
                      </button>
                    </div>
                    <div className="flex gap-2 pt-0.5">
                      <button
                        onClick={() => openEdit(a)}
                        className="flex-1 h-9 rounded-xl border border-gray-200 text-[#6366F1] text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[#6366F1]/5 transition-colors"
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(a)}
                        className="flex-1 h-9 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-rose-100 transition-colors"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Desktop table ── */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {["Assessment", "Subject", "Type", "Max Marks", "Date", "Results", "Actions"].map(h => (
                      <th key={h} className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-6 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(a => {
                    const cs = subjects.find(s => s.id === (a.classSubjectId ?? a.classSubject?.id)) ?? a.classSubject;
                    const subjectName = cs?.subject?.name ?? a.classSubject?.subject?.name ?? "—";
                    const resultCount = a.results?.length || 0;
                    return (
                      <tr key={a.id} className="hover:bg-[#F4F7FE]/50 transition-colors">
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                              a.type === "ca" ? "bg-blue-100" : "bg-purple-100"
                            )}>
                              {a.type === "ca"
                                ? <BookOpen size={14} className="text-blue-600" />
                                : <TrendingUp size={14} className="text-purple-600" />
                              }
                            </div>
                            <p className="text-sm font-semibold text-gray-800">{a.title}</p>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-sm text-gray-500">{subjectName}</td>
                        <td className="px-6 py-3.5">
                          <span className={cn(
                            "text-xs font-bold px-2.5 py-1 rounded-full uppercase",
                            a.type === "ca" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                          )}>
                            {a.type === "ca" ? "CA" : "Exam"}
                          </span>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="text-sm font-semibold text-gray-700">{a.maxMarks}</span>
                          <span className="text-xs text-gray-400 ml-1">pts</span>
                        </td>
                        <td className="px-6 py-3.5 text-sm text-gray-500">
                          {a.date ? new Date(a.date).toLocaleDateString("en-GB") : <span className="text-gray-300 italic text-xs">—</span>}
                        </td>
                        <td className="px-6 py-3.5">
                          <button
                            onClick={() => openResults(a)}
                            className={cn(
                              "text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors",
                              resultCount > 0
                                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            )}
                          >
                            <ClipboardList size={11} />
                            {resultCount > 0 ? `${resultCount} graded` : "Enter marks"}
                          </button>
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => openEdit(a)}
                              aria-label="Edit assessment"
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6366F1] hover:bg-[#6366F1]/10 transition-colors"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(a)}
                              aria-label="Delete assessment"
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ── Create / Edit Modal ── */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-900">{editTarget ? "Edit Assessment" : "New Assessment"}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{editTarget ? "Update assessment details" : "Fill in the details below"}</p>
          </div>
          <button onClick={() => setModalOpen(false)} aria-label="Close modal" className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Subject <span className="text-rose-500">*</span></Label>
            <Select value={form.classSubjectId} onValueChange={v => setForm({ ...form, classSubjectId: v })}>
              <SelectTrigger className="h-10 border-gray-200">
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent position="popper" className="z-[200] bg-white border border-gray-100 shadow-xl max-h-[250px]">
                {subjects.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.subject?.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Term <span className="text-rose-500">*</span></Label>
            <Select value={form.termId} onValueChange={v => setForm({ ...form, termId: v })}>
              <SelectTrigger className="h-10 border-gray-200">
                <SelectValue placeholder="Select term" />
              </SelectTrigger>
              <SelectContent position="popper" className="z-[200] bg-white border border-gray-100 shadow-xl max-h-[250px]">
                {terms.map(t => (
                  <SelectItem key={t.id} value={t.id}>Term {t.termNumber}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Title <span className="text-rose-500">*</span></Label>
            <Input
              placeholder="e.g. CA Test 1 / End of Term Exam"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="border-gray-200 h-10"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</Label>
            <Select value={form.type} onValueChange={v => setForm({ ...form, type: v as 'ca' | 'exam' })}>
              <SelectTrigger className="h-10 border-gray-200"><SelectValue /></SelectTrigger>
              <SelectContent position="popper" className="z-[200] bg-white border border-gray-100 shadow-xl">
                <SelectItem value="ca">Continuous Assessment (CA)</SelectItem>
                <SelectItem value="exam">End of Term Exam</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Max Marks</Label>
              <Input
                type="number"
                min={1}
                value={form.maxMarks}
                onChange={e => setForm({ ...form, maxMarks: e.target.value })}
                className="border-gray-200 h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Weight %</Label>
              <Input
                type="number"
                min={1}
                max={100}
                placeholder="e.g. 30"
                value={form.weightPercent}
                onChange={e => setForm({ ...form, weightPercent: e.target.value })}
                className="border-gray-200 h-10"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</Label>
            <Input
              type="date"
              value={form.date}
              max={new Date().toISOString().split("T")[0]}
              onChange={e => setForm({ ...form, date: e.target.value })}
              className="border-gray-200 h-10"
            />
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <Button variant="outline" onClick={() => setModalOpen(false)} className="flex-1 h-10 rounded-xl">Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-[#10B981] hover:bg-[#059669] text-white h-10 rounded-xl gap-2"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {editTarget ? "Update" : "Create"}
          </Button>
        </div>
      </Modal>

      {/* ── Results Modal ── */}
      <Modal open={!!resultsModal} onClose={() => setResultsModal(null)} maxWidth="max-w-2xl" panelClassName="max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h3 className="font-bold text-gray-900">{resultsModal?.title}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                resultsModal?.type === "ca" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
              )}>
                {resultsModal?.type === "ca" ? "CA" : "Exam"}
              </span>
              <span className="text-xs text-gray-400">Max: {resultsModal?.maxMarks} marks</span>
              {resultsModal?.weightPercent && (
                <span className="text-xs text-gray-400">· Weight: {resultsModal.weightPercent}%</span>
              )}
            </div>
          </div>
          <button onClick={() => setResultsModal(null)} aria-label="Close results" className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <GraduationCap size={36} className="mb-3 opacity-30" />
              <p className="text-sm font-medium">No students found</p>
              <p className="text-xs mt-1 opacity-70">Make sure this subject is assigned to a class</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-6 py-3 w-10">#</th>
                  <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Student</th>
                  <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Marks / {resultsModal?.maxMarks}</th>
                  <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-6 py-3">%</th>
                  <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.map((s, i) => {
                  const raw = marks[s.id];
                  const m = raw !== undefined && raw !== "" ? parseInt(raw) : null;
                  const maxM = resultsModal?.maxMarks ?? 100;
                  const pct = m !== null ? Math.round((m / maxM) * 100) : null;
                  const { grade, color } = m !== null ? getGrade(m, maxM) : { grade: "—", color: "" };
                  return (
                    <tr key={s.id} className="hover:bg-[#F4F7FE]/40 transition-colors">
                      <td className="px-6 py-3.5 text-sm text-gray-400 font-medium">{i + 1}</td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-[#6366F1]/10 flex items-center justify-center shrink-0">
                            <span className="text-[10px] font-bold text-[#6366F1]">
                              {studentFirst(s)[0]}{studentLast(s)[0]}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-gray-800">
                            {studentFirst(s)} {studentLast(s)}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <Input
                          type="number"
                          min={0}
                          max={resultsModal?.maxMarks}
                          placeholder="—"
                          value={marks[s.id] ?? ""}
                          onChange={e => setMarks(prev => ({ ...prev, [s.id]: e.target.value }))}
                          className="border-gray-200 h-9 w-24 text-center font-semibold"
                        />
                      </td>
                      <td className="px-6 py-3.5 text-sm font-medium text-gray-500">
                        {pct !== null ? `${pct}%` : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-6 py-3.5">
                        {m !== null
                          ? <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full", color)}>{grade}</span>
                          : <span className="text-gray-300 text-xs">—</span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
          <Button variant="outline" onClick={() => setResultsModal(null)} className="flex-1 h-10 rounded-xl">Cancel</Button>
          <Button
            onClick={handleSaveResults}
            disabled={savingResults || students.length === 0}
            className="flex-1 bg-[#10B981] hover:bg-[#059669] text-white h-10 rounded-xl gap-2"
          >
            {savingResults ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save Results
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        confirming={deleting}
        title="Delete Assessment"
        description={<>Delete <span className="font-semibold text-gray-800">{deleteTarget?.title}</span>? All recorded results will be lost.</>}
        icon={<Trash2 size={20} className="text-rose-600" />}
      />
    </TeacherLayout>
  );
}
