import { useEffect, useState } from "react";
import { BookOpen, Loader2, GraduationCap } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import axiosClient from "@/axiosClient";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const GRADIENTS = [
  "linear-gradient(135deg, #6366F1, #8B5CF6)",
  "linear-gradient(135deg, #3B82F6, #06B6D4)",
  "linear-gradient(135deg, #10B981, #059669)",
  "linear-gradient(135deg, #F59E0B, #D97706)",
  "linear-gradient(135deg, #EF4444, #F43F5E)",
  "linear-gradient(135deg, #8B5CF6, #6366F1)",
];

export default function StudentSubjectsPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosClient.get("/students/me/subjects")
      .then(res => setSubjects(Array.isArray(res.data) ? res.data : []))
      .catch(() => toast.error("Failed to load subjects"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout title="My Subjects" subtitle="All subjects you are enrolled in">
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-[#6366F1]" />
        </div>
      ) : subjects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <BookOpen size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="font-semibold text-gray-500">No subjects found</p>
          <p className="text-sm text-gray-400 mt-1">Contact your school administrator</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {subjects.map((cs: any, i: number) => {
            const subjectName  = cs.subject?.name ?? cs.name ?? "—";
            const grade        = cs.class?.grade?.label ?? "";
            const className    = cs.class?.name ?? "";
            const teacherFirst = cs.teacher?.user?.firstName ?? cs.teacher?.firstName ?? "";
            const teacherLast  = cs.teacher?.user?.lastName  ?? cs.teacher?.lastName  ?? "";
            const teacher      = teacherFirst || teacherLast ? `${teacherFirst} ${teacherLast}`.trim() : null;
            const gradient     = GRADIENTS[i % GRADIENTS.length];

            return (
              <div
                key={cs.id}
                className="rounded-2xl shadow-md hover:shadow-xl transition-all relative overflow-hidden text-white"
                style={{ background: gradient }}
              >
                <div className="absolute -right-5 -bottom-5 w-24 h-24 rounded-full bg-white/10" />
                <div className="absolute -right-2 -top-4 w-16 h-16 rounded-full bg-white/10" />
                <div className="relative z-10 p-5">
                  <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                    <BookOpen size={18} className="text-white" />
                  </div>
                  <p className="font-bold text-white text-base truncate">{subjectName}</p>
                  {(grade || className) && (
                    <p className="text-xs text-white/70 mt-0.5">{grade} {className}</p>
                  )}
                  {teacher && (
                    <div className="flex items-center gap-1.5 mt-3 bg-white/15 rounded-xl px-3 py-2">
                      <GraduationCap size={12} className="text-white/80 shrink-0" />
                      <p className="text-xs font-semibold text-white/90 truncate">{teacher}</p>
                    </div>
                  )}
                  {cs.description && (
                    <p className="text-xs text-white/60 mt-3 line-clamp-2">{cs.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
