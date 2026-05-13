export const useCurrentUser = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const role = localStorage.getItem("role") || user?.role || "";
    return { user, role, school: user?.school };
  } catch {
    return { user: {}, role: "", school: null };
  }
};