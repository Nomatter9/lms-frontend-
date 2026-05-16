import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Search, X, Save, Loader2, ClipboardList, Eye, EyeOff, Users, CheckCircle2 } from "lucide-react";
import TeacherLayout from "@/components/dashboard/TeacherLayout";
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
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
};

export default function TeacherHomeworkPage() {
  const [homework, setHomework] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const [submissionsModal, setSubmissionsModal] = useState<any>(null);
  const [submissions, setSubmissions]           = useState<any[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [markValues, setMarkValues]             = useState<Record<string, string>>({});
  const [markSaving, setMarkSaving]             = useState<Record<string, boolean>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentTermId, setCurrentTermId] = useState<string>("");

  const [form, setForm] = useState({
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

const loadData = async () => {
  setLoading(true);
  try {
    const [h_or_l, s, t] = await Promise.all([
      axiosClient.get("/teacher/homework"),   
      axiosClient.get("/teacher/subjects"),
      axiosClient.get("/terms"),
    ]);
    setHomework(h_or_l.data);   // or setLessons
setSubjects(s.data);    
setTerms(t.data);

    // ✅ Auto-select current term
    const current = t.data.find((term: any) => term.isCurrent);
    if (current) {
      setCurrentTermId(current.id);
      setForm(prev => ({ ...prev, termId: current.id }));
    }
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
};

 const openEdit = (hw: any) => {
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

      const selectedSubject = subjects.find(s => s.id === form.classSubjectId);
      const selectedTerm    = terms.find(t => String(t.id) === form.termId);

      const enrich = (data: any) => ({
        ...data,
        classSubject: selectedSubject
          ? { ...(data.classSubject ?? {}), ...selectedSubject }
          : data.classSubject,
        term: selectedTerm ?? data.term,
      });

      if (editTarget) {
        const res = await axiosClient.put(`/teacher/homework/${editTarget.id}`, fd);
        setHomework(prev => prev.map(h => h.id === editTarget.id ? enrich(res.data) : h));
        toast.success("Homework updated");
      } else {
        const res = await axiosClient.post("/teacher/homework", fd);
        setHomework(prev => [...prev, enrich(res.data)]);
        toast.success("Homework created");
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
      await axiosClient.delete(`/teacher/homework/${deleteTarget.id}`);
      setHomework(prev => prev.filter(h => h.id !== deleteTarget.id));
      toast.success("Homework deleted");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const togglePublish = async (hw: any) => {
    try {
      const fd = new FormData();
      fd.append("isPublished", String(!hw.isPublished));
      const res = await axiosClient.put(`/teacher/homework/${hw.id}`, fd);
      setHomework(prev => prev.map(h => h.id === hw.id ? res.data : h));
      toast.success(hw.isPublished ? "Unpublished" : "Published");
    } catch {
      toast.error("Failed");
    }
  };

  const openSubmissions = async (hw: any) => {
    setSubmissionsModal(hw);
    setSubmissions([]);
    setMarkValues({});
    setSubmissionsLoading(true);
    try {
      const res = await axiosClient.get(`/teacher/homework/${hw.id}/submissions`);
      const subs = Array.isArray(res.data) ? res.data : [];
      setSubmissions(subs);
      const initial: Record<string, string> = {};
      subs.forEach((s: any) => { initial[s.id] = s.marks?.toString() ?? ""; });
      setMarkValues(initial);
    } catch {
      toast.error("Failed to load submissions");
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const saveMark = async (submissionId: string) => {
    setMarkSaving(prev => ({ ...prev, [submissionId]: true }));
    try {
      await axiosClient.patch(`/teacher/homework/submissions/${submissionId}`, {
        marks: Number(markValues[submissionId]),
      });
      toast.success("Mark saved");
      setSubmissions(prev =>
        prev.map(s => s.id === submissionId ? { ...s, marks: Number(markValues[submissionId]) } : s)
      );
    } catch {
      toast.error("Failed to save mark");
    } finally {
      setMarkSaving(prev => ({ ...prev, [submissionId]: false }));
    }
  };

  const isOverdue = (dueDate: string) => new Date(dueDate) < new Date();

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
        <Button onClick={openCreate} className="bg-[#F59E0B] hover:bg-[#D97706] text-white h-10 gap-2 rounded-xl ml-auto">
          <Plus size={16} /> Add Homework
        </Button>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-amber-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <ClipboardList size={40} className="mb-3 opacity-30" />
            <p className="font-medium">No homework yet</p>
            <p className="text-sm mt-1">Create your first assignment</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Title", "Subject", "Class", "Term", "Due Date", "Max Marks", "Submissions", "Status", "Actions"].map(h => (
                    <th key={h} className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-6 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(hw => (
                  <tr key={hw.id} className="hover:bg-[#F4F7FE]/50 transition-colors">

                    <td className="px-6 py-3.5">
                      <p className="text-sm font-semibold text-gray-800">{hw.title}</p>
                      {hw.fileUrl && (
                        <a
                          href={`http://localhost:5000${hw.fileUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          📎 Attachment
                        </a>
                      )}
                    </td>

                    <td className="px-6 py-3.5 text-sm text-gray-500">
                      {hw.classSubject?.subject?.name || "—"}
                    </td>

                    <td className="px-6 py-3.5">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                        {hw.classSubject?.class?.grade?.label} {hw.classSubject?.class?.name || "—"}
                      </span>
                    </td>

                    <td className="px-6 py-3.5 text-sm text-gray-500">
                      {hw.term ? `Term ${hw.term.termNumber}` : "—"}
                    </td>

                    <td className="px-6 py-3.5">
                      <span className={cn(
                        "text-sm font-medium",
                        isOverdue(hw.dueDate) ? "text-rose-600" : "text-gray-600"
                      )}>
                        {hw.dueDate ? new Date(hw.dueDate).toLocaleDateString('en-GB') : "—"}
                        {isOverdue(hw.dueDate) && (
                          <span className="ml-1 text-xs text-rose-500">(overdue)</span>
                        )}
                      </span>
                    </td>

                    <td className="px-6 py-3.5 text-sm text-gray-500">
                      {hw.maxMarks ? `${hw.maxMarks} marks` : "—"}
                    </td>

                    <td className="px-6 py-3.5">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
                        {hw.submissions?.length || 0} submitted
                      </span>
                    </td>

                    <td className="px-6 py-3.5">
                      <button
                        onClick={() => togglePublish(hw)}
                        className={cn(
                          "text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 transition-colors",
                          hw.isPublished
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        )}
                      >
                        {hw.isPublished
                          ? <><Eye size={10} /> Published</>
                          : <><EyeOff size={10} /> Draft</>
                        }
                      </button>
                    </td>

                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openSubmissions(hw)}
                          title="View & mark submissions"
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6366F1] hover:bg-[#6366F1]/10 transition-colors"
                        >
                          <Users size={14} />
                        </button>
                        <button
                          onClick={() => openEdit(hw)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-amber-600 hover:bg-amber-50 transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(hw)}
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
      <div className={cn("fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4", !modalOpen && "hidden")}>
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
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
    existingUrl={editTarget?.fileUrl ? `http://localhost:5000${editTarget.fileUrl}` : null}
    existingLabel="View current attachment"
    accept=".pdf,.doc,.docx,.jpg,.png"
    maxMB={10}
    accentColor="amber"
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
        ? "border-amber-400 bg-amber-50 text-amber-700"
        : "border-dashed border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300"
    )}
  >
    <div className={cn(
      "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
      form.isPublished ? "border-amber-500 bg-amber-500" : "border-gray-300"
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
                className="flex-1 bg-[#F59E0B] hover:bg-[#D97706] text-white h-10 rounded-xl gap-2"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {editTarget ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </div>

      {/* ── Delete ── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={20} className="text-rose-600" />
            </div>
            <h3 className="font-bold text-gray-900 text-center mb-1">Delete Homework</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Delete <span className="font-semibold text-gray-800">{deleteTarget.title}</span>?
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

      {/* ── Submissions Modal ── */}
      {submissionsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div>
                <h3 className="font-bold text-gray-900">Student Submissions</h3>
                <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{submissionsModal.title}</p>
              </div>
              <button onClick={() => setSubmissionsModal(null)} className="text-gray-400 hover:text-gray-600">
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
                {submissions.map((sub: any) => {
                  const firstName = sub.student?.user?.firstName ?? "";
                  const lastName  = sub.student?.user?.lastName  ?? "";
                  const name      = `${firstName} ${lastName}`.trim() || "Unknown Student";
                  const maxMarks  = submissionsModal.maxMarks;
                  const isMarked  = sub.marks !== null && sub.marks !== undefined;

                  return (
                    <div key={sub.id} className="px-6 py-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#6366F1]/10 flex items-center justify-center shrink-0 text-[#6366F1] font-bold text-sm">
                          {firstName[0]}{lastName[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-800 text-sm">{name}</p>
                            {isMarked && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                                <CheckCircle2 size={10} /> Marked
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Submitted: {sub.submittedAt
                              ? new Date(sub.submittedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                              : "—"}
                          </p>
                          {sub.comment && (
                            <p className="text-xs text-gray-600 mt-2 bg-gray-50 rounded-xl px-3 py-2">{sub.comment}</p>
                          )}
                          {sub.fileUrl && (
                            <a
                              href={`http://localhost:5000${sub.fileUrl}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-blue-600 hover:underline mt-1.5 inline-block"
                            >
                              📎 View Submission
                            </a>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Input
                            type="number"
                            min={0}
                            max={maxMarks || undefined}
                            placeholder="Mark"
                            value={markValues[sub.id] ?? ""}
                            onChange={e => setMarkValues(prev => ({ ...prev, [sub.id]: e.target.value }))}
                            className="w-20 h-8 text-sm border-gray-200 text-center"
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
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

    </TeacherLayout>
  );
}