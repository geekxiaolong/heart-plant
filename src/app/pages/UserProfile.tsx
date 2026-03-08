import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, MapPin, Calendar, Heart, MessageCircle, Share2, 
  Loader2, Sparkles, UserCheck, UserPlus, Grid
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { useEmotionalTheme } from '../context/ThemeContext';
import { apiUrl, buildApiHeaders } from '../utils/api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
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

export function UserProfile() {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const { themeConfig } = useEmotionalTheme();
  
  const [moments, setMoments] = useState<Moment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const mountedRef = useRef(true);

  // User info (derived from moments)
  const userName = moments.length > 0 ? moments[0].user : '用户';
  const userAvatar = moments.length > 0 ? moments[0].avatar : 'U';

  useEffect(() => {
    mountedRef.current = true;
    if (userId) {
      loadUserMoments();
      loadFollowStatus();
    }
    
    return () => {
      mountedRef.current = false;
    };
  }, [userId]);

  const loadUserMoments = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const res = await fetch(apiUrl('/moments/user/${userId}'), {
        headers: await buildApiHeaders()
      });

      if (res.ok && mountedRef.current) {
        const data = await res.json();
        setMoments(data);
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
    if (!currentUser || !userId) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(apiUrl('/is-following/${userId}'), {
        headers: await buildApiHeaders()
      });

      if (res.ok && mountedRef.current) {
        const data = await res.json();
        setIsFollowing(data.isFollowing);
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
      const { data: { session } } = await supabase.auth.getSession();
      
      if (isFollowing) {
        // Unfollow
        await fetch(apiUrl('/follow/${userId}'), {
          method: 'DELETE',
          headers: await buildApiHeaders()
        });
        if (mountedRef.current) {
          setIsFollowing(false);
          toast.success('已取消关注');
        }
      } else {
        // Follow
        await fetch(apiUrl('/follow'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-JWT': session?.access_token || '',
            'Authorization': `Bearer ${publicAnonKey}`,
            'apikey': publicAnonKey
          },
          body: JSON.stringify({ targetUserId: userId })
        });
        if (mountedRef.current) {
          setIsFollowing(true);
          toast.success('关注成功 ✨');
        }
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
      const res = await fetch(apiUrl('/moments/${momentId}/like'), {
        method: 'POST',
        headers: await buildApiHeaders()
      });
      
      if (res.ok && mountedRef.current) {
        const updatedMoment = await res.json();
        setMoments(prev => prev.map(m => m.id === momentId ? { ...m, likes: updatedMoment.likes } : m));
        toast.success('已点赞 ❤️');
      }
    } catch (e) {
      console.error('Like error:', e);
    }
  };

  const isOwnProfile = currentUser?.id === userId;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-32">
      {/* Header */}
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
                "px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 flex items-center gap-2",
                isFollowLoading && "opacity-50 cursor-not-allowed",
                isFollowing 
                  ? "bg-gray-100 text-gray-600 hover:bg-gray-200" 
                  : "bg-black text-white hover:bg-gray-900"
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

      {/* User Info Card */}
      <div className="p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[40px] p-8 shadow-sm border border-black/5 relative overflow-hidden"
        >
          {/* Background Decoration */}
          <div 
            className="absolute -right-8 -top-8 w-32 h-32 rounded-full blur-3xl opacity-20"
            style={{ background: `linear-gradient(to bottom right, ${themeConfig.primary}, ${themeConfig.accent})` }}
          />
          
          <div className="relative flex items-start gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-black text-2xl shadow-lg flex-shrink-0">
              {userAvatar}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-2xl font-black tracking-tight mb-1">{userName}</h1>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                @{userName.toLowerCase().replace(/\s+/g, '')}
              </p>
              
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

      {/* Moments Grid */}
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
            <div className="text-center">
              <h3 className="text-xl font-black text-gray-900 mb-2">还没有发表文章</h3>
              <p className="text-sm font-bold text-gray-400">
                {isOwnProfile ? '快去发布第一篇文章吧' : 'TA还没有发布任何内容'}
              </p>
            </div>
            {isOwnProfile && (
              <button
                onClick={() => navigate('/moments')}
                className="px-8 py-4 bg-black text-white rounded-2xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all shadow-xl"
              >
                前往植缘广场
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
                  {/* Time */}
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

                  {/* Content */}
                  <p className="text-sm font-bold leading-relaxed text-gray-700 bg-gray-50/50 p-4 rounded-3xl border border-black/5">
                    {moment.content}
                  </p>

                  {/* Image */}
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

                  {/* Actions */}
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
