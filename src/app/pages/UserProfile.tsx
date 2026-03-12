import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Calendar, Heart, MessageCircle, Share2, Loader2, Sparkles, UserCheck, UserPlus, Grid, MapPin } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useEmotionalTheme } from '../context/ThemeContext';
import { apiRequestJson, getStoragePublicUrl } from '../utils/api';
import { parseIsFollowingResponse, syncFollowingCache } from '../utils/follow';
import { getCache, setCache } from '../utils/cache';
import { getProfileCacheKey, getPublicProfilePath, normalizePublicProfile } from '../utils/profile';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

interface Moment {
  id: string;
  userId: string;
  user: string;
  avatar: string;
  content: string;
  image?: string;
  tag: string;
  likes: number;
  comments: number;
  created_at: string;
}

interface UserProfileSummary {
  id?: string;
  name: string;
  avatar: string;
  bio?: string;
  location?: string;
}

interface UserMomentsPayload {
  data?: Moment[];
  items?: Moment[];
  moments?: Moment[];
  profile?: UserProfileSummary | null;
}

function normalizeMomentsPayload(payload: unknown): Moment[] {
  if (Array.isArray(payload)) return payload as Moment[];
  if (Array.isArray((payload as any)?.data)) return (payload as any).data as Moment[];
  if (Array.isArray((payload as any)?.items)) return (payload as any).items as Moment[];
  if (Array.isArray((payload as any)?.moments)) return (payload as any).moments as Moment[];
  return [];
}

function deriveProfileFromMoments(moments: Moment[], userId?: string): UserProfileSummary | null {
  const latest = moments
    .filter(moment => !userId || moment.userId === userId)
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())[0];

  if (!latest) return null;

  return {
    id: userId,
    name: latest.user || '用户',
    avatar: latest.avatar || (latest.user || '用户').slice(0, 1).toUpperCase(),
  };
}

