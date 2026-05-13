import type { Grade, AcademicYear } from './academic';
import type { User } from './user';

export interface ClassItem {
  id: string;
  name: string;
  gradeId: string;
  academicYearId: string;
  teacherId?: string;
  capacity?: number;
  isActive?: boolean;
  grade?: Grade;
  academicYear?: AcademicYear;
  teacher?: Pick<User, 'id' | 'firstName' | 'lastName'>;
}

export interface ClassSubject {
  id: string;
  classId: string;
  subjectId: string;
  teacherId?: string;
  subject?: import('./academic').Subject;
  class?: ClassItem;
  teacher?: Pick<User, 'id' | 'firstName' | 'lastName'>;
}