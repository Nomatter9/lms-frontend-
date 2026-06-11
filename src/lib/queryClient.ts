import { QueryClient, QueryCache } from "@tanstack/react-query";
import { toast } from "sonner";

const IGNORE_KEYS = new Set(["student/homework", "student/results", "student/attendance", "student/lessons"]);

export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 30, retry: 1 } },
  queryCache: new QueryCache({
    onError: (error: any, query) => {
      const key = String(query.queryKey[0]);
      if (IGNORE_KEYS.has(key)) return;
      const status = error?.response?.status;
      if (status === 401) return; // axiosClient handles 401 globally
      const msg = error?.response?.data?.message || error?.message || "Request failed";
      toast.error(`Failed to load ${key}: ${msg}`);
    },
  }),
});