export function UserProfile() {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const { themeConfig } = useEmotionalTheme();

  const [moments, setMoments] = useState<Moment[]>([]);
  const [profile, setProfile] = useState<UserProfileSummary>({ name: '用户', avatar: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    if (userId) {
      loadUserMoments();
      loadFollowStatus();
    }

    return () => {
      mountedRef.current = false;
    };
  }, [userId, currentUser?.id]);

  const loadUserMoments = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const cachedProfile = getCache<UserProfileSummary>(getProfileCacheKey(userId), 5 * 60 * 1000);
      if (cachedProfile && mountedRef.current) {
        setProfile(normalizePublicProfile(userId, cachedProfile));
      }

      let sortedMoments: Moment[] = [];
      let serverProfile: UserProfileSummary | null = null;

      try {
        const payload = await apiRequestJson<UserMomentsPayload | Moment[]>(`/moments/user/${userId}`);
        sortedMoments = [...normalizeMomentsPayload(payload)].sort(
          (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );
        serverProfile = !Array.isArray(payload) ? (payload as UserMomentsPayload)?.profile || null : null;
        if (serverProfile) {
          setCache(getProfileCacheKey(userId), serverProfile);
        }
      } catch (_routeError) {
        const allMoments = normalizeMomentsPayload(await apiRequestJson('/moments'));
        sortedMoments = allMoments
          .filter(moment => String(moment.userId) === String(userId))
          .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      }

      if (mountedRef.current) {
        setMoments(sortedMoments);

        if (currentUser?.id === userId) {
          const selfProfile = normalizePublicProfile(
            userId,
            cachedProfile || {
              name: currentUser.user_metadata?.name,
              avatar: currentUser.user_metadata?.avatar,
              bio: currentUser.user_metadata?.bio,
              location: currentUser.user_metadata?.location,
            },
            currentUser.email?.split('@')[0]
          );
          setProfile(selfProfile);
        } else {
          setProfile(
            normalizePublicProfile(
              userId,
              serverProfile || cachedProfile || deriveProfileFromMoments(sortedMoments, userId),
            )
          );
        }
      }
    } catch (e) {
      console.error('Error loading user moments:', e);
      if (mountedRef.current) {
        toast.error('加载失败，请重试');
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const loadFollowStatus = async () => {
    if (!currentUser || !userId || currentUser.id === userId) {
      if (mountedRef.current) setIsFollowing(false);
      return;
    }

    try {
      const data = await apiRequestJson(`/is-following/${userId}`);
      if (mountedRef.current) {
        setIsFollowing(parseIsFollowingResponse(data));
      }
    } catch (e) {
      console.error('Error loading follow status:', e);
    }
  };

  const handleFollow = async () => {
    if (!currentUser) {
      toast.error('请先登录');
      return;
    }

    if (userId === currentUser.id) {
      toast.error('不能关注自己哦');
      return;
    }

    setIsFollowLoading(true);

    try {
      await apiRequestJson(isFollowing ? `/follow/${userId}` : '/follow', {
        method: isFollowing ? 'DELETE' : 'POST',
        body: isFollowing ? undefined : { targetUserId: userId }
      });

      if (currentUser?.id) {
        syncFollowingCache(currentUser.id, userId, !isFollowing, {
          name: userName,
          avatar: profile.avatar,
        });
      }

      if (mountedRef.current) {
        setIsFollowing(!isFollowing);
        toast.success(isFollowing ? '已取消关注' : '关注成功 ✨');
      }
    } catch (e) {
      console.error('Follow error:', e);
      if (mountedRef.current) {
        toast.error('操作失败，请重试');
      }
    } finally {
      if (mountedRef.current) {
        setIsFollowLoading(false);
      }
    }
  };

  const handleLike = async (momentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updatedMoment = await apiRequestJson<Moment>(`/moments/${momentId}/like`, {
        method: 'POST'
      });

      if (mountedRef.current) {
        setMoments(prev => prev.map(m => m.id === momentId ? { ...m, likes: updatedMoment.likes } : m));
        toast.success('已点赞 ❤️');
      }
    } catch (e) {
      console.error('Like error:', e);
    }
  };

  const isOwnProfile = currentUser?.id === userId;
  const userName = profile.name || '用户';
  const avatarSource = getStoragePublicUrl(profile.avatar);
  const avatarFallbackText = (userName || 'U').slice(0, 1).toUpperCase();
  const avatarLooksLikeUrl = /^https?:\/\//.test(avatarSource) || avatarSource.startsWith('data:') || avatarSource.startsWith('blob:');

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-32">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/5">
        <div className="flex items-center justify-between p-6">
          <button
            onClick={() => navigate(-1)}
            className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-900 active:scale-95 transition-all"
          >
            <ChevronLeft size={24} />
          </button>

          {!isOwnProfile && currentUser && (
            <button
              onClick={handleFollow}
              disabled={isFollowLoading}
              className={cn(
                'px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 flex items-center gap-2',
                isFollowLoading && 'opacity-50 cursor-not-allowed',
                isFollowing
                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  : 'bg-black text-white hover:bg-gray-900'
              )}
            >
              {isFollowLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : isFollowing ? (
                <>
                  <UserCheck size={14} />
                  已关注
                </>
              ) : (
                <>
                  <UserPlus size={14} />
                  关注
                </>
              )}
            </button>
          )}
        </div>
      </header>

      <div className="p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[40px] p-8 shadow-sm border border-black/5 relative overflow-hidden"
        >
          <div
            className="absolute -right-8 -top-8 w-32 h-32 rounded-full blur-3xl opacity-20"
            style={{ background: `linear-gradient(to bottom right, ${themeConfig.primary}, ${themeConfig.accent})` }}
          />

          <div className="relative flex items-start gap-6">
            <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-black text-2xl shadow-lg flex-shrink-0 overflow-hidden">
              {avatarLooksLikeUrl ? (
                <img src={avatarSource} alt={userName} className="w-full h-full object-cover" />
              ) : (
                avatarFallbackText
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-2xl font-black tracking-tight mb-1">{userName}</h1>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                @{userName.toLowerCase().replace(/\s+/g, '')}
              </p>

              {profile.bio && (
                <p className="text-sm font-bold text-gray-500 mb-3">{profile.bio}</p>
              )}

              {profile.location && (
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 mb-4">
                  <MapPin size={12} />
                  <span>{profile.location}</span>
                </div>
              )}

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Grid size={14} className="text-gray-400" />
                  <span className="text-sm font-black">{moments.length}</span>
                  <span className="text-xs font-bold text-gray-400">篇文章</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="px-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black tracking-tight">发表的文章</h2>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 size={40} className="animate-spin text-gray-400" />
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">加载中...</p>
          </div>
        ) : moments.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 gap-6"
          >
            <div className="w-24 h-24 rounded-[32px] bg-gray-100 flex items-center justify-center">
              <Sparkles size={40} className="text-gray-300" />
            </div>
            <div className="text-center max-w-sm">
              <h3 className="text-xl font-black text-gray-900 mb-2">还没有发表文章</h3>
              <p className="text-sm font-bold text-gray-400">
                {isOwnProfile ? '快去发布第一篇文章吧' : `${userName} 还没有发布任何内容`}
              </p>
              {!isOwnProfile && (profile.bio || profile.location) && (
                <p className="text-xs font-medium text-gray-300 mt-3 leading-relaxed">
                  先看看资料卡吧，等 TA 发布内容后，这里会展示最新动态。
                </p>
              )}
            </div>
            {isOwnProfile ? (
              <button
                onClick={() => navigate('/moments')}
                className="px-8 py-4 bg-black text-white rounded-2xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all shadow-xl"
              >
                前往植缘广场
              </button>
            ) : (
              <button
                onClick={() => navigate(getPublicProfilePath(currentUser?.id))}
                className="px-8 py-4 bg-white text-gray-900 rounded-2xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all shadow-sm border border-black/5"
              >
                返回我的主页
              </button>
            )}
          </motion.div>
        ) : (
          <div className="flex flex-col gap-6">
            <AnimatePresence mode="popLayout">
              {moments.map((moment, index) => (
                <motion.article
                  key={moment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-[40px] overflow-hidden shadow-sm border border-black/5 flex flex-col gap-6 p-8"
                >
                  <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <Calendar size={12} />
                    {new Date(moment.created_at).toLocaleString('zh-CN', {
                      hour12: false,
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>

                  <p className="text-sm font-bold leading-relaxed text-gray-700 bg-gray-50/50 p-4 rounded-3xl border border-black/5">
                    {moment.content}
                  </p>

                  {moment.image && (
                    <div className="relative aspect-video rounded-[32px] overflow-hidden group">
                      <ImageWithFallback
                        src={moment.image}
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                      />
                      <div className="absolute top-6 left-6">
                        <span className="bg-black/40 backdrop-blur-xl text-white text-[10px] px-4 py-1.5 rounded-2xl font-black uppercase tracking-widest border border-white/20">
                          {moment.tag}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-8">
                      <button
                        onClick={(e) => handleLike(moment.id, e)}
                        className="flex items-center gap-2 active:scale-90 transition-all group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-500 flex items-center justify-center group-hover:bg-pink-500 group-hover:text-white transition-colors">
                          <Heart size={20} />
                        </div>
                        <span className="text-sm font-black">{moment.likes || 0}</span>
                      </button>
                      <div className="flex items-center gap-2 text-gray-900">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                          <MessageCircle size={20} />
                        </div>
                        <span className="text-sm font-black">{moment.comments || 0}</span>
                      </div>
                    </div>
                    <button className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-all active:rotate-12">
                      <Share2 size={18} />
                    </button>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
