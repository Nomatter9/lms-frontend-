import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';

// ─── Auth ─────────────────────────────────────────────────────
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';
import VerifyEmailPage from '@/pages/auth/VerifyEmailPage';

// ─── Shared Dashboard ─────────────────────────────────────────
import DashboardOverview from '@/pages/dashboard/DashboardOverview';

// ─── Headmaster / Admin ───────────────────────────────────────
import StaffPage from '@/pages/dashboard/StaffPage';
import ParentsPage from '@/pages/dashboard/ParentsPage';
import StudentsPage from '@/pages/dashboard/StudentsPage';
import ClassesPage from '@/pages/dashboard/ClassesPage';
import SubjectsPage from '@/pages/dashboard/SubjectsPage';
import GradesPage from '@/pages/dashboard/GradesPage';
import AcademicYearsPage from '@/pages/dashboard/AcademicYearsPage';
import SchoolProfilePage from '@/pages/dashboard/SchoolProfilePage';

// ─── Teacher ──────────────────────────────────────────────────
import TeacherStudentsPage from '@/pages/teacher/TeacherStudentsPage';
import TeacherLessonsPage from '@/pages/teacher/TeacherLessonsPage';
import TeacherHomeworkPage from '@/pages/teacher/TeacherHomeworkPage';
import TeacherAttendancePage from '@/pages/teacher/TeacherAttendancePage';
import TeacherAssessmentsPage from '@/pages/teacher/TeacherAssessmentsPage';

// ─── Student ──────────────────────────────────────────────────
import StudentSubjectsPage from '@/pages/student/StudentSubjectsPage';
import StudentHomeworkPage from '@/pages/student/StudentHomeworkPage';
import StudentResultsPage from '@/pages/student/StudentResultsPage';
import StudentAttendancePage from '@/pages/student/StudentAttendancePage';

// ─── Parent ───────────────────────────────────────────────────
import ParentChildrenPage from '@/pages/parent/ParentChildrenPage';

// ─── Role Constants ───────────────────────────────────────────
const ADMIN_ROLES = ['admin', 'headmaster'];
const TEACHER_ROLES = ['teacher'];
const STUDENT_ROLES = ['pupil'];
const PARENT_ROLES = ['parent'];

// ─── Route Guards ─────────────────────────────────────────────
function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: ReactNode;
  allowedRoles?: string[];
}) {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(role || "")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7FE]">
        <div className="text-center space-y-2">
          <p className="text-2xl font-black text-gray-800">Access Denied</p>
          <p className="text-gray-400 text-sm">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function GuestRoute({ children }: { children: ReactNode }) {
  const token = localStorage.getItem('token');
  if (token) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── Root ── */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* ── Auth ── */}
        <Route path="/login"           element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register"        element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
        <Route path="/reset-password"  element={<ResetPasswordPage />} />
        <Route path="/verify-email"    element={<VerifyEmailPage />} />

        {/* ── Unified Dashboard — all roles ── */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardOverview />
          </ProtectedRoute>
        } />

        {/* ── Headmaster / Admin only ── */}
        <Route path="/dashboard/staff" element={
          <ProtectedRoute allowedRoles={ADMIN_ROLES}><StaffPage /></ProtectedRoute>
        } />
        <Route path="/dashboard/parents" element={
          <ProtectedRoute allowedRoles={ADMIN_ROLES}><ParentsPage /></ProtectedRoute>
        } />
        <Route path="/dashboard/students" element={
          <ProtectedRoute allowedRoles={ADMIN_ROLES}><StudentsPage /></ProtectedRoute>
        } />
        <Route path="/dashboard/classes" element={
          <ProtectedRoute allowedRoles={ADMIN_ROLES}><ClassesPage /></ProtectedRoute>
        } />
        <Route path="/dashboard/subjects" element={
          <ProtectedRoute allowedRoles={ADMIN_ROLES}><SubjectsPage /></ProtectedRoute>
        } />
        <Route path="/dashboard/grades" element={
          <ProtectedRoute allowedRoles={ADMIN_ROLES}><GradesPage /></ProtectedRoute>
        } />
        <Route path="/dashboard/academicYear" element={
          <ProtectedRoute allowedRoles={ADMIN_ROLES}><AcademicYearsPage /></ProtectedRoute>
        } />
        <Route path="/dashboard/school" element={
          <ProtectedRoute allowedRoles={ADMIN_ROLES}><SchoolProfilePage /></ProtectedRoute>
        } />

        {/* ── Teacher only ── */}
        <Route path="/dashboard/teacher/students" element={
          <ProtectedRoute allowedRoles={TEACHER_ROLES}><TeacherStudentsPage /></ProtectedRoute>
        } />
        <Route path="/dashboard/teacher/lessons" element={
          <ProtectedRoute allowedRoles={TEACHER_ROLES}><TeacherLessonsPage /></ProtectedRoute>
        } />
        <Route path="/dashboard/teacher/homework" element={
          <ProtectedRoute allowedRoles={TEACHER_ROLES}><TeacherHomeworkPage /></ProtectedRoute>
        } />
        <Route path="/dashboard/teacher/attendance" element={
          <ProtectedRoute allowedRoles={TEACHER_ROLES}><TeacherAttendancePage /></ProtectedRoute>
        } />
        <Route path="/dashboard/teacher/assessments" element={
          <ProtectedRoute allowedRoles={TEACHER_ROLES}><TeacherAssessmentsPage /></ProtectedRoute>
        } />

        {/* ── Student only ── */}
        <Route path="/dashboard/student/subjects" element={
          <ProtectedRoute allowedRoles={STUDENT_ROLES}><StudentSubjectsPage /></ProtectedRoute>
        } />
        <Route path="/dashboard/student/homework" element={
          <ProtectedRoute allowedRoles={STUDENT_ROLES}><StudentHomeworkPage /></ProtectedRoute>
        } />
        <Route path="/dashboard/student/results" element={
          <ProtectedRoute allowedRoles={STUDENT_ROLES}><StudentResultsPage /></ProtectedRoute>
        } />
        <Route path="/dashboard/student/attendance" element={
          <ProtectedRoute allowedRoles={STUDENT_ROLES}><StudentAttendancePage /></ProtectedRoute>
        } />

        {/* ── Parent only ── */}
        <Route path="/dashboard/parent/children" element={
          <ProtectedRoute allowedRoles={PARENT_ROLES}><ParentChildrenPage /></ProtectedRoute>
        } />

        {/* ── 404 ── */}
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center bg-[#060D1F]">
            <div className="text-center space-y-2">
              <p className="text-6xl font-black text-white">404</p>
              <p className="text-gray-400">Page not found</p>
            </div>
          </div>
        } />

      </Routes>
    </BrowserRouter>
  );
}