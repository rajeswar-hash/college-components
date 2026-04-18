const PROFILE_AVATAR_IDS = [
  "avatar-1",
  "avatar-2",
  "avatar-3",
  "avatar-4",
  "avatar-6",
  "avatar-7",
  "avatar-8",
  "avatar-9",
  "avatar-10",
] as const;

export const PROFILE_AVATARS = PROFILE_AVATAR_IDS.map((id) => ({
  id,
  url: getAvatarAssetUrl(id),
}));

export function getBuiltInAvatarUrls() {
  return PROFILE_AVATAR_IDS.map((id) => getAvatarAssetUrl(id));
}

export function getAvatarAssetUrl(id: string) {
  const relativePath = `${import.meta.env.BASE_URL}avatars/${id}.jpg`;
  if (typeof window === "undefined") return relativePath;
  return new URL(relativePath, window.location.origin).toString();
}

export function extractBuiltInAvatarId(value?: string | null) {
  if (!value) return null;
  if ((PROFILE_AVATAR_IDS as readonly string[]).includes(value)) return value;

  const match = value.match(/avatar-\d+/i);
  return match ? match[0].toLowerCase() : null;
}

export function getAvatarStorageValue(value?: string | null) {
  const builtInAvatarId = extractBuiltInAvatarId(value);
  if (builtInAvatarId) return builtInAvatarId;
  return value?.trim() || "";
}

export function getDefaultAvatarUrl(name?: string | null, email?: string | null) {
  const seed = `${name || ""}${email || ""}`;
  const index =
    Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0) % PROFILE_AVATARS.length;
  return PROFILE_AVATARS[index]?.url || PROFILE_AVATARS[0].url;
}

export function resolveAvatarUrl(value?: string | null, name?: string | null, email?: string | null) {
  const builtInAvatarId = extractBuiltInAvatarId(value);
  if (builtInAvatarId) return getAvatarAssetUrl(builtInAvatarId);

  if (value && /^(https?:|data:|blob:)/i.test(value)) return value;

  return getDefaultAvatarUrl(name, email);
}
