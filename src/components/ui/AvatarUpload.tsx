import { useRef, useState } from "react";
import { Edit2, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveAvatarUrl } from "@/lib/avatar";
import axiosClient from "@/axiosClient";
import { toast } from "sonner";

interface AvatarUploadProps {
  userId: string;
  currentUrl?: string | null;
  initials: string;
  endpoint: string; // e.g. /auth/staff/:id/avatar
  onUpdated?: (newUrl: string) => void;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "w-10 h-10 text-xs",
  md: "w-16 h-16 text-sm",
  lg: "w-24 h-24 text-base",
};

export default function AvatarUpload({
  userId,
  currentUrl,
  initials,
  endpoint,
  onUpdated,
  size = "md",
}: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(resolveAvatarUrl(currentUrl));
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Only images allowed"); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("Max 2MB"); return; }

    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setUploading(true);

    try {
      const fd = new FormData();
      fd.append("avatar", file);
      const res = await axiosClient.put(endpoint.replace(":id", userId), fd);
      const url = `http://localhost:5000${res.data.avatarUrl}`;
      setPreview(url);
      onUpdated?.(res.data.avatarUrl);
      toast.success("Photo updated");
    } catch {
      toast.error("Failed to upload photo");
      setPreview(resolveAvatarUrl(currentUrl));
    } finally {
      setUploading(false);
      URL.revokeObjectURL(localPreview);
    }
  };

  return (
    <div
      className={cn(
        "relative group rounded-2xl flex items-center justify-center cursor-pointer overflow-hidden shrink-0 transition-all",
        sizes[size],
        preview ? "border-0" : "border-2 border-dashed border-gray-200 bg-gray-50 hover:border-[#6366F1] hover:bg-[#6366F1]/5"
      )}
      onClick={() => fileInputRef.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
      }}
    >
      {/* Hidden input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
      />

      {uploading ? (
        <Loader2 size={16} className="animate-spin text-[#6366F1]" />
      ) : preview ? (
        <>
          <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Edit2 size={14} className="text-white" />
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center text-gray-400 group-hover:text-[#6366F1] transition-colors">
          {initials ? (
            <span className="font-bold text-sm leading-none">{initials}</span>
          ) : (
            <Plus size={16} />
          )}
          <span className="text-[9px] font-bold uppercase mt-0.5">Photo</span>
        </div>
      )}
    </div>
  );
}