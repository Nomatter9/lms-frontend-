import { useEffect, useState } from "react";
import { BookOpen, Loader2, GraduationCap } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import axiosClient from "@/axiosClient";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const GRADIENTS = [
  "from-[#6366F1] to-[#8B5CF6]",
  "from-[#3B82F6] to-[#06B6D4]",
  "from-[#10B981] to-[#059669]",
  "from-[#F59E0B] to-[#D97706]",
  "from-[#EF4444] to-[#F43F5E]",
  "from-[#8B5CF6] to-[#6366F1]",
];

export default function StudentSubjectsPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosClient.get("/student/subjects")
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
              <div key={cs.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className={cn("h-1.5 bg-gradient-to-r", gradient)} />
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={cn("w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0", gradient)}>
                      <BookOpen size={18} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-800 truncate">{subjectName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{grade} {className}</p>
                    </div>
                  </div>
                  {teacher && (
                    <div className="flex items-center gap-2 p-2.5 bg-[#F4F7FE] rounded-xl">
                      <GraduationCap size={13} className="text-[#6366F1] shrink-0" />
                      <p className="text-xs font-semibold text-gray-600 truncate">Teacher: {teacher}</p>
                    </div>
                  )}
                  {cs.description && (
                    <p className="text-xs text-gray-400 mt-3 line-clamp-2">{cs.description}</p>
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
