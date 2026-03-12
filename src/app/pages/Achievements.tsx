import React, { useState, useEffect } from 'react';
import { 
  Trophy, Award, Star, TrendingUp, Lock, Sparkles, 
  ChevronRight, Crown, Zap, Target, CircleCheckBig,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { apiGet, apiPost } from '../utils/api';
import { useEmotionalTheme } from '../context/ThemeContext';
import { getCache, setCache } from '../utils/cache';

interface Achievement {
  id: string;
  category: string;
  name: string;
  desc: string;
  icon: string;
  requirement: {
    type: string;
    count: number;
  };
  reward: number;
}

interface UserStats {
  userId: string;
  level: number;
  exp: number;
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  waterCount: number;
  fertilizerCount: number;
  plantsAdopted: number;
  loginStreak: number;
  lastLoginDate: string | null;
  achievements: string[];
  created_at: string;
}

const categoryInfo = {
  social: { label: '社交达人', icon: '💬', color: 'from-pink-500 to-rose-500' },
  care: { label: '植物守护', icon: '💧', color: 'from-blue-500 to-cyan-500' },
  growth: { label: '成长记录', icon: '🌱', color: 'from-green-500 to-emerald-500' },
  level: { label: '等级徽章', icon: '👑', color: 'from-yellow-500 to-orange-500' },
};

const getLevelTitle = (level: number) => {
  if (level >= 50) return { title: '传奇园丁', icon: '👑', color: 'from-yellow-400 to-orange-500' };
  if (level >= 30) return { title: '繁茂园丁', icon: '🌳', color: 'from-green-600 to-emerald-600' };
  if (level >= 20) return { title: '茁壮园丁', icon: '🪴', color: 'from-green-500 to-teal-500' };
  if (level >= 10) return { title: '生长园丁', icon: '🌿', color: 'from-green-400 to-lime-500' };
  if (level >= 5) return { title: '萌芽园丁', icon: '🌱', color: 'from-green-300 to-green-400' };
  return { title: '新手园丁', icon: '🌾', color: 'from-gray-400 to-gray-500' };
};

export function Achievements() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { themeConfig } = useEmotionalTheme();
  const [stats, setStats] = useState<UserStats | null>(() => {
    if (user?.id) return getCache<UserStats>(`stats_${user.id}`) || null;
    return null;
  });
  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    return getCache<Achievement[]>('achievements_all') || [];
  });
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(!stats); // Only show loading if we don't have cached stats

  useEffect(() => {
    if (user) {
      loadUserStats();
      loadAchievements();
    }
    // Refresh on focus
    const handleFocus = () => {
      if (user) loadUserStats();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user]);

  const loadUserStats = async () => {
    if (!user) return;
    
    try {
      const data = await apiGet<UserStats>(`/stats/${user.id}`);
      if (data) {
        setStats(data);
        setCache(`stats_${user.id}`, data);
      }
    } catch (error) {
      console.error('Failed to load user stats:', error);
    }
  };

  const loadAchievements = async () => {
    try {
      const data = await apiGet<Achievement[]>('/achievements');
      if (data) {
        setAchievements(data);
        setCache('achievements_all', data);
      }
    } catch (error) {
      console.error('Failed to load achievements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getProgress = (achievement: Achievement): number => {
    if (!stats) return 0;
    
    const { type, count } = achievement.requirement;
    let current = 0;
    
    switch (type) {
      case 'posts': current = stats.totalPosts; break;
      case 'likes': current = stats.totalLikes; break;
      case 'comments': current = stats.totalComments; break;
      case 'water': current = stats.waterCount; break;
      case 'fertilizer': current = stats.fertilizerCount; break;
      case 'plants': current = stats.plantsAdopted; break;
      case 'streak': current = stats.loginStreak; break;
      case 'level': current = stats.level; break;
    }
    
    return Math.min((current / count) * 100, 100);
  };

  const isUnlocked = (achievementId: string) => {
    return stats?.achievements?.includes(achievementId) || false;
  };

  const filteredAchievements = achievements.filter(a => 
    activeCategory === 'all' || a.category === activeCategory
  );

  const unlockedCount = achievements.filter(a => isUnlocked(a.id)).length;
  const totalCount = achievements.length;
  const completionRate = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  // Calculate exp to next level
  const getExpNeeded = (lv: number) => Math.max(10, (lv * lv * 10));
  const expForCurrentLevel = stats?.level && stats.level > 1 ? getExpNeeded(stats.level - 1) : 0;
  const expForNextLevel = stats ? getExpNeeded(stats.level) : 10;
  
  const currentLevelExp = stats ? stats.exp - expForCurrentLevel : 0;
  const neededForNext = expForNextLevel - expForCurrentLevel;
  const expProgress = Math.min(100, Math.max(0, (currentLevelExp / neededForNext) * 100));

  const levelInfo = getLevelTitle(stats?.level || 1);

  if (isLoading || (!stats && user)) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-transparent border-black rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-bold">加载数据中...</p>
        </div>
      </div>
    );
  }

  // If no stats and not loading, something went wrong or user logged out
  if (!stats) return null;

  return (
    <div className="flex flex-col gap-6 p-6 pb-32 bg-gradient-to-br from-gray-50 to-white min-h-screen">
      {/* Header */}
      <header className="flex items-center justify-between pt-4">
        <button 
          onClick={() => navigate(-1)} 
          className="p-3 bg-white rounded-2xl shadow-sm border border-black/5 text-gray-400 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="flex-1 text-center pr-12">
          <h1 className="text-3xl font-black tracking-tighter">成就中心</h1>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Growth Achievements</p>
        </div>
      </header>

      {/* User Level Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "relative overflow-hidden rounded-[48px] p-8 text-white shadow-2xl",
          `bg-gradient-to-br ${levelInfo.color}`
        )}
      >
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-24 -translate-x-24" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center text-4xl">
                {levelInfo.icon}
              </div>
              <div>
                <div className="text-white/80 text-xs font-bold uppercase tracking-widest mb-1">当前等级</div>
                <div className="text-3xl font-black tracking-tight">Lv.{stats.level}</div>
                <div className="text-white/90 text-sm font-bold">{levelInfo.title}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-white/80 text-xs font-bold uppercase tracking-widest mb-1">总经验</div>
              <div className="text-2xl font-black">{stats.exp}</div>
              <div className="text-white/90 text-xs font-bold">EXP</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-white/80">升级进度</span>
              <span>{Math.round(expProgress)}%</span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${expProgress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-white rounded-full"
              />
            </div>
            <div className="text-right text-xs text-white/70 font-bold">
              还需 {expForNextLevel - stats.exp} EXP 升级
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-3xl p-4 text-center shadow-sm">
          <div className="text-2xl font-black text-gray-900">{stats.totalPosts}</div>
          <div className="text-xs text-gray-500 font-bold mt-1">发布文章</div>
        </div>
        <div className="bg-white rounded-3xl p-4 text-center shadow-sm">
          <div className="text-2xl font-black text-gray-900">{stats.totalLikes}</div>
          <div className="text-xs text-gray-500 font-bold mt-1">获得点赞</div>
        </div>
        <div className="bg-white rounded-3xl p-4 text-center shadow-sm">
          <div className="text-2xl font-black text-gray-900">{stats.plantsAdopted}</div>
          <div className="text-xs text-gray-500 font-bold mt-1">领养植物</div>
        </div>
      </div>

      {/* Achievement Completion */}
      <div className="bg-white rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-lg font-black">成就完成度</div>
            <div className="text-sm text-gray-500 font-bold">{unlockedCount} / {totalCount} 已解锁</div>
          </div>
          <div className="text-3xl font-black" style={{ color: themeConfig.primary }}>
            {completionRate}%
          </div>
        </div>
        <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${completionRate}%` }}
            transition={{ duration: 1, delay: 0.3 }}
            className="h-full rounded-full"
            style={{ background: `linear-gradient(to right, ${themeConfig.primary}, ${themeConfig.accent})` }}
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button 
          onClick={() => setActiveCategory('all')}
          className={cn(
            "px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shrink-0 transition-all",
            activeCategory === 'all' 
              ? "bg-black text-white shadow-lg" 
              : "bg-white text-gray-400 shadow-sm"
          )}
        >
          全部
        </button>
        {Object.entries(categoryInfo).map(([key, info]) => (
          <button 
            key={key}
            onClick={() => setActiveCategory(key)}
            className={cn(
              "px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shrink-0 transition-all flex items-center gap-2",
              activeCategory === key 
                ? "bg-black text-white shadow-lg" 
                : "bg-white text-gray-400 shadow-sm"
            )}
          >
            <span>{info.icon}</span>
            <span>{info.label}</span>
          </button>
        ))}
      </div>

      {/* Achievements List */}
      <div className="space-y-3">
        {filteredAchievements.map((achievement, index) => {
          const unlocked = isUnlocked(achievement.id);
          const progress = getProgress(achievement);
          const categoryData = categoryInfo[achievement.category as keyof typeof categoryInfo] || categoryInfo.social;

          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "relative overflow-hidden rounded-3xl p-6 shadow-sm transition-all",
                unlocked 
                  ? "bg-gradient-to-br " + categoryData.color + " text-white" 
                  : "bg-white"
              )}
            >
              {unlocked && (
                <div className="absolute top-3 right-3">
                  <CircleCheckBig className="text-white" size={24} />
                </div>
              )}

              <div className="flex items-start gap-4">
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0",
                  unlocked ? "bg-white/20 backdrop-blur-sm" : "bg-gray-100"
                )}>
                  {unlocked ? achievement.icon : '🔒'}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className={cn(
                        "text-lg font-black tracking-tight",
                        !unlocked && "text-gray-900"
                      )}>
                        {achievement.name}
                      </div>
                      <div className={cn(
                        "text-xs font-bold mt-1",
                        unlocked ? "text-white/80" : "text-gray-500"
                      )}>
                        {achievement.desc}
                      </div>
                    </div>
                    {unlocked && (
                      <div className="text-right shrink-0">
                        <div className="text-xs text-white/70 font-bold">奖励</div>
                        <div className="text-lg font-black">+{achievement.reward}</div>
                        <div className="text-[10px] text-white/70 font-bold">EXP</div>
                      </div>
                    )}
                  </div>

                  {!unlocked && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs font-bold text-gray-600 mb-1">
                        <span>进度</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r"
                          style={{ 
                            width: `${progress}%`,
                            background: `linear-gradient(to right, ${themeConfig.primary}, ${themeConfig.accent})`
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
