import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Edit2, Trash2, X, Save, Loader2, Calendar } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import axiosClient from "@/axiosClient";
import { useQueryClient } from "@tanstack/react-query";
import { useAcademicYears } from "@/hooks/queries";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { AcademicYear, Term } from "@/types";
import type { YearForm, TermForm } from "@/types/forms";

const EMPTY_YEAR: YearForm = { year: new Date().getFullYear(), isCurrent: false };
const EMPTY_TERM: TermForm = { termNumber: 1, startDate: "", endDate: "", isCurrent: false };

const selectClass =
  "w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]/20 bg-white";

function YearCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 bg-gray-50/30">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gray-200 shrink-0" />
          <div className="space-y-1.5">
            <div className="h-4 w-16 bg-gray-200 rounded" />
            <div className="h-3 w-12 bg-gray-100 rounded" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="w-20 h-8 bg-gray-200 rounded-xl" />
          <div className="w-8 h-8 bg-gray-200 rounded-lg" />
          <div className="w-8 h-8 bg-gray-200 rounded-lg" />
        </div>
      </div>
      <div className="px-6 py-4">
        <div className="h-3 w-32 bg-gray-100 rounded" />
      </div>
    </div>
  );
}

export default function AcademicYearsPage() {
  const { data: years = [], isLoading, isSuccess } = useAcademicYears();
  const queryClient = useQueryClient();

  const [yearModal, setYearModal] = useState(false);
  const [editYear, setEditYear] = useState<AcademicYear | null>(null);
  const [yearForm, setYearForm] = useState<YearForm>(EMPTY_YEAR);
  const [savingYear, setSavingYear] = useState(false);
  const [deleteYear, setDeleteYear] = useState<AcademicYear | null>(null);
  const [deletingYear, setDeletingYear] = useState(false);

  const [termModal, setTermModal] = useState(false);
  const [termParent, setTermParent] = useState<AcademicYear | null>(null);
  const [editTerm, setEditTerm] = useState<Term | null>(null);
  const [termForm, setTermForm] = useState<TermForm>(EMPTY_TERM);
  const [savingTerm, setSavingTerm] = useState(false);
  const [deleteTerm, setDeleteTerm] = useState<{ term: Term; yearId: string } | null>(null);
  const [deletingTerm, setDeletingTerm] = useState(false);

  const openCreateYear = useCallback(() => {
    setEditYear(null);
    setYearForm(EMPTY_YEAR);
    setYearModal(true);
  }, []);

  const [searchParams] = useSearchParams();
  useEffect(() => {
    if (isSuccess && searchParams.get("open") === "create") openCreateYear();
  }, [isSuccess, searchParams, openCreateYear]);

  const openEditYear = (y: AcademicYear) => {
    setEditYear(y);
    setYearForm({ year: y.year, isCurrent: y.isCurrent });
    setYearModal(true);
  };

  const handleSaveYear = async () => {
    if (!yearForm.year) { toast.error("Year is required"); return; }
    setSavingYear(true);
    try {
      if (editYear) {
        await axiosClient.put(`/academicYear/${editYear.id}`, yearForm);
        toast.success("Year updated");
      } else {
        await axiosClient.post("/academicYear", yearForm);
        toast.success("Year created");
      }
      setYearModal(false);
      queryClient.invalidateQueries({ queryKey: ["academicYears"] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save");
    } finally {
      setSavingYear(false);
    }
  };

  const handleDeleteYear = async () => {
    if (!deleteYear) return;
    setDeletingYear(true);
    try {
      await axiosClient.delete(`/academicYear/${deleteYear.id}`);
      toast.success("Year deleted");
      setDeleteYear(null);
      queryClient.invalidateQueries({ queryKey: ["academicYears"] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete");
    } finally {
      setDeletingYear(false);
    }
  };

  const openCreateTerm = (year: AcademicYear) => {
    setTermParent(year);
    setEditTerm(null);
    setTermForm(EMPTY_TERM);
    setTermModal(true);
  };

  const openEditTerm = (year: AcademicYear, term: Term) => {
    setTermParent(year);
    setEditTerm(term);
    setTermForm({
      termNumber: term.termNumber,
      startDate: term.startDate?.split('T')[0] || "",
      endDate: term.endDate?.split('T')[0] || "",
      isCurrent: term.isCurrent,
    });
    setTermModal(true);
  };

  const handleSaveTerm = async () => {
    if (!termForm.startDate || !termForm.endDate) {
      toast.error("Start and end dates are required");
      return;
    }
    setSavingTerm(true);
    try {
      if (editTerm) {
        await axiosClient.put(`/terms/${editTerm.id}`, termForm);
        toast.success("Term updated");
      } else {
        await axiosClient.post(`/academicYear/${termParent?.id}/terms`, termForm);
        toast.success("Term created");
      }
      setTermModal(false);
      queryClient.invalidateQueries({ queryKey: ["academicYears"] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save");
    } finally {
      setSavingTerm(false);
    }
  };

  const handleDeleteTerm = async () => {
    if (!deleteTerm) return;
    setDeletingTerm(true);
    try {
      await axiosClient.delete(`/terms/${deleteTerm.term.id}`);
      toast.success("Term deleted");
      setDeleteTerm(null);
      queryClient.invalidateQueries({ queryKey: ["academicYears"] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete");
    } finally {
      setDeletingTerm(false);
    }
  };

  return (
    <DashboardLayout title="Academic Years" subtitle="Manage academic years and terms">

      <div className="flex justify-end mb-5">
        <Button onClick={openCreateYear} className="bg-[#6366F1] hover:bg-[#5558E3] text-white h-10 gap-2 rounded-xl">
          <Plus size={16} /> Add Academic Year
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <YearCardSkeleton />
          <YearCardSkeleton />
        </div>
      ) : years.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <EmptyState
            icon={Calendar}
            title="No academic years yet"
            description="Create your first academic year to start organizing terms and classes"
            actionLabel="Add Academic Year"
            onAction={openCreateYear}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {[...years]
            .sort((a, b) => b.year - a.year)
            .map((year) => (
              <div key={year.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 bg-gray-50/30">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#6366F1] flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {String(year.year).slice(-2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900 text-lg">{year.year}</p>
                        {year.isCurrent && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 uppercase tracking-wider">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">{year.terms?.length || 0} terms</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openCreateTerm(year)}
                      className="border-[#6366F1]/30 text-[#6366F1] hover:bg-[#6366F1] hover:text-white h-9 gap-1.5 rounded-xl text-xs font-semibold px-4 transition-all"
                    >
                      <Plus size={14} /> Add Term
                    </Button>
                    <button
                      onClick={() => openEditYear(year)}
                      aria-label={`Edit ${year.year}`}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6366F1] hover:bg-[#6366F1]/10 transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteYear(year)}
                      aria-label={`Delete ${year.year}`}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {year.terms && year.terms.length > 0 ? (
                  <div className="divide-y divide-gray-50">
                    {[...year.terms]
                      .sort((a, b) => a.termNumber - b.termNumber)
                      .map((term) => (
                        <div key={term.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50/50 transition-colors">
                          <div className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0",
                            term.isCurrent ? "bg-[#6366F1] text-white" : "bg-gray-100 text-gray-500"
                          )}>
                            {term.termNumber}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-gray-800">Term {term.termNumber}</p>
                              {term.isCurrent && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#6366F1]/10 text-[#6366F1]">
                                  Active
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {term.startDate?.split('T')[0]} → {term.endDate?.split('T')[0]}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => openEditTerm(year, term)}
                              aria-label={`Edit Term ${term.termNumber}`}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-[#6366F1] hover:bg-[#6366F1]/10 transition-colors"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => setDeleteTerm({ term, yearId: year.id })}
                              aria-label={`Delete Term ${term.termNumber}`}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="px-6 py-4 text-sm text-gray-400 italic">No terms added yet</div>
                )}
              </div>
            ))}
        </div>
      )}

      {/* Year Modal */}
      <Modal open={yearModal} onClose={() => setYearModal(false)} maxWidth="max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">{editYear ? "Edit Year" : "Add Academic Year"}</h3>
          <button onClick={() => setYearModal(false)} aria-label="Close" className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Year</Label>
            <Input
              type="number"
              placeholder="e.g. 2025"
              value={yearForm.year}
              onChange={(e) => setYearForm({ ...yearForm, year: parseInt(e.target.value) })}
              className="border-gray-200 h-10"
            />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={yearForm.isCurrent}
              onChange={(e) => setYearForm({ ...yearForm, isCurrent: e.target.checked })}
              className="w-4 h-4 rounded accent-[#6366F1]"
            />
            <span className="text-sm font-medium text-gray-700">Set as current academic year</span>
          </label>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <Button variant="outline" onClick={() => setYearModal(false)} className="flex-1 border-gray-200 h-10 rounded-xl">Cancel</Button>
          <Button onClick={handleSaveYear} disabled={savingYear} className="flex-1 bg-[#6366F1] hover:bg-[#5558E3] text-white h-10 rounded-xl gap-2">
            {savingYear ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {editYear ? "Update" : "Create"}
          </Button>
        </div>
      </Modal>

      {/* Term Modal */}
      <Modal open={termModal} onClose={() => setTermModal(false)} maxWidth="max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">
            {editTerm ? "Edit Term" : `Add Term — ${termParent?.year}`}
          </h3>
          <button onClick={() => setTermModal(false)} aria-label="Close" className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Term Number</Label>
            <select
              value={termForm.termNumber}
              onChange={(e) => setTermForm({ ...termForm, termNumber: parseInt(e.target.value) })}
              className={selectClass}
            >
              <option value={1}>Term 1</option>
              <option value={2}>Term 2</option>
              <option value={3}>Term 3</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Start Date</Label>
            <Input type="date" value={termForm.startDate}
              onChange={(e) => setTermForm({ ...termForm, startDate: e.target.value })}
              className="border-gray-200 h-10" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">End Date</Label>
            <Input type="date" value={termForm.endDate}
              onChange={(e) => setTermForm({ ...termForm, endDate: e.target.value })}
              className="border-gray-200 h-10" />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={termForm.isCurrent}
              onChange={(e) => setTermForm({ ...termForm, isCurrent: e.target.checked })}
              className="w-4 h-4 rounded accent-[#6366F1]"
            />
            <span className="text-sm font-medium text-gray-700">Set as current term</span>
          </label>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <Button variant="outline" onClick={() => setTermModal(false)} className="flex-1 border-gray-200 h-10 rounded-xl">Cancel</Button>
          <Button onClick={handleSaveTerm} disabled={savingTerm} className="flex-1 bg-[#6366F1] hover:bg-[#5558E3] text-white h-10 rounded-xl gap-2">
            {savingTerm ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {editTerm ? "Update" : "Create"}
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteYear}
        onClose={() => setDeleteYear(null)}
        onConfirm={handleDeleteYear}
        confirming={deletingYear}
        title="Delete Academic Year"
        description={<>Delete year <span className="font-semibold text-gray-800">{deleteYear?.year}</span> and all its terms? This cannot be undone.</>}
        icon={<Trash2 size={20} className="text-rose-600" />}
      />

      <ConfirmDialog
        open={!!deleteTerm}
        onClose={() => setDeleteTerm(null)}
        onConfirm={handleDeleteTerm}
        confirming={deletingTerm}
        title="Delete Term"
        description={<>Delete <span className="font-semibold text-gray-800">Term {deleteTerm?.term.termNumber}</span>? This cannot be undone.</>}
        icon={<Trash2 size={20} className="text-rose-600" />}
      />

    </DashboardLayout>
  );
}
