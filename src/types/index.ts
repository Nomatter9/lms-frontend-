export type { User, School, UserRole } from './user';
export type { Grade, AcademicYear, Term, Subject } from './academic';
export type { ClassItem, ClassSubject } from './class';
export type {
  StudentItem,
  StudentUser,
  StudentChild,
  StudentParent,
  StudentClass,
  Parent,
  StudentSubject,
  StudentHomework,
  StudentAssessment,
  StudentDashboardData,
  StudentDashboardState,
} from './student';
export type { StaffMember } from './staffMember';
export type {
  Lesson, Homework, HomeworkSubmission,
  Assessment, AssessmentResult, Attendance,
} from './teaching';
export type {
  HeadmasterStats, HeadmasterStatCard,
  HeadmasterQuickLink, HeadmasterManagementLink,
  HeadmasterOverviewState,
} from './headmaster';
export type {
  TeacherClass, TeacherSubject, TeacherStudent,
  TeacherData, TeacherQuickLink,
} from './teacher';
export type {
  ParentChild, ParentDashboardState,
} from './parent';
