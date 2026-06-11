import { Loader2, GraduationCap, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useParentChildren } from "@/hooks/queries";
import type { ParentChild } from "@/types";

export default function ParentDashboard() {
  const { user } = useCurrentUser();
  const { data: children = [], isLoading, isError } = useParentChildren(user?.id ?? "");

  return (
    <div className="space-y-6">

      <div className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] rounded-2xl p-6 text-white">
        <h2 className="text-xl font-black mb-1">Parent Portal</h2>
        <p className="text-indigo-100/80 text-sm">
          Track your {children.length === 1 ? "child's" : "children's"} academic progress
        </p>
      </div>

      {isError ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
          <AlertCircle size={36} className="mx-auto mb-3 text-rose-400" />
          <p className="font-medium text-gray-700">Failed to load children</p>
          <p className="text-sm text-gray-400 mt-1">Please refresh the page to try again</p>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-[#6366F1]" />
        </div>
      ) : children.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
          <GraduationCap size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No children linked to your account</p>
          <p className="text-sm mt-1">Please contact the school administrator</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {children.map((child: ParentChild) => {
            const firstName = child.user?.firstName ?? "";
            const lastName  = child.user?.lastName  ?? "";
            const email     = child.user?.email     ?? "—";
            const isActive  = child.user?.isActive  ?? false;
            const grade     = child.class?.grade?.label ?? "";
            const className = child.class?.name ?? "";

            return (
              <div key={child.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#6366F1]/10 flex items-center justify-center text-[#6366F1] font-extrabold text-lg shrink-0">
                    {firstName[0]}{lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 text-base">{firstName} {lastName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {grade} {className} {child.regNumber ? `· Reg: ${child.regNumber}` : ""}
                    </p>
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0",
                    isActive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                  )}>
                    {isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Class",         value: grade && className ? `${grade} ${className}` : "—" },
                    { label: "Reg Number",    value: child.regNumber ?? "—" },
                    { label: "Gender",        value: child.gender ? (child.gender.charAt(0).toUpperCase() + child.gender.slice(1)) : "—" },
                    { label: "Date of Birth", value: child.dateOfBirth ? child.dateOfBirth.split('T')[0] : "—" },
                    { label: "Email",         value: email },
                    { label: "Student ID",    value: child.user?.id ?? "—" },
                  ].map(item => (
                    <div key={item.label} className="p-2.5 bg-[#F4F7FE] rounded-xl">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.label}</p>
                      <p className="text-xs font-semibold text-gray-700 mt-0.5 truncate">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
