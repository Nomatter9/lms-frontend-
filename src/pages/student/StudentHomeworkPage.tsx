import { useEffect, useState } from "react";
import { ClipboardList, Loader2, Send, Upload, X, CheckCircle2 } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import axiosClient from "@/axiosClient";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function StudentHomeworkPage() {
  const [homework, setHomework] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);

  const [submitModal,    setSubmitModal]    = useState<any>(null);
  const [submitFile,     setSubmitFile]     = useState<File | null>(null);
  const [submitComment,  setSubmitComment]  = useState("");
  const [submitting,     setSubmitting]     = useState(false);

  useEffect(() => {
    axiosClient.get("/student/homework")
      .then(res => setHomework(Array.isArray(res.data) ? res.data : []))
      .catch(() => toast.error("Failed to load homework"))
      .finally(() => setLoading(false));
  }, []);

  const closeModal = () => {
    setSubmitModal(null);
    setSubmitFile(null);
    setSubmitComment("");
  };

  const handleSubmit = async () => {
    if (!submitModal) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      if (submitComment.trim()) fd.append("comment", submitComment.trim());
      if (submitFile) fd.append("file", submitFile);
      await axiosClient.post(`/student/homework/${submitModal.id}/submit`, fd);
      toast.success("Homework submitted!");
      setHomework(prev => prev.map(h => h.id === submitModal.id ? { ...h, submitted: true } : h));
      closeModal();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="My Homework" subtitle="View and submit your assigned homework">
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-[#F59E0B]" />
        </div>
      ) : homework.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <ClipboardList size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="font-semibold text-gray-500">No homework assigned yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-6 py-3">#</th>
                  <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Title</th>
                  <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Subject</th>
                  <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Due Date</th>
                  <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Max Marks</th>
                  <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Status</th>
                  <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {homework.map((hw: any, i: number) => {
                  const isOverdue = hw.dueDate && new Date(hw.dueDate) < new Date();
                  const submitted = hw.submitted || !!hw.submission;
                  const subject   = hw.classSubject?.subject?.name ?? hw.subject?.name ?? "—";

                  return (
                    <tr key={hw.id} className="hover:bg-[#F4F7FE]/50 transition-colors">
                      <td className="px-6 py-3.5 text-sm text-gray-400 font-medium">{i + 1}</td>
                      <td className="px-6 py-3.5">
                        <p className="text-sm font-semibold text-gray-800">{hw.title}</p>
                        {hw.description && (
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{hw.description}</p>
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
                      <td className="px-6 py-3.5 text-sm text-gray-500">{hw.maxMarks ?? "—"}</td>
                      <td className="px-6 py-3.5">
                        <span className={cn(
                          "text-xs font-semibold px-2.5 py-1 rounded-full",
                          submitted     ? "bg-emerald-100 text-emerald-700"
                          : isOverdue   ? "bg-rose-100 text-rose-600"
                          :               "bg-amber-100 text-amber-700"
                        )}>
                          {submitted ? "Submitted" : isOverdue ? "Overdue" : "Pending"}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        {submitted ? (
                          <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                            <CheckCircle2 size={13} /> Done
                          </span>
                        ) : (
                          <button
                            onClick={() => setSubmitModal(hw)}
                            className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#6366F1]/10 text-[#6366F1] hover:bg-[#6366F1]/20 transition-colors flex items-center gap-1"
                          >
                            <Send size={10} /> Submit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Submission Modal */}
      {submitModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900">Submit Homework</h3>
                <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[280px]">{submitModal.title}</p>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block">
                  Comment <span className="text-gray-400 normal-case font-normal">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Add a note for your teacher..."
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

            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <Button variant="outline" onClick={closeModal} className="flex-1 h-10 rounded-xl">
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 bg-[#6366F1] hover:bg-[#4F46E5] text-white h-10 rounded-xl gap-2"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {submitting ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
