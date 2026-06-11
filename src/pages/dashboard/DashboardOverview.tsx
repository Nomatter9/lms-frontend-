import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PermissionGate from "@/components/auth/PermissionGate";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import HeadmasterDashboard from "./HeadmasterDashboard";
import TeacherDashboard from "./TeacherDashboard";
import ParentDashboard from "./ParentDashboard";
import StudentDashboard from "./StudentDashboard";

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const ROLE_SUBTITLES: Record<string, string> = {
  admin:      "Welcome to your Administrator Dashboard",
  headmaster: "Welcome to your Headmaster Dashboard",
  teacher:    "Welcome to your Teacher Dashboard",
  parent:     "Welcome to your Parent Dashboard",
  pupil:      "Welcome to your Student Dashboard",
};

export default function DashboardOverview() {
  const { user, role, school } = useCurrentUser();

  return (
    <DashboardLayout
      title={`${getGreeting()}, ${user?.firstName || "there"} 👋`}
      subtitle={ROLE_SUBTITLES[role] ?? "Welcome to your Dashboard"}
    >
      <PermissionGate allowedRoles={["headmaster", "admin"]}>
        <HeadmasterDashboard user={user} school={school} />
      </PermissionGate>

      <PermissionGate allowedRoles={["teacher"]}>
        <TeacherDashboard />
      </PermissionGate>

      <PermissionGate allowedRoles={["parent"]}>
        <ParentDashboard />
      </PermissionGate>

      <PermissionGate allowedRoles={["pupil"]}>
        <StudentDashboard />
      </PermissionGate>
    </DashboardLayout>
  );
}
