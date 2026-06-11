import { useUserStore } from "@/store/useUserStore";

export const useCurrentUser = () => {
  const user = useUserStore((s) => s.user);
  const role = localStorage.getItem("role") || user?.role || "";
  return { user, role, school: user?.school };
};
