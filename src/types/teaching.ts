import type { ClassSubject } from './class';
import type { Term } from './academic';
import type { StudentUser } from './student';

export interface Lesson {
  id: string;
  classSubjectId: string;
  termId: string;
  title: string;
  content?: string;
   dueDate: string
  videoUrl?: string;
  fileUrl?: string;
  maxMarks: string
  weekNumber?: number;
  isPublished: boolean;
  classSubject?: ClassSubject;
  term?: Term;
  createdAt: string;
}

export interface Homework {
  id: string;
  classSubjectId: string;
  termId: string;
  title: string;
  description?: string;
  dueDate: string;
  maxMarks?: number;
  fileUrl?: string;
  isPublished: boolean;
  submissions?: HomeworkSubmission[];
  classSubject?: ClassSubject;
  term?: Term;
  createdAt: string;
}

export interface HomeworkSubmission {
  id: string;
  homeworkId: string;
  pupilId: string;
  fileUrl?: string;
  notes?: string;
  marks?: number;
  feedback?: string;
  submittedAt?: string;
  gradedAt?: string;
  comment?: string;
  pupil?: { firstName?: string; lastName?: string; user?: { firstName?: string; lastName?: string } };
  student?: { firstName?: string; lastName?: string; user?: { firstName?: string; lastName?: string } };
  user?: { firstName?: string; lastName?: string };
  firstName?: string;
  lastName?: string;
}

export interface LessonProgressEntry {
  id: string;
  lessonId?: string;
  pupilId?: string;
  readAt?: string;
  response?: string;
  student?: { firstName?: string; lastName?: string; user?: { firstName?: string; lastName?: string } };
  pupil?: { firstName?: string; lastName?: string; user?: { firstName?: string; lastName?: string } };
  user?: { firstName?: string; lastName?: string };
  firstName?: string;
  lastName?: string;
}

export interface Assessment {
  id: string;
  classSubjectId: string;
  termId: string;
  title: string;
  type: 'ca' | 'exam';
  maxMarks: number;
  weightPercent?: number;
  date?: string;
  results?: AssessmentResult[];
  classSubject?: ClassSubject;
  term?: Term;
}

export interface AssessmentResult {
  id: string;
  assessmentId: string;
  pupilId: string;
  marks: number;
  gradeSymbol?: string;
  remarks?: string;
  student?: StudentUser;
}

export interface Attendance {
  id: string;
  classId: string;
  pupilId: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  notes?: string;
  recordedBy: string;
  student?: StudentUser;
}