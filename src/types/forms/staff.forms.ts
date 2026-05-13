export interface StaffForm {
  firstName: string;
  lastName: string;
  email: string;
  classId?: string;
  phone: string;
  role: string;
}

export interface StudentForm {
  avatarUrl?: string | null;  
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  regNumber: string;
  dateOfBirth: string;
  gender: string;
  classId: string;
  parentId: string;
}

export interface ParentForm {
  firstName: string;
  lastName: string;
  email: string;
  schoolId: string;
  phone: string;
}

export interface SchoolProfileForm {
  name: string;
  email: string;
  phone: string;
  address: string;
  province: string;
}