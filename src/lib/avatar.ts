const API_BASE = (import.meta.env.VITE_API_URL as string || "http://localhost:5000/api")
  .replace(/\/api\/?$/, "");

export const resolveAvatarUrl = (avatarUrl?: string | null): string | null => {
  if (!avatarUrl) return null;
  if (avatarUrl.startsWith("blob:") || avatarUrl.startsWith("http")) return avatarUrl;
  return `${API_BASE}${avatarUrl}`;
};

export const getInitials = (firstName: string, lastName: string): string =>
  `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

/** Build the final <img src> for a stored user object, with cache-busting. */
export const getUserAvatarSrc = (user: { avatarUrl?: string | null; avatarUpdatedAt?: number } | null | undefined): string | null => {
  const url = resolveAvatarUrl(user?.avatarUrl);
  if (!url) return null;
  return `${url}?t=${user?.avatarUpdatedAt || 0}`;
};