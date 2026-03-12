import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';
import { 
  ArrowLeft, Heart, Calendar, Timer, Leaf, Sparkles, Info, 
  ShieldCheck, Award, Zap, Smile, BookOpen, Clock, Frown, Meh,
  ChevronRight, Filter, History, Loader2, Image as ImageIcon
} from 'lucide-react';
import { useEmotionalTheme } from '../context/ThemeContext';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { apiUrl, buildApiHeaders } from '../utils/api';
import { EmotionalRadarChart } from '../components/EmotionalRadarChart';
import { GoldenSentenceCard } from '../components/GoldenSentenceCard';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { cn } from '../utils/cn';
import { findPlantByAnyId, getPrimaryPlantId, getDisplayVariety, getDisplayName } from '../utils/plantIdentity';
import { prependPlantTimelineRecord, subscribeRecordCreated } from '../utils/recordRefresh';

export default function PlantProfileDetail() {
  const { plantId } = useParams();
  const resolvedPlantId = getPrimaryPlantId(plantId);
  const navigate = useNavigate();
  const { theme, themeConfig } = useEmotionalTheme();
  const [plant, setPlant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Timeline states
  const [timeline, setTimeline] = useState<any[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [filter, setFilter] = useState<'all' | 'journal' | 'mood'>('all');

  const fetchPlant = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/plants'), {
        headers: await buildApiHeaders()
      });
      
      if (res.ok) {
        const data = await res.json();
        const found = findPlantByAnyId(data, resolvedPlantId || plantId);
        if (found) setPlant(found);
      }
    } catch (e) {
      console.error('Error fetching plant detail:', e);
    } finally {
      setLoading(false);
    }
  }, [plantId, resolvedPlantId]);

  const fetchTimeline = useCallback(async (pageNum: number, isNewFilter = false) => {
    if (!resolvedPlantId && !plantId) return;
    setTimelineLoading(true);
    try {
      const res = await fetch(apiUrl(`/plant-timeline/${resolvedPlantId || plantId}?page=${pageNum}&limit=10`), {
        headers: await buildApiHeaders()
      });
      
      if (res.ok) {
        const data = await res.json();
        if (isNewFilter || pageNum === 1) {
          setTimeline(data.items);
        } else {
          setTimeline(prev => [...prev, ...data.items]);
        }
        setHasMore(data.hasMore);
        setPage(pageNum);
      }
    } catch (e) {
      console.error('Error fetching timeline:', e);
    } finally {
      setTimelineLoading(false);
    }
  }, [plantId, resolvedPlantId]);

  useEffect(() => {
    fetchPlant();
    fetchTimeline(1);
  }, [fetchPlant, fetchTimeline]);

  useEffect(() => {
    const unsubscribe = subscribeRecordCreated((event) => {
      const detail = event.detail;
      if (!findPlantByAnyId([{ id: resolvedPlantId || plantId, originalId: resolvedPlantId || plantId }], detail.plantId || detail.originalId || detail.rawRecord)) {
        return;
      }

      setTimeline((prev) => prependPlantTimelineRecord(prev, detail.rawRecord, resolvedPlantId || plantId));
      fetchPlant();
      fetchTimeline(1, true);
    });

    return unsubscribe;
  }, [fetchPlant, fetchTimeline, plantId, resolvedPlantId]);

  const loadMore = () => {
    if (!timelineLoading && hasMore) {
      fetchTimeline(page + 1);
    }
  };

  /** 守护天数：优先用接口的 days，否则从认领/创建日期起算到今日 */
  const guardianDays = (() => {
    if (plant?.days != null && Number.isFinite(Number(plant.days))) return Math.max(0, Math.floor(Number(plant.days)));
    const raw = plant?.adoptedAt ?? plant?.created_at ?? plant?.createdAt ?? plant?.plantingDate ?? plant?.addedDate;
    if (!raw) return 0;
    const start = new Date(raw);
    if (Number.isNaN(start.getTime())) return 0;
    const today = new Date();
    start.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return Math.max(0, Math.floor((today.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)));
  })();

  const getMoodIcon = (mood?: string) => {
    switch (mood) {
      case 'happy': return <Smile className="text-pink-500" size={16} />;
      case 'sad': return <Frown className="text-blue-400" size={16} />;
      case 'meh': return <Meh className="text-gray-400" size={16} />;
      default: return <Heart className="text-red-400" size={16} />;
    }
  };

  const filteredTimeline = timeline.filter(item => {
    if (filter === 'all') return true;
    return item.type === filter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full" 
        />
      </div>
    );
  }

  if (!plant) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center gap-4">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
          <Info size={40} />
        </div>
        <h2 className="text-xl font-black">未找到植物信息</h2>
        <button onClick={() => navigate(-1)} className="px-6 py-3 bg-black text-white rounded-xl font-bold">返回</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-500 pb-12" style={{ backgroundColor: themeConfig.bg }}>
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl px-4 py-4 flex items-center justify-between border-b border-black/5">
        <button onClick={() => navigate(-1)} className="p-2 text-gray-500 hover:text-black transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1 text-center">
           <h1 className="text-sm font-black uppercase tracking-widest opacity-40">植物详细档案</h1>
        </div>
        <div className="w-10" />
      </div>

      <div className="px-6 pt-8 flex flex-col gap-8">
        {/* Plant Summary Card */}
        <Motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[40px] overflow-hidden shadow-xl border border-black/5"
        >
          <div className="aspect-square relative">
            <img src={plant.image} className="w-full h-full object-cover" alt={plant.name} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
              <div className="flex flex-col gap-2">
                <span className="text-white/80 text-xs font-bold uppercase tracking-widest">品种 · {getDisplayVariety(plant)}</span>
                <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white text-[10px] font-black w-fit uppercase tracking-widest border border-white/20">
                  {plant.type || '观叶植物'}
                </span>
                <h2 className="text-4xl font-black text-white">{getDisplayName(plant)}</h2>
              </div>
            </div>
          </div>
          
          <div className="p-8 flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">名称</span>
              <span className="text-lg font-black text-gray-900">{getDisplayName(plant)}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">品种</span>
              <span className="text-lg font-black text-gray-900">{getDisplayVariety(plant)}</span>
            </div>
            <div className="flex items-center gap-4">
               <div className="flex-1 flex flex-col gap-1">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">守护天数</span>
                  <span className="text-2xl font-black text-gray-900">{guardianDays} 天</span>
               </div>
               <div className="w-px h-10 bg-black/5" />
               <div className="flex-1 flex flex-col gap-1">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">健康状态</span>
                  <span className="text-2xl font-black text-green-500">{plant.health}%</span>
               </div>
            </div>
          </div>
        </Motion.div>

        {/* Detailed Info Cards */}
        <div className="flex flex-col gap-4">
           <div className="bg-white rounded-[32px] p-6 shadow-sm border border-black/5 flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                 <div className="flex items-center gap-2">
                    <Heart size={16} className="text-pink-500 fill-pink-500/20" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-pink-600">情感寓意</span>
                 </div>
                 <p className="text-sm font-black text-pink-900 leading-relaxed italic">
                    “ {plant.emotionalMeaning || "在静默的时光里，它是你最长情的告白。"} ”
                 </p>
              </div>

              <div className="h-px bg-black/5" />

              <div className="grid grid-cols-2 gap-4">
                 <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-gray-400">
                       <Calendar size={12} />
                       <span className="text-[10px] font-bold uppercase tracking-widest">领养日期</span>
                    </div>
                    <span className="text-sm font-black text-gray-800">
                      {(() => {
                        const raw = plant.adoptedAt || plant.created_at || plant.plantingDate;
                        if (!raw) return '—';
                        const d = new Date(raw);
                        return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('zh-CN');
                      })()}
                    </span>
                 </div>
                 <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-gray-400">
                       <Timer size={12} />
                       <span className="text-[10px] font-bold uppercase tracking-widest">预计寿命</span>
                    </div>
                    <span className="text-sm font-black text-gray-800">{plant.lifespan || '5-10 年'}</span>
                 </div>
              </div>
              
              <div className="h-px bg-black/5" />
              
              <div className="flex flex-col gap-2">
                 <div className="flex items-center gap-1.5 text-gray-400">
                    <Leaf size={12} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">生长习性</span>
                 </div>
                 <p className="text-xs font-bold leading-relaxed text-gray-500">
                    {plant.habits || '该植物喜欢半阴环境，适宜温度在18-28℃之间，需要保持盆土微润但不积水。'}
                 </p>
              </div>
           </div>

           <GoldenSentenceCard sentence={plant.goldenSentence} />

           <div className="bg-white rounded-[32px] p-6 shadow-sm border border-black/5 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                 <Sparkles size={16} className="text-amber-500" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">情感互动画像</span>
              </div>
              <EmotionalRadarChart dimensions={plant.dimensions} />
           </div>

           {/* New Care Stats or Badges */}
           <div className="bg-white rounded-[32px] p-6 shadow-sm border border-black/5 grid grid-cols-2 gap-4">
              <div className="bg-blue-50/50 p-4 rounded-2xl flex flex-col gap-1">
                 <Award size={20} className="text-blue-500 mb-1" />
                 <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">养护称号</span>
                 <span className="text-xs font-black text-blue-900">细心守护者</span>
              </div>
              <div className="bg-teal-50/50 p-4 rounded-2xl flex flex-col gap-1">
                 <ShieldCheck size={20} className="text-teal-500 mb-1" />
                 <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest">守护等级</span>
                 <span className="text-xs font-black text-teal-900">LV.5 生命共鸣</span>
              </div>
           </div>

           {/* Memory Archive Section */}
           <div className="bg-white rounded-[32px] p-6 shadow-sm border border-black/5 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <History size={16} className="text-indigo-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">生命成长记忆档案</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setFilter('all')}
                      className={cn(
                        "text-[9px] font-black px-2 py-1 rounded-full transition-all border",
                        filter === 'all' ? "bg-indigo-500 text-white border-indigo-500" : "bg-transparent text-gray-400 border-gray-100"
                      )}
                    >全部</button>
                    <button 
                      onClick={() => setFilter('journal')}
                      className={cn(
                        "text-[9px] font-black px-2 py-1 rounded-full transition-all border",
                        filter === 'journal' ? "bg-indigo-500 text-white border-indigo-500" : "bg-transparent text-gray-400 border-gray-100"
                      )}
                    >日志</button>
                    <button 
                      onClick={() => setFilter('mood')}
                      className={cn(
                        "text-[9px] font-black px-2 py-1 rounded-full transition-all border",
                        filter === 'mood' ? "bg-indigo-500 text-white border-indigo-500" : "bg-transparent text-gray-400 border-gray-100"
                      )}
                    >心情</button>
                 </div>
              </div>

              <div className="flex flex-col gap-4">
                 <AnimatePresence mode="popLayout">
                    {filteredTimeline.length > 0 ? (
                       filteredTimeline.map((item, idx) => (
                          <Motion.div 
                            key={item.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => {
                              if (item.type === 'journal') navigate(`/journal-detail/${item.id}`);
                              else if (item.type === 'mood') navigate(`/mood-detail/${item.id}`);
                            }}
                            className="group flex gap-4 p-4 rounded-2xl border border-black/5 hover:bg-gray-50/50 hover:border-black/10 transition-all cursor-pointer"
                          >
                             <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm" style={{ 
                               backgroundColor: item.type === 'journal' ? '#ECFDF5' : '#FDF2F8'
                             }}>
                                {item.type === 'journal' ? <BookOpen size={16} className="text-emerald-500" /> : getMoodIcon(item.mood)}
                             </div>
                             
                             <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                                <div className="flex items-center justify-between gap-2">
                                   <span className="text-[10px] font-black text-gray-400 flex items-center gap-1">
                                      <Clock size={10} />
                                      {new Date(item.timestamp).toLocaleDateString()}
                                   </span>
                                   {item.type === 'journal' && (
                                      <span className="text-[9px] font-bold bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded uppercase">Journal</span>
                                   )}
                                   {item.type === 'mood' && (
                                      <span className="text-[9px] font-bold bg-pink-50 text-pink-600 px-1.5 py-0.5 rounded uppercase">Mood</span>
                                   )}
                                </div>
                                <h4 className="text-xs font-black text-gray-900 truncate">
                                   {item.title || item.content || (item.type === 'mood' ? `心情: ${item.mood}` : '未命名记录')}
                                </h4>
                                <p className="text-[10px] font-bold text-gray-400 line-clamp-1 italic">
                                   {item.content || item.details || '点击查看详情...'}
                                </p>
                             </div>

                             <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <ChevronRight size={14} className="text-gray-300" />
                             </div>
                          </Motion.div>
                       ))
                    ) : (
                       !timelineLoading && (
                          <div className="py-12 flex flex-col items-center gap-2 text-center">
                             <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-200">
                                <History size={24} />
                             </div>
                             <p className="text-xs font-bold text-gray-400">暂无此类型的档案记录</p>
                          </div>
                       )
                    )}
                 </AnimatePresence>

                 {timelineLoading && (
                    <div className="flex justify-center py-4">
                       <Loader2 size={20} className="text-indigo-500 animate-spin" />
                    </div>
                 )}

                 {hasMore && !timelineLoading && (
                    <button 
                       onClick={loadMore}
                       className="w-full py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-colors"
                    >
                       加载更多历史记忆
                    </button>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
