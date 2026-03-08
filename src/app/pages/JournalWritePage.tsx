import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Send, Sparkles, BookOpen, Users, 
  Check, Edit3, ArrowRight, Feather, Save,
  MessageCircle, Plus, X, Camera, Image as ImageIcon,
  RefreshCw, Wifi
} from 'lucide-react';
import { useEmotionalTheme } from '../context/ThemeContext';
import { cn } from '../utils/cn';
import { toast } from 'sonner';
import { apiGet, apiPost } from '../utils/api';
import { getCache, setCache } from '../utils/cache';
import { WebRTCPlayer, WebRTCPlayerRef } from '../components/WebRTCPlayer';
import { projectId, publicAnonKey } from '/utils/supabase/info';

interface JournalEntry {
  id: string;
  author: string;
  content: string;
  imageUrl?: string;
  timestamp: string;
}

const journalPrompts = [
  '今天我们的小植物有什么新变化？',
  '照顾它的时候，我想到了...',
  '看着它成长，让我感受到...',
  '如果植物会说话，它会对我们说...',
  '这段陪伴的时光教会了我...',
];

const writingStyles = [
  { id: 'casual', label: '随笔', icon: Edit3, desc: '轻松记录日常' },
  { id: 'poetic', label: '诗意', icon: Feather, desc: '浪漫抒情' },
  { id: 'diary', label: '日记', icon: BookOpen, desc: '详细记录' },
];

