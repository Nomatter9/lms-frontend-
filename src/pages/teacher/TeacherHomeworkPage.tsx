import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTeacherHomework, useTeacherSubjects, useTerms } from "@/hooks/queries";
import { useSearchParams } from "react-router-dom";
import type { Homework, HomeworkSubmission } from "@/types";
import type { HomeworkForm } from "@/types/forms/teaching";
import { Plus, Edit2, Trash2, Search, X, Save, Loader2, ClipboardList, Eye, EyeOff, Users, CheckCircle2, Clock } from "lucide-react";
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
import { resolveLogoUrl } from "@/lib/logo";
import { useQuill } from "react-quilljs";
import "quill/dist/quill.snow.css";
import FileDropZone from "@/components/ui/FileDropZone";


// localStorage helpers — keyed by teacher userId
const getTeacherId = () => {
  try { return JSON.parse(localStorage.getItem("user") || "{}").id ?? "anon"; }
  catch { return "anon"; }
};
const gradeKey = () => `teacher_grades_${getTeacherId()}`;

type GradeStore = Record<string, Record<string, { marks: number; feedback: string }>>;

const readGrades = (): GradeStore => {
  try { return JSON.parse(localStorage.getItem(gradeKey()) || "{}"); }
  catch { return {}; }
};
const writeGrades = (data: GradeStore) => {
  try { localStorage.setItem(gradeKey(), JSON.stringify(data)); }
  catch { /* quota exceeded */ }
};

const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
};

