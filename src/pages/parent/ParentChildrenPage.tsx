import { useEffect, useState } from "react";
import { Loader2, Users } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import axiosClient from "@/axiosClient";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const CHILD_COLORS = [
  { bg: "bg-[#6366F1]/10", text: "text-[#6366F1]", bar: "bg-[#6366F1]" },
  { bg: "bg-[#10B981]/10", text: "text-[#10B981]", bar: "bg-[#10B981]" },
  { bg: "bg-[#F59E0B]/10", text: "text-[#F59E0B]", bar: "bg-[#F59E0B]" },
  { bg: "bg-[#EF4444]/10", text: "text-[#EF4444]", bar: "bg-[#EF4444]" },
];

export default function ParentChildrenPage() {
  const [children, setChildren] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = storedUser?.id;
    if (!userId) { setLoading(false); return; }

    axiosClient.get(`/students?parentId=${userId}`)
      .then(res => setChildren(Array.isArray(res.data) ? res.data : []))
      .catch(() => toast.error("Failed to load children"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout title="My Children" subtitle="View your children's school information">

      {/* Header banner */}
      <div className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] rounded-2xl p-6 text-white mb-6">
        <h2 className="text-xl font-black mb-1">Parent Portal</h2>
        <p className="text-indigo-100/80 text-sm">
          {loading ? "Loading..." : `${children.length} ${children.length === 1 ? "child" : "children"} linked to your account`}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-[#6366F1]" />
        </div>
      ) : children.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <Users size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="font-semibold text-gray-500">No children linked to your account</p>
          <p className="text-sm text-gray-400 mt-1">Contact the school administrator to link your children</p>
        </div>
      ) : (
        <div className="space-y-6">
          {children.map((child: any, idx: number) => {
            const color      = CHILD_COLORS[idx % CHILD_COLORS.length];
            const firstName  = child.user?.firstName ?? child.firstName ?? "";
            const lastName   = child.user?.lastName  ?? child.lastName  ?? "";
            const email      = child.user?.email     ?? child.email     ?? "—";
            const isActive   = child.user?.isActive  ?? child.isActive  ?? false;
            const grade      = child.class?.grade?.label ?? "";
            const className  = child.class?.name ?? "";

            return (
              <div key={child.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Card header */}
                <div className="flex items-center gap-4 p-5 border-b border-gray-50">
                  <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center font-extrabold text-xl shrink-0", color.bg, color.text)}>
                    {(firstName[0] || "").toUpperCase()}{(lastName[0] || "").toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 text-lg">{firstName} {lastName}</p>
                    <p className="text-sm text-gray-400 mt-0.5">
                      {grade} {className}
                      {child.regNumber ? ` · Reg: ${child.regNumber}` : ""}
                    </p>
                  </div>
                  <span className={cn(
                    "text-[11px] font-bold px-3 py-1.5 rounded-full shrink-0",
                    isActive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                  )}>
                    {isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* Info grid */}
                <div className="p-5">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Details</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { label: "Class",         value: grade && className ? `${grade} ${className}` : "—" },
                      { label: "Reg Number",    value: child.regNumber ?? "—" },
                      { label: "Gender",        value: child.gender ? child.gender.charAt(0).toUpperCase() + child.gender.slice(1) : "—" },
                      { label: "Date of Birth", value: child.dateOfBirth ? child.dateOfBirth.split("T")[0] : "—" },
                      { label: "Email",         value: email },
                      { label: "Account ID",    value: child.userId ?? "—" },
                    ].map(item => (
                      <div key={item.label} className="p-3 bg-[#F4F7FE] rounded-xl">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.label}</p>
                        <p className="text-xs font-semibold text-gray-700 mt-0.5 truncate">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
