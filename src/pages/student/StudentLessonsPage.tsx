import { useState } from "react";
import { BookOpen, Loader2, FileText, ExternalLink, Send, X } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { CardGridSkeleton } from "@/components/ui/TableSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import axiosClient from "@/axiosClient";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useStudentLessons } from "@/hooks/queries";
import { resolveLogoUrl } from "@/lib/logo";

const GRADIENTS = [
  "linear-gradient(135deg, #6366F1, #8B5CF6)",
  "linear-gradient(135deg, #3B82F6, #06B6D4)",
  "linear-gradient(135deg, #10B981, #059669)",
  "linear-gradient(135deg, #F59E0B, #D97706)",
  "linear-gradient(135deg, #EF4444, #F43F5E)",
  "linear-gradient(135deg, #8B5CF6, #6366F1)",
];

export default function StudentLessonsPage() {
  const { data: lessons = [], isLoading } = useStudentLessons();
  const [search, setSearch]   = useState("");

  // View modal
  const [viewLesson, setViewLesson]   = useState<any>(null);
  const [readIds, setReadIds]         = useState<Set<string>>(new Set());
  const [respondText, setRespondText] = useState("");
  const [responding, setResponding]   = useState(false);

  const openLesson = async (lesson: any) => {
    setViewLesson(lesson);
    setRespondText("");

    if (!readIds.has(lesson.id)) {
      try {
        await axiosClient.post(`/students/me/lessons/${lesson.id}/read`);
        setReadIds(prev => new Set(prev).add(lesson.id));
      } catch {
        // non-critical
      }
    }
  };

  const closeLesson = () => {
    setViewLesson(null);
    setRespondText("");
  };

  const handleRespond = async () => {
    const text = respondText.trim();
    if (!text || !viewLesson) return;
    setResponding(true);
    try {
      await axiosClient.post(`/students/me/lessons/${viewLesson.id}/respond`, { response: text });
      toast.success("Response sent!");
      setRespondText("");
    } catch {
      toast.error("Failed to send response");
    } finally {
      setResponding(false);
    }
  };

  const filtered = lessons.filter(l =>
    `${l.title} ${l.classSubject?.subject?.name ?? ""}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout title="My Lessons" subtitle="View lesson notes and resources from your teachers">

      {/* Search */}
      {!isLoading && lessons.length > 0 && (
        <div className="relative mb-5 max-w-sm">
          <BookOpen size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Search lessons..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 h-10 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30"
          />
        </div>
      )}

      {isLoading ? (
        <CardGridSkeleton count={6} />
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <EmptyState
            icon={BookOpen}
            title={search ? "No lessons match your search" : "No lessons published yet"}
            description={search ? undefined : "Your teacher hasn't published any lessons yet"}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((lesson: any, i: number) => {
            const subject  = lesson.classSubject?.subject?.name ?? lesson.subject?.name ?? "—";
            const grade    = lesson.classSubject?.class?.grade?.label ?? "";
            const cls      = lesson.classSubject?.class?.name ?? "";
            const term     = lesson.term ? `Term ${lesson.term.termNumber}` : null;
            const gradient = GRADIENTS[i % GRADIENTS.length];
            const isRead   = readIds.has(lesson.id);

            return (
              <div
                key={lesson.id}
                className="rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all group cursor-pointer relative"
                style={{ background: gradient }}
                onClick={() => openLesson(lesson)}
              >
                <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/10" />
                <div className="absolute -right-2 -top-4 w-14 h-14 rounded-full bg-white/10" />

                <div className="relative z-10 p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                      <BookOpen size={18} className="text-white" />
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {isRead && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white/90">
                          Read
                        </span>
                      )}
                      {lesson.fileUrl && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white/90 flex items-center gap-0.5">
                          <FileText size={9} /> File
                        </span>
                      )}
                      {lesson.videoUrl && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white/90 flex items-center gap-0.5">
                          <ExternalLink size={9} /> Link
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="font-bold text-white text-sm leading-snug mb-1">{lesson.title}</p>
                  <p className="text-xs text-white/70">{subject}{(grade || cls) ? ` · ${grade} ${cls}` : ""}</p>
                  {term && <p className="text-xs text-white/50 mt-0.5">{term}</p>}

                  <div className="mt-4">
                    <span className="text-xs font-semibold text-white/80">Read</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Lesson View Modal ── */}
      {(() => {
        const subject  = viewLesson?.classSubject?.subject?.name ?? viewLesson?.subject?.name ?? "—";
        const grade    = viewLesson?.classSubject?.class?.grade?.label ?? "";
        const cls      = viewLesson?.classSubject?.class?.name ?? "";
        const term     = viewLesson?.term ? `Term ${viewLesson.term.termNumber}` : null;
        const hasContent = viewLesson?.content && viewLesson.content.replace(/<[^>]*>/g, "").trim().length > 0;

        return (
          <Modal open={!!viewLesson} onClose={closeLesson} maxWidth="max-w-2xl" panelClassName="max-h-[90vh] overflow-y-auto">

              {/* Header */}
              <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                <div>
                  <h3 className="font-bold text-gray-900">{viewLesson?.title}</h3>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-gray-400">{subject}</span>
                    {(grade || cls) && <span className="text-xs text-gray-400">· {grade} {cls}</span>}
                    {term && <span className="text-xs text-gray-400">· {term}</span>}
                  </div>
                </div>
                <button onClick={closeLesson} aria-label="Close lesson" className="text-gray-400 hover:text-gray-600 ml-4 shrink-0">
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-5">

                {/* Resources */}
                {(viewLesson?.fileUrl || viewLesson?.videoUrl) && (
                  <div className="flex flex-wrap gap-2">
                    {viewLesson?.fileUrl && (
                      <a
                        href={resolveLogoUrl(viewLesson.fileUrl) ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition-colors"
                      >
                        <FileText size={13} /> Download Attachment
                      </a>
                    )}
                    {viewLesson?.videoUrl && (
                      <a
                        href={viewLesson.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-50 border border-purple-100 text-purple-700 text-xs font-semibold hover:bg-purple-100 transition-colors"
                      >
                        <ExternalLink size={13} /> Open Resource Link
                      </a>
                    )}
                  </div>
                )}

                {/* Lesson content */}
                {hasContent ? (
                  <div
                    className="prose prose-sm max-w-none text-gray-700 bg-[#F4F7FE] rounded-xl p-4 [&_h1]:text-base [&_h1]:font-bold [&_h2]:text-sm [&_h2]:font-bold [&_h3]:text-sm [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:my-0.5 [&_a]:text-[#6366F1] [&_a]:underline [&_strong]:font-semibold"
                    dangerouslySetInnerHTML={{ __html: viewLesson?.content }}
                  />
                ) : (
                  <p className="text-sm text-gray-400 italic bg-[#F4F7FE] rounded-xl p-4">
                    No written notes for this lesson.
                  </p>
                )}

                <hr className="border-gray-100" />

                {/* Respond section */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Send a Response to Your Teacher</p>
                  <textarea
                    rows={3}
                    placeholder="Ask a question or leave a comment for your teacher..."
                    value={respondText}
                    onChange={e => setRespondText(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30 resize-none"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex gap-3 px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white">
                <Button variant="outline" onClick={closeLesson} className="flex-1 h-10 rounded-xl">
                  Close
                </Button>
                <Button
                  onClick={handleRespond}
                  disabled={responding || !respondText.trim()}
                  className={cn(
                    "flex-1 h-10 rounded-xl gap-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {responding ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  {responding ? "Sending..." : "Send Response"}
                </Button>
              </div>
          </Modal>
        );
      })()}
    </DashboardLayout>
  );
}
