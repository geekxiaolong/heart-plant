import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { motion } from 'motion/react';
import { 
  ArrowLeft, Smile, Meh, Frown, Heart, Star, 
  Cloud, Sun, Moon, Coffee, Music, Book,
  Send, Image as ImageIcon, Check, X, RefreshCw,
  Camera, Upload
} from 'lucide-react';
import { useEmotionalTheme } from '../context/ThemeContext';
import { cn } from '../utils/cn';
import { toast } from 'sonner';
import { apiGet, apiPost } from '../utils/api';
import { apiUrl, buildApiHeaders } from '../utils/api';
import { getCache } from '../utils/cache';
import { WebRTCPlayer, WebRTCPlayerRef } from '../components/WebRTCPlayer';

const moodEmojis = [
  { id: 'happy', icon: Smile, label: '开心', color: 'text-yellow-500', bg: 'bg-yellow-50' },
  { id: 'calm', icon: Meh, label: '平静', color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'sad', icon: Frown, label: '低落', color: 'text-gray-500', bg: 'bg-gray-50' },
  { id: 'love', icon: Heart, label: '感动', color: 'text-red-500', bg: 'bg-red-50' },
  { id: 'excited', icon: Star, label: '兴奋', color: 'text-purple-500', bg: 'bg-purple-50' },
  { id: 'peaceful', icon: Cloud, label: '宁静', color: 'text-teal-500', bg: 'bg-teal-50' },
];

const activityTags = [
  { id: 'watering', icon: Sun, label: '浇水' },
  { id: 'photo', icon: ImageIcon, label: '拍照' },
  { id: 'music', icon: Music, label: '听音乐' },
  { id: 'reading', icon: Book, label: '读书' },
  { id: 'coffee', icon: Coffee, label: '喝咖啡' },
  { id: 'evening', icon: Moon, label: '夜晚' },
];

