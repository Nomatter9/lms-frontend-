export interface ParentChild {
  id: string;
  regNumber?: string;
  gender?: string;
  classId?: string;
  parentId?: string;
  dateOfBirth?: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    avatarUrl?: string | null;
    isActive: boolean;
    isVerified: boolean;
  };
  class?: {
    id: string;
    name: string;
    grade?: {
      id: string;
      label: string;
      level: number;
    };
  };
}

export interface ParentDashboardState {
  children: ParentChild[];
  loading: boolean;
}