import type { UserRole } from './user';

export interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  classId?: string;
  avatarUrl?: string | null;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  class?: {
    id: string;
    name: string;
    grade?: { label: string };
  };
}