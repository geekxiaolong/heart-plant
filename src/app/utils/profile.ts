export interface PublicProfileData {
  id?: string;
  name?: string;
  avatar?: string;
  bio?: string;
  location?: string;
}

export function getPublicProfilePath(userId?: string | null) {
  const normalizedUserId = String(userId || '').trim();
  return normalizedUserId ? `/u/${normalizedUserId}` : '/profile';
}

export function getProfileCacheKey(userId?: string | null) {
  return `profile_${String(userId || '').trim()}`;
}

export function normalizePublicProfile(
  userId?: string | null,
  profile?: PublicProfileData | null,
  fallbackName?: string | null,
): Required<Pick<PublicProfileData, 'name' | 'avatar' | 'bio' | 'location'>> & { id?: string } {
  const safeName = String(profile?.name || fallbackName || '').trim() || (userId ? `用户${String(userId).slice(0, 6)}` : '用户');

  return {
    id: profile?.id || String(userId || '').trim() || undefined,
    name: safeName,
    avatar: String(profile?.avatar || '').trim(),
    bio: String(profile?.bio || '').trim(),
    location: String(profile?.location || '').trim(),
  };
}
