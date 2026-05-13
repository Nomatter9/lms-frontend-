export interface Grade {
  id: string;
  level: number;
  label: string;
  isActive?: boolean;
}

export interface AcademicYear {
  id: string;
  year: number;
  isCurrent: boolean;
  terms?: Term[];
}

export interface Term {
  id: string;
  academicYearId: string;
  termNumber: number;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  academicYear?: AcademicYear;
}

export interface Subject {
  id: string;
  name: string;
  code?: string;
    classId: string;
  gradeId: string;
  grade?: Grade;
  isActive?: boolean;
}
