import type { LucideIcon } from "lucide-react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <Icon size={28} className="text-gray-300" />
      </div>
      <p className="font-semibold text-gray-500 text-base">{title}</p>
      {description && (
        <p className="text-sm text-gray-400 mt-1 max-w-xs">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="mt-5 bg-[#6366F1] hover:bg-[#5558E3] text-white rounded-xl gap-2 h-10"
        >
          <Plus size={15} />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
