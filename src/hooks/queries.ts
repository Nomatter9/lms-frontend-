import { useQuery } from "@tanstack/react-query";
import axiosClient from "@/axiosClient";
import type {
  Grade, AcademicYear, Term, Subject,
  ClassItem, StaffMember, Parent, StudentItem,
  Lesson, Homework, Assessment, Attendance,
  TeacherClass, TeacherSubject,
  StudentSubject, StudentAssessment,
  ParentChild,
} from "@/types";

// ─── Admin / headmaster ───────────────────────────────────────

export const useGrades = () =>
  useQuery({
    queryKey: ["grades"],
    queryFn: () => axiosClient.get("/grades").then((r) => r.data as Grade[]),
  });

export const useAcademicYears = () =>
  useQuery({
    queryKey: ["academicYears"],
    queryFn: () => axiosClient.get("/academicYear").then((r) => r.data as AcademicYear[]),
  });

export const useSubjects = () =>
  useQuery({
    queryKey: ["subjects"],
    queryFn: () => axiosClient.get("/subjects").then((r) => r.data as Subject[]),
  });

export const useClasses = () =>
  useQuery({
    queryKey: ["classes"],
    queryFn: () => axiosClient.get("/classes").then((r) => r.data as ClassItem[]),
  });

export const useStaff = () =>
  useQuery({
    queryKey: ["staff"],
    queryFn: () => axiosClient.get("/auth/staff").then((r) => r.data as StaffMember[]),
  });

export const useParents = () =>
  useQuery({
    queryKey: ["parents"],
    queryFn: () => axiosClient.get("/auth/parents").then((r) => r.data as Parent[]),
  });

export const useStudents = () =>
  useQuery({
    queryKey: ["students"],
    queryFn: () => axiosClient.get("/students").then((r) => r.data as StudentItem[]),
  });

// ─── Shared ───────────────────────────────────────────────────

export const useTerms = () =>
  useQuery({
    queryKey: ["terms"],
    queryFn: () => axiosClient.get("/terms").then((r) => r.data as Term[]),
  });

// ─── Teacher ──────────────────────────────────────────────────

export const useTeacherSubjects = () =>
  useQuery({
    queryKey: ["teacher/subjects"],
    queryFn: () => axiosClient.get("/teacher/subjects").then((r) => r.data as TeacherSubject[]),
  });

export const useTeacherClasses = () =>
  useQuery({
    queryKey: ["teacher/classes"],
    queryFn: () => axiosClient.get("/teacher/classes").then((r) => r.data as TeacherClass[]),
  });

export const useTeacherLessons = () =>
  useQuery({
    queryKey: ["teacher/lessons"],
    queryFn: () => axiosClient.get("/teacher/lessons").then((r) => r.data as Lesson[]),
  });

export const useTeacherHomework = () =>
  useQuery({
    queryKey: ["teacher/homework"],
    queryFn: () => axiosClient.get("/teacher/homework").then((r) => r.data as Homework[]),
  });

export const useTeacherAssessments = () =>
  useQuery({
    queryKey: ["teacher/assessments"],
    queryFn: () => axiosClient.get("/teacher/assessments").then((r) => r.data as Assessment[]),
  });

// ─── Student ──────────────────────────────────────────────────

export const useStudentSubjects = () =>
  useQuery({
    queryKey: ["student/subjects"],
    queryFn: () => axiosClient.get("/students/me/subjects").then((r) => r.data as StudentSubject[]),
  });

export const useStudentLessons = () =>
  useQuery({
    queryKey: ["student/lessons"],
    queryFn: () => axiosClient.get("/students/me/lessons").then((r) => r.data as Lesson[]),
  });

export const useStudentHomework = () =>
  useQuery({
    queryKey: ["student/homework"],
    queryFn: () => axiosClient.get("/students/me/homework").then((r) => r.data as Homework[]),
  });

export const useStudentResults = () =>
  useQuery({
    queryKey: ["student/results"],
    queryFn: () => axiosClient.get("/students/me/results").then((r) => r.data as StudentAssessment[]),
  });

export const useStudentAttendance = () =>
  useQuery({
    queryKey: ["student/attendance"],
    queryFn: () => axiosClient.get("/students/me/attendance").then((r) => r.data as Attendance[]),
  });

// ─── Parent ───────────────────────────────────────────────────

export const useParentChildren = (userId: string) =>
  useQuery({
    queryKey: ["parent/children", userId],
    queryFn: () => axiosClient.get(`/students?parentId=${userId}`).then((r) => r.data as ParentChild[]),
    enabled: !!userId,
  });
