export type UserRole = 'admin' | 'headmaster' | 'teacher' | 'parent' | 'pupil';

export interface User {
  id: string;
  avatarUrl?: string | null;  
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  schoolId: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  
}

export interface School {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  province: string;
  logoUrl?: string;
  isVerified: boolean;
  createdAt: string;
}