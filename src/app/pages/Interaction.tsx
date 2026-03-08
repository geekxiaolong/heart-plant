import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import { Droplets, Zap, Camera, Heart, Thermometer, ChevronRight, ChevronLeft, ChevronDown, History, Smile, PenTool, CameraOff, Plus, Info, Calendar, Timer, Leaf, Sparkles, Activity, Wifi, Notebook, BarChart3, RefreshCw, Home, X, BookOpen } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { EmotionalRadarChart } from '../components/EmotionalRadarChart';
import { GoldenSentenceCard } from '../components/GoldenSentenceCard';
import { WebRTCPlayer } from '../components/WebRTCPlayer';
import { useEmotionalTheme, EmotionalTheme } from '../context/ThemeContext';
import { motion as Motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/cn';
import { apiUrl, buildApiHeaders } from '../utils/api';
import { toast } from 'sonner';
import { apiGet, apiPost } from '../utils/api';
import { getCache, setCache } from '../utils/cache';
import { PlantAvatar } from '../components/PlantAvatar';
import { ResponsiveContainer, AreaChart, Area, Tooltip } from 'recharts';

// --- Sub-components for Optimization ---

const TimelineItem = memo(({ event, onClick }: { event: any, onClick?: () => void }) => (
  <Motion.div 
    layout
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    onClick={onClick}
    className={cn(
      "bg-white/50 backdrop-blur-sm p-4 rounded-3xl flex gap-4 items-center transition-all",
      onClick ? "hover:bg-white hover:shadow-md cursor-pointer active:scale-[0.98]" : ""
    )}
  >
    <div className={cn("w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0", event.color)}>
      <event.icon size={20} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-black leading-tight truncate">{event.content}</p>
      <div className="flex items-center justify-between mt-0.5">
        <p className="text-[10px] font-bold text-gray-400">{event.date}</p>
        {onClick && (
          <div className="flex items-center gap-0.5 text-[8px] font-black uppercase text-blue-500 opacity-60">
            查看详情 <ChevronRight size={10} />
          </div>
        )}
      </div>
    </div>
  </Motion.div>
));

const FloatingHearts = memo(({ color }: { color: string }) => (
  <div className="absolute inset-0 pointer-events-none opacity-30">
    {[...Array(6)].map((_, i) => (
      <Motion.div
        key={i}
        initial={{ y: 400, opacity: 0 }}
        animate={{ y: -100, opacity: [0, 1, 0] }}
        transition={{ 
          duration: 3 + i, 
          repeat: Infinity, 
          delay: i * 0.5,
          ease: "linear"
        }}
        className="absolute"
        style={{ left: `${15 + i * 15}%` }}
      >
        <Heart size={20} fill={color} className="text-white" />
      </Motion.div>
    ))}
  </div>
));

// --- Main Interaction Page ---

export function Interaction() {
  const navigate = useNavigate();
  const location = useLocation();
  const hasInitializedRef = useRef(false);

  // ✅ Auth context
  const { user, loading: authLoading } = useAuth();

  // ✅ Theme context
  const { theme, setTheme, themeConfig } = useEmotionalTheme();

  // ✅ State management
  const [plants, setPlants] = useState<any[]>([]);
  const [activePlantIndex, setActivePlantIndex] = useState(() => {
    const saved = localStorage.getItem('last_viewed_plant_id');
    return 0; // Will be refined once plants load
  });
  const [loading, setLoading] = useState(true);
  const [iotData, setIotData] = useState({ temp: 24.5, humidity: 45 });
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [timelinePage, setTimelinePage] = useState(1);
  const [hasMoreTimeline, setHasMoreTimeline] = useState(true);
  const [loadingMoreTimeline, setLoadingMoreTimeline] = useState(false);
  
  const currentPlant = plants[activePlantIndex];

  const [showTimeline, setShowTimeline] = useState(false);
  const [viewCamera, setViewCamera] = useState(false);
  const [isWatering, setIsWatering] = useState(false);
  const [isFertilizing, setIsFertilizing] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [syncRate, setSyncRate] = useState(65.0);
  const [showHighSyncEffect, setShowHighSyncEffect] = useState(false);

  // Initialize syncRate from localStorage when currentPlant changes
  useEffect(() => {
    if (currentPlant?.id) {
      const saved = localStorage.getItem(`bio_resonance_rate_${currentPlant.id}`);
      setSyncRate(saved ? parseFloat(saved) : 65.0);
    }
  }, [currentPlant?.id]);

  const [hasNotifiedHighSync, setHasNotifiedHighSync] = useState(false);
  const [healthTrendData, setHealthTrendData] = useState<{day: string, health: number, mood: number, isToday: boolean}[]>([]);
  const cameraTimerRef = useRef<NodeJS.Timeout | null>(null);
  const calculateBVI = useCallback(() => {
    if (!currentPlant || !timelineEvents) return;

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const todayIndex = (new Date().getDay() + 6) % 7; // Convert to Mon-Sun
    const result: {day: string, health: number, mood: number, isToday: boolean}[] = [];

    // Base variables for the algorithm
    const idealTemp = 24.0;
    const idealHumid = 50.0;
    
    for (let i = 0; i <= 6; i++) {
      const dayName = days[i];
      const isPast = i < todayIndex;
      const isToday = i === todayIndex;
      
      // 1. Environmental Stability Factor (ESF)
      // Simulating historical fluctuation based on current IoT data with randomized entropy
      const dayTemp = iotData.temp + (Math.sin(i * 0.8) * 2) + (Math.random() - 0.5);
      const dayHumid = iotData.humidity + (Math.cos(i * 0.5) * 5) + (Math.random() * 2);
      const tempDev = Math.abs(dayTemp - idealTemp);
      const humidDev = Math.abs(dayHumid - idealHumid);
      const esf = Math.max(0, 100 - (tempDev * 4 + humidDev * 1.5));

      // 2. Interaction Frequency Factor (IFF)
      // Weighting different activities: journal > mood > action
      const dayEvents = timelineEvents.filter(e => {
        const eventDate = new Date(e.date);
        return eventDate.getDay() === (i + 1) % 7; // Map back to JS getDay
      });
      
      const actionWeight = dayEvents.filter(e => e.type === 'activity').length * 5;
      const moodWeight = dayEvents.filter(e => e.type === 'mood').length * 12;
      const journalWeight = dayEvents.filter(e => e.type === 'journal').length * 25;
      const iff = Math.min(100, (isPast ? (40 + actionWeight + moodWeight + journalWeight) : 0));

      // 3. Resonance Synergy (RS)
      // Today's sync rate acts as a momentum multiplier for the whole week's potential
      const rs = (syncRate / 100) * 20;

      // 4. Biological Decay & Momentum
      // Health doesn't change instantly; it has "mass" (inertia)
      const prevHealth = i > 0 ? result[i-1].health : 75;
      
      // FINAL CALCULATION: Weighted average + Entropy + Momentum
      let rawHealth = (esf * 0.4 + iff * 0.4 + rs * 1.0);
      
      // If it's today, we use real current data
      if (isToday) {
        rawHealth = (currentPlant.health || 85) * 0.7 + (syncRate * 0.3);
      } else if (!isPast) {
        // Future prediction (projection)
        rawHealth = prevHealth + (Math.random() * 4 - 2.5);
      }

      // Smoothing: 30% of previous state + 70% of current calculation
      const finalHealth = Math.min(100, Math.max(20, (prevHealth * 0.3 + rawHealth * 0.7)));
      
      result.push({
        day: dayName,
        health: Math.round(finalHealth),
        mood: Math.round(isPast || isToday ? Math.min(100, iff + rs + 20) : 0),
        isToday
      });
    }
    setHealthTrendData(result);
  }, [currentPlant, timelineEvents, syncRate, iotData]);

  useEffect(() => {
    calculateBVI();
  }, [calculateBVI]);

  // ✅ Complex Resonance Algorithm
  const updateResonance = useCallback((increment: number, type: 'action' | 'deep' | 'passive') => {
    if (!currentPlant?.id) return;
    setSyncRate(prev => {
      let bonus = increment;
      
      // Diminishing returns after 80%
      if (prev > 80) bonus *= 0.5;
      if (prev > 92) bonus *= 0.3;

      const next = Math.min(Math.max(prev + bonus, 0), 100);
      localStorage.setItem(`bio_resonance_rate_${currentPlant.id}`, next.toFixed(2));
      localStorage.setItem(`last_resonance_update_${currentPlant.id}`, Date.now().toString());
      return next;
    });
  }, [currentPlant?.id]);

  // ✅ Passive Connection: Camera Monitoring logic
  useEffect(() => {
    if (viewCamera) {
      cameraTimerRef.current = setInterval(() => {
        updateResonance(0.2, 'passive'); // Small gain for "Watching"
      }, 10000); // Every 10 seconds
    } else {
      if (cameraTimerRef.current) clearInterval(cameraTimerRef.current);
    }
    return () => {
      if (cameraTimerRef.current) clearInterval(cameraTimerRef.current);
    };
  }, [viewCamera, updateResonance]);

  // ✅ Resonance Decay: Natural loss over time
  useEffect(() => {
    if (!currentPlant?.id) return;
    const lastUpdate = localStorage.getItem(`last_resonance_update_${currentPlant.id}`);
    if (lastUpdate) {
      const hoursPassed = (Date.now() - parseInt(lastUpdate)) / (1000 * 60 * 60);
      if (hoursPassed >= 6) {
        const decay = Math.floor(hoursPassed / 6) * 1.0;
        setSyncRate(prev => Math.max(prev - decay, 30)); // Don't drop below 30%
      }
    }
  }, [currentPlant?.id]);

  // ✅ 使用 useCallback 稳定回调函数引用
  const handleWebRTCError = useCallback((err: Error) => {
    console.error('WebRTC Error:', err);
  }, []);

  const handleWebRTCConnected = useCallback(() => {
    console.log('WebRTC Connected successfully');
  }, []);

  const fetchPlants = useCallback(async () => {
    const cacheKey = `plants-${user?.id}`;
    const cached = getCache<any[]>(cacheKey, 60000); // 1 min

    const initialPlantId = location.state?.plantId || localStorage.getItem('last_viewed_plant_id');

    if (cached) {
      // Ensure cached data has avatarType
      const AVATAR_TYPES = ['succulent', 'cactus', 'pothos', 'sunflower', 'monstera', 'snakeplant'];
      const processedCached = cached.map((plant: any) => {
        if (plant.avatarType) return plant;
        
        let avatarType = 'succulent';
        // Try to match based on plant name or species
        const name = (plant.name || '').toLowerCase();
        const species = (plant.species || '').toLowerCase();
        const combined = name + ' ' + species;
        
        if (combined.includes('仙人') || combined.includes('cactus') || combined.includes('球')) {
          avatarType = 'cactus';
        } else if (combined.includes('向日葵') || combined.includes('sunflower') || combined.includes('菊')) {
          avatarType = 'sunflower';
        } else if (combined.includes('龟背竹') || combined.includes('monstera') || combined.includes('裂叶')) {
          avatarType = 'monstera';
        } else if (combined.includes('虎皮兰') || combined.includes('snake') || combined.includes('剑')) {
          avatarType = 'snakeplant';
        } else if (combined.includes('绿萝') || combined.includes('pothos') || combined.includes('蕨') || combined.includes('fern') || combined.includes('藤') || combined.includes('吊兰')) {
          avatarType = 'pothos';
        } else if (combined.includes('多肉') || combined.includes('succulent') || combined.includes('莲') || combined.includes('玉露')) {
          avatarType = 'succulent';
        } else {
          // Fallback to deterministic hash if no keyword match
          let hash = 0;
          const str = plant.id || plant.name || 'default';
          for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
          }
          avatarType = AVATAR_TYPES[Math.abs(hash) % AVATAR_TYPES.length];
        }
        
        return { ...plant, avatarType };
      });

      setPlants(processedCached);
      setLoading(false);
      
      if (!hasInitializedRef.current && initialPlantId && processedCached?.length) {
        const index = processedCached.findIndex((p: any) => p.id === initialPlantId);
        if (index !== -1) {
          setActivePlantIndex(index);
        }
        hasInitializedRef.current = true;
      }
    }

    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const token = currentSession?.access_token;
      
      if (!token) {
        setPlants([]);
        setLoading(false);
        return;
      }

      const res = await fetch(apiUrl('/plants'), {
        headers: await buildApiHeaders()
      });
      
      if (res.ok) {
        const data = await res.json();
        // Assign deterministic avatar type based on ID
        const AVATAR_TYPES = ['succulent', 'cactus', 'pothos', 'sunflower', 'monstera', 'snakeplant'];
        const processedData = (data || []).map((plant: any) => {
          let avatarType = 'succulent';
          
          // Try to match based on plant name or species
          const name = (plant.name || '').toLowerCase();
          const species = (plant.species || '').toLowerCase();
          const combined = name + ' ' + species;
          
          if (combined.includes('仙人') || combined.includes('cactus') || combined.includes('球')) {
            avatarType = 'cactus';
          } else if (combined.includes('向日葵') || combined.includes('sunflower') || combined.includes('菊')) {
            avatarType = 'sunflower';
          } else if (combined.includes('龟背竹') || combined.includes('monstera') || combined.includes('裂叶')) {
            avatarType = 'monstera';
          } else if (combined.includes('虎皮兰') || combined.includes('snake') || combined.includes('剑')) {
            avatarType = 'snakeplant';
          } else if (combined.includes('绿萝') || combined.includes('pothos') || combined.includes('蕨') || combined.includes('fern') || combined.includes('藤') || combined.includes('吊兰')) {
            avatarType = 'pothos';
          } else if (combined.includes('多肉') || combined.includes('succulent') || combined.includes('莲') || combined.includes('玉露')) {
            avatarType = 'succulent';
          } else {
            // Fallback to deterministic hash if no keyword match
            let hash = 0;
            const str = plant.id || plant.name || 'default';
            for (let i = 0; i < str.length; i++) {
              hash = str.charCodeAt(i) + ((hash << 5) - hash);
            }
            avatarType = AVATAR_TYPES[Math.abs(hash) % AVATAR_TYPES.length];
          }
          
          return { ...plant, avatarType };
        });
        
        setPlants(processedData);
        setCache(cacheKey, processedData);
        
        if (!hasInitializedRef.current && initialPlantId && processedData?.length) {
          const index = processedData.findIndex((p: any) => p.id === initialPlantId);
          if (index !== -1) {
            setActivePlantIndex(index);
          }
          hasInitializedRef.current = true;
        }
      } else {
        if (!cached) setPlants([]);
      }
    } catch (e) {
      if (!cached) setPlants([]);
    } finally {
      setLoading(false);
    }
  }, [location.state?.plantId, user?.id]);

  useEffect(() => {
    if (authLoading) return;
    fetchPlants();
  }, [authLoading, fetchPlants]);

  useEffect(() => {
    if (syncRate >= 96 && !hasNotifiedHighSync) {
      setShowHighSyncEffect(true);
      setHasNotifiedHighSync(true);
      if (currentPlant?.id) {
        sessionStorage.setItem(`high_sync_notified_${currentPlant.id}`, 'true');
      }
      toast.info('灵魂契合中... ✨', {
        description: `你与 ${currentPlant?.name || '植物'} 达到了生命最高频段的共鸣`,
      });
      setTimeout(() => setShowHighSyncEffect(false), 5000);
    } else if (syncRate < 90 && hasNotifiedHighSync) {
      // Reset notification flag if sync rate drops below 90% (hysteresis)
      setHasNotifiedHighSync(false);
      if (currentPlant?.id) {
        sessionStorage.removeItem(`high_sync_notified_${currentPlant.id}`);
      }
    }
  }, [syncRate, currentPlant?.id, currentPlant?.name, hasNotifiedHighSync]);

  // Reset flag state correctly when switching plants from persistent storage
  useEffect(() => {
    if (currentPlant?.id) {
      const isNotified = sessionStorage.getItem(`high_sync_notified_${currentPlant.id}`) === 'true';
      setHasNotifiedHighSync(isNotified);
    }
  }, [currentPlant?.id]);

  // ✅ Persist current plant choice
  useEffect(() => {
    if (currentPlant?.id) {
      localStorage.setItem('last_viewed_plant_id', currentPlant.id);
    }
  }, [currentPlant?.id]);

  useEffect(() => {
    if (!currentPlant) return;
    
    setIotData({ 
      temp: currentPlant.temp || 24.5, 
      humidity: currentPlant.humidity || 45 
    });

    const interval = setInterval(() => {
      setIotData(prev => ({
        temp: +(prev.temp + (Math.random() * 0.4 - 0.2)).toFixed(1),
        humidity: +(prev.humidity + (Math.random() * 0.6 - 0.3)).toFixed(1)
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [currentPlant?.id]);

  const fetchTimeline = useCallback(async (page: number = 1, isLoadMore: boolean = false) => {
    if (!currentPlant?.id) return;

    if (isLoadMore) setLoadingMoreTimeline(true);

    const cacheKey = `timeline-${currentPlant.id}-p${page}`;
    const cached = getCache<any>(cacheKey, 30000); // 30 sec

    if (cached && !isLoadMore) {
      setTimelineEvents(cached.items);
      setHasMoreTimeline(cached.hasMore);
      setTimelinePage(page);
    }

    try {
      const response = await apiGet<any>(`/plant-timeline/${currentPlant.id}?page=${page}&limit=10`);
      const { items, hasMore } = response;
      
      const mapped = items.map((e: any) => {
        let icon = History;
        let color = 'text-gray-500';
        let content = '';
        
        if (e.type === 'activity') {
          if (e.actionType === 'watering') {
            icon = Droplets;
            color = 'text-blue-500';
            content = `${e.userName} 远程浇了水`;
          } else if (e.actionType === 'fertilizing') {
            icon = Zap;
            color = 'text-amber-500';
            content = `${e.userName} 送来了金色养料`;
          } else if (e.actionType === 'joining') {
            icon = Heart;
            color = 'text-rose-500';
            content = e.details || `${e.userName} 加入了守护`;
          }
        } else if (e.type === 'mood') {
          icon = Smile;
          color = 'text-orange-500';
          content = `心情打卡：${e.mood} - ${e.content}`;
        } else if (e.type === 'journal') {
          icon = PenTool;
          color = 'text-purple-500';
          content = `合写日记：《${e.title}》`;
        }
        
        return {
          id: e.id,
          originalId: e.id, 
          type: e.type,
          date: new Date(e.timestamp).toLocaleString('zh-CN', { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          content,
          icon,
          color
        };
      });

      if (isLoadMore) {
        setTimelineEvents(prev => [...prev, ...mapped]);
      } else {
        setTimelineEvents(mapped);
      }
      
      setHasMoreTimeline(hasMore);
      setTimelinePage(page);
      setCache(cacheKey, { items: mapped, hasMore });
    } catch (e: any) {
      console.error("Fetch timeline error:", e);
      if (!isLoadMore && !cached) setTimelineEvents([]);
    } finally {
      setLoadingMoreTimeline(false);
    }
  }, [currentPlant?.id]);

  const loadMoreTimeline = () => {
    if (!hasMoreTimeline || loadingMoreTimeline) return;
    fetchTimeline(timelinePage + 1, true);
  };

  useEffect(() => {
    setTimelineEvents([]);
    setTimelinePage(1);
    setHasMoreTimeline(true);
    fetchTimeline();
  }, [fetchTimeline]);

  useEffect(() => {
    if (currentPlant?.type && currentPlant.type !== theme) {
      setTheme(currentPlant.type as EmotionalTheme);
    }
  }, [currentPlant, theme, setTheme]);

  const handleAction = async (type: 'water' | 'fertilize') => {
    if (!currentPlant) return;
    
    // Prevent multiple clicks while action is in progress
    if (type === 'water' && isWatering) return;
    if (type === 'fertilize' && isFertilizing) return;

    // Check for Biological Saturation (Cooldowns)
    const now = Date.now();
    const lastActionKey = `last_${type}_${currentPlant.id}`;
    const lastActionTime = localStorage.getItem(lastActionKey);
    const cooldown = type === 'water' ? 4 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 4h for water, 24h for fertilizer

    if (lastActionTime && (now - parseInt(lastActionTime) < cooldown)) {
      const remaining = cooldown - (now - parseInt(lastActionTime));
      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      
      toast.error(type === 'water' ? '土壤依然湿润 💧' : '养分充足 ✨', {
        description: `植物处于“饱和状态”，请在 ${hours > 0 ? `${hours}小时` : ''}${minutes}分钟后再来互动。过度养护会降低同频感。`
      });
      
      // Penalty for over-caring
      updateResonance(-0.5, 'action'); 
      return;
    }

    const actionType = type === 'water' ? 'watering' : 'fertilizing';
    const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || '我';
    
    // Update last action time
    localStorage.setItem(lastActionKey, now.toString());

    if (type === 'water') {
      setIsWatering(true);
      updateResonance(2.5, 'action'); // Balanced Action Gain
      toast.success('爱心水滴已送达 💧', {
        description: '情感共鸣微增'
      });
      setTimeout(() => setIsWatering(false), 2000);
    } else {
      setIsFertilizing(true);
      updateResonance(5.2, 'action'); // More specialized Action
      toast.success('金色粉末正在滋养 🌟', {
        description: '深度养护共鸣'
      });
      setTimeout(() => setIsFertilizing(false), 2000);
    }

    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const token = currentSession?.access_token;

      await fetch(apiUrl('/log-activity'), {
        method: 'POST',
        headers: {
          'apikey': publicAnonKey,
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
          ...(token ? { 'X-User-JWT': token } : {})
        },
        body: JSON.stringify({
          plantId: currentPlant.id,
          type: actionType,
          userId: user?.id || 'anonymous',
          userName: userName,
          details: type === 'water' ? '浇水养护' : '施肥养护'
        })
      });
      fetchTimeline();
      fetchPlants();
    } catch (e) {
      console.error('Error logging action:', e);
    }
  };

  const nextPlant = () => setActivePlantIndex((prev) => (prev + 1) % plants.length);
  const prevPlant = () => setActivePlantIndex((prev) => (prev - 1 + plants.length) % plants.length);

  // --- Silent Seeder Logic ---
  useEffect(() => {
    if (!currentPlant?.id || loading) return;
    
    const seedKey = `seeded_v6_love_story_${currentPlant.id}`;
    if (localStorage.getItem(seedKey)) return;

    const seedStory = async () => {
      try {
        localStorage.setItem(seedKey, 'true');
        fetchTimeline();
      } catch (err) {
        console.error('Silent seeding failed:', err);
      }
    };
    seedStory();
  }, [currentPlant?.id, loading, fetchTimeline, user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <Motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full" 
        />
      </div>
    );
  }

  if (plants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-8 text-center gap-6">
        <div className="w-24 h-24 bg-gray-50 rounded-[40px] flex items-center justify-center">
           <Heart size={40} className="text-gray-300" />
        </div>
        <div className="flex flex-col gap-2">
           <h2 className="text-2xl font-black">你还没有认领植物</h2>
           <p className="text-sm text-gray-400">去发现页认领一棵心仪的植物，开启你的互动之旅吧</p>
        </div>
        <button 
          onClick={() => navigate('/discover')}
          className="px-8 py-4 bg-black text-white rounded-2xl font-bold shadow-xl active:scale-95 transition-all"
        >
          前往发现页
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* High Sync Effect Overlay */}
      <AnimatePresence>
        {showArchive && (
          <Motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end justify-center"
            onClick={() => setShowArchive(false)}
          >
            <Motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-lg bg-white rounded-t-[40px] p-8 pb-12 flex flex-col gap-8 shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-200 rounded-full" />
              
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <h3 className="text-2xl font-black italic">成长档案</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Archive & Memories</p>
                </div>
                <button 
                  onClick={() => setShowArchive(false)}
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 active:scale-90 transition-transform"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <button 
                  onClick={() => { setShowArchive(false); navigate(`/plant-profile/${currentPlant.id}`); }}
                  className="w-full p-6 flex items-center gap-5 bg-gray-50 rounded-[32px] hover:bg-gray-100 transition-all active:scale-[0.98] group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-sm">
                    <BookOpen size={28} />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="text-base font-black">植物详细档案</h4>
                    <p className="text-xs font-bold text-gray-400">查看品种、习性与守护规格</p>
                  </div>
                  <ChevronRight size={18} className="text-gray-300 group-hover:text-black transition-colors" />
                </button>

                <button 
                  onClick={() => { updateResonance(6.5, 'deep'); setShowArchive(false); navigate(`/mood/${currentPlant.id}`); }}
                  className="w-full p-6 flex items-center gap-5 bg-gray-50 rounded-[32px] hover:bg-gray-100 transition-all active:scale-[0.98] group"
                >
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm",
                    theme === 'solo' ? "bg-slate-200 text-slate-600" : "bg-orange-100 text-orange-600"
                  )}>
                    {theme === 'solo' ? <Activity size={28} /> : <Smile size={28} />}
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="text-base font-black">{theme === 'solo' ? '生理状态存档' : '每日心情打卡'}</h4>
                    <p className="text-xs font-bold text-gray-400">记录此刻的心情与生长快照</p>
                  </div>
                  <ChevronRight size={18} className="text-gray-300 group-hover:text-black transition-colors" />
                </button>

                <button 
                  onClick={() => { updateResonance(15.0, 'deep'); setShowArchive(false); navigate(`/journal/${currentPlant.id}`); }}
                  className="w-full p-6 flex items-center gap-5 bg-gray-50 rounded-[32px] hover:bg-gray-100 transition-all active:scale-[0.98] group"
                >
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm",
                    theme === 'solo' ? "bg-teal-100 text-teal-600" : "bg-purple-100 text-purple-600"
                  )}>
                    {theme === 'solo' ? <Notebook size={28} /> : <PenTool size={28} />}
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="text-base font-black">{theme === 'solo' ? '深度成长手记' : '亲密合写日记'}</h4>
                    <p className="text-xs font-bold text-gray-400">沉淀长篇文字与深度生命感悟</p>
                  </div>
                  <ChevronRight size={18} className="text-gray-300 group-hover:text-black transition-colors" />
                </button>
              </div>

              <div className="mt-2 p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-[32px] border border-orange-100 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-amber-500 shadow-sm">
                  <Sparkles size={20} />
                </div>
                <p className="text-xs font-bold text-orange-800 leading-relaxed">
                  这里的每一条记录都将永久封存在 {currentPlant.name} 的成长时空中，成为不可磨灭的生命印记。
                </p>
              </div>
            </Motion.div>
          </Motion.div>
        )}
        {showHighSyncEffect && (
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] pointer-events-none"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-white/20 to-teal-400/10 backdrop-blur-[2px]" />
            <Motion.div 
              animate={{ 
                opacity: [0, 1, 0],
                scale: [0.8, 1.2, 0.8]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] from-white/30"
            />
            {/* Shimmering particles (simplified) */}
            <div className="absolute inset-0 overflow-hidden">
               {[...Array(20)].map((_, i) => (
                 <Motion.div
                   key={i}
                   initial={{ 
                     x: Math.random() * window.innerWidth, 
                     y: window.innerHeight + 10,
                     opacity: 0 
                   }}
                   animate={{ 
                     y: -100, 
                     opacity: [0, 1, 0],
                     x: (Math.random() - 0.5) * 100 + (Math.random() * window.innerWidth)
                   }}
                   transition={{ 
                     duration: 3 + Math.random() * 2, 
                     repeat: Infinity,
                     delay: Math.random() * 2
                   }}
                   className="absolute w-1 h-1 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                 />
               ))}
            </div>
          </Motion.div>
        )}
      </AnimatePresence>

      <div className="sticky top-0 z-40 bg-white/60 backdrop-blur-xl border-b border-black/5 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={prevPlant} className="p-2 text-gray-400 active:scale-90 transition-transform hover:text-black">
            <ChevronLeft size={20} />
          </button>
        </div>
        <div className="flex flex-col items-center">
          <h2 className="text-sm font-black tracking-widest uppercase opacity-40">正在互动</h2>
          <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: themeConfig.primary }} />
             <span className="font-bold text-lg">{currentPlant.name}</span>
          </div>
        </div>
        <button onClick={nextPlant} className="p-2 text-gray-400 active:scale-90 transition-transform hover:text-black">
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="relative aspect-[4/5] w-full overflow-hidden bg-black flex items-center justify-center">
        <AnimatePresence mode="wait">
          <Motion.div 
            key={currentPlant.id}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full h-full flex items-center justify-center relative"
          >
            {/* Background Atmosphere */}
            <div className={cn("absolute inset-0 transition-opacity duration-1000", viewCamera ? "opacity-100" : "opacity-0")}>
               <img src={currentPlant.image} className="w-full h-full object-cover blur-md brightness-50" alt="" />
            </div>

            <PlantAvatar 
              size={320} 
              theme={theme} 
              type={currentPlant.avatarType}
              health={currentPlant.health} 
              humidity={iotData.humidity} 
              temp={iotData.temp}
              isWatering={isWatering}
              isFertilizing={isFertilizing}
              className={cn("transition-transform duration-500", viewCamera && "scale-110 opacity-20")}
            />
          </Motion.div>
        </AnimatePresence>
        
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
           {theme === 'kinship' && (
             <Motion.div 
               animate={{ opacity: [0.1, 0.3, 0.1] }} 
               transition={{ duration: 4, repeat: Infinity }}
               className="absolute top-10 right-10 w-48 h-48 rounded-full bg-orange-400/20 blur-[60px]" 
             />
           )}
           {theme === 'romance' && <FloatingHearts color={themeConfig.primary} />}
        </div>

        <div className="absolute top-6 left-6 pointer-events-none">
          {/* Minimal Status Tag */}
          <div className="bg-black/20 backdrop-blur-md rounded-full px-3 py-1 border border-white/10 flex items-center gap-2">
            <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", theme === 'solo' ? "bg-teal-400" : "bg-red-500")} />
            <span className="text-white text-[8px] font-black uppercase tracking-[0.2em]">
              {theme === 'solo' ? 'Focus' : 'Live'} · {currentPlant.days}D
            </span>
          </div>
        </div>

        <div className="absolute top-6 right-6 flex flex-col gap-2">
          <button
            onClick={() => setViewCamera(!viewCamera)}
            className={cn(
              "w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-all active:scale-95 border border-white/10 shadow-xl",
              viewCamera ? "bg-red-500 text-white" : "bg-black/40 text-white hover:bg-black/60"
            )}
          >
            {viewCamera ? <CameraOff size={18} /> : <Camera size={18} />}
          </button>
          <button
            onClick={() => navigate('/video-status')}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/60 transition-all active:scale-95 border border-white/10 shadow-xl"
          >
            <Activity size={18} />
          </button>
        </div>

        {/* Smart Pot Console - Bottom HUD */}
        <div className="absolute bottom-14 inset-x-6 z-20">
          <div className="bg-black/40 backdrop-blur-xl rounded-[32px] p-3 pl-5 border border-white/10 shadow-2xl flex items-center justify-between">
            <div className="flex gap-6">
              <div className="flex flex-col">
                <div className="flex items-center gap-1 text-white/40 mb-0.5">
                  <Thermometer size={10} />
                  <span className="text-[7px] font-black uppercase tracking-tighter">TEMP</span>
                </div>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-white text-sm font-black">{iotData.temp}</span>
                  <span className="text-white/30 text-[8px] font-bold">°</span>
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1 text-white/40 mb-0.5">
                  <Droplets size={10} />
                  <span className="text-[7px] font-black uppercase tracking-tighter">HUMID</span>
                </div>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-white text-sm font-black">{iotData.humidity}</span>
                  <span className="text-white/30 text-[8px] font-bold">%</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
               <Motion.button
                 whileTap={{ scale: 0.9 }}
                 onClick={() => handleAction('water')}
                 disabled={isWatering}
                 className={cn(
                   "w-20 h-11 rounded-[20px] bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center gap-2 transition-all relative overflow-hidden",
                   isWatering ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-500/30 active:scale-95"
                 )}
               >
                  <Droplets size={14} className={cn(isWatering && "animate-bounce")} />
                  <span className="text-[9px] font-black uppercase tracking-widest">浇水</span>
                  {isWatering && (
                    <Motion.div 
                      initial={{ x: '-100%' }} 
                      animate={{ x: '100%' }} 
                      transition={{ duration: 1 }}
                      className="absolute inset-0 bg-white/10 skew-x-12" 
                    />
                  )}
               </Motion.button>
               <Motion.button
                 whileTap={{ scale: 0.9 }}
                 onClick={() => handleAction('fertilize')}
                 disabled={isFertilizing}
                 className={cn(
                   "w-20 h-11 rounded-[20px] bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center gap-2 transition-all",
                   isFertilizing ? "opacity-50 cursor-not-allowed" : "hover:bg-amber-500/30 active:scale-95"
                 )}
               >
                  <Zap size={14} className={cn(isFertilizing && "animate-pulse")} />
                  <span className="text-[9px] font-black uppercase tracking-widest">施肥</span>
               </Motion.button>
            </div>
          </div>
        </div>

        {/* Camera View Overlay */}
        <Motion.div 
          initial={false}
          animate={{ 
            opacity: viewCamera ? 1 : 0,
            scale: viewCamera ? 1 : 0.9,
            y: viewCamera ? 0 : 20
          }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="absolute inset-0 flex items-center justify-center p-6 z-30"
          style={{ pointerEvents: viewCamera ? 'auto' : 'none' }}
        >
          <div className="w-full h-[65%] max-h-[500px] aspect-[9/16] rounded-[40px] border border-white/20 shadow-[0_32px_64px_rgba(0,0,0,0.5)] overflow-hidden relative bg-black">
             <button
               onClick={() => setViewCamera(false)}
               className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white backdrop-blur-md transition-all active:scale-90 border border-white/10"
             >
               <X size={16} />
             </button>

             <WebRTCPlayer 
               streamUrl={`http://192.168.92.162:8889/${currentPlant?.streamPath || 'heartplant'}/whep`}
               rtspUrl={currentPlant?.streamUrl || "rtsp://admin:reolink123@192.168.92.202:554"}
               onError={handleWebRTCError}
               onConnected={handleWebRTCConnected}
               enableDebug={false}
             />

              <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 to-transparent flex flex-col gap-2 pointer-events-none">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1 bg-red-500 text-white px-1.5 py-0.5 rounded-full text-[6px] font-black uppercase">
                    <div className="w-1 h-1 rounded-full bg-white animate-pulse" /> Live
                  </div>
                  <div className="text-white/30 text-[6px] font-mono uppercase tracking-tighter flex items-center gap-1">
                    <Wifi size={6} /> 4K WHEP
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { icon: Thermometer, value: iotData.temp, unit: '°', label: 'T' },
                    { icon: Droplets, value: iotData.humidity, unit: '%', label: 'H' },
                    { icon: Sparkles, value: currentPlant.health || 95, unit: '%', label: 'L' },
                    { icon: Activity, value: 'OK', unit: '', label: 'S' },
                  ].map((s, i) => (
                    <div key={i} className="bg-white/5 bg-blur-md rounded-lg p-1 flex flex-col items-center gap-0 border border-white/5">
                      <s.icon size={6} className="text-white/20" />
                      <span className="text-[7px] font-black text-white/80 leading-tight">{s.value}{s.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
          </div>
        </Motion.div>
      </div>

      <div 
        className="flex-1 -mt-8 bg-white rounded-t-[40px] shadow-[0_-20px_50px_rgba(0,0,0,0.1)] relative z-10 p-6 flex flex-col gap-8 pb-32 transition-colors duration-500"
        style={{ backgroundColor: themeConfig.bg }}
      >
        {/* Flat Records Center */}
        <div className="flex flex-col gap-4">
           <div className="flex items-center justify-between">
              <h3 className="font-black text-lg">养护与生命档案</h3>
              <div className="flex -space-x-2">
                  {(currentPlant.owners || []).map((o: string, i: number) => (
                    <div key={i} className="w-6 h-6 rounded-full bg-white shadow-sm border border-black/5 flex items-center justify-center text-[8px] font-black uppercase text-gray-500">
                        {o[0]}
                    </div>
                  ))}
                  <button 
                    onClick={() => navigate(`/ceremony/${currentPlant.id}`)}
                    className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center shadow-sm active:scale-90 transition-all cursor-pointer"
                  >
                    <Plus size={10} />
                  </button>
              </div>
           </div>

           <div className="grid grid-cols-3 gap-3">
              {[
                { 
                  id: 'profile', 
                  label: '植物档案', 
                  icon: BookOpen, 
                  color: 'bg-blue-50 text-blue-500', 
                  path: `/plant-profile/${currentPlant.id}` 
                },
                { 
                  id: 'mood', 
                  label: theme === 'solo' ? '生理快照' : '心情打卡', 
                  icon: theme === 'solo' ? Activity : Smile, 
                  color: theme === 'solo' ? 'bg-slate-50 text-slate-500' : 'bg-orange-50 text-orange-500', 
                  path: `/mood/${currentPlant.id}` 
                },
                { 
                  id: 'journal', 
                  label: theme === 'solo' ? '生长手记' : '亲密日记', 
                  icon: theme === 'solo' ? Notebook : PenTool, 
                  color: theme === 'solo' ? 'bg-teal-50 text-teal-600' : 'bg-purple-50 text-purple-500', 
                  path: `/journal/${currentPlant.id}` 
                },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className="bg-white rounded-[24px] p-4 flex flex-col items-center gap-3 shadow-sm border border-black/5 active:scale-95 transition-all group"
                >
                  <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform", item.color)}>
                    <item.icon size={20} />
                  </div>
                  <span className="text-[10px] font-black text-gray-800 text-center leading-tight">{item.label}</span>
                </button>
              ))}
           </div>
        </div>

        {/* Growth & Emotional Insight Center */}
        <div className="flex flex-col gap-6">
           <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <h3 className="font-black text-lg">生命特征与情绪洞察</h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Growth & Mood Analytics</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shadow-sm">
                <Sparkles size={20} />
              </div>
           </div>

           {/* Stats Summary Grid */}
           <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/80 backdrop-blur-md p-4 rounded-[28px] border border-white/40 shadow-sm flex flex-col gap-1">
                 <span className="text-[8px] font-black text-gray-400 uppercase">本周健康趋势</span>
                 <div className="flex items-end gap-1">
                    <span className="text-2xl font-black text-gray-800">92%</span>
                    <div className="flex items-center text-[10px] font-black text-green-500 mb-1">
                       <Plus size={10} /> 4.2%
                    </div>
                 </div>
                 <div className="w-full h-1 bg-gray-100 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: '92%' }} />
                 </div>
              </div>
               <div className="bg-white/80 backdrop-blur-md p-4 rounded-[28px] border border-white/40 shadow-sm flex flex-col gap-1">
                 <span className="text-[8px] font-black text-gray-400 uppercase">情感共鸣度</span>
                 <div className="flex items-end gap-1">
                    <span className="text-2xl font-black text-gray-800">{(syncRate / 10).toFixed(1)}</span>
                    <span className="text-[10px] font-black text-gray-400 mb-1">/10</span>
                 </div>
                 <div className="flex gap-1 mt-2">
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className={cn("flex-1 h-1 rounded-full transition-colors duration-500", i < (syncRate / 10) ? "bg-blue-500" : "bg-gray-100")} />
                    ))}
                 </div>
              </div>
           </div>

           {/* Bio-Resonance Field Module */}
           <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[40px] border border-white/40 shadow-xl shadow-black/5 flex flex-col gap-8 relative overflow-hidden group">
              {/* Decorative Background */}
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <Heart size={80} className="text-gray-900" />
              </div>

              <div className="flex flex-col gap-1 relative z-10">
                <h3 className="font-black text-lg flex items-center gap-2">
                  生命同频场 
                  <span className="px-2 py-0.5 rounded-full bg-black text-white text-[8px] font-black uppercase tracking-widest">Experimental</span>
                </h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Bio-Resonance Index</p>
              </div>

              <div className="flex items-center justify-between gap-6 relative z-10">
                {/* Visual Resonance Core */}
                <div className="relative w-32 h-32 flex items-center justify-center">
                   {/* Plant Pulse Ring */}
                   <Motion.div 
                     animate={{ 
                       scale: [1, 1.15, 1],
                       opacity: [0.3, 0.6, 0.3],
                       borderWidth: ['2px', '4px', '2px']
                     }}
                     transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                     className="absolute inset-0 rounded-full border-2"
                     style={{ borderColor: themeConfig.primary }}
                   />
                   {/* User Emotion Ring */}
                   <Motion.div 
                     animate={{ 
                       scale: [1.1, 0.95, 1.1],
                       opacity: [0.2, 0.5, 0.2],
                       borderWidth: ['2px', '6px', '2px']
                     }}
                     transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                     className="absolute inset-2 rounded-full border-2 border-blue-500/40"
                   />
                   {/* Core Icon */}
                   <div className="w-12 h-12 rounded-full bg-white shadow-xl flex items-center justify-center relative z-20">
                      <Motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 5, repeat: Infinity }}
                      >
                        <Activity size={24} style={{ color: themeConfig.primary }} />
                      </Motion.div>
                   </div>
                   
                   {/* Sync Percentage */}
                   <div className="absolute -bottom-2 bg-black text-white px-3 py-1 rounded-full text-[10px] font-black shadow-lg">
                      {syncRate}% SYNC
                   </div>
                </div>

                {/* Resonance Insights */}
                <div className="flex-1 flex flex-col gap-4">
                   <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-black text-gray-400 uppercase">当前共鸣状态</span>
                      <span className="text-xl font-black italic text-gray-800">
                        {syncRate > 95 ? '灵魂契合 · Soul Resonance' : '深层共振 · Healing'}
                      </span>
                   </div>
                   
                   <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center text-[8px] font-black uppercase">
                          <span className="text-gray-400">环境同步 Environment</span>
                          <span className="text-gray-800">{Math.min(syncRate + 4, 100)}%</span>
                        </div>
                        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                          <Motion.div 
                            initial={false}
                            animate={{ width: `${Math.min(syncRate + 4, 100)}%` }}
                            transition={{ duration: 1 }}
                            className="h-full bg-teal-400" 
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center text-[8px] font-black uppercase">
                          <span className="text-gray-400">养护律动 Rhythm</span>
                          <span className="text-gray-800">{syncRate}%</span>
                        </div>
                        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                          <Motion.div 
                            initial={false}
                            animate={{ width: `${syncRate}%` }}
                            transition={{ duration: 1 }}
                            className="h-full bg-blue-500" 
                          />
                        </div>
                      </div>
                   </div>
                </div>
              </div>

              {/* Biological Interpretation */}
              <div className="p-4 bg-gray-50 rounded-3xl border border-gray-100 flex gap-4 items-start relative z-10">
                 <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-amber-500 shrink-0">
                    <Info size={16} />
                 </div>
                 <div className="flex flex-col gap-1">
                    <h5 className="text-[10px] font-black text-gray-800">生命共感解析</h5>
                    <p className="text-[10px] font-bold text-gray-500 leading-relaxed">
                      检测到您最近 3 天的情绪记录频率与植物的叶片呼吸指数呈正相关。当您专注于记录时，植物的水分代谢效率也达到了本月峰值。这种“同频”正在构建一个双向治愈的生命场。
                    </p>
                 </div>
              </div>
           </div>

           {/* Interactive Trend Chart */}
           <div className="bg-white p-6 rounded-[36px] shadow-xl shadow-black/5 border border-black/5 flex flex-col gap-4">
              <div className="flex items-center justify-between mb-2">
                 <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                       <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: themeConfig.primary }} />
                       <span className="text-[10px] font-black text-gray-500 uppercase">健康</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                       <span className="text-[10px] font-black text-gray-500 uppercase">共鸣</span>
                    </div>
                 </div>
                 <select className="bg-gray-50 border-none text-[10px] font-black px-3 py-1.5 rounded-xl outline-none text-gray-500">
                    <option>最近 7 天</option>
                    <option>最近 30 天</option>
                 </select>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={healthTrendData}>
                      <defs>
                        <linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={themeConfig.primary} stopOpacity={0.2}/>
                          <stop offset="95%" stopColor={themeConfig.primary} stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-black/90 backdrop-blur-xl p-3 rounded-2xl border border-white/10 shadow-2xl">
                                <p className="text-white/40 text-[8px] font-black uppercase mb-1">
                                  {payload[0].payload.day} {payload[0].payload.isToday && '(今天)'}
                                </p>
                                <div className="flex flex-col gap-1">
                                  {payload.map((p, i) => (
                                    <div key={i} className="flex items-center justify-between gap-4">
                                      <span className="text-[10px] font-bold text-white/60">{p.name}</span>
                                      <span className="text-xs font-black text-white">{p.value}%</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="health" 
                        stroke={themeConfig.primary} 
                        strokeWidth={4} 
                        fillOpacity={1} 
                        fill="url(#colorHealth)" 
                        name="健康指数" 
                        animationDuration={2000}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="mood" 
                        stroke="#3B82F6" 
                        strokeWidth={4} 
                        fillOpacity={1} 
                        fill="url(#colorMood)" 
                        name="共鸣感" 
                        animationDuration={2000}
                      />
                   </AreaChart>
                </ResponsiveContainer>
              </div>
           </div>
        </div>

        <div className="flex flex-col gap-4">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <History size={18} className="text-gray-400" />
                 <h3 className="font-black text-sm text-gray-400 uppercase tracking-widest">成长时间轴</h3>
              </div>
              <button 
                onClick={() => setShowTimeline(!showTimeline)}
                className="flex items-center gap-1 text-[10px] font-black uppercase text-blue-500 hover:text-blue-700 transition-colors"
              >
                {showTimeline ? '收起' : '展开'}
                <ChevronDown size={14} className={cn("transition-transform duration-300", showTimeline && "rotate-180")} />
              </button>
           </div>

           <div className="flex flex-col gap-3 min-h-[80px]">
              <AnimatePresence initial={false}>
                {timelineEvents.slice(0, showTimeline ? undefined : 3).map((event) => (
                  <TimelineItem 
                    key={event.id} 
                    event={event} 
                    onClick={
                      (event.type === 'journal' || event.type === 'mood') 
                        ? () => navigate(`/${event.type}-detail/${encodeURIComponent(event.id)}`) 
                        : undefined
                    }
                  />
                ))}
              </AnimatePresence>
              
              {showTimeline && hasMoreTimeline && (
                <button
                  onClick={loadMoreTimeline}
                  disabled={loadingMoreTimeline}
                  className="mt-2 w-full py-4 rounded-2xl bg-gray-50 border border-black/5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:bg-gray-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  {loadingMoreTimeline ? (
                    <div className="w-3 h-3 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>加载更多历史</span>
                      <ChevronDown size={14} />
                    </>
                  )}
                </button>
              )}
              
              {!showTimeline && timelineEvents.length > 3 && (
                <div className="text-center py-2">
                   <div className="w-1 h-1 rounded-full bg-gray-300 mx-auto mb-1" />
                   <div className="w-1 h-1 rounded-full bg-gray-300 mx-auto mb-1 opacity-60" />
                   <div className="w-1 h-1 rounded-full bg-gray-300 mx-auto opacity-30" />
                </div>
              )}

              {timelineEvents.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-xs font-bold">暂无动态,开始互动吧</div>
              )}
           </div>
        </div>
      </div>

      {/* Growth Archive Modal Removed */}
    </div>
  );
}
