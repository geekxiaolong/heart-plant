import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, Heart, Share2, Plus, Sparkles, 
  Smile, PenTool, Users, ArrowRight, Check,
  Camera, Droplets, Thermometer, ShieldCheck,
  Award, Leaf, Target, User, Mail, Send, Loader2,
  Calendar, Info, Timer, Eye, EyeOff, Wifi,
  Sun, Activity
} from 'lucide-react';
import { useEmotionalTheme, EmotionalTheme, themes } from '../context/ThemeContext';
import { cn } from '../utils/cn';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useLocation, useNavigate, useParams } from 'react-router';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { apiGet, apiPost } from '../utils/api';
import { buildLoginRedirectState } from '../utils/authRedirect';
import { hydrateAdoptionCaches } from '../utils/adoptionRefresh';
import { EmotionalRadarChart } from '../components/EmotionalRadarChart';
import { GoldenSentenceCard } from '../components/GoldenSentenceCard';
import { WebRTCPlayer } from '../components/WebRTCPlayer';
import { getStreamWhepUrl } from '../utils/streamUrl';

const ADOPTION_DRAFT_STORAGE_KEY = 'heartplant:adoption-draft';

type AdoptionDraft = {
  plantId: string;
  step: number;
  plantName: string;
  selectedType: EmotionalTheme;
  targetEmail: string;
  updatedAt: number;
};

const ADOPTION_DRAFT_TTL = 1000 * 60 * 60 * 24;

function readAdoptionDraft(plantId?: string) {
  if (!plantId || typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(ADOPTION_DRAFT_STORAGE_KEY);
    if (!raw) return null;

    const draft = JSON.parse(raw) as Partial<AdoptionDraft>;
    if (draft.plantId !== plantId) return null;
    if (typeof draft.updatedAt !== 'number' || Date.now() - draft.updatedAt > ADOPTION_DRAFT_TTL) {
      window.localStorage.removeItem(ADOPTION_DRAFT_STORAGE_KEY);
      return null;
    }

    return {
      plantId,
      step: typeof draft.step === 'number' ? Math.min(Math.max(draft.step, 1), 3) : 1,
      plantName: typeof draft.plantName === 'string' ? draft.plantName : '',
      selectedType: (['solo', 'kinship', 'romance', 'friendship'] as EmotionalTheme[]).includes(draft.selectedType as EmotionalTheme)
        ? (draft.selectedType as EmotionalTheme)
        : 'solo',
      targetEmail: typeof draft.targetEmail === 'string' ? draft.targetEmail : '',
      updatedAt: draft.updatedAt,
    } satisfies AdoptionDraft;
  } catch (error) {
    console.error('Failed to read adoption draft:', error);
    return null;
  }
}

function writeAdoptionDraft(draft: AdoptionDraft) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(ADOPTION_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch (error) {
    console.error('Failed to persist adoption draft:', error);
  }
}

function clearAdoptionDraft() {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(ADOPTION_DRAFT_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear adoption draft:', error);
  }
}