export function MoodRecordPage() {
  const navigate = useNavigate();
  const { plantId } = useParams();
  const { theme, themeConfig } = useEmotionalTheme();
  const isSoloMode = theme === 'solo';
  
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [plantData, setPlantData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const playerRef = useRef<WebRTCPlayerRef>(null);

  useEffect(() => {
    const fetchPlant = async () => {
      try {
        const cached = getCache<any[]>(`plants-current`, 60000);
        if (cached) {
          const found = cached.find((p: any) => p.id === plantId);
          if (found) {
            setPlantData(found);
            return;
          }
        }
        
        const data = await apiGet<any[]>('/plants');
        if (Array.isArray(data)) {
          const found = data.find((p: any) => p.id === plantId);
          if (found) setPlantData(found);
        }
      } catch (e) {
        console.error('Error fetching plant data:', e);
      }
    };
    fetchPlant();
  }, [plantId]);

  const handleCapture = async () => {
    if (!playerRef.current) return;
    
    const base64Image = playerRef.current.captureFrame();
    if (!base64Image) {
      toast.error('无法截取直播画面，请重试');
      return;
    }

    setIsUploading(true);
    const uploadToast = toast.loading('正在保存直播瞬间...');
    
    try {
      const response = await fetch(apiUrl('/upload-snapshot'), {
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
        toast.success('已截取当前直播瞬间 ✨', { id: uploadToast });
      } else {
        throw new Error(result.error || '保存失败');
      }
    } catch (err: any) {
      console.error('Capture upload error:', err);
      toast.error(`截取失败: ${err.message}`, { id: uploadToast });
    } finally {
      setIsUploading(false);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
    );
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过 5MB');
      return;
    }

    setIsUploading(true);
    const uploadToast = toast.loading('正在上传生长瞬间...');
    
    try {
      // Convert to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      const base64Image = await base64Promise;

      const response = await fetch(apiUrl('/upload-snapshot'), {
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
        toast.success('瞬间已成功上传 ✨', { id: uploadToast });
      } else {
        const errorMsg = result.details || result.error || '上传失败';
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error(`上传失败: ${err.message}`, { id: uploadToast });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!selectedMood || !content.trim()) {
      toast.error('请选择心情并填写内容');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiPost('/mood', {
        plantId,
        mood: selectedMood,
        content,
        tags: selectedTags,
        imageUrl: uploadedImageUrl,
        timestamp: new Date().toISOString(),
      });

      // Navigate first to ensure immediate response
      navigate(-1);
      toast.success(isSoloMode ? '成长记录已保存 🌱' : '心情记录已保存 💚');
    } catch (error: any) {
      console.error('Error saving mood:', error);
      toast.error('保存失败：' + (error.message || '请重试'));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: themeConfig.bg }}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-black/5 px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-black">
              {isSoloMode ? '成长记录' : '记录心情'}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">记录此刻的感受</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-8 pb-32">
          {/* Mood Selection */}
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-4">
              {isSoloMode ? '今日状态' : '此刻心情'}
            </label>
            <div className="grid grid-cols-3 gap-3">
              {moodEmojis.map((mood) => (
                <motion.button
                  key={mood.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedMood(mood.id)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-2 p-5 rounded-3xl border-2 transition-all bg-white',
                    selectedMood === mood.id
                      ? `border-current ${mood.color} ${mood.bg} shadow-lg`
                      : 'border-black/5 hover:border-black/10'
                  )}
                >
                  <mood.icon 
                    size={32} 
                    className={selectedMood === mood.id ? mood.color : 'text-gray-400'}
                  />
                  <span className={cn(
                    'text-sm font-bold',
                    selectedMood === mood.id ? mood.color : 'text-gray-400'
                  )}>
                    {mood.label}
                  </span>
                  {selectedMood === mood.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={cn('w-5 h-5 rounded-full flex items-center justify-center', mood.bg)}
                    >
                      <Check size={14} className={mood.color} />
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Content Input */}
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-4">
              {isSoloMode ? '今天的收获' : '想说的话'}
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                isSoloMode 
                  ? '记录今天与植物相处的感悟...'
                  : '分享此刻的心情和感受...'
              }
              className="w-full h-48 px-5 py-4 rounded-3xl border border-black/10 focus:border-black/20 focus:outline-none resize-none text-sm leading-relaxed placeholder:text-gray-300 bg-white shadow-sm"
              maxLength={500}
            />
            <div className="flex justify-between items-center mt-3 px-2">
              <span className="text-xs text-gray-400">{content.length} / 500</span>
            </div>
          </div>

          {/* Activity Tags */}
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-4">
              添加标签（可选）
            </label>
            <div className="flex flex-wrap gap-3">
              {activityTags.map((tag) => (
                <motion.button
                  key={tag.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleTag(tag.id)}
                  className={cn(
                    'flex items-center gap-2 px-5 py-3 rounded-full border-2 transition-all text-sm font-bold bg-white',
                    selectedTags.includes(tag.id)
                      ? 'border-current text-white shadow-lg'
                      : 'border-black/10 text-gray-500 hover:border-black/20'
                  )}
                  style={
                    selectedTags.includes(tag.id)
                      ? { backgroundColor: themeConfig.primary, borderColor: themeConfig.primary }
                      : {}
                  }
                >
                  <tag.icon size={16} />
                  <span>{tag.label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Live Capture section */}
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center justify-between">
              <span>此刻生长瞬间</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-black/5 text-[10px] font-bold text-gray-400 hover:text-gray-600 active:scale-95 transition-all shadow-sm"
                >
                  <Upload size={10} />
                  本地上传
                </button>
              </div>
            </label>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              accept="image/*" 
              className="hidden" 
            />
            
            {uploadedImageUrl ? (
              <div className="relative group mb-4">
                <div className="rounded-[32px] overflow-hidden border-4 border-white shadow-xl aspect-video bg-black/5">
                  <img 
                    src={uploadedImageUrl} 
                    alt="Captured moment" 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <button 
                  onClick={() => setUploadedImageUrl(null)}
                  className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform z-10"
                >
                  <X size={20} />
                </button>
                <div className="absolute bottom-4 left-4 right-4 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full text-white text-[10px] font-bold text-center">
                  瞬间已记录，点击右上角可重新截取
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="relative aspect-video rounded-[32px] overflow-hidden border border-black/5 bg-black group">
                  <WebRTCPlayer 
                    ref={playerRef}
                    streamUrl={`http://192.168.92.162:8889/${plantData?.streamPath || 'heartplant'}/whep`}
                    rtspUrl={plantData?.streamUrl}
                    className="w-full h-full"
                  />
                  
                  {/* Overlay scanline effect */}
                  <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] z-10 bg-[length:100%_2px,3px_100%]" />
                  
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-12 h-12 border-2 border-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>

                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCapture}
                  disabled={isUploading}
                  className="w-full flex items-center justify-center gap-3 p-5 rounded-3xl bg-black text-white hover:bg-zinc-800 transition-colors shadow-lg disabled:opacity-50"
                >
                  {isUploading ? (
                    <RefreshCw className="animate-spin" size={20} />
                  ) : (
                    <>
                      <Camera size={20} />
                      <span className="text-sm font-black uppercase tracking-widest">截取直播画面作为瞬间</span>
                    </>
                  )}
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-black/5 p-6 pb-8">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={!selectedMood || !content.trim() || isSubmitting}
          className={cn(
            'w-full py-4 rounded-full font-black text-white text-lg flex items-center justify-center gap-2 transition-all',
            (!selectedMood || !content.trim() || isSubmitting)
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'shadow-lg hover:shadow-xl active:shadow-md'
          )}
          style={
            (selectedMood && content.trim() && !isSubmitting)
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
                <Send size={20} />
              </motion.div>
              <span>保存中...</span>
            </>
          ) : (
            <>
              <Send size={20} />
              <span>保存记录</span>
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
