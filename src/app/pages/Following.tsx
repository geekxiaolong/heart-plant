import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, UserMinus, MapPin, Calendar, Heart, Loader2, UserX, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { useEmotionalTheme } from '../context/ThemeContext';
import { apiUrl, buildApiHeaders } from '../utils/api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/cn';

interface FollowingUser {
  followerId: string;
  followerName: string;
  followerAvatar: string;
  targetUserId: string;
  timestamp: string;
}

export function Following() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { themeConfig } = useEmotionalTheme();
  const [followingList, setFollowingList] = useState<FollowingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unfollowingIds, setUnfollowingIds] = useState<Set<string>>(new Set());
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    loadFollowing();
    
    return () => {
      mountedRef.current = false;
    };
  }, [user]);

  const loadFollowing = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(apiUrl('/following'), {
        headers: await buildApiHeaders()
      });

      if (res.ok && mountedRef.current) {
        const data = await res.json();
        setFollowingList(data);
      }
    } catch (e) {
      console.error('Error loading following list:', e);
      if (mountedRef.current) {
        toast.error('加载失败，请重试');
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleUnfollow = async (targetUserId: string) => {
    setUnfollowingIds(prev => new Set(prev).add(targetUserId));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch(apiUrl('/follow/${targetUserId}'), {
        method: 'DELETE',
        headers: await buildApiHeaders()
      });

      if (res.ok && mountedRef.current) {
        // Remove from list
        setFollowingList(prev => prev.filter(f => f.targetUserId !== targetUserId));
        toast.success('已取消关注');
      }
    } catch (e) {
      console.error('Unfollow error:', e);
      if (mountedRef.current) {
        toast.error('操作失败，请重试');
      }
    } finally {
      if (mountedRef.current) {
        setUnfollowingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(targetUserId);
          return newSet;
        });
      }
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '今天关注';
    if (diffDays === 1) return '昨天关注';
    if (diffDays < 7) return `${diffDays}天前`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}个月前`;
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/5">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-900 active:scale-95 transition-all"
            >
              <ChevronLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-black tracking-tight">我的关注</h1>
              <p className="text-xs font-bold text-gray-400 mt-0.5">
                {followingList.length} 位好友
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 size={40} className="animate-spin text-gray-400" />
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">加载中...</p>
          </div>
        ) : followingList.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 gap-6"
          >
            <div className="w-24 h-24 rounded-[32px] bg-gray-100 flex items-center justify-center">
              <UserX size={40} className="text-gray-300" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-black text-gray-900 mb-2">还没有关注任何人</h3>
              <p className="text-sm font-bold text-gray-400 max-w-xs">
                去广场看看，关注感兴趣的植物主人吧
              </p>
            </div>
            <button
              onClick={() => navigate('/moments')}
              className="px-8 py-4 bg-black text-white rounded-2xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all shadow-xl"
            >
              前往植缘广场
            </button>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-4">
            <AnimatePresence mode="popLayout">
              {followingList.map((followUser, index) => (
                <motion.div
                  key={followUser.targetUserId}
                  layoutId={followUser.targetUserId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100, height: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-[32px] p-6 shadow-sm border border-black/5 flex items-center justify-between gap-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Avatar */}
                    <button
                      onClick={() => navigate(`/user/${followUser.targetUserId}`)}
                      className="w-16 h-16 rounded-[24px] overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-black text-xl shadow-lg flex-shrink-0 active:scale-95 transition-all cursor-pointer"
                    >
                      {followUser.followerAvatar ? (
                        followUser.followerAvatar.startsWith('storage:') ? (
                          <img 
                            src={`https://${projectId}.supabase.co/storage/v1/object/public/make-4b732228-plants/${followUser.followerAvatar.replace('storage:', '')}`}
                            className="w-full h-full object-cover"
                            alt={followUser.followerName}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const parent = e.currentTarget.parentElement;
                              if (parent) parent.textContent = followUser.followerName?.charAt(0).toUpperCase() || 'U';
                            }}
                          />
                        ) : (
                          <img 
                            src={followUser.followerAvatar}
                            className="w-full h-full object-cover"
                            alt={followUser.followerName}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const parent = e.currentTarget.parentElement;
                              if (parent) parent.textContent = followUser.followerName?.charAt(0).toUpperCase() || 'U';
                            }}
                          />
                        )
                      ) : (
                        followUser.followerName?.charAt(0).toUpperCase() || 'U'
                      )}
                    </button>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-black tracking-tight truncate">
                        {followUser.followerName || '匿名用户'}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-xs font-bold text-gray-400">
                        <Calendar size={12} />
                        <span>{formatDate(followUser.timestamp)}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 font-medium">
                        ID: {followUser.targetUserId.slice(0, 8)}...
                      </p>
                    </div>
                  </div>

                  {/* Unfollow Button */}
                  <button
                    onClick={() => handleUnfollow(followUser.targetUserId)}
                    disabled={unfollowingIds.has(followUser.targetUserId)}
                    className={cn(
                      "px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 flex-shrink-0",
                      unfollowingIds.has(followUser.targetUserId)
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-red-50 text-red-500 hover:bg-red-100 active:scale-95"
                    )}
                  >
                    {unfollowingIds.has(followUser.targetUserId) ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <UserMinus size={14} />
                    )}
                    <span className="hidden sm:inline">
                      {unfollowingIds.has(followUser.targetUserId) ? '处理中' : '取消'}
                    </span>
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Bottom Action */}
      {followingList.length > 0 && (
        <div className="fixed bottom-24 left-0 right-0 p-6">
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="bg-white/90 backdrop-blur-xl rounded-[32px] p-6 shadow-2xl border border-black/10 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: `linear-gradient(to bottom right, ${themeConfig.primary}, ${themeConfig.accent})` }}
              >
                <Heart size={20} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-black">共{followingList.length}位好友</p>
                <p className="text-xs font-bold text-gray-400">持续互动，共同成长</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/moments')}
              className="px-6 py-3 bg-black text-white rounded-2xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all shadow-xl"
            >
              发现更多
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}