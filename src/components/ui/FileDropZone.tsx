import { useState } from "react";
import { Upload, X, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileDropZoneProps {
  value: File | null;
  onChange: (file: File | null) => void;
  existingUrl?: string | null;
  existingLabel?: string;
  accept?: string;
  maxMB?: number;
  accentColor?: string;
}

export default function FileDropZone({
  value,
  onChange,
  existingUrl,
  existingLabel = "View current file",
  accept = ".pdf,.doc,.docx,.jpg,.png",
  maxMB = 10,
  accentColor = "emerald",
}: FileDropZoneProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleFile = (file: File) => {
    if (file.size > maxMB * 1024 * 1024) {
      alert(`Max file size is ${maxMB}MB`);
      return;
    }
    onChange(file);
  };

  const colorMap: Record<string, string> = {
    emerald: "border-emerald-400 bg-emerald-50",
    amber:   "border-amber-400 bg-amber-50",
    indigo:  "border-indigo-400 bg-indigo-50",
    rose:    "border-rose-400 bg-rose-50",
  };

  const hoverColor = colorMap[accentColor] || colorMap.emerald;

  return (
    <div className="space-y-2">
      <label
        className={cn(
          "relative flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all text-center",
          dragActive
            ? hoverColor
            : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100",
          value && "border-solid border-gray-300 bg-white"
        )}
        onDragOver={e => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={e => { e.preventDefault(); setDragActive(false); }}
        onDrop={e => {
          e.preventDefault();
          setDragActive(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
      >
        <input
          type="file"
          className="hidden"
          accept={accept}
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />

        {value ? (
          <div className="flex items-center gap-3 w-full">
            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
              <FileText size={16} className="text-gray-500" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold text-gray-800 truncate">{value.name}</p>
              <p className="text-xs text-gray-400">{(value.size / 1024).toFixed(0)} KB</p>
            </div>
            <button
              type="button"
              onClick={e => { e.preventDefault(); onChange(null); }}
              className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center hover:bg-rose-100 hover:text-rose-500 transition-colors shrink-0"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <>
            <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center">
              <Upload size={18} className="text-gray-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">
                {dragActive ? "Drop file here" : "Drag & drop or click to upload"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {accept.replace(/\./g, "").toUpperCase().split(",").join(", ")} · max {maxMB}MB
              </p>
            </div>
          </>
        )}
      </label>

      {/* Existing file link */}
      {existingUrl && !value && (
        <a
          href={existingUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-blue-600 hover:underline ml-1 flex items-center gap-1"
        >
          <FileText size={11} /> {existingLabel}
        </a>
      )}
    </div>
  );
}