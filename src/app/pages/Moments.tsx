import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, MessageCircle, Share2, MoreHorizontal, Sparkles, Filter, Plus, 
  TrendingUp, Award, Calendar, ChevronRight, BarChart3, Users, Search, X,
  Camera, Image as ImageIcon, Loader2, Send, UserPlus, UserCheck, Leaf
} from 'lucide-react';
import { useEmotionalTheme } from '../context/ThemeContext';
import { cn } from '../utils/cn';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { toast } from 'sonner';
import { apiUrl, buildApiHeaders } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { getCache, setCache } from '../utils/cache';
import { getFollowingMapCacheKey, parseIsFollowingResponse, syncFollowingCache } from '../utils/follow';

const reportData = {
  title: '三月情感成长报告',
  plants: 3,
  interactions: 124,
  frequency: 'High',
  bestFriend: '妈妈',
  growthRate: '+15%',
};

export function Moments() {
  const { themeConfig } = useEmotionalTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('全部故事');
  const [moments, setMoments] = useState<any[]>(() => {
    return getCache<any[]>('moments-feed') || [];
  });
  const [showFilter, setShowFilter] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishContent, setPublishContent] = useState('');
  const [publishTag, setPublishTag] = useState('成长日志');
  const [publishImage, setPublishImage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(!getCache<any[]>('moments-feed'));
  const mountedRef = useRef(true); // Track if component is mounted
  
  // Comment related
  const [activeMomentId, setActiveMomentId] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  // Follow related
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>(() => {
    if (user?.id) return getCache<Record<string, boolean>>(getFollowingMapCacheKey(user.id)) || {};
    return {};
  });

  // Plant selection related
  const [userPlants, setUserPlants] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(() => getCache<any>(`stats_${user?.id}`));

  const fetchStats = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(apiUrl(`/stats/${user.id}`), {
        headers: await buildApiHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        setCache(`stats_${user.id}`, data);
      } else {
        const errorText = await res.text();
        console.error(`Stats API error (${res.status}):`, errorText);
      }
    } catch (e) {
      console.error('Error fetching stats:', e);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user]);

  // Cleanup effect for mounted ref and object URLs
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // Cleanup object URL if exists
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, []);

  // Cleanup preview URL when it changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过 5MB');
      return;
    }

    setIsUploading(true);
    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    try {
      // 1. Get upload URL
      const res = await fetch(apiUrl('/upload-url'), {
        method: 'POST',
        headers: await buildApiHeaders(true),
        body: JSON.stringify({ 
          fileName: file.name,
          contentType: file.type
        })
      });

      if (!res.ok) throw new Error('Failed to get upload URL');
      
      const { uploadUrl, path } = await res.json();

      // 2. Upload to storage
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type
        },
        body: file
      });

      if (!uploadRes.ok) throw new Error('Upload failed');

      // 3. Set path for publishing
      setPublishImage(`storage:${path}`);
      toast.success('图片上传成功');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('图片上传失败，请重试');
      setPreviewUrl('');
      setPublishImage('');
    } finally {
      setIsUploading(false);
      // Reset input value to allow re-selecting same file if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const fetchMoments = async () => {
    const cacheKey = 'moments-feed';
    
    try {
      const res = await fetch(apiUrl('/moments'), {
        headers: await buildApiHeaders()
      });
      if (res.ok && mountedRef.current) {
        const data = await res.json();
        setMoments(data);
        setCache(cacheKey, data);
      }
    } catch (e) {
      console.error('Error fetching moments:', e);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchMoments();
  }, []);

  const handleLike = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    // Optimistic update
    setMoments(prev => prev.map(m => {
      if (m.id === id) {
        return {
          ...m,
          likes: (m.likes || 0) + 1,
          isLiked: true
        };
      }
      return m;
    }));

    try {
      await fetch(apiUrl(`/moments/${id}/like`), {
        method: 'POST',
        headers: await buildApiHeaders()
      });
      toast.success('感谢你的点赞！✨');
    } catch (e) {
      console.error('Like error:', e);
    }
  };

  const handleShare = (moment: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: '心植 - 植缘广场',
        text: moment.content,
        url: window.location.href,
      }).catch(() => {});
    } else {
      toast.info('分享链接已复制到剪贴板');
    }
  };

  const handlePublish = async () => {
    if (!publishContent.trim()) {
      toast.error('请输入内容后再发布哦');
      return;
    }
    
    setIsPublishing(true);
    try {
      const res = await fetch(apiUrl('/moments'), {
        method: 'POST',
        headers: await buildApiHeaders(true),
        body: JSON.stringify({
          content: publishContent,
          tag: publishTag,
          image: publishImage || 'https://images.unsplash.com/photo-1545239351-ef35f43d514b?q=80&w=1080' // default fallback
        })
      });
      
      if (res.ok) {
        toast.success('发布成功！✨');
        setShowPublishModal(false);
        setPublishContent('');
        setPublishImage('');
        setPreviewUrl('');
        fetchMoments();
      } else {
        throw new Error('Publish failed');
      }
    } catch (e) {
      toast.error('发布失败，请检查网络后重试');
    } finally {
      setIsPublishing(false);
    }
  };

  const loadComments = async (momentId: string) => {
    setIsLoadingComments(true);
    try {
      const res = await fetch(apiUrl(`/moments/${momentId}/comments`), {
        headers: await buildApiHeaders()
      });
      if (res.ok && mountedRef.current) {
        const data = await res.json();
        setComments(data);
      }
    } catch (e) {
      console.error('Error loading comments:', e);
    } finally {
      if (mountedRef.current) {
        setIsLoadingComments(false);
      }
    }
  };

  const handlePostComment = async () => {
    if (!commentInput.trim() || !activeMomentId) return;
    
    setIsSubmittingComment(true);
    try {
      const res = await fetch(apiUrl(`/moments/${activeMomentId}/comments`), {
        method: 'POST',
        headers: await buildApiHeaders(true),
        body: JSON.stringify({ content: commentInput })
      });
      
      if (res.ok && mountedRef.current) {
        setCommentInput('');
        loadComments(activeMomentId);
        toast.success('评论已送达 ✨');
      }
    } catch (e) {
      if (mountedRef.current) {
        toast.error('发送评论失败');
      }
    } finally {
      if (mountedRef.current) {
        setIsSubmittingComment(false);
      }
    }
  };

  const handleFollow = async (targetUserId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    if (!user) {
      toast.error('请先登录');
      return;
    }

    if (targetUserId === user.id) {
      toast.error('不能关注自己哦');
      return;
    }

    const isCurrentlyFollowing = followingMap[targetUserId];
    
    // Optimistic update
    setFollowingMap(prev => ({
      ...prev,
      [targetUserId]: !isCurrentlyFollowing
    }));

    try {
      const endpoint = isCurrentlyFollowing ? `/follow/${targetUserId}` : '/follow';
      const res = await fetch(apiUrl(endpoint), {
        method: isCurrentlyFollowing ? 'DELETE' : 'POST',
        headers: await buildApiHeaders(!isCurrentlyFollowing),
        body: isCurrentlyFollowing ? undefined : JSON.stringify({ targetUserId })
      });

      if (!res.ok) {
        throw new Error(`Follow request failed: ${res.status}`);
      }

      if (user?.id) {
        syncFollowingCache(user.id, targetUserId, !isCurrentlyFollowing, {
          name: moments.find(m => m.userId === targetUserId)?.user,
          avatar: moments.find(m => m.userId === targetUserId)?.avatar,
        });
      }

      toast.success(isCurrentlyFollowing ? '已取消关注' : '关注成功 ✨');
    } catch (e) {
      console.error('Follow error:', e);
      // Revert optimistic update on error
      setFollowingMap(prev => ({
        ...prev,
        [targetUserId]: isCurrentlyFollowing
      }));
      if (user?.id) {
        syncFollowingCache(user.id, targetUserId, isCurrentlyFollowing, {
          name: moments.find(m => m.userId === targetUserId)?.user,
          avatar: moments.find(m => m.userId === targetUserId)?.avatar,
        });
      }
      toast.error('操作失败，请重试');
    }
  };

  // Load following状态 when moments load
  useEffect(() => {
    if (!user || moments.length === 0) return;

    const loadFollowingStatus = async () => {
      try {
        const uniqueUserIds = [...new Set(moments.map(m => m.userId).filter(Boolean))];
        
        const statusPromises = uniqueUserIds.map(async (userId) => {
          const res = await fetch(apiUrl(`/is-following/${userId}`), {
            headers: await buildApiHeaders()
          });
          if (res.ok) {
            const data = await res.json();
            return [userId, parseIsFollowingResponse(data)];
          }
          return [userId, false];
        });

        const results = await Promise.all(statusPromises);
        const newFollowingMap: Record<string, boolean> = {};
        results.forEach(([userId, isFollowing]) => {
          newFollowingMap[userId as string] = isFollowing as boolean;
        });
        
        setFollowingMap(newFollowingMap);
        setCache(getFollowingMapCacheKey(user.id), newFollowingMap);
      } catch (e) {
        console.error('Error loading following status:', e);
      }
    };

    loadFollowingStatus();
  }, [user, moments]);

  const filteredMoments = activeTab === '全部故事' 
    ? moments 
    : moments.filter(m => m.tag === activeTab);

  return (
    <div className="flex flex-col gap-8 p-6 pb-32 max-w-2xl mx-auto">
      {/* System Status HUD */}
      <header className="flex flex-col gap-4">
        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span>Bio-Link: Stable</span>
           </div>
           <div className="flex items-center gap-4">
              <span>Sync: {stats?.level ? (stats.level * 12.5).toFixed(1) : '0.0'}%</span>
              <span>Buffer: {((stats?.totalPosts || 0) * 2.5).toFixed(1)}GB</span>
           </div>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-black tracking-tighter italic">HEART<span className="text-indigo-600">PLANT</span></h1>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowPublishModal(true)}
              className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center shadow-xl active:scale-90 transition-all"
            >
              <Plus size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* Lightweight memory summary */}
      <div className="bg-white rounded-3xl border border-black/5 p-4 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">生命记忆摘要</div>
          <div className="text-xs font-bold text-gray-700 mt-1">
            已记录 {stats?.totalPosts || 0} 条 · 收到 {stats?.totalLikes || 0} 次共鸣 · 当前 LV.{stats?.level || 0}
          </div>
        </div>
        <button
          onClick={() => toast.info('报告详情页规划中，当前先展示轻量摘要')}
          className="shrink-0 px-4 py-2 rounded-xl bg-black text-white text-[10px] font-black uppercase tracking-wider active:scale-95 transition-all"
        >
          查看报告
        </button>
      </div>

      {/* Categories HUD */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide no-scrollbar">
        {['全部故事', '成长日志', '感人瞬间', '求助问答'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-5 py-2.5 rounded-2xl whitespace-nowrap text-[9px] font-black uppercase tracking-[0.15em] transition-all flex items-center gap-2 border",
              activeTab === tab 
                ? "bg-black text-white border-black shadow-lg" 
                : "bg-white text-gray-400 border-gray-100 hover:border-black/10"
            )}
          >
            {activeTab === tab && <div className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse" />}
            {tab}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="flex flex-col gap-8">
        {isLoading ? (
          <div className="flex flex-col items-center gap-4 py-20">
             <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin" />
             <span className="text-[10px] font-black text-gray-400 uppercase">加载社区动态中...</span>
          </div>
        ) : filteredMoments.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center gap-4 opacity-40">
             <Sparkles size={40} className="text-gray-300" />
             <p className="text-xs font-black uppercase tracking-widest">暂无故事，快来分享第一个瞬间吧</p>
          </div>
        ) : filteredMoments.map((moment) => (
          <motion.article
            key={moment.id}
            layoutId={moment.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setActiveMomentId(moment.id);
              loadComments(moment.id);
            }}
            className="bg-white rounded-[48px] overflow-hidden shadow-sm border border-black/5 flex flex-col gap-6 p-8 cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gray-900 text-white flex items-center justify-center font-black uppercase shadow-lg">
                   {moment.avatar || 'U'}
                </div>
                <div>
                  <h4 className="font-black text-lg tracking-tight">{moment.user}</h4>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                     <Calendar size={12} />
                     {moment.time || (moment.created_at && new Date(moment.created_at).toLocaleString('zh-CN', { hour12: false, month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })) || '刚刚'}
                  </div>
                </div>
              </div>
              {moment.userId && moment.userId !== user?.id && (
                <button 
                  onClick={(e) => handleFollow(moment.userId, e)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 flex items-center gap-2",
                    followingMap[moment.userId] 
                      ? "bg-gray-100 text-gray-600 hover:bg-gray-200" 
                      : "bg-black text-white hover:bg-gray-900"
                  )}
                >
                  {followingMap[moment.userId] ? (
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
              {(!moment.userId || moment.userId === user?.id) && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toast.info('功能开发中...');
                  }}
                  className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-300"
                >
                  <MoreHorizontal size={20} />
                </button>
              )}
            </div>

            <p className="text-sm font-bold leading-relaxed text-gray-700 bg-gray-50/50 p-4 rounded-3xl border border-black/5">
              {moment.content}
            </p>

            {moment.image && (
              <div className="relative aspect-video rounded-[32px] overflow-hidden group">
                <ImageWithFallback src={moment.image} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
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
                  className={cn(
                    "flex items-center gap-2 active:scale-90 transition-all group",
                    moment.isLiked ? "text-pink-500" : "text-gray-900"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                    moment.isLiked ? "bg-pink-500 text-white" : "bg-pink-50 text-pink-500 group-hover:bg-pink-500 group-hover:text-white"
                  )}>
                    <Heart size={20} className={moment.isLiked ? "fill-current" : "group-hover:fill-current"} />
                  </div>
                  <span className="text-sm font-black">{moment.likes || 0}</span>
                </button>
                <div className="flex items-center gap-2 text-gray-900 group">
                   <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
                    <MessageCircle size={20} />
                  </div>
                  <span className="text-sm font-black">{moment.comments || 0}</span>
                </div>
              </div>
              <button 
                onClick={(e) => handleShare(moment, e)}
                className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-all active:rotate-12"
              >
                <Share2 size={18} />
              </button>
            </div>
          </motion.article>
        ))}
      </div>

      {/* Publish Modal */}
      <AnimatePresence>
        {showPublishModal && (
          <div 
            className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowPublishModal(false);
              }
            }}
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white w-full max-w-lg rounded-[48px] overflow-hidden flex flex-col p-8 gap-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black tracking-tight">记录这一刻</h2>
                <button onClick={() => setShowPublishModal(false)} className="p-2 bg-gray-100 rounded-full text-gray-400 hover:text-black">
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <textarea 
                  value={publishContent}
                  onChange={(e) => setPublishContent(e.target.value)}
                  placeholder="这一刻，你在想什么？"
                  className="w-full h-40 bg-gray-50 rounded-[32px] p-6 text-sm font-bold border-none focus:ring-4 ring-black/5 transition-all outline-none resize-none"
                />

                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {['成长日志', '感人瞬间', '求助问答', '同城认领'].map(tag => (
                    <button 
                      key={tag}
                      onClick={() => setPublishTag(tag)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all shrink-0",
                        publishTag === tag ? "bg-black border-black text-white" : "border-gray-100 text-gray-400"
                      )}
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileChange}
                />

                {previewUrl && (
                  <div className="relative aspect-video rounded-3xl overflow-hidden border border-black/5 group">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => {
                        setPreviewUrl('');
                        setPublishImage('');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex-1 py-4 bg-gray-50 rounded-2xl flex items-center justify-center gap-2 text-gray-400 font-bold text-xs hover:bg-gray-100 transition-colors disabled:opacity-50"
                  >
                    {isUploading ? <Loader2 className="animate-spin" size={18} /> : <ImageIcon size={18} />} 
                    {isUploading ? '上传中...' : '选择图片'}
                  </button>
                  <button className="flex-1 py-4 bg-gray-50 rounded-2xl flex items-center justify-center gap-2 text-gray-400 font-bold text-xs hover:bg-gray-100 transition-colors">
                    <Camera size={18} /> 拍照记录
                  </button>
                </div>
              </div>

              <button 
                onClick={handlePublish}
                disabled={isPublishing || !publishContent.trim()}
                className="w-full py-6 bg-black text-white rounded-[32px] font-black text-sm uppercase tracking-widest shadow-2xl disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                {isPublishing ? <Loader2 className="animate-spin" /> : <Plus size={18} />}
                {isPublishing ? '正在发布...' : '确认发布'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Comment Section (Slide up panel) */}
      <AnimatePresence>
        {activeMomentId && (
          <div 
            className="fixed inset-0 z-[110] flex items-end justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setActiveMomentId(null);
              }
            }}
          >
             <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white w-full max-w-lg h-[80vh] rounded-[48px] overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-black/5 flex items-center justify-between bg-white sticky top-0 z-10">
                <div>
                  <h3 className="text-xl font-black tracking-tight">全部评论</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Comments • {comments.length}</p>
                </div>
                <button onClick={() => setActiveMomentId(null)} className="p-2 bg-gray-100 rounded-full text-gray-400 hover:text-black">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6">
                {isLoadingComments ? (
                  <div className="flex flex-col items-center gap-4 py-20 opacity-20">
                    <Loader2 className="animate-spin" size={32} />
                    <span className="text-[10px] font-black uppercase tracking-widest">评论加载中...</span>
                  </div>
                ) : comments.length === 0 ? (
                  <div className="flex flex-col items-center gap-4 py-20 opacity-20">
                     <MessageCircle size={40} />
                     <p className="text-xs font-black uppercase tracking-widest">暂无评论，快来抢沙发</p>
                  </div>
                ) : comments.map((comment) => (
                  <div key={comment.id} className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 font-black uppercase shrink-0">
                      {comment.user?.[0] || 'U'}
                    </div>
                    <div className="flex flex-col gap-1 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-gray-900">{comment.user}</span>
                        <span className="text-[8px] font-bold text-gray-400 uppercase">
                          {new Date(comment.created_at).toLocaleString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed font-medium bg-gray-50 p-4 rounded-2xl rounded-tl-none">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Comment Input */}
              <div className="p-8 bg-gray-50 border-t border-black/5 flex items-center gap-4">
                <input 
                  type="text"
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="写下你的感悟..."
                  className="flex-1 bg-white rounded-2xl py-4 px-6 text-sm font-bold border-none focus:ring-4 ring-black/5 transition-all outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                />
                <button 
                  onClick={handlePostComment}
                  disabled={isSubmittingComment || !commentInput.trim()}
                  className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center disabled:opacity-30 transition-all active:scale-90"
                >
                  {isSubmittingComment ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}