import { getCache, setCache } from './cache';

export interface NormalizedFollowingUser {
  targetUserId: string;
  followerId?: string;
  followerName: string;
  followerAvatar: string;
  timestamp: string;
  raw?: Record<string, any>;
}

export interface FollowTargetProfile {
  name?: string;
  avatar?: string;
}

const FOLLOWING_EVENT = 'heartplant:following-updated';

function asObject(value: unknown): Record<string, any> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, any>
    : null;
}

function asString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function asBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return ['true', '1', 'yes', 'following', 'followed'].includes(normalized);
  }
  return false;
}

export function parseIsFollowingResponse(payload: unknown): boolean {
  if (typeof payload === 'boolean') return payload;

  const data = asObject(payload);
  if (!data) return false;

  return asBoolean(
    data.isFollowing ?? data.following ?? data.followed ?? data.data?.isFollowing ?? data.data?.following
  );
}

function normalizeFollowingItem(item: unknown): NormalizedFollowingUser | null {
  const data = asObject(item);
  if (!data) return null;

  const targetUserId = asString(
    data.targetUserId,
    data.followingId,
    data.followedUserId,
    data.userId,
    data.id,
    data.target?.id,
    data.user?.id
  );

  if (!targetUserId) return null;

  return {
    targetUserId,
    followerId: asString(data.followerId, data.currentUserId, data.ownerId),
    followerName: asString(
      data.targetUserName,
      data.targetName,
      data.followingName,
      data.followedUserName,
      data.userName,
      data.username,
      data.name,
      data.followerName,
      data.target?.name,
      data.user?.name
    ) || '匿名用户',
    followerAvatar: asString(
      data.targetUserAvatar,
      data.targetAvatar,
      data.followingAvatar,
      data.followedUserAvatar,
      data.userAvatar,
      data.avatar,
      data.followerAvatar,
      data.target?.avatar,
      data.user?.avatar
    ),
    timestamp: asString(data.timestamp, data.createdAt, data.created_at, data.updatedAt) || new Date(0).toISOString(),
    raw: data,
  };
}

export function normalizeFollowingListResponse(payload: unknown): NormalizedFollowingUser[] {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as any)?.data)
      ? (payload as any).data
      : Array.isArray((payload as any)?.items)
        ? (payload as any).items
        : Array.isArray((payload as any)?.following)
          ? (payload as any).following
          : [];

  return list
    .map(normalizeFollowingItem)
    .filter((item): item is NormalizedFollowingUser => Boolean(item));
}

export function getFollowingListCacheKey(userId: string) {
  return `following_${userId}`;
}

export function getFollowingMapCacheKey(userId: string) {
  return `following_map_${userId}`;
}

function emitFollowingUpdate(userId: string, followingList: NormalizedFollowingUser[]) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(FOLLOWING_EVENT, {
    detail: {
      userId,
      followingList,
      followingCount: followingList.length,
    }
  }));
}

export function syncFollowingCache(
  currentUserId: string,
  targetUserId: string,
  isFollowing: boolean,
  profile?: FollowTargetProfile,
) {
  const listKey = getFollowingListCacheKey(currentUserId);
  const mapKey = getFollowingMapCacheKey(currentUserId);

  const previousList = getCache<NormalizedFollowingUser[]>(listKey, Number.MAX_SAFE_INTEGER) || [];
  const previousMap = getCache<Record<string, boolean>>(mapKey, Number.MAX_SAFE_INTEGER) || {};

  let nextList = previousList.filter(item => item.targetUserId !== targetUserId);
  if (isFollowing) {
    nextList = [
      {
        targetUserId,
        followerName: profile?.name?.trim() || nextList.find(item => item.targetUserId === targetUserId)?.followerName || '匿名用户',
        followerAvatar: profile?.avatar?.trim() || nextList.find(item => item.targetUserId === targetUserId)?.followerAvatar || '',
        timestamp: new Date().toISOString(),
      },
      ...nextList,
    ];
  }

  const nextMap = {
    ...previousMap,
    [targetUserId]: isFollowing,
  };

  setCache(listKey, nextList);
  setCache(mapKey, nextMap);
  emitFollowingUpdate(currentUserId, nextList);

  return {
    followingList: nextList,
    followingMap: nextMap,
    followingCount: nextList.length,
  };
}

export function subscribeFollowingUpdates(handler: (event: CustomEvent<any>) => void) {
  if (typeof window === 'undefined') return () => {};

  const wrapped = (event: Event) => handler(event as CustomEvent<any>);
  window.addEventListener(FOLLOWING_EVENT, wrapped);
  return () => window.removeEventListener(FOLLOWING_EVENT, wrapped);
}
