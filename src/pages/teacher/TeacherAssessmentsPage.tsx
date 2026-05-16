import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Search, X, Save, Loader2, GraduationCap, ClipboardList } from "lucide-react";
import TeacherLayout from "@/components/dashboard/TeacherLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import axiosClient from "@/axiosClient";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const studentFirst = (s: any) => s.user?.firstName ?? s.firstName ?? "";
const studentLast  = (s: any) => s.user?.lastName  ?? s.lastName  ?? "";

export default function TeacherAssessmentsPage() {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [resultsModal, setResultsModal] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [savingResults, setSavingResults] = useState(false);

  const [form, setForm] = useState({
    classSubjectId: "", termId: "", title: "",
    type: "ca", maxMarks: "100", weightPercent: "", date: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [a, s, t] = await Promise.all([
        axiosClient.get("/teacher/assessments"),
        axiosClient.get("/teacher/subjects"),
        axiosClient.get("/terms"),
      ]);
      setAssessments(Array.isArray(a.data) ? a.data : []);
      setSubjects(Array.isArray(s.data) ? s.data : []);
      setTerms(Array.isArray(t.data) ? t.data : []);
    } catch {
      toast.error("Failed to load assessments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const openCreate = () => {
    setEditTarget(null);
    setForm({ classSubjectId: "", termId: "", title: "", type: "ca", maxMarks: "100", weightPercent: "", date: "" });
    setModalOpen(true);
  };

  const openEdit = (a: any) => {
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

  const openResults = async (assessment: any) => {
    setResultsModal(assessment);
    setStudents([]);
    setMarks({});
    try {
      const csId = assessment.classSubjectId ?? assessment.classSubject?.id;
      const cs = subjects.find(s => s.id === csId);
      const classId = cs?.classId ?? cs?.class?.id;
      if (classId) {
        const res = await axiosClient.get(`/teacher/classes/${classId}/students`);
        const studs = Array.isArray(res.data) ? res.data : [];
        setStudents(studs);
        const existingMarks: Record<string, string> = {};
        assessment.results?.forEach((r: any) => { existingMarks[r.pupilId] = r.marks?.toString() || ""; });
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
        const res = await axiosClient.put(`/teacher/assessments/${editTarget.id}`, payload);
        setAssessments(prev => prev.map(a => a.id === editTarget.id ? enrich(res.data) : a));
        toast.success("Assessment updated");
      } else {
        const res = await axiosClient.post("/teacher/assessments", payload);
        setAssessments(prev => [...prev, enrich(res.data)]);
        toast.success("Assessment created");
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
      await axiosClient.delete(`/teacher/assessments/${deleteTarget.id}`);
      setAssessments(prev => prev.filter(a => a.id !== deleteTarget.id));
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
      toast.success("Results saved successfully");
      setResultsModal(null);
      const res = await axiosClient.get("/teacher/assessments");
      setAssessments(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Failed to save results");
    } finally {
      setSavingResults(false);
    }
  };

  const getGrade = (m: number, max: number) => {
    const pct = (m / max) * 100;
    if (pct >= 80) return { grade: "A", color: "text-emerald-700 bg-emerald-100" };
    if (pct >= 70) return { grade: "B", color: "text-blue-700 bg-blue-100" };
    if (pct >= 60) return { grade: "C", color: "text-amber-700 bg-amber-100" };
    if (pct >= 50) return { grade: "D", color: "text-orange-700 bg-orange-100" };
    if (pct >= 40) return { grade: "E", color: "text-rose-700 bg-rose-100" };
    return { grade: "U", color: "text-gray-700 bg-gray-100" };
  };

  const filtered = assessments.filter(a =>
    `${a.title} ${a.classSubject?.subject?.name || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <TeacherLayout title="Assessments" subtitle="Create tests, record marks and generate grades">

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Search assessments..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-white border-gray-200 h-10" />
        </div>
        <Button onClick={openCreate} className="bg-[#EF4444] hover:bg-[#DC2626] text-white h-10 gap-2 rounded-xl ml-auto">
          <Plus size={16} /> Add Assessment
        </Button>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-rose-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <GraduationCap size={40} className="mb-3 opacity-30" />
            <p className="font-medium">No assessments yet</p>
            <p className="text-sm mt-1">Create your first assessment</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Title", "Subject", "Class", "Type", "Max Marks", "Date", "Results", "Actions"].map(h => (
                    <th key={h} className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-6 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(a => (
                  <tr key={a.id} className="hover:bg-[#F4F7FE]/50 transition-colors">
                    <td className="px-6 py-3.5">
                      <p className="text-sm font-semibold text-gray-800">{a.title}</p>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-gray-500">
                      {a.classSubject?.subject?.name || "—"}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-gray-500">
                      {a.classSubject?.class?.grade?.label
                        ? `${a.classSubject.class.grade.label} ${a.classSubject.class.name}`
                        : a.classSubject?.class?.name || "—"}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={cn(
                        "text-xs font-bold px-2.5 py-1 rounded-full uppercase",
                        a.type === "ca" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                      )}>
                        {a.type}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-gray-600 font-medium">{a.maxMarks}</td>
                    <td className="px-6 py-3.5 text-sm text-gray-500">
                      {a.date ? new Date(a.date).toLocaleDateString("en-GB") : "—"}
                    </td>
                    <td className="px-6 py-3.5">
                      <button
                        onClick={() => openResults(a)}
                        className="text-xs font-semibold px-3 py-1 rounded-full bg-[#6366F1]/10 text-[#6366F1] hover:bg-[#6366F1]/20 transition-colors flex items-center gap-1"
                      >
                        <ClipboardList size={11} />
                        {a.results?.length || 0} results
                      </button>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(a)} className="w-8 h-8 flex items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => setDeleteTarget(a)} className="w-8 h-8 flex items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50">
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
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">{editTarget ? "Edit Assessment" : "Add Assessment"}</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Subject & Class</Label>
                <Select value={form.classSubjectId} onValueChange={v => setForm({ ...form, classSubjectId: v })}>
                  <SelectTrigger className="h-10 border-gray-200">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="z-[200] bg-white border border-gray-100 shadow-xl max-h-[250px]">
                    {subjects.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.subject?.name} — {s.class?.grade?.label} {s.class?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Term</Label>
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
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Title</Label>
                <Input placeholder="e.g. CA Test 1 / End of Term Exam" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="border-gray-200 h-10" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</Label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                  <SelectTrigger className="h-10 border-gray-200"><SelectValue /></SelectTrigger>
                  <SelectContent position="popper" className="z-[200] bg-white border border-gray-100 shadow-xl max-h-[250px]">
                    <SelectItem value="ca">Continuous Assessment (CA)</SelectItem>
                    <SelectItem value="exam">End of Term Exam</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Max Marks</Label>
                  <Input type="number" min={1} value={form.maxMarks} onChange={e => setForm({ ...form, maxMarks: e.target.value })} className="border-gray-200 h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Weight %</Label>
                  <Input type="number" min={1} max={100} placeholder="e.g. 30" value={form.weightPercent} onChange={e => setForm({ ...form, weightPercent: e.target.value })} className="border-gray-200 h-10" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</Label>
                <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="border-gray-200 h-10" />
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <Button variant="outline" onClick={() => setModalOpen(false)} className="flex-1 h-10 rounded-xl">Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="flex-1 bg-[#EF4444] hover:bg-[#DC2626] text-white h-10 rounded-xl gap-2">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {editTarget ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Results Modal ── */}
      {resultsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <div>
                <h3 className="font-bold text-gray-900">{resultsModal.title}</h3>
                <p className="text-xs text-gray-400 mt-0.5">Max marks: {resultsModal.maxMarks} • Enter marks for each student</p>
              </div>
              <button onClick={() => setResultsModal(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {students.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <GraduationCap size={32} className="mb-2 opacity-30" />
                  <p className="text-sm">No students found</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 rounded-xl">
                      <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-4 py-3">#</th>
                      <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-4 py-3">Student</th>
                      <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-4 py-3">Marks / {resultsModal.maxMarks}</th>
                      <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-4 py-3">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {students.map((s, i) => {
                      const m = parseInt(marks[s.id] || "0");
                      const { grade, color } = getGrade(m, resultsModal.maxMarks);
                      return (
                        <tr key={s.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 text-sm text-gray-400">{i + 1}</td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-semibold text-gray-800">
                              {studentFirst(s)} {studentLast(s)}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="number"
                              min={0}
                              max={resultsModal.maxMarks}
                              placeholder="0"
                              value={marks[s.id] || ""}
                              onChange={e => setMarks(prev => ({ ...prev, [s.id]: e.target.value }))}
                              className="border-gray-200 h-9 w-28 text-center font-semibold"
                            />
                          </td>
                          <td className="px-4 py-3">
                            {marks[s.id]
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
              <Button onClick={handleSaveResults} disabled={savingResults || students.length === 0} className="flex-1 bg-[#6366F1] hover:bg-[#5558E3] text-white h-10 rounded-xl gap-2">
                {savingResults ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save Results
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
            <h3 className="font-bold text-gray-900 text-center mb-1">Delete Assessment</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Delete <span className="font-semibold text-gray-800">{deleteTarget.title}</span>? All results will be lost.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setDeleteTarget(null)} className="flex-1 h-10 rounded-xl">Cancel</Button>
              <Button onClick={handleDelete} disabled={deleting} className="flex-1 bg-rose-500 hover:bg-rose-600 text-white h-10 rounded-xl gap-2">
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </TeacherLayout>
  );
}
