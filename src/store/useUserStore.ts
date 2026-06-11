import { create } from "zustand";
import type { StoredUser } from "@/types/user";

interface UserStore {
  user: StoredUser;
  setUser: (user: StoredUser) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: (() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}") as StoredUser; }
    catch { return {} as StoredUser; }
  })(),
  setUser: (user) => {
    localStorage.setItem("user", JSON.stringify(user));
    set({ user });
  },
  clearUser: () => {
    localStorage.removeItem("user");
    set({ user: {} as StoredUser });
  },
}));
