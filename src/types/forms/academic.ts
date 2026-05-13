export interface YearForm {
  year: number;
  isCurrent: boolean;
}

export interface TermForm {
  termNumber: number;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface GradeForm {
  level: string;
  label: string;
}
export interface SubjectForm {
  name: string;
  code: string;
    gradeId: string;
     classId?: string;
}