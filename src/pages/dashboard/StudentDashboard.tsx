import { useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen, BookMarked, ClipboardList, TrendingUp,
  CalendarCheck, ArrowUpRight, GraduationCap,
  Loader2, Send, Upload, X, AlertCircle,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useStudentHomework, useStudentLessons } from "@/hooks/queries";
import { cn } from "@/lib/utils";
import { resolveLogoUrl } from "@/lib/logo";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import axiosClient from "@/axiosClient";
import type { Homework, HomeworkSubmission, Lesson } from "@/types";

type DashboardHW = Homework & { submitted?: boolean; submission?: HomeworkSubmission };

export default function StudentDashboard() {
  const queryClient = useQueryClient();
  const {
    data: homeworkRaw = [],
    isLoading: hwLoading,
    isError: hwError,
  } = useStudentHomework();
  const {
    data: lessons = [],
    isLoading: lessonsLoading,
    isError: lessonsError,
  } = useStudentLessons();

  const homework = homeworkRaw as DashboardHW[];
  const isLoading = hwLoading || lessonsLoading;
  const isError   = hwError   || lessonsError;

  const [submitModal,   setSubmitModal]   = useState<DashboardHW | null>(null);
  const [submitFile,    setSubmitFile]    = useState<File | null>(null);
  const [submitComment, setSubmitComment] = useState("");
  const [submitting,    setSubmitting]    = useState(false);

  const [lessonModal,       setLessonModal]       = useState<Lesson | null>(null);
  const [lessonReadIds,     setLessonReadIds]     = useState<Set<string>>(new Set());
  const [lessonRespondText, setLessonRespondText] = useState("");
  const [lessonResponding,  setLessonResponding]  = useState(false);

  const closeSubmitModal = () => {
    setSubmitModal(null);
    setSubmitFile(null);
    setSubmitComment("");
  };

  const openLesson = async (lesson: Lesson) => {
    setLessonModal(lesson);
    setLessonRespondText("");
    if (!lessonReadIds.has(lesson.id)) {
      try {
        await axiosClient.post(`/students/me/lessons/${lesson.id}/read`);
        setLessonReadIds(prev => new Set(prev).add(lesson.id));
      } catch {
        // non-critical
      }
    }
  };

  const handleLessonRespond = async () => {
    const text = lessonRespondText.trim();
    if (!text || !lessonModal) return;
    setLessonResponding(true);
    try {
      await axiosClient.post(`/students/me/lessons/${lessonModal.id}/respond`, { response: text });
      toast.success("Response sent!");
      setLessonRespondText("");
    } catch {
      toast.error("Failed to send response");
    } finally {
      setLessonResponding(false);
    }
  };

  const handleSubmit = async () => {
    if (!submitModal) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      if (submitComment.trim()) fd.append("notes", submitComment.trim());
      if (submitFile) fd.append("file", submitFile);
      const subRes = await axiosClient.post(`/homework/${submitModal.id}/submit`, fd);
      toast.success("Homework submitted!");
      queryClient.setQueryData<DashboardHW[]>(
        ["student/homework"],
        (old = []) => old.map(h => h.id === submitModal.id ? { ...h, submitted: true, submission: subRes.data } : h)
      );
      closeSubmitModal();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr.response?.data?.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  const pendingHomework = homework.filter(hw => !hw.submitted && !hw.submission);

  const QUICK_LINKS = [
    { label: "My Subjects", desc: "All subjects you're enrolled in", href: "/dashboard/student/subjects",   gradient: "linear-gradient(135deg, #6366F1, #8B5CF6)", icon: BookOpen },
    { label: "Lessons",     desc: "View lesson notes and resources",  href: "/dashboard/student/lessons",    gradient: "linear-gradient(135deg, #10B981, #059669)", icon: BookMarked },
    { label: "Homework",    desc: "View and submit your assignments", href: "/dashboard/student/homework",   gradient: "linear-gradient(135deg, #F59E0B, #D97706)", icon: ClipboardList },
    { label: "My Results",  desc: "Assessment scores and marks",      href: "/dashboard/student/results",    gradient: "linear-gradient(135deg, #EF4444, #F43F5E)", icon: TrendingUp },
    { label: "Attendance",  desc: "Your daily attendance record",     href: "/dashboard/student/attendance", gradient: "linear-gradient(135deg, #3B82F6, #06B6D4)", icon: CalendarCheck },
  ];

  return (
    <div className="space-y-6">

      {/* Banner */}
      <div className="bg-gradient-to-r from-[#10B981] to-[#059669] rounded-2xl p-6 text-white">
        <h2 className="text-xl font-black mb-1">Student Portal</h2>
        <p className="text-emerald-100/80 text-sm">View your lessons, homework and submit assignments</p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {QUICK_LINKS.map(link => (
          <Link key={link.href} to={link.href}
            className="rounded-2xl p-5 shadow-md hover:shadow-xl transition-all group relative overflow-hidden text-white"
            style={{ background: link.gradient }}
          >
            <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-white/10" />
            <div className="absolute -right-2 -top-4 w-14 h-14 rounded-full bg-white/10" />
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                <link.icon size={18} className="text-white" />
              </div>
              <p className="font-bold text-white text-sm mb-1">{link.label}</p>
              <p className="text-xs text-white/70 leading-relaxed">{link.desc}</p>
              <div className="flex items-center gap-1 mt-3 text-white/80">
                <span className="text-xs font-semibold">View</span>
                <ArrowUpRight size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {isError && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <AlertCircle size={32} className="mx-auto mb-3 text-rose-400" />
          <p className="font-medium text-gray-700">Failed to load content</p>
          <p className="text-sm text-gray-400 mt-1">Please refresh the page to try again</p>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-10">
          <Loader2 size={24} className="animate-spin text-emerald-500" />
        </div>
      )}

      {/* Recent Lessons */}
      {!isLoading && !isError && lessons.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-4">Recent Lessons</h2>
          <div className="space-y-2">
            {lessons.slice(0, 6).map((lesson: Lesson) => (
              <div
                key={lesson.id}
                onClick={() => openLesson(lesson)}
                className="flex items-center gap-3 p-3 bg-[#F4F7FE] rounded-xl cursor-pointer hover:bg-[#EEF2FF] transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                  <BookOpen size={14} className="text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{lesson.title}</p>
                  <p className="text-xs text-gray-400">
                    {lesson.classSubject?.subject?.name ?? "—"}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {lessonReadIds.has(lesson.id) && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Read</span>
                  )}
                  {lesson.fileUrl && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 font-semibold">📎 File</span>
                  )}
                  {lesson.videoUrl && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-600 font-semibold">🔗 Link</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Homework */}
      {!isLoading && !isError && pendingHomework.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-4">Pending Homework</h2>
          <div className="space-y-2">
            {pendingHomework.slice(0, 6).map((hw: DashboardHW) => {
              const isOverdue = hw.dueDate && new Date(hw.dueDate) < new Date();
              return (
                <div key={hw.id} className="flex items-center gap-3 p-3 bg-[#F4F7FE] rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                    <ClipboardList size={14} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{hw.title}</p>
                    <p className={cn("text-xs", isOverdue ? "text-rose-500 font-semibold" : "text-gray-400")}>
                      Due: {hw.dueDate?.split('T')[0] ?? "—"} {isOverdue ? "(overdue)" : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => setSubmitModal(hw)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors flex items-center gap-1 shrink-0"
                  >
                    <Send size={10} /> Submit
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!isLoading && !isError && homework.length === 0 && lessons.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-gray-400">
          <GraduationCap size={36} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No content yet</p>
          <p className="text-sm mt-1">Your teacher hasn't published any lessons or homework yet</p>
        </div>
      )}

      {/* ── Lesson Modal ── */}
      {lessonModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div>
                <h3 className="font-bold text-gray-900">{lessonModal.title}</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {lessonModal.classSubject?.subject?.name ?? "—"}
                  {lessonModal.term ? ` · Term ${lessonModal.term.termNumber}` : ""}
                </p>
              </div>
              <button onClick={() => setLessonModal(null)} className="text-gray-400 hover:text-gray-600 ml-4 shrink-0">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {(lessonModal.fileUrl || lessonModal.videoUrl) && (
                <div className="flex flex-wrap gap-2">
                  {lessonModal.fileUrl && (
                    <a
                      href={resolveLogoUrl(lessonModal.fileUrl) ?? "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition-colors"
                    >
                      📎 Download Attachment
                    </a>
                  )}
                  {lessonModal.videoUrl && (
                    <a
                      href={lessonModal.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-50 border border-purple-100 text-purple-700 text-xs font-semibold hover:bg-purple-100 transition-colors"
                    >
                      🔗 Open Resource Link
                    </a>
                  )}
                </div>
              )}
              {lessonModal.content && lessonModal.content.replace(/<[^>]*>/g, "").trim().length > 0 ? (
                <div
                  className="prose prose-sm max-w-none text-gray-700 bg-[#F4F7FE] rounded-xl p-4 [&_h1]:text-base [&_h1]:font-bold [&_h2]:text-sm [&_h2]:font-bold [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:my-0.5 [&_a]:text-[#6366F1] [&_a]:underline [&_strong]:font-semibold"
                  dangerouslySetInnerHTML={{ __html: lessonModal.content }}
                />
              ) : (
                <p className="text-sm text-gray-400 italic bg-[#F4F7FE] rounded-xl p-4">
                  No written notes for this lesson.
                </p>
              )}
            </div>
            <div className="px-6 space-y-2 pb-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Send a Response to Your Teacher</p>
              <textarea
                rows={2}
                placeholder="Ask a question or leave a comment..."
                value={lessonRespondText}
                onChange={e => setLessonRespondText(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30 resize-none"
              />
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <Button variant="outline" onClick={() => setLessonModal(null)} className="flex-1 h-10 rounded-xl">
                Close
              </Button>
              <Button
                onClick={handleLessonRespond}
                disabled={lessonResponding || !lessonRespondText.trim()}
                className="flex-1 h-10 rounded-xl gap-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {lessonResponding ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {lessonResponding ? "Sending..." : "Send Response"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Submission Modal ── */}
      {submitModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900">Submit Homework</h3>
                <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[280px]">{submitModal.title}</p>
              </div>
              <button onClick={closeSubmitModal} className="text-gray-400 hover:text-gray-600">
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
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/30 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block">
                  Attachment <span className="text-gray-400 normal-case font-normal">(optional)</span>
                </label>
                <label className={cn(
                  "flex items-center gap-3 p-3.5 rounded-xl border-2 border-dashed cursor-pointer transition-colors group",
                  submitFile ? "border-emerald-400 bg-emerald-50" : "border-gray-200 hover:border-emerald-300"
                )}>
                  <Upload size={16} className={cn("shrink-0", submitFile ? "text-emerald-600" : "text-gray-400 group-hover:text-emerald-500")} />
                  <span className={cn("text-sm truncate", submitFile ? "text-emerald-700 font-semibold" : "text-gray-400")}>
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
              <Button variant="outline" onClick={closeSubmitModal} className="flex-1 h-10 rounded-xl">
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white h-10 rounded-xl gap-2"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {submitting ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
