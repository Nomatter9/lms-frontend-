export const resolveAvatarUrl = (avatarUrl?: string | null): string | null => {
  if (!avatarUrl) return null;
  if (avatarUrl.startsWith("blob:") || avatarUrl.startsWith("http")) return avatarUrl;
  return `http://localhost:5000${avatarUrl}`;
};

export const getInitials = (firstName: string, lastName: string): string =>
  `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();