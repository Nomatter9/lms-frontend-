export interface LessonForm {
  classSubjectId: string;
  termId: string;
  title: string;
  content: string;
  videoUrl: string;
  weekNumber: string;
  isPublished: boolean;
}

export interface HomeworkForm {
  classSubjectId: string;
  termId: string;
  title: string;
  description: string;
  dueDate: string;
  maxMarks: string;
  isPublished: boolean;
}

export interface AssessmentForm {
  classSubjectId: string;
  termId: string;
  title: string;
  type: 'ca' | 'exam';
  maxMarks: string;
  weightPercent: string;
  date: string;
}