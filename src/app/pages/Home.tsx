import React, { useState, useEffect, useMemo } from 'react';
import { Heart, User, Thermometer, MessageSquare, Plus, Bell, Sparkles, TrendingUp, Calendar, ChevronRight, Users, Smile, Baby, Sprout, Notebook } from 'lucide-react';
import { useNavigate, NavLink, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { PlantAvatar } from '../components/PlantAvatar';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { useEmotionalTheme, EmotionalTheme } from '../context/ThemeContext';
import { cn } from '../utils/cn';
import { toast } from 'sonner';
import { apiGet } from '../utils/api';
import { getCache, setCache } from '../utils/cache';
import { ADOPTION_REFRESH_EVENT } from '../utils/adoptionRefresh';
import { getPrimaryPlantId, getPlantDisplayImage, getAvatarTypeForPlant, hasCartoonImage } from '../utils/plantIdentity';

export function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, session, loading: authLoading } = useAuth();
  const { setTheme, themeConfig, theme } = useEmotionalTheme();
  const [plants, setPlants] = useState<any[]>(() => {
    // Immediate initialization from cache if available
    if (typeof window !== 'undefined') {
      const cached = getCache<any[]>(`plants-current`, 60000);
      return cached || [];
    }
    return [];
  });
  const [availableToAdopt, setAvailableToAdopt] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = getCache<any[]>('library', 300000);
      return cached ? cached.filter((p: any) => p.status === 'active' || !p.status).slice(0, 4) : [];
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState(!plants.length);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotificationsCount = async () => {
    if (!user?.email) return;
    try {
      const data = await apiGet<any[]>(`/notifications/${user.email}`);
      if (Array.isArray(data)) {
        setUnreadCount(data.length);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotificationsCount();
    const interval = setInterval(fetchNotificationsCount, 15000); // 15s poll
    return () => clearInterval(interval);
  }, [user?.email]);


  const fetchAvailable = async () => {
    // Background refresh even if we have cache
    try {
      const data = await apiGet<any[]>('/library');
      if (data && Array.isArray(data)) {
        setCache('library', data);
        setAvailableToAdopt(data.filter((p: any) => p.status === 'active' || !p.status).slice(0, 4));
      }
    } catch (e) {
      console.error('Error fetching library:', e);
    }
  };

  const fetchPlants = async (options?: { silent?: boolean; force?: boolean }) => {
    const cacheKey = `plants-current`;
    const cachedPlants = !options?.force ? getCache<any[]>(cacheKey, 60000) : null;

    if (cachedPlants && !plants.length) {
      setPlants(cachedPlants);
      setIsLoading(false);
    }

    try {
      if (!session?.access_token) {
        setPlants([]);
        setIsLoading(false);
        return;
      }

      const data = await apiGet<any[]>('/plants');
      
      if (data && Array.isArray(data)) {
        setPlants(data);
        setCache(cacheKey, data);
        if (user?.id) setCache(`plants-${user.id}`, data);
      } else {
        setPlants([]);
      }
    } catch (e: any) {
      console.error('Error fetching plants:', e);
      if (!options?.silent && !plants.length) {
        toast.error('获取植物数据失败：' + e.message);
        setPlants([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailable();
  }, []);

  useEffect(() => {
    if (authLoading) return;
    fetchPlants();
  }, [session, authLoading, user?.id]);

  useEffect(() => {
    if (!session?.access_token || !location.state?.refreshMyPlants) return;
    fetchPlants({ force: true, silent: true });
    fetchAvailable();
  }, [location.state, session?.access_token]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleAdoptionRefresh = () => {
      fetchPlants({ force: true, silent: true });
      fetchAvailable();
    };

    window.addEventListener(ADOPTION_REFRESH_EVENT, handleAdoptionRefresh);
    return () => window.removeEventListener(ADOPTION_REFRESH_EVENT, handleAdoptionRefresh);
  }, [session?.access_token, user?.id]);

  const goToPlant = (plant: any, target: 'interaction' | 'mood' | 'journal') => {
    const canonicalId = getPrimaryPlantId(plant);
    if (!canonicalId) return;

    if (target === 'interaction') {
      navigate('/interaction', { state: { plantId: canonicalId, originalId: plant?.originalId } });
      return;
    }

    navigate(`/${target}/${canonicalId}`, { state: { plantId: canonicalId, originalId: plant?.originalId } });
  };

  const filteredPlants = useMemo(() => {
    let result = [...plants];
    result.sort((a, b) => (a.type === theme ? -1 : 1));
    return result;
  }, [plants, theme]);

  const themeStats = useMemo(() => {
    const themePlants = plants.filter(p => p.type === theme);
    const totalDays = themePlants.reduce((sum, p) => sum + p.days, 0);
    const avgHealth = themePlants.length > 0 
      ? Math.round(themePlants.reduce((sum, p) => sum + p.health, 0) / themePlants.length)
      : 0;
    return { count: themePlants.length, totalDays, avgHealth, needsAttention: themePlants.filter(p => p.alert).length };
  }, [plants, theme]);

  const themeContent = {
    solo: { title: '本周最佳\n自我成长记录', subtitle: '"独处，是为了更好地遇见自己。"', badge: '个人成长', icon: <Sprout size={20} />, insight: `${themeStats.count} 棵悦己植物，陪伴你 ${themeStats.totalDays} 天`, suggestion: '记录今日心情' },
    kinship: { title: '本周最感人\n家庭时光', subtitle: '"无论相隔多远，这份爱始终在生长。"', badge: '亲情记忆', icon: <Baby size={20} />, insight: `${themeStats.count} 棵亲情植物，共同守护 ${themeStats.totalDays} 天`, suggestion: '给家人留言' },
    romance: { title: '本周最浪漫\n爱的瞬间', subtitle: '"我们的爱，像白掌一样纯净而坚定。"', badge: '爱情见证', icon: <Heart size={20} />, insight: `${themeStats.count} 棵爱情植物，记录 ${themeStats.totalDays} 天甜蜜`, suggestion: '写给 TA 的话' },
    friendship: { title: '本周最有趣\n友情故事', subtitle: '"朋友，就是那个陪你一起照顾仙人掌的人。"', badge: '友谊纪念', icon: <Users size={20} />, insight: `${themeStats.count} 棵友情植物，共度 ${themeStats.totalDays} 天快乐时光`, suggestion: '邀请好友互动' }
  };

  const currentContent = themeContent[theme as keyof typeof themeContent];

  return (
    <div className="flex flex-col gap-8 p-6 pb-32">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-white shadow-lg">
             <Sprout size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter">
              {user?.email?.split('@')[0] || '心植'}
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Heart Gardener</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/notifications')}
            className="relative w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-gray-400 active:scale-90 transition-all hover:bg-gray-50"
          >
            <Bell size={20} />
            {unreadCount > 0 && <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white animate-pulse" />}
          </button>
          <button className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-gray-400">
            <TrendingUp size={20} />
          </button>
        </div>
      </header>

      <motion.div
        key={`featured-${theme}`}
        className={cn("w-full rounded-[40px] p-6 text-white flex flex-col justify-end gap-1 shadow-2xl relative overflow-hidden bg-gradient-to-br min-h-[120px]", themeConfig.gradient)}
      >
        <Sparkles className="absolute -right-8 -top-8 text-white/10 w-48 h-48 rotate-12" />
        <div className="flex items-center gap-2">
          <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{currentContent.badge}</span>
        </div>
        <h2 className="text-xl font-black leading-tight whitespace-pre-line">{currentContent.title}</h2>
        <p className="text-[10px] font-medium opacity-80 mt-1 italic">{currentContent.subtitle}</p>
      </motion.div>

      <div className="flex flex-col gap-10">
        {/* DISCOVER PLANTS SECTION (ONLY SHOW WHEN NO PLANTS) */}
        {plants.length === 0 && !isLoading && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-xl tracking-tight">寻觅森灵</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-green-500/10 text-green-600 rounded-full uppercase tracking-widest">待结缘</span>
              </div>
              <NavLink to="/discover" className="text-sm font-black uppercase text-gray-400 hover:text-gray-900 transition-colors">查看全部</NavLink>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 scrollbar-hide min-h-[220px]">
              {availableToAdopt.length > 0 ? availableToAdopt.map((p) => (
                <NavLink key={p.id} to={`/adopt/${p.id}`} className="shrink-0 w-64">
                  <motion.div
                    whileTap={{ scale: 0.95 }}
                    className="bg-white rounded-[40px] overflow-hidden shadow-sm border border-black/5 flex flex-col gap-4 p-4"
                  >
                    <div className="h-40 w-full rounded-[32px] overflow-hidden relative">
                      <img src={p.imageUrl || p.image} className="w-full h-full object-cover" alt={p.name} />
                      <div className="absolute top-3 left-3 flex gap-1.5">
                        <span className="px-2 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-widest border border-white/20">
                          {p.mood || '#治愈'}
                        </span>
                      </div>
                    </div>
                    <div className="px-2 pb-2">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-black text-lg">{p.name}</h4>
                        <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">Lv.1 初学者</span>
                      </div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">养护难度: {p.difficulty}</p>
                      <div className="w-full mt-4 py-3 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest text-center">
                        开启契约
                      </div>
                    </div>
                  </motion.div>
                </NavLink>
              )) : (
                // Placeholder to prevent layout shift
                [...Array(2)].map((_, i) => (
                  <div key={i} className="shrink-0 w-64 h-[240px] bg-white/50 rounded-[40px] border border-black/5 animate-pulse" />
                ))
              )}
            </div>
          </div>
        )}

        {/* MY PLANTS SECTION */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-xl tracking-tight">我的植物</h3>
            <button onClick={() => navigate('/discover')} className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center shadow-lg active:scale-90 transition-all">
              <Plus size={20} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {filteredPlants.length > 0 ? filteredPlants.map((plant) => (
              <motion.div
                key={plant.id}
                whileHover={{ y: -4 }}
                className={cn(
                  "bg-white rounded-[32px] overflow-hidden shadow-sm border border-black/5 group transition-all duration-500",
                  filteredPlants.length === 1 ? "col-span-2 flex flex-row items-stretch h-[220px]" : "flex flex-col"
                )}
              >
                {/* Compact Image Area：认领后优先展示 fal 生成的卡通形象 */}
                <div className={cn(
                  "relative bg-gray-50 flex items-center justify-center overflow-hidden shrink-0 transition-all",
                  filteredPlants.length === 1 ? "w-[45%] h-full" : "h-40 w-full"
                )}>
                  <button type="button" onClick={() => goToPlant(plant, 'interaction')} className="absolute inset-0 z-10" aria-label={`查看 ${plant.name} 互动详情`}>
                    <img src={getPlantDisplayImage(plant)} className="w-full h-full object-cover opacity-10 blur-sm" alt="" />
                  </button>
                  <div className={cn(
                    "relative z-20 pointer-events-none transition-transform flex items-center justify-center",
                    filteredPlants.length === 1 ? "scale-90" : "scale-75"
                  )}>
                    {hasCartoonImage(plant) ? (
                      <img src={getPlantDisplayImage(plant)} alt={plant.name} referrerPolicy="no-referrer" className={cn("object-contain", filteredPlants.length === 1 ? "w-40 h-40" : "w-36 h-36")} />
                    ) : (
                      <PlantAvatar 
                        size={filteredPlants.length === 1 ? 160 : 140} 
                        theme={plant.type} 
                        type={getAvatarTypeForPlant(plant)}
                        health={plant.health} 
                        humidity={plant.humidity} 
                        temp={plant.temp} 
                      />
                    )}
                  </div>
                  
                  {/* Floating Status Badges */}
                  <div className="absolute top-4 left-4 z-20 flex flex-col gap-1">
                    <span className="px-2 py-0.5 rounded-lg bg-black/40 backdrop-blur-md text-white text-[7px] font-black uppercase tracking-widest border border-white/10">
                      {plant.name || plant.species || plant.tag || plant.type}
                    </span>
                    {plant.health < 30 && (
                      <span className="px-2 py-0.5 rounded-lg bg-rose-500 text-white text-[7px] font-black uppercase tracking-widest animate-pulse">
                        需关注
                      </span>
                    )}
                  </div>

                </div>

                {/* Compact Info Area */}
                <div className={cn(
                  "p-4 flex flex-col flex-1",
                  filteredPlants.length === 1 ? "p-6 justify-center" : "gap-3"
                )}>
                  <button type="button" onClick={() => goToPlant(plant, 'interaction')} className="flex flex-col text-left">
                    <div className="flex justify-between items-start">
                      <h4 className={cn("font-black tracking-tight line-clamp-1 flex-1", filteredPlants.length === 1 ? "text-xl" : "text-sm")}>{plant.name}</h4>
                      <span className={cn(
                        "font-black italic ml-2",
                        filteredPlants.length === 1 ? "text-lg" : "text-xs",
                        plant.health > 70 ? "text-green-500" : plant.health > 30 ? "text-amber-500" : "text-rose-500"
                      )}>
                        {plant.health}%
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      {plant.owners?.length > 1 ? (
                        <div className="flex items-center gap-1.5">
                          <div className="flex -space-x-1.5">
                            {plant.owners.slice(0, 3).map((ownerName: string, i: number) => {
                              const isMe = ownerName === (user?.user_metadata?.name || user?.email?.split('@')[0]);
                              return (
                                <div 
                                  key={i} 
                                  className={cn(
                                    "w-5 h-5 rounded-full border border-white flex items-center justify-center text-[7px] font-black uppercase shadow-sm transition-transform hover:scale-110 hover:z-10",
                                    isMe ? "bg-black text-white" : "bg-gray-100 text-gray-500"
                                  )}
                                  title={ownerName}
                                >
                                  {isMe ? '我' : ownerName[0]}
                                </div>
                              );
                            })}
                            {plant.owners.length > 3 && (
                              <div className="w-5 h-5 rounded-full bg-gray-50 border border-white flex items-center justify-center text-[6px] font-black text-gray-400">
                                +{plant.owners.length - 3}
                              </div>
                            )}
                          </div>
                          <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest truncate max-w-[80px]">
                            {plant.owners.length}位守护者
                          </span>
                        </div>
                      ) : (
                        // Individual claim, no special label needed to keep it clean
                        <div className="h-5" /> 
                      )}
                    </div>
                  </button>

                  <div className={cn(
                    "flex gap-2 border-t border-black/5 pt-3",
                    filteredPlants.length === 1 ? "mt-6" : "mt-0"
                  )}>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        goToPlant(plant, 'mood');
                      }}
                      className="flex-1 py-3 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-orange-50 hover:text-orange-500 transition-colors"
                    >
                      <Smile size={16} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        goToPlant(plant, 'journal');
                      }}
                      className="flex-1 py-3 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-blue-50 hover:text-blue-500 transition-colors"
                    >
                      <Notebook size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )) : !isLoading && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="col-span-2 relative overflow-hidden py-16 px-8 text-center bg-gradient-to-b from-white to-gray-50/50 border border-black/5 rounded-[48px] flex flex-col items-center gap-6 shadow-sm group"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500/20 to-transparent" />
                
                <div className="relative">
                  <div className="w-24 h-24 rounded-[32px] bg-green-50 flex items-center justify-center text-green-500 mb-2 rotate-3 group-hover:rotate-0 transition-transform duration-500 shadow-inner">
                    <Sprout size={48} strokeWidth={1.5} />
                  </div>
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                    className="absolute -top-2 -right-2 text-amber-400"
                  >
                    <Sparkles size={20} />
                  </motion.div>
                </div>

                <div className="space-y-2 max-w-[240px]">
                  <h4 className="text-xl font-black tracking-tight text-gray-900">心之花园待启封</h4>
                  <p className="text-[11px] font-bold text-gray-400 leading-relaxed uppercase tracking-wide">
                    每一颗种子都藏着一段未完待续的故事，在这里种下你的第一份期待吧。
                  </p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/discover')}
                  className="mt-2 px-8 py-4 bg-black text-white rounded-[24px] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-black/10 flex items-center gap-2 group/btn"
                >
                  <span>寻觅我的森灵</span>
                  <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                </motion.button>

                {/* Decorative background elements */}
                <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-green-500/5 rounded-full blur-3xl" />
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl" />
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}