export function JournalWritePage() {
  const navigate = useNavigate();
  const { plantId } = useParams();
  const { theme, setTheme, themeConfig } = useEmotionalTheme();
  const isSoloMode = theme === 'solo';
  
  const [plantData, setPlantData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('casual');
  const [currentAuthor, setCurrentAuthor] = useState('我');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPrompts, setShowPrompts] = useState(true);
  const [isStreamOpen, setIsStreamOpen] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const playerRef = useRef<WebRTCPlayerRef>(null);

  useEffect(() => {
    const fetchPlant = async () => {
      const cached = getCache<any[]>(`plants-current`, 60000);
      if (cached) {
        const found = cached.find((p: any) => p.id === plantId);
        if (found) {
          setPlantData(found);
          setTheme(found.type);
          setLoading(false);
        }
      }

      try {
        const data = await apiGet<any[]>('/plants');
        if (Array.isArray(data)) {
          setCache(`plants-current`, data);
          const found = data.find((p: any) => p.id === plantId);
          if (found) {
            setPlantData(found);
            setTheme(found.type);
            if (found.owners && found.owners.length > 0) {
              setCurrentAuthor(found.owners[0]);
            }
          }
        }
      } catch (e) {
        console.error('Error fetching plant:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchPlant();
  }, [plantId, setTheme]);

  const owners = plantData?.owners || ['我'];

  const handlePromptClick = (prompt: string) => {
    setContent((prev) => prev + (prev ? '\n\n' : '') + prompt);
    setShowPrompts(false);
  };

  const handleCaptureFromStream = async () => {
    if (!playerRef.current) return;
    
    const base64Image = playerRef.current.captureFrame();
    if (!base64Image) {
      toast.error('捕捉画面失败，请确保视频正在播放');
      return;
    }

    setIsUploading(true);
    const uploadToast = toast.loading('正在上传生长瞬间...');
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-4b732228/upload-snapshot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': publicAnonKey,
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          image: base64Image,
          plantId: plantId
        })
      });

      const result = await response.json();
      if (result.success) {
        setUploadedImageUrl(result.url);
        toast.success('瞬间已从直播中捕捉 ✨', { id: uploadToast });
        setIsStreamOpen(false);
      } else {
        const errorMsg = result.details || result.error || '上传失败';
        console.error('Server upload error:', result);
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error(`上传失败: ${err.message}`, { id: uploadToast });
    } finally {
      setIsUploading(false);
    }
  };

  const addEntry = () => {
    if (!content.trim() && !uploadedImageUrl) {
      toast.error('请输入内容或拍摄照片');
      return;
    }

    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      author: currentAuthor,
      content: content.trim(),
      imageUrl: uploadedImageUrl || undefined,
      timestamp: new Date().toLocaleString('zh-CN', { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
    };

    setEntries([...entries, newEntry]);
    setContent('');
    setUploadedImageUrl(null);
    
    if (!isSoloMode && owners.length > 1) {
      const nextAuthorIndex = (owners.indexOf(currentAuthor) + 1) % owners.length;
      setCurrentAuthor(owners[nextAuthorIndex]);
      toast.success(`轮到 ${owners[nextAuthorIndex]} 书写了 ✨`);
    } else {
      toast.success('段落已添加 📝');
    }
  };

  const removeEntry = (id: string) => {
    setEntries(entries.filter(e => e.id !== id));
    toast.success('段落已删除');
  };

  const handleSubmit = async () => {
    if (!title.trim() || entries.length === 0) {
      toast.error('请填写标题并至少添加一段内容');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiPost('/journal', {
        plantId,
        title,
        style: selectedStyle,
        entries,
        timestamp: new Date().toISOString(),
      });

      toast.success(isSoloMode ? '成长笔记已保存 📖' : '合写日记已发布 💌');
      
      // Explicitly return to the interaction page of the plant
      navigate(`/interaction`, { state: { plantId: plantId }, replace: true });
    } catch (error: any) {
      console.error('Error saving journal:', error);
      toast.error('保存失败：' + (error.message || '请重试'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!plantData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-8 text-center">
        <h2 className="text-xl font-black mb-4">未找到植物数据</h2>
        <button onClick={() => navigate(-1)} className="px-6 py-2 bg-black text-white rounded-xl font-bold">返回</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: themeConfig.bg }}>
      <div className="sticky top-0 z-10 bg-white border-b border-black/5 px-6 py-4">
        <div className="flex items-center gap-4 mb-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-black">
              {isSoloMode ? '生长笔记' : '合写日记'}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">为 {plantData.name} 共同创作</p>
          </div>
        </div>

        {!isSoloMode && owners.length > 1 && (
          <div className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-3 rounded-2xl">
            <Users size={16} className="text-purple-500" />
            <span className="text-xs font-bold text-gray-600">参与者:</span>
            <div className="flex -space-x-2">
              {owners.map((owner, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black',
                    owner === currentAuthor ? 'bg-purple-500 text-white ring-2 ring-purple-300' : 'bg-gray-200 text-gray-600'
                  )}
                >
                  {owner[0]}
                </div>
              ))}
            </div>
            {entries.length > 0 && (
              <span className="text-[10px] text-purple-600 font-bold ml-auto">
                轮到 {currentAuthor} 书写
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6 pb-32">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-3">
              {isSoloMode ? '笔记标题' : '日记标题'}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isSoloMode ? '例如: 第一片新叶子' : '例如: 春天的第一抹绿'}
              className="w-full px-5 py-4 rounded-3xl border border-black/10 focus:border-black/20 focus:outline-none text-lg font-bold placeholder:text-gray-300 bg-white shadow-sm"
              maxLength={50}
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-3">
              写作风格
            </label>
            <div className="grid grid-cols-3 gap-3">
              {writingStyles.map((style) => (
                <motion.button
                  key={style.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedStyle(style.id)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all bg-white',
                    selectedStyle === style.id
                      ? 'border-current text-white shadow-lg'
                      : 'border-black/5 hover:border-black/10 text-gray-600'
                  )}
                  style={
                    selectedStyle === style.id
                      ? { backgroundColor: themeConfig.primary, borderColor: themeConfig.primary }
                      : {}
                  }
                >
                  <style.icon size={20} />
                  <div className="text-center">
                    <div className="text-xs font-black">{style.label}</div>
                    <div className={cn(
                      'text-[9px] mt-0.5',
                      selectedStyle === style.id ? 'text-white/70' : 'text-gray-400'
                    )}>
                      {style.desc}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {entries.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-gray-400" />
                <span className="text-xs font-black uppercase tracking-widest text-gray-400">
                  已书写内容 ({entries.length} 段)
                </span>
              </div>
              {entries.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-5 rounded-3xl border border-black/5 shadow-sm relative group"
                >
                  <button
                    onClick={() => removeEntry(entry.id)}
                    className="absolute top-3 right-3 w-6 h-6 rounded-full bg-red-50 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                  <div className="flex items-center gap-2 mb-3">
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white"
                      style={{ backgroundColor: themeConfig.primary }}
                    >
                      {entry.author[0]}
                    </div>
                    <span className="text-xs font-bold text-gray-600">{entry.author}</span>
                    <span className="text-[10px] text-gray-400">{entry.timestamp}</span>
                    {index < entries.length - 1 && (
                      <ArrowRight size={12} className="text-gray-300 ml-auto" />
                    )}
                  </div>
                  {entry.imageUrl && (
                    <div className="mb-4 rounded-2xl overflow-hidden border border-black/5 aspect-video bg-gray-50">
                      <img 
                        src={entry.imageUrl} 
                        alt="Growth moment" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap pr-8">
                    {entry.content}
                  </p>
                </motion.div>
              ))}
            </div>
          )}

          {showPrompts && entries.length === 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-amber-500" />
                <span className="text-xs font-black uppercase tracking-widest text-gray-400">
                  灵感提示
                </span>
              </div>
              <div className="grid gap-2">
                {journalPrompts.map((prompt, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handlePromptClick(prompt)}
                    className="text-left px-4 py-3 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-100 text-sm text-gray-700 transition-colors"
                  >
                    💡 {prompt}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center justify-between">
              <span>{entries.length === 0 ? '开始书写' : `${currentAuthor} 继续书写`}</span>
              <button 
                onClick={() => setIsStreamOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-black/5 text-[10px] font-bold text-gray-600 hover:bg-gray-50 active:scale-95 transition-all"
              >
                <Camera size={12} />
                提取直播瞬间
              </button>
            </label>
            <div className="relative">
              {uploadedImageUrl && (
                <div className="mb-4 relative group">
                  <div className="rounded-3xl overflow-hidden border-4 border-white shadow-md aspect-video">
                    <img 
                      src={uploadedImageUrl} 
                      alt="Captured moment" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <button 
                    onClick={() => setUploadedImageUrl(null)}
                    className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onFocus={() => setShowPrompts(false)}
                placeholder={
                  entries.length === 0
                    ? '开启这段共同的成长记录...'
                    : '接着前面的内容继续书写...'
                }
                className="w-full h-40 px-5 py-4 rounded-3xl border border-black/10 focus:border-black/20 focus:outline-none resize-none text-sm leading-relaxed placeholder:text-gray-300 bg-white shadow-sm"
                maxLength={1000}
              />
              <div className="flex justify-between items-center mt-3 px-2">
                <span className="text-xs text-gray-400">{content.length} / 1000</span>
                {(content.trim() || uploadedImageUrl) && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={addEntry}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-white text-xs font-bold shadow-md"
                    style={{ backgroundColor: themeConfig.primary }}
                  >
                    <Plus size={14} />
                    <span>{entries.length === 0 ? '添加首段' : '添加段落'}</span>
                  </motion.button>
                )}
              </div>
            </div>
          </div>

          {!isSoloMode && owners.length > 1 && entries.length > 0 && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-blue-50 border border-blue-100">
              <MessageCircle size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700 leading-relaxed">
                <span className="font-bold">接力创作提示：</span> 
                每次添加段落后会自动切换到下一位作者。完成所有内容后点击"发布日记"保存。
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-black/5 p-6 pb-8">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={!title.trim() || entries.length === 0 || isSubmitting}
          className={cn(
            'w-full py-4 rounded-full font-black text-white text-lg flex items-center justify-center gap-2 transition-all',
            (!title.trim() || entries.length === 0 || isSubmitting)
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'shadow-lg hover:shadow-xl active:shadow-md'
          )}
          style={
            (title.trim() && entries.length > 0 && !isSubmitting)
              ? { backgroundColor: themeConfig.primary }
              : {}
          }
        >
          {isSubmitting ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Save size={20} />
              </motion.div>
              <span>发布中...</span>
            </>
          ) : (
            <>
              <Save size={20} />
              <span>{isSoloMode ? '保存笔记' : '发布日记'}</span>
            </>
          )}
        </motion.button>
      </div>

      <AnimatePresence>
        {isStreamOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-4"
          >
            <div className="relative w-full max-w-lg aspect-[3/4] bg-gray-900 rounded-[40px] overflow-hidden shadow-2xl border border-white/10 flex flex-col">
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-sm font-black text-white tracking-widest uppercase">Live Stream</span>
                </div>
                <button 
                  onClick={() => setIsStreamOpen(false)}
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 relative bg-black">
                <WebRTCPlayer 
                  ref={playerRef}
                  streamUrl={`http://192.168.92.162:8889/${plantData?.streamPath || 'heartplant'}/whep`}
                  rtspUrl={plantData?.streamUrl || "rtsp://admin:reolink123@192.168.92.202:554"}
                  className="w-full h-full"
                />
              </div>

              <div className="p-8 bg-black/60 backdrop-blur-xl border-t border-white/5 flex flex-col items-center gap-6">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">提取当前视频帧作为笔记图片</p>
                <button 
                  onClick={handleCaptureFromStream}
                  disabled={isUploading}
                  className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1 active:scale-95 transition-transform"
                >
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-black">
                    {isUploading ? <RefreshCw className="animate-spin" size={24} /> : <Camera size={24} />}
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