export default function TeacherHomeworkPage() {
  const { data: homework = [], isLoading } = useTeacherHomework();
  const { data: subjects = [] } = useTeacherSubjects();
  const { data: terms = [] } = useTerms();
  const queryClient = useQueryClient();
  const currentTermId = terms.find(t => t.isCurrent)?.id ?? terms[0]?.id ?? "";
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Homework | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Homework | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [submissionsModal, setSubmissionsModal] = useState<Homework | null>(null);
  const [submissions, setSubmissions]           = useState<HomeworkSubmission[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [markValues,     setMarkValues]     = useState<Record<string, string>>({});
  const [feedbackValues, setFeedbackValues] = useState<Record<string, string>>({});
  const [markSaving,     setMarkSaving]     = useState<Record<string, boolean>>({});
  const [editingIds,     setEditingIds]     = useState<Set<string>>(new Set());

  // Persisted grades: { [homeworkId]: { [submissionId]: { marks, feedback } } }
  const [localGrades, setLocalGrades] = useState<GradeStore>(readGrades);

  const saveGrade = (homeworkId: string, submissionId: string, marks: number, feedback: string) => {
    setLocalGrades(prev => {
      const next = {
        ...prev,
        [homeworkId]: { ...(prev[homeworkId] ?? {}), [submissionId]: { marks, feedback } },
      };
      writeGrades(next);
      return next;
    });
  };
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [form, setForm] = useState<HomeworkForm>({
    classSubjectId: "",
    termId: "",
    title: "",
    description: "",
    dueDate: "",
    maxMarks: "",
    isPublished: false,
  });

  const { quill, quillRef } = useQuill({
    theme: "snow",
    modules: QUILL_MODULES,
    placeholder: "Write instructions for students...",
  });

useEffect(() => {
  if (!quill) return;

  const handler = () => {
    setForm(prev => ({
      ...prev,
      description: quill.root.innerHTML,
    }));
  };

  quill.on("text-change", handler);

  return () => {
    quill.off("text-change", handler);
  };
}, [quill]);

// ✅ Same pattern — fixed size deps
useEffect(() => {
  if (!quill || !modalOpen) return;
  const timer = setTimeout(() => {
    quill.clipboard.dangerouslyPasteHTML(form.description || "");
  }, 30);
  return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [quill, modalOpen]); // ✅ fixed size — never changes

  const openCreate = useCallback(() => {
    setEditTarget(null);
    setSelectedFile(null);
    setForm({
      classSubjectId: "",
      termId: currentTermId,
      title: "",
      description: "",
      dueDate: "",
      maxMarks: "",
      isPublished: false,
    });
    setModalOpen(true);
  }, [currentTermId]);

  const [searchParams] = useSearchParams();
  useEffect(() => {
    if (!isLoading && searchParams.get("open") === "create") openCreate();
  }, [isLoading, searchParams, openCreate]);

 const openEdit = (hw: Homework) => {
  setEditTarget(hw);
  setSelectedFile(null);

  setForm({
    classSubjectId: hw.classSubjectId ?? hw.classSubject?.id ?? "",
    termId: hw.termId ?? hw.term?.id ?? "",
    title: hw.title,
    description: hw.description || "",
    dueDate: hw.dueDate?.split("T")[0] || "",
    maxMarks: hw.maxMarks?.toString() || "",
    isPublished: hw.isPublished,
  });

  setModalOpen(true);
};

  const handleSave = async () => {
    if (!form.classSubjectId || !form.termId || !form.title || !form.dueDate) {
      toast.error("Subject, term, title and due date are required");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("classSubjectId", form.classSubjectId);
      fd.append("termId", form.termId);
      fd.append("title", form.title);
      fd.append("description", form.description);
      fd.append("dueDate", form.dueDate);
      fd.append("maxMarks", form.maxMarks);
      fd.append("isPublished", String(form.isPublished));
      if (selectedFile) fd.append("file", selectedFile);

      if (editTarget) {
        await axiosClient.put(`/teacher/homework/${editTarget.id}`, fd);
        toast.success("Homework updated");
      } else {
        await axiosClient.post("/teacher/homework", fd);
        toast.success("Homework created");
      }
      queryClient.invalidateQueries({ queryKey: ["teacher/homework"] });
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
      await axiosClient.delete(`/teacher/homework/${deleteTarget.id}`);
      queryClient.invalidateQueries({ queryKey: ["teacher/homework"] });
      toast.success("Homework deleted");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const togglePublish = async (hw: Homework) => {
    try {
      const fd = new FormData();
      fd.append("isPublished", String(!hw.isPublished));
      await axiosClient.put(`/teacher/homework/${hw.id}`, fd);
      queryClient.invalidateQueries({ queryKey: ["teacher/homework"] });
      toast.success(hw.isPublished ? "Unpublished" : "Published");
    } catch {
      toast.error("Failed");
    }
  };

  const openSubmissions = async (hw: Homework) => {
    setSubmissionsModal(hw);
    setSubmissions([]);
    setMarkValues({});
    setFeedbackValues({});
    setSubmissionsLoading(true);
    try {
      const res = await axiosClient.get(`/homework/${hw.id}/submissions`);
      const raw = res.data;
      const subs: HomeworkSubmission[] = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.submissions)
        ? raw.submissions
        : Array.isArray(raw?.data)
        ? raw.data
        : [];
      setSubmissions(subs);
      const stored = readGrades()[hw.id] ?? {}; // read directly — state may lag writeGrades
      const initial: Record<string, string> = {};
      const initialFb: Record<string, string> = {};
      subs.forEach((s: HomeworkSubmission) => {
        // localStorage wins when API doesn't return marks
        initial[s.id]   = s.marks?.toString() ?? stored[s.id]?.marks?.toString() ?? "";
        initialFb[s.id] = s.feedback ?? stored[s.id]?.feedback ?? "";
      });
      setMarkValues(initial);
      setFeedbackValues(initialFb);
    } catch {
      toast.error("Failed to load submissions");
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const saveMark = async (submissionId: string) => {
    const homeworkId = submissionsModal?.id;
    if (!homeworkId) return;
    setMarkSaving(prev => ({ ...prev, [submissionId]: true }));
    try {
      await axiosClient.put(`/homework/${homeworkId}/submissions/${submissionId}/grade`, {
        marks: Number(markValues[submissionId]),
        feedback: feedbackValues[submissionId] ?? "",
      });
      toast.success("Mark saved");
      saveGrade(homeworkId, submissionId, Number(markValues[submissionId]), feedbackValues[submissionId] ?? "");
      setEditingIds(prev => { const s = new Set(prev); s.delete(submissionId); return s; });
      setSubmissionsModal(null);
    } catch {
      toast.error("Failed to save mark");
    } finally {
      setMarkSaving(prev => ({ ...prev, [submissionId]: false }));
    }
  };

  const isOverdue = (dueDate: string) => new Date(dueDate) < new Date();

  const publishedCount = homework.filter(h => h.isPublished).length;
  const draftCount = homework.filter(h => !h.isPublished).length;
  const overdueCount = homework.filter(h => !!(h.dueDate && isOverdue(h.dueDate))).length;

  const filtered = homework.filter(h =>
    `${h.title} ${h.classSubject?.subject?.name || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <TeacherLayout title="Homework" subtitle="Create and manage homework assignments">

      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search homework..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 bg-white border-gray-200 h-10"
          />
        </div>
        <Button onClick={openCreate} className="bg-[#10B981] hover:bg-[#059669] text-white h-10 gap-2 rounded-xl ml-auto">
          <Plus size={16} /> Add Homework
        </Button>
      </div>

      {/* ── Stats ── */}
      {!isLoading && homework.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Assignments", value: homework.length, bg: "linear-gradient(135deg, #6366F1, #8B5CF6)", Icon: ClipboardList },
            { label: "Published",         value: publishedCount,  bg: "linear-gradient(135deg, #10B981, #059669)", Icon: Eye },
            { label: "Draft",             value: draftCount,      bg: "linear-gradient(135deg, #94A3B8, #64748B)", Icon: EyeOff },
            { label: "Overdue",           value: overdueCount,    bg: "linear-gradient(135deg, #EF4444, #DC2626)", Icon: Clock },
          ].filter(s => s.value > 0).map(({ label, value, bg, Icon }) => (
            <div
              key={label}
              className="rounded-2xl p-5 shadow-lg text-white relative overflow-hidden"
              style={{ background: bg }}
            >
              <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
                  <Icon size={22} className="text-white" />
                </div>
                <p className="text-3xl font-extrabold">{value}</p>
                <p className="text-sm text-white/80 mt-1 font-medium">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <TableSkeleton cols={9} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title={search ? "No homework matches your search" : "No homework yet"}
            description={search ? "Try a different search term" : "Create your first assignment for students"}
            actionLabel={search ? undefined : "Add Homework"}
            onAction={search ? undefined : openCreate}
          />
        ) : (
          <>
            {/* ── Mobile card list ── */}
            <div className="sm:hidden divide-y divide-gray-50">
              {filtered.map(hw => (
                <div key={hw.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{hw.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {hw.classSubject?.subject?.name || "—"}
                      </p>
                    </div>
                    <button onClick={() => togglePublish(hw)} className={cn("text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0", hw.isPublished ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500")}>
                      {hw.isPublished ? <><Eye size={9} /> Published</> : <><EyeOff size={9} /> Draft</>}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {hw.dueDate && (
                      <span className={cn("text-xs font-medium", isOverdue(hw.dueDate) ? "text-rose-500" : "text-gray-400")}>
                        Due {new Date(hw.dueDate).toLocaleDateString("en-GB")}
                        {isOverdue(hw.dueDate) && " (overdue)"}
                      </span>
                    )}
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{hw.submissions?.length || 0} submitted</span>
                    {hw.maxMarks && <span className="text-xs text-gray-400">{hw.maxMarks} marks</span>}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => openSubmissions(hw)} aria-label="View submissions" className="flex-1 h-9 rounded-xl bg-[#6366F1]/10 text-[#6366F1] text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[#6366F1]/20">
                      <Users size={12} /> Submissions
                    </button>
                    <button onClick={() => openEdit(hw)} aria-label="Edit homework" className="w-9 h-9 rounded-xl border border-gray-200 text-[#6366F1] flex items-center justify-center hover:bg-[#6366F1]/10">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => setDeleteTarget(hw)} aria-label="Delete homework" className="w-9 h-9 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Desktop table ── */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {["Title", "Subject", "Term", "Due Date", "Max Marks", "Submissions", "Status", "Actions"].map(h => (
                      <th key={h} className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-6 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(hw => (
                    <tr key={hw.id} className="hover:bg-[#F4F7FE]/50 transition-colors">

                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#6366F1]/10 flex items-center justify-center shrink-0">
                            <ClipboardList size={15} className="text-[#6366F1]" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{hw.title}</p>
                            {hw.fileUrl && (
                              <a href={resolveLogoUrl(hw.fileUrl) ?? "#"} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">
                                📎 Attachment
                              </a>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-3.5 text-sm text-gray-500">{hw.classSubject?.subject?.name || "—"}</td>

                      <td className="px-6 py-3.5 text-sm text-gray-500">{hw.term ? `Term ${hw.term.termNumber}` : "—"}</td>

                      <td className="px-6 py-3.5">
                        <span className={cn("text-sm font-medium", isOverdue(hw.dueDate) ? "text-rose-600" : "text-gray-600")}>
                          {hw.dueDate ? new Date(hw.dueDate).toLocaleDateString('en-GB') : "—"}
                          {isOverdue(hw.dueDate) && <span className="ml-1 text-xs text-rose-500">(overdue)</span>}
                        </span>
                      </td>

                      <td className="px-6 py-3.5 text-sm text-gray-500">{hw.maxMarks ? `${hw.maxMarks} marks` : "—"}</td>

                      <td className="px-6 py-3.5">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
                          {hw.submissions?.length || 0} submitted
                        </span>
                      </td>

                      <td className="px-6 py-3.5">
                        <button onClick={() => togglePublish(hw)} className={cn("text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 transition-colors", hw.isPublished ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200")}>
                          {hw.isPublished ? <><Eye size={10} /> Published</> : <><EyeOff size={10} /> Draft</>}
                        </button>
                      </td>

                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openSubmissions(hw)} aria-label="View submissions" title="View & mark submissions" className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6366F1] hover:bg-[#6366F1]/10 transition-colors">
                            <Users size={14} />
                          </button>
                          <button onClick={() => openEdit(hw)} aria-label="Edit homework" className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6366F1] hover:bg-[#6366F1]/10 transition-colors">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => setDeleteTarget(hw)} aria-label="Delete homework" className="w-8 h-8 flex items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ── Modal (keepMounted preserves Quill init) ── */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="max-w-2xl" panelClassName="max-h-[90vh] overflow-y-auto" keepMounted>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="font-bold text-gray-900">
                {editTarget ? "Edit Homework" : "Add Homework"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">

              {/* Subject & Term */}
{/* Subject & Term in a grid */}
<div className="grid grid-cols-2 gap-3">
  {/* Subject */}
  <div className="space-y-1.5">
    <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
      Subject & Class <span className="text-rose-500">*</span>
    </Label>
    <Select value={form.classSubjectId} onValueChange={v => setForm({ ...form, classSubjectId: v })}>
      <SelectTrigger className="h-10 border-gray-200 w-full">
        <SelectValue placeholder={subjects.length === 0 ? "No subjects assigned" : "Select subject"} />
      </SelectTrigger>
      <SelectContent className="z-[200] bg-white border border-gray-100 shadow-xl max-h-[250px]">
        {subjects.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-xs font-semibold text-gray-500">No subjects assigned</p>
            <p className="text-[10px] text-gray-400 mt-1">Contact the headmaster to assign you subjects</p>
          </div>
        ) : (
          [...subjects]
            .sort((a, b) => (a.class?.grade?.level || 0) - (b.class?.grade?.level || 0))
            .map(s => (
              <SelectItem key={s.id} value={s.id}>
                {s.subject?.name}
              </SelectItem>
            ))
        )}
      </SelectContent>
    </Select>
    {subjects.length === 0 && (
      <p className="text-[10px] text-[#6366F1] ml-1">⚠️ You have no subjects assigned yet</p>
    )}
  </div>

  {/* ✅ Term — with current auto-selected */}
  <div className="space-y-1.5">
    <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
      Term <span className="text-rose-500">*</span>
    </Label>
    <Select value={form.termId} onValueChange={v => setForm({ ...form, termId: v })}>
      <SelectTrigger className="h-10 border-gray-200 w-full">
        <SelectValue placeholder="Select term" />
      </SelectTrigger>
      <SelectContent className="z-[200] bg-white border border-gray-100 shadow-xl max-h-[250px]">
        {terms.length === 0 ? (
          <div className="p-3 text-xs text-gray-400 text-center">No terms found</div>
        ) : (
          terms.map(t => (
            <SelectItem key={t.id} value={t.id}>
              <div className="flex items-center gap-2">
                <span>Term {t.termNumber}</span>
                {t.academicYear?.year && (
                  <span className="text-gray-400 text-[10px]">— {t.academicYear.year}</span>
                )}
                {t.isCurrent && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 uppercase">
                    Current
                  </span>
                )}
              </div>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  </div>
</div>

              {/* Title */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Title <span className="text-rose-500">*</span>
                </Label>
                <Input
                  placeholder="e.g. Chapter 3 Exercise"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="border-gray-200 h-10"
                />
              </div>

              {/* ✅ Quill Editor */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Instructions 
                </Label>
                <div className="rounded-xl border border-gray-200 overflow-hidden [&_.ql-toolbar]:border-0 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-gray-200 [&_.ql-container]:border-0 [&_.ql-editor]:min-h-[130px] [&_.ql-editor]:text-sm">
                  <div ref={quillRef} />
                </div>
              </div>

              {/* Due Date + Max Marks */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Due Date <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={form.dueDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={e => setForm({ ...form, dueDate: e.target.value })}
                    className="border-gray-200 h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Max Marks 
                  </Label>
                  <Input
                    type="number"
                    placeholder="e.g. 50"
                    min={1}
                    value={form.maxMarks}
                    onChange={e => setForm({ ...form, maxMarks: e.target.value })}
                    className="border-gray-200 h-10"
                  />
                </div>
              </div>

              {/* File Upload */}
          <div className="space-y-1.5">
  <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
    Attachment
  </Label>
  <FileDropZone
    value={selectedFile}
    onChange={setSelectedFile}
    existingUrl={editTarget?.fileUrl ? resolveLogoUrl(editTarget.fileUrl) ?? "#" : null}
    existingLabel="View current attachment"
    accept=".pdf,.doc,.docx,.jpg,.png"
    maxMB={10}
    accentColor="emerald"
  />
</div>

              {/* Publish */}
             <div className="space-y-1.5">
  <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
    Visibility
  </Label>
  <button
    type="button"
    onClick={() => setForm(prev => ({ ...prev, isPublished: !prev.isPublished }))}
    className={cn(
      "w-full h-10 flex items-center gap-3 px-3 rounded-xl border-2 transition-all text-sm font-semibold",
      form.isPublished
        ? "border-emerald-400 bg-emerald-50 text-emerald-700"
        : "border-dashed border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300"
    )}
  >
    <div className={cn(
      "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
      form.isPublished ? "border-emerald-500 bg-emerald-500" : "border-gray-300"
    )}>
      {form.isPublished && (
        <div className="w-2 h-2 rounded-full bg-white" />
      )}
    </div>
    {form.isPublished ? "Published" : "Save as Draft"}
  </button>
</div>

            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white">
              <Button variant="outline" onClick={() => setModalOpen(false)} className="flex-1 h-10 rounded-xl">
                Cancel
              </Button>
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

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        confirming={deleting}
        title="Delete Homework"
        description={<>Delete <span className="font-semibold text-gray-800">{deleteTarget?.title}</span>? This cannot be undone.</>}
        icon={<Trash2 size={20} className="text-rose-600" />}
      />

      {/* ── Submissions Modal ── */}
      <Modal open={!!submissionsModal} onClose={() => setSubmissionsModal(null)} maxWidth="max-w-2xl" panelClassName="max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div>
                <h3 className="font-bold text-gray-900">Student Submissions</h3>
                <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{submissionsModal?.title}</p>
              </div>
              <button onClick={() => setSubmissionsModal(null)} aria-label="Close" className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            {submissionsLoading ? (
              <div className="flex items-center justify-center py-14">
                <Loader2 size={24} className="animate-spin text-[#6366F1]" />
              </div>
            ) : submissions.length === 0 ? (
              <div className="py-14 text-center text-gray-400">
                <ClipboardList size={36} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">No submissions yet</p>
                <p className="text-sm mt-1">Students haven't submitted this homework</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {submissions.map((sub) => {
                  const firstName = sub.student?.user?.firstName ?? sub.student?.firstName
                                ?? sub.pupil?.user?.firstName  ?? sub.pupil?.firstName
                                ?? sub.user?.firstName          ?? sub.firstName ?? "";
                  const lastName  = sub.student?.user?.lastName  ?? sub.student?.lastName
                                ?? sub.pupil?.user?.lastName   ?? sub.pupil?.lastName
                                ?? sub.user?.lastName           ?? sub.lastName  ?? "";
                  const name      = `${firstName} ${lastName}`.trim() || "Unknown Student";
                  const maxMarks   = submissionsModal?.maxMarks;
                  const storedMark = localGrades[submissionsModal?.id ?? ""]?.[sub.id]?.marks;
                  const savedMark  = sub.marks ?? storedMark ?? (markValues[sub.id] !== "" ? Number(markValues[sub.id]) : undefined);
                  const isMarked   = savedMark !== null && savedMark !== undefined;

                  return (
                    <div key={sub.id} className="px-6 py-4 space-y-3">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#6366F1]/10 flex items-center justify-center shrink-0 text-[#6366F1] font-bold text-sm">
                          {firstName[0] ?? "?"}{lastName[0] ?? "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-800 text-sm">{name}</p>
                            {isMarked && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                                <CheckCircle2 size={10} /> {savedMark}{maxMarks ? ` / ${maxMarks}` : ""}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Submitted: {sub.submittedAt
                              ? new Date(sub.submittedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                              : "—"}
                          </p>
                          {sub.notes && (
                            <p className="text-xs text-gray-600 mt-2 bg-gray-50 rounded-xl px-3 py-2">{sub.notes}</p>
                          )}
                          {sub.comment && !sub.notes && (
                            <p className="text-xs text-gray-600 mt-2 bg-gray-50 rounded-xl px-3 py-2">{sub.comment}</p>
                          )}
                          {sub.fileUrl && (
                            <a
                              href={resolveLogoUrl(sub.fileUrl) ?? "#"}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-blue-600 hover:underline mt-1.5 inline-block"
                            >
                              📎 View Submission
                            </a>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {isMarked && !editingIds.has(sub.id) ? (
                            <button
                              onClick={() => setEditingIds(prev => new Set(prev).add(sub.id))}
                              title="Click to re-grade"
                              className="text-sm font-extrabold text-[#6366F1] bg-[#6366F1]/10 hover:bg-[#6366F1]/20 px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors"
                            >
                              {savedMark}{maxMarks ? ` / ${maxMarks}` : ""}
                            </button>
                          ) : (
                            <>
                              <Input
                                type="number"
                                min={0}
                                max={maxMarks || undefined}
                                placeholder="Mark"
                                value={markValues[sub.id] ?? ""}
                                onChange={e => setMarkValues(prev => ({ ...prev, [sub.id]: e.target.value }))}
                                className="w-20 h-8 text-sm border-gray-200 text-center"
                                autoFocus={editingIds.has(sub.id)}
                              />
                              {maxMarks && <span className="text-xs text-gray-400 shrink-0">/ {maxMarks}</span>}
                              <Button
                                size="sm"
                                onClick={() => saveMark(sub.id)}
                                disabled={markSaving[sub.id] || markValues[sub.id] === ""}
                                className="h-8 bg-[#6366F1] hover:bg-[#4F46E5] text-white text-xs rounded-lg px-3"
                              >
                                {markSaving[sub.id] ? <Loader2 size={12} className="animate-spin" /> : "Save"}
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      {/* Feedback textarea */}
                      <div className="ml-14">
                        <textarea
                          rows={2}
                          placeholder="Feedback for student (optional)..."
                          value={feedbackValues[sub.id] ?? ""}
                          onChange={e => setFeedbackValues(prev => ({ ...prev, [sub.id]: e.target.value }))}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30 resize-none"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
      </Modal>

    </TeacherLayout>
  );
}