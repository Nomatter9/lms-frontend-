export const resolveLogoUrl = (logoUrl?: string | null): string | null => {
  if (!logoUrl) return null;
  if (logoUrl.startsWith("blob:") || logoUrl.startsWith("http")) return logoUrl;
  return `http://localhost:5000${logoUrl}`;
};

