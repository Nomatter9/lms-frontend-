export interface TeacherClass {
  id: string;
  name: string;
  grade?: {
    id: string;
    label: string;
    level: number;
  };
  students?: { id: string }[];
}

export interface TeacherSubject {
  id: string;
  name?: string;
  subject?: {
    id: string;
    name: string;
    code?: string;
  };
  class?: {
    id: string;
    name: string;
    grade?: { label: string };
  };
}

export interface TeacherStudent {
  id: string;
  regNumber?: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string | null;
    isActive: boolean;
  };
  class?: {
    id: string;
    name: string;
    grade?: { label: string };
  };
}

export interface TeacherData {
  classes: TeacherClass[];
  subjects: TeacherSubject[];
  students: TeacherStudent[];
}

export interface TeacherQuickLink {
  label: string;
  href: string;
  color: string;
}