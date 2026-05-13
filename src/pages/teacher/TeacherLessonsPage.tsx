import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Search, X, Save, Loader2, BookOpen, Eye, EyeOff } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import axiosClient from "@/axiosClient";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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
  const [lessons, setLessons] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [form, setForm] = useState({
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

  const loadData = async () => {
    setLoading(true);
    try {
      const [lessonsRes, subjectsRes, termsRes] = await Promise.all([
        axiosClient.get("/teacher/lessons"),
        axiosClient.get("/teacher/subjects"),
        axiosClient.get("/terms"),
      ]);
      setLessons(Array.isArray(lessonsRes.data) ? lessonsRes.data : []);
      setSubjects(Array.isArray(subjectsRes.data) ? subjectsRes.data : []);
      setTerms(Array.isArray(termsRes.data) ? termsRes.data : []);
    } catch {
      toast.error("Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const openCreate = () => {
    setEditTarget(null);
    setSelectedFile(null);
    const currentTerm = terms.find((t: any) => t.isCurrent);
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
  };

  const openEdit = (lesson: any) => {
    setEditTarget(lesson);
    setSelectedFile(null);
    setForm({
      classSubjectId: lesson.classSubjectId ?? lesson.classSubject?.id ?? "",
      termId: lesson.termId ?? lesson.term?.id ?? "",
      title: lesson.title,
      content: lesson.content || "",
      dueDate: lesson.dueDate || "",
      resourceLink: lesson.videoUrl || "",
      maxMarks: lesson.marks || "",
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
        const res = await axiosClient.put(`/teacher/lessons/${editTarget.id}`, fd);
        setLessons(prev => prev.map(l => l.id === editTarget.id ? res.data : l));
        toast.success("Lesson updated");
      } else {
        const res = await axiosClient.post("/teacher/lessons", fd);
        setLessons(prev => [...prev, res.data]);
        toast.success("Lesson created");
      }
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
      setLessons(prev => prev.filter(l => l.id !== deleteTarget.id));
      toast.success("Lesson deleted");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const togglePublish = async (lesson: any) => {
    try {
      const fd = new FormData();
      fd.append("isPublished", String(!lesson.isPublished));
      const res = await axiosClient.put(`/teacher/lessons/${lesson.id}`, fd);
      setLessons(prev => prev.map(l => l.id === lesson.id ? res.data : l));
      toast.success(lesson.isPublished ? "Unpublished" : "Published");
    } catch {
      toast.error("Failed");
    }
  };

  const filtered = lessons.filter(l =>
    `${l.title} ${l.classSubject?.subject?.name || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout title="Lessons" subtitle="Create and manage lessons for your students">

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

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-emerald-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <BookOpen size={40} className="mb-3 opacity-30" />
            <p className="font-medium">No lessons yet</p>
            <p className="text-sm mt-1">Create your first lesson</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Title", "Subject", "Class", "Term", "Week", "Resources", "Status", "Actions"].map(h => (
                    <th key={h} className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-6 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(lesson => (
                  <tr key={lesson.id} className="hover:bg-[#F4F7FE]/50 transition-colors">

                    <td className="px-6 py-3.5">
                      <p className="text-sm font-semibold text-gray-800">{lesson.title}</p>
                      {lesson.content && (
                        <p
                          className="text-xs text-gray-400 mt-0.5 line-clamp-1"
                          dangerouslySetInnerHTML={{ __html: lesson.content }}
                        />
                      )}
                    </td>

                    <td className="px-6 py-3.5 text-sm text-gray-500">
                      {lesson.classSubject?.subject?.name || "—"}
                    </td>

                    <td className="px-6 py-3.5">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                        {lesson.classSubject?.class?.grade?.label} {lesson.classSubject?.class?.name || "—"}
                      </span>
                    </td>

                    <td className="px-6 py-3.5 text-sm text-gray-500">
                      {lesson.term ? `Term ${lesson.term.termNumber}` : "—"}
                    </td>

                    <td className="px-6 py-3.5 text-sm text-gray-500">
                      {lesson.weekNumber ? `Week ${lesson.weekNumber}` : "—"}
                    </td>

                    <td className="px-6 py-3.5">
                      <div className="flex gap-1 flex-wrap">
                        {lesson.fileUrl && (
                          <a
                            href={`http://localhost:5000${lesson.fileUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold"
                          >
                            📎 File
                          </a>
                        )}
                        {lesson.videoUrl && (
                          <a
                            href={lesson.videoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold"
                          >
                            🔗 Link
                          </a>
                        )}
                        {!lesson.fileUrl && !lesson.videoUrl && (
                          <span className="text-gray-300 italic text-xs">—</span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-3.5">
                      <button
                        onClick={() => togglePublish(lesson)}
                        className={cn(
                          "text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 transition-colors",
                          lesson.isPublished
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        )}
                      >
                        {lesson.isPublished
                          ? <><Eye size={10} /> Published</>
                          : <><EyeOff size={10} /> Draft</>
                        }
                      </button>
                    </td>

                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(lesson)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(lesson)}
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

      {/* ── Create/Edit Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="font-bold text-gray-900">
                {editTarget ? "Edit Lesson" : "Add Lesson"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
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
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-700">{s.subject?.name}</span>
                                <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-bold">
                                  {s.class?.grade?.label} {s.class?.name}
                                </span>
                              </div>
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
                  existingUrl={editTarget?.fileUrl ? `http://localhost:5000${editTarget.fileUrl}` : null}
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
            <h3 className="font-bold text-gray-900 text-center mb-1">Delete Lesson</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Delete <span className="font-semibold text-gray-800">{deleteTarget.title}</span>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setDeleteTarget(null)} className="flex-1 h-10 rounded-xl">Cancel</Button>
              <Button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white h-10 rounded-xl gap-2"
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Delete
              </Button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
