import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, Filter, Sparkles, ArrowRight, Leaf, Heart, Smile, Users, Video } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/cn';
import { supabase } from '../utils/supabaseClient';
import { getCache, setCache } from '../utils/cache';
import { apiGet } from '../utils/api';
import { projectId, publicAnonKey } from '/utils/supabase/info';

export function DiscoverPlants() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [plants, setPlants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [myPlantIds, setMyPlantIds] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [tickerIndex, setTickerIndex] = useState(0);
  const tickerItems = [
    "✨ 刚刚: 匿名园丁 认领了【银皇后】",
    "🍃 提示: 珍珠吊兰 进入春季生长期，适合认领",
    "💓 推荐: 今日共有 128 位园丁开启了“爱情”模式",
    "🏆 成就: 心植花园 认领总数已突破 1,000 棵"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex(prev => (prev + 1) % tickerItems.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const categories = [
    { id: 'All', label: '全部', icon: <Leaf size={14} /> },
    { id: 'Air', label: '空气净化', icon: <Sparkles size={14} /> },
    { id: 'Easy', label: '新手必备', icon: <Smile size={14} /> },
    { id: 'Healing', label: '治愈系', icon: <Heart size={14} /> },
    { id: 'Social', label: '社交神器', icon: <Users size={14} /> },
  ];

  useEffect(() => {
    const fetchLibrary = async () => {
      // 1. Try Cache First
      const cachedLibrary = getCache<any[]>('library', 300000); // 5 min
      const cachedMyPlantIds = getCache<string[]>('my-plant-ids', 60000); // 1 min

      if (cachedLibrary) {
        setPlants(cachedLibrary.filter((p: any) => p.status === 'active' || !p.status));
        if (cachedMyPlantIds) {
          setMyPlantIds(cachedMyPlantIds);
          setIsLoading(false);
        } else {
          // If we have library but not IDs, still show library but load IDs in bg
          setIsLoading(false);
        }
      }

      try {
        const libraryData = await apiGet<any[]>('/library');
        if (Array.isArray(libraryData)) {
          const activePlants = libraryData.filter((p: any) => p.status === 'active' || !p.status);
          setPlants(activePlants);
          setCache('library', libraryData);
        }

        const { data: { session } } = await supabase.auth.getSession();
        // Fetch user's plants to mark already adopted ones
        if (session?.access_token) {
          const userPlants = await apiGet<any[]>('/plants');
          if (Array.isArray(userPlants)) {
            const ids = userPlants.map((p: any) => p.originalId || p.id);
            setMyPlantIds(ids);
            setCache('my-plant-ids', ids);
          }
        }
      } catch (e) {
        console.error('Error fetching library:', e);
        if (!cachedLibrary) setPlants([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLibrary();
  }, []);

  const filteredPlants = plants.filter(plant => {
    const matchesSearch = plant.name.includes(searchTerm) || (plant.tags && plant.tags.some((tag: string) => tag.includes(searchTerm)));
    const matchesDifficulty = selectedDifficulty === 'All' || plant.difficulty.toLowerCase() === selectedDifficulty.toLowerCase();
    
    // Simple category mapping based on keywords/tags
    const matchesCategory = activeCategory === 'All' || 
      (activeCategory === 'Air' && (plant.tags?.includes('空气净化') || plant.description?.includes('空气'))) ||
      (activeCategory === 'Easy' && plant.difficulty.toLowerCase() === 'easy') ||
      (activeCategory === 'Healing' && (plant.mood?.includes('治愈') || plant.tags?.includes('治愈'))) ||
      (activeCategory === 'Social' && (plant.tags?.includes('垂吊') || plant.tags?.includes('多肉')));

    return matchesSearch && matchesDifficulty && matchesCategory;
  });

  const trendingPlants = plants.slice(0, 3);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-32">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl px-6 py-6 border-b border-black/5">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-400 hover:text-gray-900 transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-2xl font-black tracking-tight">寻觅森灵</h1>
        </div>
      </div>

      {/* Results Grid */}
      <div className="p-6">
        <div className="flex flex-col gap-10">
          {/* Trending Header if no search */}
          {!searchTerm && activeCategory === 'All' && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-xl tracking-tight">热门推荐</h3>
                  <div className="px-2 py-0.5 bg-rose-500 text-white rounded-full text-[8px] font-black uppercase tracking-widest animate-pulse">Hot</div>
                </div>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 scrollbar-hide">
                {trendingPlants.map((p) => (
                  <NavLink key={`trending-${p.id}`} to={`/adopt/${p.id}`} className="shrink-0 w-64 group">
                    <motion.div 
                      whileTap={{ scale: 0.95 }}
                      className="bg-white rounded-[40px] overflow-hidden shadow-sm border border-black/5 flex flex-col p-4"
                    >
                      <div className="h-44 w-full rounded-[32px] overflow-hidden relative">
                        <img src={p.imageUrl || p.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={p.name} />
                        <div className="absolute top-3 left-3 flex gap-1.5">
                          <span className="px-2 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[8px] font-black border border-white/20">
                            {p.mood || '#治愈'}
                          </span>
                        </div>
                      </div>
                      <div className="px-2 pt-4 flex justify-between items-center">
                        <div>
                          <h4 className="font-black text-lg leading-tight">{p.name}</h4>
                          <span className="text-[10px] font-bold text-gray-300 uppercase">认领指数 9.8</span>
                        </div>
                        <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center">
                          <ArrowRight size={16} />
                        </div>
                      </div>
                    </motion.div>
                  </NavLink>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <h3 className="font-black text-xl tracking-tight">
                {activeCategory === 'All' ? '全部品种' : categories.find(c => c.id === activeCategory)?.label}
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-black/5 text-gray-400 rounded-full">{filteredPlants.length}</span>
            </div>
            <div className="grid grid-cols-1 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredPlants.map((p, index) => (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <NavLink 
                      to={`/adopt/${p.id}`}
                      className="bg-white rounded-[40px] overflow-hidden shadow-sm border border-black/5 flex flex-col gap-0 active:scale-[0.98] transition-all group"
                    >
                      <div className="h-56 w-full relative">
                        <img src={p.imageUrl || p.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={p.name} />
                        <div className="absolute top-4 left-4 flex gap-1.5">
                          <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest border border-white/20">
                            {p.mood || '#治愈'}
                          </span>
                          {p.streamUrl && (
                            <span className="px-3 py-1 rounded-full bg-red-500/80 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest border border-white/20 flex items-center gap-1 shadow-lg animate-pulse">
                              <Video size={10} /> LIVE
                            </span>
                          )}
                        </div>
                        <div className="absolute bottom-4 right-4">
                          <div className={cn(
                            "px-3 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/20 backdrop-blur-md text-white shadow-lg",
                            p.difficulty.toLowerCase() === 'easy' ? "bg-green-500/80" : p.difficulty.toLowerCase() === 'medium' ? "bg-amber-500/80" : "bg-red-500/80"
                          )}>
                            {p.difficulty.toLowerCase() === 'easy' ? 'Lv.1 易上手' : p.difficulty.toLowerCase() === 'medium' ? 'Lv.2 进阶型' : 'Lv.3 大师级'}
                          </div>
                        </div>
                      </div>
                      <div className="p-8">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-black text-2xl tracking-tighter mb-1 leading-tight">{p.name}</h4>
                            <div className="flex gap-2 mb-3">
                              {(p.tags || []).map(tag => (
                                <span key={tag} className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded-full">#{tag}</span>
                              ))}
                            </div>
                            {p.emotionalSummary ? (
                              <div className="flex items-center gap-2 mb-4">
                                <div className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse shrink-0" />
                                <p className="text-xs font-black text-pink-600 tracking-tight leading-relaxed">
                                  {p.emotionalSummary}
                                </p>
                              </div>
                            ) : p.emotionalMeaning && (
                              <p className="text-[10px] font-bold text-pink-500 italic bg-pink-50 px-3 py-1.5 rounded-2xl border border-pink-100/50 w-fit mb-4 line-clamp-1">
                                “ {p.emotionalMeaning} ”
                              </p>
                            )}
                          </div>
                          <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300">
                             <Sparkles size={24} />
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 leading-relaxed font-medium line-clamp-2 mb-6">
                          {p.description}
                        </p>
                        <div className="flex items-center justify-between">
                           <div className="flex -space-x-2">
                              {[...Array(3)].map((_, i) => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400">
                                   {['👤', '👶', '🐱'][i]}
                                </div>
                              ))}
                              <div className="pl-4 text-[10px] font-bold text-gray-400">已有 50+ 人正在守护</div>
                           </div>
                           <div className="flex items-center gap-2 font-black text-sm uppercase tracking-widest">
                               {myPlantIds.includes(p.id) ? (
                                 <span className="text-gray-300">已认领</span>
                               ) : (
                                 <span className="text-green-500 flex items-center gap-2">去认领 <ArrowRight size={18} /></span>
                               )}
                           </div>
                        </div>
                      </div>
                    </NavLink>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {filteredPlants.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center gap-4">
               <div className="w-20 h-20 rounded-[32px] bg-gray-100 flex items-center justify-center text-gray-300">
                  <Leaf size={40} />
               </div>
               <div>
                  <h3 className="text-lg font-black text-gray-900">没有匹配的植物</h3>
                  <p className="text-sm text-gray-400 font-medium mt-1">换个关键词或者调整筛选条件试试吧</p>
               </div>
               <button 
                onClick={() => {setSearchTerm(''); setSelectedDifficulty('All');}}
                className="mt-4 px-6 py-3 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg"
               >
                 清除所有筛选
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}