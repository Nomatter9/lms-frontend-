import type { User } from './user';

export interface StudentUser extends Pick<User,
  'id' | 'firstName' | 'lastName' | 'email' | 'phone' | 'isActive' | 'isVerified'
> {
  avatarUrl?: string | null;
}

export interface StudentChild {
  id: string;
  user: Pick<User, 'id' | 'firstName' | 'lastName'>;
}

export interface StudentParent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface StudentClass {
  id: string;
  name: string;
  grade?: { id: string; label: string; level: number };
}

export interface Parent extends User {
  avatarUrl?: string | null;
  children?: StudentChild[];
}

export interface StudentItem {
  id: string;
  userId: string;
  regNumber?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | string;
  classId?: string;
  parentId?: string;
  user: StudentUser;
  class?: StudentClass;
  parent?: StudentParent;
  createdAt: string;
}

// ─── Student dashboard view types ────────────────────────────
export interface StudentSubject {
  id: string;
  subject?: {
    id: string;
    name: string;
    code?: string;
  };
  class?: {
    id: string;
    name: string;
  };
}

export interface StudentHomework {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  maxMarks?: number;
  isPublished: boolean;
  classSubject?: {
    subject?: { name: string };
    class?: { name: string };
  };
}

export interface StudentAssessment {
  id: string;
  title: string;
  type: 'ca' | 'exam';
  date?: string;
  maxMarks: number;
  result?: {
    marks: number;
    gradeSymbol?: string;
    remarks?: string;
  };
}

export interface StudentDashboardData {
  subjects: StudentSubject[];
  homework: StudentHomework[];
  assessments: StudentAssessment[];
}

export interface StudentDashboardState {
  data: StudentDashboardData;
  loading: boolean;
}