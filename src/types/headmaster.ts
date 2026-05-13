import type { AcademicYear, Term } from './academic';

export interface HeadmasterStats {
  staff: number;
  students: number;
  classes: number;
  subjects: number;
    grades: number;    
  parents: number; 
}

export interface HeadmasterStatCard {
  label: string;
  key: keyof HeadmasterStats;
  singular: string;
  plural: string;
  bg: string;
  value: number;
}

export interface HeadmasterQuickLink {
  label: string;
  href: string;
  color: string;
}

export interface HeadmasterManagementLink {
  label: string;
  desc: string;
  href: string;
  gradient: string;
}

export interface HeadmasterOverviewState {
  stats: HeadmasterStats;
  currentYear: AcademicYear | null;
  currentTerm: Term | null;
  loading: boolean;
}