export function PlantAdoption() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, session } = useAuth();
  const { setTheme, themeConfig } = useEmotionalTheme();
  const draft = useMemo(() => readAdoptionDraft(id), [id]);
  
  const [step, setStep] = useState(draft?.step ?? 1); // 1: Detail, 2: Define, 3: Goal/Invite, 4: Ceremony/Complete
  const [plantName, setPlantName] = useState(draft?.plantName ?? '');
  const [selectedType, setSelectedType] = useState<EmotionalTheme>(draft?.selectedType ?? 'solo');
  const [isInviting, setIsInviting] = useState(false);
  const [targetEmail, setTargetEmail] = useState(draft?.targetEmail ?? '');
  const [isSending, setIsSending] = useState(false);
  const [ceremonyComplete, setCeremonyComplete] = useState(false);
  const [adoptedPlantId, setAdoptedPlantId] = useState<string | null>(null); // 认领后的植物实例 id，用于邀请
  const [goal, setGoal] = useState('期待它开花');
  const [plant, setPlant] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdopting, setIsAdopting] = useState(false);
  const [isLiveVisible, setIsLiveVisible] = useState(false);
  const [simulatedSensors, setSimulatedSensors] = useState({
    temp: 24.5,
    humidity: 58,
    light: 1200,
    health: 98
  });

  // Dynamic labels based on selected mode
  const getModeLabels = () => {
    switch (selectedType) {
      case 'solo':
        return {
          title: '悦己之境',
          action: '开启生长寄托',
          loading: '正在为你开启独处之境...',
          success: '生命映射已建立 ✨',
          button: '开启独享旅程'
        };
      case 'kinship':
        return {
          title: '守护承诺',
          action: '开启守护连接',
          loading: '正在为你记录守护承诺...',
          success: '守护纽带已达成 ✨',
          button: '开始共同守护'
        };
      case 'romance':
        return {
          title: '心意结缘',
          action: '签署共鸣契约',
          loading: '正在为您开启结缘契约...',
          success: '结缘契约已达成 ✨',
          button: '开启共鸣之旅'
        };
      case 'friendship':
        return {
          title: '友情见证',
          action: '开启成长见证',
          loading: '正在记录这段友情瞬间...',
          success: '成长见证已开启 ✨',
          button: '开始合写记忆'
        };
      default:
        return {
          title: '心意结缘',
          action: '签署结缘契约',
          loading: '正在开启契约...',
          success: '契约已达成 ✨',
          button: '开启旅程'
        };
    }
  };

  const labels = getModeLabels();

  useEffect(() => {
    setTheme(selectedType);
  }, [selectedType, setTheme]);

  useEffect(() => {
    if (draft && (draft.step > 1 || draft.plantName || draft.targetEmail || draft.selectedType !== 'solo')) {
      toast.info('已为你恢复上次未完成的认养进度');
    }
  }, [draft]);

  useEffect(() => {
    if (!id || ceremonyComplete || step >= 4) {
      clearAdoptionDraft();
      return;
    }

    const hasMeaningfulDraft = step > 1 || !!plantName.trim() || !!targetEmail.trim() || selectedType !== 'solo';
    if (!hasMeaningfulDraft) {
      clearAdoptionDraft();
      return;
    }

    writeAdoptionDraft({
      plantId: id,
      step,
      plantName,
      selectedType,
      targetEmail,
      updatedAt: Date.now(),
    });
  }, [id, step, plantName, selectedType, targetEmail, ceremonyComplete]);

  useEffect(() => {
    // Randomize sensors slightly for "live" feel
    if (isLiveVisible) {
      const interval = setInterval(() => {
        setSimulatedSensors(prev => ({
          temp: +(prev.temp + (Math.random() - 0.5) * 0.2).toFixed(1),
          humidity: Math.min(100, Math.max(0, prev.humidity + Math.floor((Math.random() - 0.5) * 2))),
          light: Math.max(0, prev.light + Math.floor((Math.random() - 0.5) * 50)),
          health: prev.health
        }));
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isLiveVisible]);

  useEffect(() => {
    const fetchPlant = async () => {
      try {
        const data = await apiGet<any[]>('/library');
        if (data && Array.isArray(data)) {
          const found = data.find((p: any) => p.id === id);
          setPlant(found);
        }
      } catch (e) {
        console.error('Error fetching plant:', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlant();
  }, [id]);

  const handleNext = async () => {
    if (!plant || isAdopting) return;
    
    if (step === 2) {
      if (!plantName.trim()) {
        toast.error('请先为你的植物起个名字吧');
        return;
      }
      
      setIsAdopting(true);
      const loadingToast = toast.loading(labels.loading);
      
      try {
        if (!session?.access_token) {
          writeAdoptionDraft({
            plantId: plant.id,
            step,
            plantName,
            selectedType,
            targetEmail,
            updatedAt: Date.now(),
          });
          toast.dismiss(loadingToast);
          toast.error('登录状态已失效，请重新登录');
          navigate('/login', { state: buildLoginRedirectState(location), replace: true });
          return;
        }

        const response: any = await apiPost<any>('/adopt', {
          libraryId: plant.id,
          id: plant.id,
          name: plantName || plant.name || plant.species,
          species: plant.species || plant.name,
          type: selectedType,
          image: plant.imageUrl || plant.image,
          ownerName: user?.user_metadata?.name || user?.email?.split('@')[0] || '我'
        });

        if (response.success === false) {
          toast.dismiss(loadingToast);
          const msg = response.message || response.error || '认领失败';
          if (msg === 'DUPLICATE_ADOPTION' || String(msg).includes('DUPLICATE_ADOPTION')) {
            toast.error('认领被拒（旧版接口）。请在本机运行后端（deno task serve）或重新部署最新 API 后再试。');
            return;
          }
          throw new Error(msg);
        }

        hydrateAdoptionCaches({
          userId: user?.id,
          adoptedPlant: response,
          originalId: plant.id,
        });
        toast.dismiss(loadingToast);
        toast.success(labels.success);

        if (selectedType === 'solo') {
          // 悦己：个人认领直接完成，返回首页
          clearAdoptionDraft();
          setTimeout(() => navigate('/', {
            state: {
              refreshMyPlants: true,
              adoptedPlantId: response.id,
              adoptedOriginalId: plant.id,
              adoptedAt: Date.now(),
            }
          }), 1200);
        } else {
          // 亲情/爱情/友情：进入邀请认领页面
          setAdoptedPlantId(response.id);
          setStep(3);
        }
      } catch (e: any) {
        toast.dismiss(loadingToast);
        console.error('Adoption flow error:', e);
        const msg = e?.message ?? '';
        if (msg === 'DUPLICATE_ADOPTION' || msg.includes('DUPLICATE_ADOPTION')) {
          toast.error('认领被拒（旧版接口）。请在本机运行后端（deno task serve）或重新部署最新 API 后再试。');
          return;
        }
        toast.error(msg || '认领失败，请稍后重试');
      } finally {
        setIsAdopting(false);
      }
      return;
    }
    setStep(step + 1);
  };

  const handleTypeSelect = (type: EmotionalTheme) => {
    setSelectedType(type);
    setTheme(type);
  };

  const handleFinishSolo = async () => {
    // Adoption already happened in handleNext transition from step 2 to step 3
    clearAdoptionDraft();
    setCeremonyComplete(true);
    toast.success('开启你的私人治愈时光 ✨');
    setTimeout(() => navigate('/'), 2000);
  };

  const handleSendDirectInvite = async () => {
    if (!targetEmail || !plant || !user || isSending) {
      if (isSending) return;
      toast.error('请输入对方的注册邮箱');
      return;
    }
    setIsSending(true);
    try {
      if (!session?.access_token) {
        if (plant?.id) {
          writeAdoptionDraft({
            plantId: plant.id,
            step,
            plantName,
            selectedType,
            targetEmail,
            updatedAt: Date.now(),
          });
        }
        toast.error('登录状态已失效，请重新登录');
        navigate('/login', { state: buildLoginRedirectState(location), replace: true });
        return;
      }

      const data = await apiPost<any>('/send-direct-invite', {
        plantId: adoptedPlantId || plant.id,
        inviterId: user.id,
        inviterName: user.user_metadata?.name || user.email?.split('@')[0] || '我',
        targetEmail: targetEmail.trim().toLowerCase()
      });
      
      if (data.success) {
        toast.success(`邀请已投递至 ${targetEmail}！ ✨`);
        // Proceed to last step to show waiting screen
        setStep(4);
      } else {
        toast.error('发送失败，请确保该邮箱已注册');
      }
    } catch (e) {
      toast.error('网络错误');
    } finally {
      setIsSending(false);
    }
  };

  const handleGoToCeremonyPoster = () => {
    // Navigate to the dedicated ceremony page which has the poster logic
    navigate(`/ceremony/${plant.id}`);
  };

  const completeCeremony = async () => {
    // If we're here, it means we've already adopted (via handleNext) and possibly invited.
    // The plant instance already exists in the database.
    clearAdoptionDraft();
    setCeremonyComplete(true);
    toast.success('结缘仪式圆满完成！🎉');
    setTimeout(() => navigate('/'), 2000);
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-screen bg-white"><Loader2 className="animate-spin text-green-500" /></div>;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl px-4 py-4 flex items-center justify-between border-b border-black/5">
        <button onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)} className="p-2 text-gray-400">
          <ChevronLeft size={24} />
        </button>
        <div className="flex-1 text-center">
           <h1 className="text-sm font-black uppercase tracking-widest opacity-30">
             {step === 1 ? '生命素描' : step === 2 ? labels.title : step === 3 ? '邀请守护' : '认领确认'}
           </h1>
        </div>
        <div className="w-10" />
      </div>

      <div className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-8 pb-32">
              <div className="relative aspect-[4/5] w-full overflow-hidden">
                <AnimatePresence mode="wait">
                  {!isLiveVisible ? (
                    <motion.img 
                      key="static"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      src={plant.imageUrl || plant.image} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <motion.div 
                      key="live"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-full h-full bg-black relative"
                    >
                      <WebRTCPlayer 
                        streamUrl={getStreamWhepUrl(plant.streamPath)} 
                        rtspUrl={plant.streamUrl || (import.meta.env.VITE_DEFAULT_RTSP_URL || '')}
                        className="w-full h-full"
                      />
                      {/* Live HUD Overlay */}
                      <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 bg-red-500 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase animate-pulse">
                            <div className="w-1 h-1 rounded-full bg-white" /> Live View
                          </div>
                          <div className="text-white/50 text-[8px] font-mono uppercase tracking-widest flex items-center gap-1">
                            <Wifi size={10} /> Stable Connection
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { icon: Thermometer, value: simulatedSensors.temp, unit: '°C', label: '温度' },
                            { icon: Droplets, value: simulatedSensors.humidity, unit: '%', label: '湿度' },
                            { icon: Sun, value: simulatedSensors.light, unit: 'lx', label: '光照' },
                            { icon: Activity, value: simulatedSensors.health, unit: '%', label: '健康' },
                          ].map((s, i) => (
                            <div key={i} className="bg-white/10 backdrop-blur-md rounded-xl p-2 flex flex-col items-center gap-0.5 border border-white/10">
                              <s.icon size={12} className="text-white/60" />
                              <span className="text-xs font-black text-white">{s.value}{s.unit}</span>
                              <span className="text-[6px] font-bold text-white/40 uppercase tracking-tighter">{s.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                
                {/* Live Toggle Button */}
                <button 
                  onClick={() => setIsLiveVisible(!isLiveVisible)}
                  className={cn(
                    "absolute top-6 right-6 p-3 rounded-full backdrop-blur-xl border border-white/20 transition-all active:scale-90 z-20",
                    isLiveVisible ? "bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)]" : "bg-white/10 text-white"
                  )}
                >
                  {isLiveVisible ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>

                {!isLiveVisible && (
                  <div className="absolute bottom-10 left-8 right-8 text-white pointer-events-none">
                     <h2 className="text-4xl font-black tracking-tight mb-2">{plant.name}</h2>
                     <p className="text-sm opacity-80 leading-relaxed max-w-xs">{plant.description}</p>
                  </div>
                )}
              </div>

              {isLiveVisible && (
                <div className="px-8 -mt-4 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 text-red-500 flex items-center justify-center shrink-0">
                      <Camera size={20} />
                    </div>
                    <p className="text-[10px] font-bold text-red-800 leading-relaxed">
                      正在通过 IoT 传感器实时观察「{plant.name}」。<br/>当前画面与环境数据均来自该植物的实际生长位。
                    </p>
                  </div>
                </div>
              )}

              <div className="px-8 flex flex-col gap-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-[32px] p-6 flex flex-col gap-2 transition-all hover:shadow-md">
                       <ShieldCheck className="text-green-500" size={24} />
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">养成难度</span>
                       <span className="text-lg font-black">{plant.difficulty === 'easy' ? '初级' : plant.difficulty === 'medium' ? '中级' : '高级'}</span>
                    </div>
                    <div className="bg-gray-50 rounded-[32px] p-6 flex flex-col gap-2 transition-all hover:shadow-md">
                       <Timer className="text-blue-500" size={24} />
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">预计寿命</span>
                       <span className="text-lg font-black">{plant.lifespan || '未知'}</span>
                    </div>
                 </div>

                  <div className="bg-pink-50 rounded-[40px] p-8 flex flex-col gap-6 border border-pink-100/50 shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 text-pink-100 group-hover:scale-150 group-hover:-rotate-12 transition-transform duration-1000">
                       <Heart size={120} fill="currentColor" />
                    </div>
                    <div className="flex items-center gap-3 relative z-10">
                       <Heart size={18} className="text-pink-500 fill-pink-500/20" />
                       <h3 className="text-xs font-black uppercase tracking-widest text-pink-600">情感寓意</h3>
                    </div>
                    <div className="relative z-10">
                       <p className="text-lg font-black leading-snug text-pink-900 mb-4 pr-12">
                          {plant.emotionalMeaning || "“在静默的时光里，它是你最长情的告白。”"}
                       </p>
                       <div className="flex flex-wrap gap-2">
                          {plant.scene === 'love' && <span className="bg-pink-100 text-pink-600 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">爱情守护者</span>}
                          {plant.scene === 'kinship' && <span className="bg-orange-100 text-orange-600 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">亲情纽带</span>}
                          {plant.scene === 'friend' && <span className="bg-blue-100 text-blue-600 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">友情见证</span>}
                          {plant.scene === 'self' && <span className="bg-purple-100 text-purple-600 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">独享宁静</span>}
                          <span className="bg-white/60 text-pink-400 text-[8px] font-black px-3 py-1 rounded-full border border-pink-100 uppercase tracking-widest">
                             情感能量 {plant.dimensions ? Math.round((plant.dimensions.healing + plant.dimensions.companion) / 2) : 95}%
                          </span>
                       </div>
                    </div>
                 </div>

                 <GoldenSentenceCard sentence={plant.goldenSentence} />

                 <div className="bg-white rounded-[40px] p-8 flex flex-col gap-6 border border-black/5 shadow-sm">
                    <div className="flex items-center gap-3">
                       <Sparkles size={18} className="text-amber-500" />
                       <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">情感互动画像</h3>
                    </div>
                    <EmotionalRadarChart dimensions={plant.dimensions} />
                    <div className="grid grid-cols-2 gap-4">
                       {[
                         { label: '治愈力', value: plant.dimensions?.healing ?? 85, color: 'text-green-500' },
                         { label: '陪伴感', value: plant.dimensions?.companion ?? 92, color: 'text-blue-500' },
                       ].map((stat, i) => (
                         <div key={i} className="bg-gray-50 rounded-2xl p-4 flex flex-col gap-1">
                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</span>
                            <span className={cn("text-xl font-black", stat.color)}>{stat.value}%</span>
                         </div>
                       ))}
                    </div>
                 </div>

                 <div className="bg-gray-50 rounded-[40px] p-8 flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                       <Info size={18} className="text-purple-500" />
                       <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">生长习性</h3>
                    </div>
                    <p className="text-sm font-bold leading-relaxed text-gray-600">
                       {plant.habits || "该植物具有较强的适应能力，建议放置在光线充足且通风良好的环境中。"}
                    </p>
                 </div>

                 <div className="bg-green-50 rounded-[40px] p-8 flex flex-col gap-4 border border-green-100/50">
                    <div className="flex items-center gap-3">
                       <Calendar size={18} className="text-green-500" />
                       <h3 className="text-xs font-black uppercase tracking-widest text-green-600">入库时间</h3>
                    </div>
                    <p className="text-sm font-black text-green-800">
                       {plant.addedDate || new Date().toISOString().split('T')[0]}
                    </p>
                 </div>
              </div>
              <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-md px-8 z-50">
                 <button 
                  onClick={handleNext} 
                  disabled={isAdopting}
                  className="w-full py-6 bg-black text-white rounded-[32px] font-black text-sm uppercase tracking-[0.2em] shadow-2xl active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all flex items-center justify-center gap-3"
                 >
                   {isAdopting ? <Loader2 className="animate-spin" size={18} /> : <>开启结缘之旅 <ArrowRight size={18} /></>}
                 </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex flex-col gap-10 p-8 pb-32">
              <div className="flex flex-col items-center gap-6">
                <div className="w-32 h-32 rounded-[40px] shadow-2xl overflow-hidden border-4 border-white rotate-3">
                   <img src={plant.imageUrl || plant.image} className="w-full h-full object-cover" />
                </div>
                <div className="w-full flex flex-col gap-4">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">给它起个昵称</label>
                  <input type="text" value={plantName} onChange={(e) => setPlantName(e.target.value)} placeholder="例如：小福..." className="w-full bg-gray-50 border-none rounded-[32px] p-6 text-xl font-black tracking-tight focus:ring-4 transition-all" style={{ '--tw-ring-color': `${themeConfig.primary}20` } as any} />
                </div>
              </div>
              <div className="flex flex-col gap-6">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">选择这段关系的性质</label>
                 <div className="grid grid-cols-1 gap-4">
                    {(['solo', 'kinship', 'romance', 'friendship'] as EmotionalTheme[]).map((t) => (
                      <button key={t} onClick={() => handleTypeSelect(t)} className={cn("p-6 rounded-[32px] border-2 flex items-center justify-between transition-all active:scale-95", selectedType === t ? "border-current shadow-lg" : "border-gray-100 opacity-60")} style={{ color: themes[t].primary, backgroundColor: selectedType === t ? `${themes[t].primary}08` : 'transparent' }}>
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${themes[t].primary}15` }}>
                               {t === 'solo' ? <Leaf size={24} /> : t === 'kinship' ? <Users size={24} /> : t === 'romance' ? <Heart size={24} /> : <Smile size={24} />}
                            </div>
                            <div className="text-left">
                               <p className="font-black text-lg">{t === 'solo' ? '悦己' : t === 'kinship' ? '亲情' : t === 'romance' ? '爱情' : '友情'}</p>
                               <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">{t === 'solo' ? '自我治愈' : t === 'kinship' ? '守护长辈' : t === 'romance' ? '共同心跳' : '见证成长'}</p>
                            </div>
                         </div>
                         {selectedType === t && <Check size={24} />}
                      </button>
                    ))}
                 </div>
              </div>
              <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-md px-8 z-50">
                 <button 
                  onClick={handleNext} 
                  disabled={isAdopting}
                  className={cn("w-full py-6 text-white rounded-[32px] font-black text-sm uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 bg-gradient-to-br disabled:opacity-50 disabled:active:scale-100 transition-all", themeConfig.gradient)}
                 >
                   {isAdopting ? <Loader2 className="animate-spin" size={18} /> : <>确认认领 <Check size={18} /></>}
                 </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} className="flex flex-col gap-10 p-8 items-center justify-center min-h-[70vh]">
              {selectedType === 'solo' ? (
                <div className="w-full flex flex-col gap-8">
                  <div className="bg-white rounded-[48px] shadow-2xl p-8 border border-black/5 flex flex-col gap-8 relative overflow-hidden">
                    <div className={cn("absolute inset-x-0 top-0 h-2 bg-gradient-to-r", themeConfig.gradient)} />
                    <h3 className="text-center font-black text-xl">欢迎开启个人空间</h3>
                    <div className="aspect-[4/3] rounded-[32px] overflow-hidden"><img src={plant.image} className="w-full h-full object-cover" /></div>
                  </div>
                  <button 
                    onClick={handleFinishSolo} 
                    disabled={isAdopting}
                    className={cn("w-full py-6 text-white rounded-[32px] font-black text-sm uppercase tracking-[0.2em] shadow-2xl bg-gradient-to-br disabled:opacity-50 transition-all", themeConfig.gradient)}
                  >
                    {isAdopting ? <Loader2 className="animate-spin mx-auto" size={20} /> : '开启独享旅程'}
                  </button>
                </div>
              ) : (
                <div className="w-full flex flex-col gap-8">
                  {/* Account Invite Section (NEWLY ADDED HERE) */}
                  <div className="bg-white rounded-[40px] shadow-xl p-8 border border-black/5 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center"><Mail size={24} /></div>
                      <div>
                        <h3 className="font-black text-lg">填写对方账号</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Direct Invite</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <input 
                        type="email" 
                        placeholder="输入对方注册邮箱账号..."
                        value={targetEmail}
                        onChange={(e) => setTargetEmail(e.target.value)}
                        className="w-full bg-gray-50 border-none rounded-2xl py-5 px-6 text-sm font-bold focus:ring-4 transition-all"
                      />
                      <button 
                        onClick={handleSendDirectInvite}
                        disabled={isSending}
                        className="w-full py-5 bg-black text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all"
                      >
                        {isSending ? <Loader2 className="animate-spin" /> : <Send size={18} />}
                        {isSending ? '发送中...' : '发送实时邀请通知'}
                      </button>
                    </div>
                  </div>

                  <div className="w-full flex items-center gap-4">
                    <div className="h-[1px] flex-1 bg-black/5" /><span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">或者</span><div className="h-[1px] flex-1 bg-black/5" />
                  </div>

                  <button 
                    onClick={handleGoToCeremonyPoster}
                    className="w-full py-6 bg-white border-2 border-dashed border-black/10 rounded-[32px] font-black text-sm text-gray-500 flex items-center justify-center gap-3"
                  >
                    <Share2 size={18} /> 生成海报/复制链接
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center min-h-[80vh] p-8">
               {!ceremonyComplete ? (
                 <div className="flex flex-col items-center gap-12 text-center">
                    <div className="flex items-center gap-8">
                       <div className="flex flex-col gap-3 items-center">
                          <div className="w-20 h-20 rounded-full bg-gray-100 border-4 border-white shadow-xl overflow-hidden">
                             <img src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=1080" className="w-full h-full object-cover" />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest">ME</span>
                       </div>
                       <Heart size={48} fill={themeConfig.primary} style={{ color: themeConfig.primary }} className="animate-pulse" />
                       <div className="flex flex-col gap-3 items-center">
                          <div className="w-20 h-20 rounded-full bg-gray-100 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center text-gray-300">
                             <User size={32} />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest">PARTNER</span>
                       </div>
                    </div>
                    <div className="flex flex-col gap-4">
                       <h2 className="text-3xl font-black tracking-tighter">邀请已发出</h2>
                       <p className="text-xs font-bold text-gray-400 leading-relaxed">等待对方在“结缘信箱”确认<br/>或长按下方按钮强制开启演示模式</p>
                    </div>
                    <button onClick={completeCeremony} className="px-8 py-4 bg-black text-white rounded-full font-black text-xs uppercase tracking-widest">开启守护</button>
                 </div>
               ) : (
                 <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center text-center gap-8">
                    <div className="w-64 h-64 rounded-[64px] shadow-2xl overflow-hidden border-8 border-white"><img src={plant.image} className="w-full h-full object-cover" /></div>
                    <div className="flex flex-col gap-4">
                       <h2 className="text-4xl font-black tracking-tighter">结缘成功!</h2>
                       <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">你与「{plantName}」的故事正式开启</p>
                    </div>
                    <button onClick={() => navigate('/')} className="px-8 py-4 bg-black text-white rounded-full font-black text-xs uppercase">进入花园</button>
                 </motion.div>
               )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
