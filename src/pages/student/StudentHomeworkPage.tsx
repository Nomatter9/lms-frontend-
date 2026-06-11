import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ClipboardList, Loader2, Send, Upload, X,
  CheckCircle2, FileText, BookOpen, Calendar, Award, RefreshCw,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import axiosClient from "@/axiosClient";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useStudentHomework } from "@/hooks/queries";
import { resolveLogoUrl } from "@/lib/logo";

// localStorage helpers — keyed by user so shared-device students don't bleed data
const getUserId = () => {
  try { return JSON.parse(localStorage.getItem("user") || "{}").id ?? "anon"; }
  catch { return "anon"; }
};
const storageKey = () => `hw_submissions_${getUserId()}`;

const readStored = (): Record<string, any> => {
  try { return JSON.parse(localStorage.getItem(storageKey()) || "{}"); }
  catch { return {}; }
};
const writeStored = (data: Record<string, any>) => {
  try { localStorage.setItem(storageKey(), JSON.stringify(data)); }
  catch { /* quota exceeded — silent */ }
};

export default function StudentHomeworkPage() {
  const { data: homework = [], isLoading } = useStudentHomework();
  const queryClient = useQueryClient();

  // Persisted across refreshes via localStorage.
  // { [homeworkId]: submissionObject } — presence means submitted, marks field means graded.
  const [localSubmissions, setLocalSubmissions] = useState<Record<string, any>>(readStored);

  const saveSubmission = (homeworkId: string, sub: any) => {
    setLocalSubmissions(prev => {
      const next = { ...prev, [homeworkId]: sub };
      writeStored(next);
      return next;
    });
  };

  // Unified detail modal state
  const [modal,       setModal]       = useState<any>(null);
  const [subData,     setSubData]     = useState<any>(null);
  const [subLoading,  setSubLoading]  = useState(false);

  // Submit form state (inside modal)
  const [submitFile,    setSubmitFile]    = useState<File | null>(null);
  const [submitComment, setSubmitComment] = useState("");
  const [submitting,    setSubmitting]    = useState(false);

  const loadSubmission = async (hw: any) => {
    // Use submissionId from API response OR from persisted local data
    const submissionId = hw.submission?.id ?? hw.submissionId ?? localSubmissions[hw.id]?.id;
    if (!submissionId) return;
    setSubLoading(true);
    try {
      const res = await axiosClient.get(`/students/me/submissions/${submissionId}`);
      setSubData(res.data);
      // Persist fresh data (includes marks if teacher has graded)
      saveSubmission(hw.id, res.data);
      queryClient.setQueryData<any[]>(["student/homework"], (old) =>
        old?.map(h => h.id === hw.id
          ? { ...h, submission: { ...(h.submission ?? {}), marks: res.data.marks, feedback: res.data.feedback } }
          : h
        ) ?? old
      );
    } catch {
      toast.error("Failed to load submission details");
    } finally {
      setSubLoading(false);
    }
  };

  const openModal = async (hw: any) => {
    setModal(hw);
    setSubData(null);
    setSubmitFile(null);
    setSubmitComment("");
    const submitted = hw.submitted || !!hw.submission || !!localSubmissions[hw.id];
    if (submitted) {
      const cached = localSubmissions[hw.id];
      // Use cached data immediately if already marked; otherwise fetch fresh to pick up marks
      if (cached?.marks !== null && cached?.marks !== undefined) {
        setSubData(cached);
      } else {
        await loadSubmission(hw);
      }
    }
  };

  const closeModal = () => {
    setModal(null);
    setSubData(null);
    setSubmitFile(null);
    setSubmitComment("");
  };

  const handleSubmit = async () => {
    if (!modal) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      if (submitComment.trim()) fd.append("notes", submitComment.trim());
      if (submitFile) fd.append("file", submitFile);
      const subRes = await axiosClient.post(`/homework/${modal.id}/submit`, fd);
      const submission = subRes.data ?? {};
      toast.success("Homework submitted!");
      // Persist so status survives refresh
      saveSubmission(modal.id, submission);
      // Stay in modal and flip to submitted view immediately
      setSubData(submission);
      setModal((prev: any) => prev ? { ...prev, submitted: true, submission } : prev);
      setSubmitFile(null);
      setSubmitComment("");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="My Homework" subtitle="View and submit your assigned homework">
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <TableSkeleton cols={7} />
        </div>
      ) : homework.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <EmptyState icon={ClipboardList} title="No homework assigned yet" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* ── Mobile card list ── */}
          <div className="sm:hidden divide-y divide-gray-50">
            {homework.map((hw: any) => {
              const isOverdue = hw.dueDate && new Date(hw.dueDate) < new Date();
              const submitted = hw.submitted || !!hw.submission || !!localSubmissions[hw.id];
              const subject   = hw.classSubject?.subject?.name ?? hw.subject?.name ?? "—";
              const marks     = localSubmissions[hw.id]?.marks ?? hw.submission?.marks ?? hw.marks ?? null;
              const maxMarks  = hw.maxMarks ?? null;
              const isMarked  = submitted && marks !== null && marks !== undefined;
              return (
                <div key={hw.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{hw.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{subject}</p>
                    </div>
                    <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full shrink-0",
                      isMarked  ? "bg-[#6366F1]/10 text-[#6366F1]" :
                      submitted ? "bg-emerald-100 text-emerald-700" :
                      isOverdue ? "bg-rose-100 text-rose-600" :
                                  "bg-amber-100 text-amber-700"
                    )}>
                      {isMarked ? "Marked" : submitted ? "Submitted" : isOverdue ? "Overdue" : "Pending"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    {hw.dueDate && (
                      <span className={cn("text-xs font-medium", isOverdue && !submitted ? "text-rose-500" : "text-gray-400")}>
                        Due {hw.dueDate.split("T")[0]}
                      </span>
                    )}
                    {marks !== null ? (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#6366F1]/10 text-[#6366F1]">
                        {marks}{maxMarks ? ` / ${maxMarks}` : ""}
                      </span>
                    ) : submitted ? (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
                        Awaiting mark
                      </span>
                    ) : null}
                  </div>
                  <button
                    onClick={() => openModal(hw)}
                    className={cn("w-full h-9 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors", submitted ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-[#F59E0B]/10 text-[#D97706] hover:bg-[#F59E0B]/20")}
                  >
                    <BookOpen size={12} /> {submitted ? "View Submission" : "Open & Submit"}
                  </button>
                </div>
              );
            })}
          </div>

          {/* ── Desktop table ── */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["#", "Title", "Subject", "Due Date", "Status", "Mark", "Action"].map(h => (
                    <th key={h} className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-6 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {homework.map((hw: any, i: number) => {
                  const isOverdue = hw.dueDate && new Date(hw.dueDate) < new Date();
                  const submitted = hw.submitted || !!hw.submission || !!localSubmissions[hw.id];
                  const subject   = hw.classSubject?.subject?.name ?? hw.subject?.name ?? "—";
                  const marks     = localSubmissions[hw.id]?.marks ?? hw.submission?.marks ?? hw.marks ?? null;
                  const maxMarks  = hw.maxMarks ?? null;
                  const isMarked  = submitted && marks !== null && marks !== undefined;

                  return (
                    <tr key={hw.id} className="hover:bg-[#F4F7FE]/50 transition-colors">
                      <td className="px-6 py-3.5 text-sm text-gray-400 font-medium">{i + 1}</td>
                      <td className="px-6 py-3.5">
                        <p className="text-sm font-semibold text-gray-800">{hw.title}</p>
                        {hw.description && (
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1" dangerouslySetInnerHTML={{ __html: hw.description }} />
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-gray-500">{subject}</td>
                      <td className="px-6 py-3.5">
                        <span className={cn("text-xs font-semibold", isOverdue && !submitted ? "text-rose-500" : "text-gray-500")}>
                          {hw.dueDate?.split("T")[0] ?? "—"}
                          {isOverdue && !submitted && (
                            <span className="ml-1.5 text-[10px] bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-full">Overdue</span>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full",
                          isMarked  ? "bg-[#6366F1]/10 text-[#6366F1]" :
                          submitted ? "bg-emerald-100 text-emerald-700" :
                          isOverdue ? "bg-rose-100 text-rose-600" :
                                      "bg-amber-100 text-amber-700"
                        )}>
                          {isMarked ? "Marked" : submitted ? "Submitted" : isOverdue ? "Overdue" : "Pending"}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        {marks !== null
                          ? <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#6366F1]/10 text-[#6366F1]">{marks}{maxMarks ? ` / ${maxMarks}` : ""}</span>
                          : submitted
                            ? <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-600">Awaiting mark</span>
                            : <span className="text-xs text-gray-300 font-medium">—</span>}
                      </td>
                      <td className="px-6 py-3.5">
                        <button onClick={() => openModal(hw)} className={cn("text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors", submitted ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-[#F59E0B]/10 text-[#D97706] hover:bg-[#F59E0B]/20")}>
                          <BookOpen size={10} /> {submitted ? "View" : "Open"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Unified Homework Modal ── */}
      {(() => {
        const submitted = modal?.submitted || !!modal?.submission || (modal && !!localSubmissions[modal.id]);
        const subject   = modal?.classSubject?.subject?.name ?? modal?.subject?.name ?? "—";
        const hasContent = modal?.description && modal.description.replace(/<[^>]*>/g, "").trim().length > 0;

        return (
          <Modal open={!!modal} onClose={closeModal} maxWidth="max-w-xl" panelClassName="max-h-[90vh] overflow-y-auto">

              {/* Header */}
              <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                <div>
                  <h3 className="font-bold text-gray-900">{modal?.title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{subject}</p>
                </div>
                <button onClick={closeModal} aria-label="Close" className="text-gray-400 hover:text-gray-600 ml-4 shrink-0">
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-5">

                {/* Meta strip */}
                <div className="flex flex-wrap gap-2">
                  {modal?.dueDate && (
                    <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-[#F4F7FE] text-gray-600">
                      <Calendar size={11} /> Due: {modal.dueDate.split("T")[0]}
                    </span>
                  )}
                  {modal?.maxMarks && (
                    <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-[#F4F7FE] text-gray-600">
                      <Award size={11} /> {modal.maxMarks} marks
                    </span>
                  )}
                  <span className={cn(
                    "text-xs font-semibold px-3 py-1.5 rounded-full",
                    submitted ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                  )}>
                    {submitted ? "Submitted" : "Pending"}
                  </span>
                </div>

                {/* Instructions */}
                {hasContent && (
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Instructions</p>
                    <div
                      className="prose prose-sm max-w-none text-gray-700 bg-[#F4F7FE] rounded-xl p-4 [&_h1]:text-base [&_h1]:font-bold [&_h2]:text-sm [&_h2]:font-bold [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:my-0.5 [&_a]:text-[#6366F1] [&_a]:underline [&_strong]:font-semibold"
                      dangerouslySetInnerHTML={{ __html: modal.description }}
                    />
                  </div>
                )}

                {/* Teacher's attached file */}
                {modal?.fileUrl && (
                  <a
                    href={resolveLogoUrl(modal.fileUrl) ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 text-sm font-semibold hover:bg-blue-100 transition-colors"
                  >
                    <FileText size={14} /> Download Homework File
                  </a>
                )}

                <hr className="border-gray-100" />

                {/* ── SUBMITTED VIEW ── */}
                {submitted && (
                  <div className="space-y-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Your Submission</p>

                    {subLoading ? (
                      <div className="flex justify-center py-6">
                        <Loader2 size={22} className="animate-spin text-[#6366F1]" />
                      </div>
                    ) : subData ? (
                      <div className="space-y-3">
                        {/* Mark banner — or awaiting mark state */}
                        {subData.marks !== null && subData.marks !== undefined ? (
                          <div className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] rounded-xl p-4 text-white flex items-center gap-3">
                            <CheckCircle2 size={20} className="text-white/80 shrink-0" />
                            <div className="flex-1">
                              <p className="text-[10px] font-semibold opacity-60 uppercase tracking-widest">Mark Received</p>
                              <p className="text-2xl font-extrabold leading-none">
                                {subData.marks}{modal?.maxMarks ? ` / ${modal.maxMarks}` : ""}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                            <div>
                              <p className="text-xs font-bold text-amber-700">Awaiting mark</p>
                              <p className="text-[11px] text-amber-500 mt-0.5">Your teacher hasn't graded this yet</p>
                            </div>
                            <button
                              onClick={() => loadSubmission(modal)}
                              className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-900 transition-colors"
                            >
                              <RefreshCw size={12} /> Refresh
                            </button>
                          </div>
                        )}

                        {/* Feedback from teacher */}
                        {subData.feedback && (
                          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Teacher Feedback</p>
                            <p className="text-sm text-indigo-800">{subData.feedback}</p>
                          </div>
                        )}

                        {/* Submitted at */}
                        <div className="p-3 bg-[#F4F7FE] rounded-xl">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Submitted On</p>
                          <p className="text-sm font-semibold text-gray-700 mt-0.5">
                            {subData.submittedAt
                              ? new Date(subData.submittedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                              : "—"}
                          </p>
                        </div>

                        {/* Student's notes */}
                        {(subData.notes || subData.comment) && (
                          <div className="p-3 bg-[#F4F7FE] rounded-xl">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Your Notes</p>
                            <p className="text-sm text-gray-700">{subData.notes ?? subData.comment}</p>
                          </div>
                        )}

                        {/* Student's submitted file */}
                        {subData.fileUrl && (
                          <a
                            href={resolveLogoUrl(subData.fileUrl) ?? "#"}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-700 text-sm font-semibold hover:bg-blue-100 transition-colors"
                          >
                            <FileText size={14} /> View Your Submitted File
                          </a>
                        )}

                        {!subData.notes && !subData.comment && !subData.fileUrl && subData.marks === null && (
                          <p className="text-sm text-gray-400 text-center py-2">No submission details available</p>
                        )}
                      </div>
                    ) : (
                      <div className="py-4 text-center">
                        <CheckCircle2 size={28} className="mx-auto mb-2 text-emerald-400" />
                        <p className="text-sm font-semibold text-emerald-700">Submitted successfully</p>
                        <p className="text-xs text-gray-400 mt-1">Refresh the page to view full submission details</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── NOT SUBMITTED: Submit Form ── */}
                {!submitted && (
                  <div className="space-y-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Submit Your Work</p>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block">
                        Notes / Answer <span className="text-gray-400 normal-case font-normal">(optional)</span>
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Write your answer or notes here..."
                        value={submitComment}
                        onChange={e => setSubmitComment(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30 resize-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block">
                        Attachment <span className="text-gray-400 normal-case font-normal">(optional)</span>
                      </label>
                      <label className={cn(
                        "flex items-center gap-3 p-3.5 rounded-xl border-2 border-dashed cursor-pointer transition-colors",
                        submitFile ? "border-[#6366F1] bg-[#6366F1]/5" : "border-gray-200 hover:border-[#6366F1]/40"
                      )}>
                        <Upload size={16} className={cn("shrink-0", submitFile ? "text-[#6366F1]" : "text-gray-400")} />
                        <span className={cn("text-sm truncate", submitFile ? "text-[#6366F1] font-semibold" : "text-gray-400")}>
                          {submitFile ? submitFile.name : "Click to select a file"}
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip"
                          onChange={e => setSubmitFile(e.target.files?.[0] ?? null)}
                        />
                      </label>
                      {submitFile && (
                        <button onClick={() => setSubmitFile(null)} className="text-xs text-rose-500 hover:underline ml-1">
                          Remove file
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex gap-3 px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white">
                <Button variant="outline" onClick={closeModal} className="flex-1 h-10 rounded-xl">
                  Close
                </Button>
                {!submitted && (
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 bg-[#6366F1] hover:bg-[#4F46E5] text-white h-10 rounded-xl gap-2"
                  >
                    {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    {submitting ? "Submitting..." : "Submit"}
                  </Button>
                )}
              </div>
          </Modal>
        );
      })()}
    </DashboardLayout>
  );
}
