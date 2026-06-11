import { useRef, useState } from "react";
import axiosClient from "@/axiosClient";
import { toast } from "sonner";
import { useUserStore } from "@/store/useUserStore";

/**
 * Handles uploading the current user's own avatar to /auth/me/avatar
 * and syncing the result into the Zustand user store.
 */
export function useOwnAvatarUpload() {
  const user    = useUserStore((s) => s.user);
  const setUser = useUserStore((s) => s.setUser);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      const res = await axiosClient.put("/auth/me/avatar", fd, {
        headers: { "Content-Type": undefined },
      });
      const newAvatarUrl = res.data.avatarUrl ?? res.data.user?.avatarUrl;
      if (newAvatarUrl) {
        setUser({ ...user, avatarUrl: newAvatarUrl, avatarUpdatedAt: Date.now() });
        toast.success("Profile photo updated");
      } else {
        toast.error("Upload failed — server did not return a URL");
      }
    } catch {
      toast.error("Failed to upload photo");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return { uploading, fileRef, handleChange };
}
