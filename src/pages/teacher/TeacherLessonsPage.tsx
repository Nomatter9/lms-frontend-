import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTeacherLessons, useTeacherSubjects, useTerms } from "@/hooks/queries";
import { useSearchParams } from "react-router-dom";
import type { Lesson, LessonProgressEntry } from "@/types";
import type { LessonForm } from "@/types/forms/teaching";
import { Plus, Edit2, Trash2, Search, X, Save, Loader2, BookOpen, Eye, EyeOff, Users } from "lucide-react";
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

const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
};

export default function TeacherLessonsPage() {
  const { data: lessons = [], isLoading } = useTeacherLessons();
  const { data: subjects = [] } = useTeacherSubjects();
  const { data: terms = [] } = useTerms();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Lesson | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Lesson | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progressModal, setProgressModal]   = useState<Lesson | null>(null);
  const [progressData, setProgressData]     = useState<LessonProgressEntry[]>([]);
  const [progressLoading, setProgressLoading] = useState(false);

  const [form, setForm] = useState<LessonForm>({
    classSubjectId: "",
    termId: "",
    title: "",
    content: "",
    dueDate: "",
    maxMarks: "",
    resourceLink: "",
    isPublished: false,
  });

  const { quill, quillRef } = useQuill({
    theme: "snow",
    modules: QUILL_MODULES,
    placeholder: "Write lesson notes, instructions or descriptions...",
  });

  useEffect(() => {
    if (!quill) return;
    const handler = () => {
      setForm(prev => ({ ...prev, content: quill.root.innerHTML }));
    };
    quill.on("text-change", handler);
    return () => { quill.off("text-change", handler); };
  }, [quill]);

  useEffect(() => {
    if (modalOpen && quill) {
      const timer = setTimeout(() => {
        quill.root.innerHTML = form.content || "";
      }, 30);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen, quill]);

  const openCreate = useCallback(() => {
    setEditTarget(null);
    setSelectedFile(null);
    const currentTerm = terms.find(t => t.isCurrent);
    const termId = currentTerm?.id ? String(currentTerm.id) : (terms[0]?.id ? String(terms[0].id) : "");
    setForm({
      classSubjectId: "",
      termId,
      title: "",
      content: "",
      dueDate: "",
      maxMarks: "",
      isPublished: false,
      resourceLink: "",
    });
    setModalOpen(true);
  }, [terms]);

  const [searchParams] = useSearchParams();
  useEffect(() => {
    if (!isLoading && searchParams.get("open") === "create") openCreate();
  }, [isLoading, searchParams, openCreate]);

  const openEdit = (lesson: Lesson) => {
    setEditTarget(lesson);
    setSelectedFile(null);
    setForm({
      classSubjectId: lesson.classSubjectId ?? lesson.classSubject?.id ?? "",
      termId: lesson.termId ?? lesson.term?.id ?? "",
      title: lesson.title,
      content: lesson.content || "",
      dueDate: lesson.dueDate || "",
      resourceLink: lesson.videoUrl || "",
      maxMarks: lesson.maxMarks || "",
      isPublished: lesson.isPublished,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.classSubjectId) { toast.error("Please select a subject"); return; }
    if (!form.termId) { toast.error("Please select a term"); return; }
    if (!form.title.trim()) { toast.error("Please enter a title"); return; }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("classSubjectId", form.classSubjectId);
      fd.append("termId", form.termId);
      fd.append("title", form.title.trim());
      fd.append("content", form.content);
      fd.append("videoUrl", form.resourceLink);
      fd.append("isPublished", String(form.isPublished));
      if (selectedFile) fd.append("file", selectedFile);

      if (editTarget) {
        await axiosClient.put(`/teacher/lessons/${editTarget.id}`, fd);
        toast.success("Lesson updated");
      } else {
        await axiosClient.post("/teacher/lessons", fd);
        toast.success("Lesson created");
      }
      queryClient.invalidateQueries({ queryKey: ["teacher/lessons"] });
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
      await axiosClient.delete(`/teacher/lessons/${deleteTarget.id}`);
      queryClient.invalidateQueries({ queryKey: ["teacher/lessons"] });
      toast.success("Lesson deleted");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const togglePublish = async (lesson: Lesson) => {
    try {
      const fd = new FormData();
      fd.append("isPublished", String(!lesson.isPublished));
      await axiosClient.put(`/teacher/lessons/${lesson.id}`, fd);
      queryClient.invalidateQueries({ queryKey: ["teacher/lessons"] });
      toast.success(lesson.isPublished ? "Unpublished" : "Published");
    } catch {
      toast.error("Failed");
    }
  };

  const openProgress = async (lesson: Lesson) => {
    setProgressModal(lesson);
    setProgressData([]);
    setProgressLoading(true);
    try {
      const res = await axiosClient.get(`/lessons/${lesson.id}/progress`);
      setProgressData(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Failed to load progress");
    } finally {
      setProgressLoading(false);
    }
  };

  const filtered = lessons.filter(l =>
    `${l.title} ${l.classSubject?.subject?.name || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  const publishedCount = lessons.filter(l => l.isPublished).length;
  const draftCount = lessons.filter(l => !l.isPublished).length;

  return (
    <TeacherLayout title="Lessons" subtitle="Create and manage lessons for your students">

      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search lessons..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 bg-white border-gray-200 h-10"
          />
        </div>
        <Button onClick={openCreate} className="bg-[#10B981] hover:bg-[#059669] text-white h-10 gap-2 rounded-xl ml-auto">
          <Plus size={16} /> Add Lesson
        </Button>
      </div>

      {/* ── Stats ── */}
      {!isLoading && lessons.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total Lessons", value: lessons.length, bg: "linear-gradient(135deg, #10B981, #059669)", Icon: BookOpen },
            { label: "Published",     value: publishedCount,  bg: "linear-gradient(135deg, #3B82F6, #06B6D4)", Icon: Eye },
            { label: "Draft",         value: draftCount,      bg: "linear-gradient(135deg, #94A3B8, #64748B)", Icon: EyeOff },
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
          <TableSkeleton cols={8} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title={search ? "No lessons match your search" : "No lessons yet"}
            description={search ? "Try a different search term" : "Create your first lesson for students"}
            actionLabel={search ? undefined : "Add Lesson"}
            onAction={search ? undefined : openCreate}
          />
        ) : (
          <>
            {/* ── Mobile card list ── */}
            <div className="sm:hidden divide-y divide-gray-50">
              {filtered.map(lesson => (
                <div key={lesson.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{lesson.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {lesson.classSubject?.subject?.name || "—"}
                        {lesson.term && ` · Term ${lesson.term.termNumber}`}
                      </p>
                    </div>
                    <button onClick={() => togglePublish(lesson)} className={cn("text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0", lesson.isPublished ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500")}>
                      {lesson.isPublished ? <><Eye size={9} /> Published</> : <><EyeOff size={9} /> Draft</>}
                    </button>
                  </div>
                  {(lesson.fileUrl || lesson.videoUrl) && (
                    <div className="flex gap-1.5 flex-wrap">
                      {lesson.fileUrl && (
                        <a href={resolveLogoUrl(lesson.fileUrl) ?? "#"} target="_blank" rel="noreferrer" className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">📎 File</a>
                      )}
                      {lesson.videoUrl && (
                        <a href={lesson.videoUrl} target="_blank" rel="noreferrer" className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold">🔗 Link</a>
                      )}
                    </div>
                  )}
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => openProgress(lesson)} aria-label="View progress" className="flex-1 h-9 rounded-xl bg-[#6366F1]/10 text-[#6366F1] text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[#6366F1]/20">
                      <Users size={12} /> Progress
                    </button>
                    <button onClick={() => openEdit(lesson)} aria-label={`Edit ${lesson.title}`} className="w-9 h-9 rounded-xl border border-gray-200 text-emerald-600 flex items-center justify-center hover:bg-emerald-50">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => setDeleteTarget(lesson)} aria-label={`Delete ${lesson.title}`} className="w-9 h-9 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100">
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
                    {["Title", "Subject", "Term", "Week", "Resources", "Status", "Actions"].map(h => (
                      <th key={h} className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-6 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(lesson => (
                    <tr key={lesson.id} className="hover:bg-[#F4F7FE]/50 transition-colors">

                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#10B981]/10 flex items-center justify-center shrink-0">
                            <BookOpen size={15} className="text-[#10B981]" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{lesson.title}</p>
                            {lesson.content && (
                              <p className="text-xs text-gray-400 mt-0.5 line-clamp-1" dangerouslySetInnerHTML={{ __html: lesson.content }} />
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-3.5 text-sm text-gray-500">{lesson.classSubject?.subject?.name || "—"}</td>

                      <td className="px-6 py-3.5 text-sm text-gray-500">{lesson.term ? `Term ${lesson.term.termNumber}` : "—"}</td>

                      <td className="px-6 py-3.5 text-sm text-gray-500">{lesson.weekNumber ? `Week ${lesson.weekNumber}` : "—"}</td>

                      <td className="px-6 py-3.5">
                        <div className="flex gap-1 flex-wrap">
                          {lesson.fileUrl && (
                            <a href={resolveLogoUrl(lesson.fileUrl) ?? "#"} target="_blank" rel="noreferrer" className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">📎 File</a>
                          )}
                          {lesson.videoUrl && (
                            <a href={lesson.videoUrl} target="_blank" rel="noreferrer" className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold">🔗 Link</a>
                          )}
                          {!lesson.fileUrl && !lesson.videoUrl && <span className="text-gray-300 italic text-xs">—</span>}
                        </div>
                      </td>

                      <td className="px-6 py-3.5">
                        <button onClick={() => togglePublish(lesson)} className={cn("text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 transition-colors", lesson.isPublished ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200")}>
                          {lesson.isPublished ? <><Eye size={10} /> Published</> : <><EyeOff size={10} /> Draft</>}
                        </button>
                      </td>

                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openProgress(lesson)} aria-label={`View progress for ${lesson.title}`} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6366F1] hover:bg-[#6366F1]/10 transition-colors">
                            <Users size={14} />
                          </button>
                          <button onClick={() => openEdit(lesson)} aria-label={`Edit ${lesson.title}`} className="w-8 h-8 flex items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => setDeleteTarget(lesson)} aria-label={`Delete ${lesson.title}`} className="w-8 h-8 flex items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 transition-colors">
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

      {/* ── Create/Edit Modal (keepMounted preserves Quill init) ── */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="max-w-2xl" panelClassName="max-h-[90vh] overflow-y-auto" keepMounted>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="font-bold text-gray-900">
                {editTarget ? "Edit Lesson" : "Add Lesson"}
              </h3>
              <button onClick={() => setModalOpen(false)} aria-label="Close" className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">

              {/* Subject & Term */}
              <div className="grid grid-cols-2 gap-3">
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
                    <p className="text-[10px] text-amber-600 ml-1">⚠️ You have no subjects assigned yet</p>
                  )}
                </div>

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
                          <SelectItem key={t.id} value={String(t.id)}>
                            <div className="flex items-center gap-2">
                              <span>Term {t.termNumber}</span>
                              {t.academicYear?.year && (
                                <span className="text-gray-400 text-[10px]">— {t.academicYear.year}</span>
                              )}
                              {t.isCurrent && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 uppercase tracking-wide">
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
                  placeholder="e.g. Introduction to Fractions"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="border-gray-200 h-10"
                />
              </div>

              {/* Quill Editor */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Lesson Content
                </Label>
                <div className="rounded-xl border border-gray-200 overflow-hidden [&_.ql-toolbar]:border-0 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-gray-200 [&_.ql-container]:border-0 [&_.ql-editor]:min-h-[160px] [&_.ql-editor]:text-sm">
                  <div ref={quillRef} />
                </div>
              </div>

              {/* Resource Link */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Resource Link
                </Label>
                <Input
                  placeholder="https://youtube.com/watch?v=... or any external link"
                  value={form.resourceLink}
                  onChange={e => setForm({ ...form, resourceLink: e.target.value })}
                  className="border-gray-200 h-10"
                />
                <p className="text-[10px] text-gray-400 ml-1">Paste a YouTube, Google Drive, or any resource link</p>
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
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.png"
                  maxMB={100}
                  accentColor="emerald"
                />
              </div>

              {/* Visibility */}
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
                    {form.isPublished && <div className="w-2 h-2 rounded-full bg-white" />}
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
        title="Delete Lesson"
        description={<>Delete <span className="font-semibold text-gray-800">{deleteTarget?.title}</span>? This cannot be undone.</>}
        icon={<Trash2 size={20} className="text-rose-600" />}
      />

      {/* ── Progress Modal ── */}
      <Modal open={!!progressModal} onClose={() => setProgressModal(null)} maxWidth="max-w-2xl" panelClassName="max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div>
                <h3 className="font-bold text-gray-900">Student Progress</h3>
                <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{progressModal?.title}</p>
              </div>
              <button onClick={() => setProgressModal(null)} aria-label="Close" className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            {progressLoading ? (
              <div className="flex items-center justify-center py-14">
                <Loader2 size={24} className="animate-spin text-emerald-500" />
              </div>
            ) : progressData.length === 0 ? (
              <div className="py-14 text-center text-gray-400">
                <BookOpen size={36} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">No student activity yet</p>
                <p className="text-sm mt-1">Students haven't opened this lesson</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {progressData.map((entry) => {
                  const firstName = entry.student?.user?.firstName ?? entry.student?.firstName
                                ?? entry.pupil?.user?.firstName  ?? entry.pupil?.firstName
                                ?? entry.user?.firstName          ?? entry.firstName ?? "";
                  const lastName  = entry.student?.user?.lastName  ?? entry.student?.lastName
                                ?? entry.pupil?.user?.lastName   ?? entry.pupil?.lastName
                                ?? entry.user?.lastName           ?? entry.lastName  ?? "";
                  const name      = `${firstName} ${lastName}`.trim() || "Unknown Student";

                  return (
                    <div key={entry.id} className="px-6 py-4 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-700 font-bold text-sm">
                        {firstName[0] ?? "?"}{lastName[0] ?? "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-sm">{name}</p>
                        {entry.readAt && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            Read: {new Date(entry.readAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        )}
                        {entry.response && (
                          <div className="mt-2 bg-[#F4F7FE] rounded-xl px-3 py-2">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Response</p>
                            <p className="text-xs text-gray-700">{entry.response}</p>
                          </div>
                        )}
                      </div>
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0",
                        entry.readAt ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                      )}>
                        {entry.readAt ? "Read" : "Not Read"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
      </Modal>

    </TeacherLayout>
  );
}
