const API_BASE = (import.meta.env.VITE_API_URL as string || "http://localhost:5000/api")
  .replace(/\/api\/?$/, "");

export const resolveLogoUrl = (logoUrl?: string | null): string | null => {
  if (!logoUrl) return null;
  if (logoUrl.startsWith("blob:") || logoUrl.startsWith("http")) return logoUrl;
  return `${API_BASE}${logoUrl}`;
};
