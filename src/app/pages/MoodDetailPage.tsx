import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { 
  ArrowLeft, 
  Smile, 
  Calendar, 
  Clock, 
  Tag,
  Share2,
  Heart,
  MessageCircle,
  Sparkles,
  ChevronRight,
  Meh,
  Frown,
  Star,
  Cloud,
  X
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { apiGet } from '../utils/api';
import { useEmotionalTheme } from '../context/ThemeContext';
import { cn } from '../utils/cn';

const moodIcons: any = {
  happy: { icon: Smile, label: '开心', color: 'text-yellow-500', bg: 'bg-yellow-50' },
  calm: { icon: Meh, label: '平静', color: 'text-blue-500', bg: 'bg-blue-50' },
  sad: { icon: Frown, label: '低落', color: 'text-gray-500', bg: 'bg-gray-50' },
  love: { icon: Heart, label: '感动', color: 'text-red-500', bg: 'bg-red-50' },
  excited: { icon: Star, label: '兴奋', color: 'text-purple-500', bg: 'bg-purple-50' },
  peaceful: { icon: Cloud, label: '宁静', color: 'text-teal-500', bg: 'bg-teal-50' },
};

export default function MoodDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { themeConfig } = useEmotionalTheme();
  
  const [mood, setMood] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      try {
        const data = await apiGet<any>(`/mood-detail/${id}`);
        setMood(data);
      } catch (err: any) {
        console.error('Error fetching mood detail:', err);
        toast.error('无法加载心情记录');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!mood) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-xl font-black mb-4">未找到记录内容</h2>
        <button onClick={() => navigate(-1)} className="px-6 py-2 bg-black text-white rounded-xl font-bold">返回</button>
      </div>
    );
  }

  const moodInfo = moodIcons[mood.mood] || moodIcons.calm;
  const date = new Date(mood.timestamp).toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
  const time = new Date(mood.timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="sticky top-0 z-10 bg-white border-b border-black/5 px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-sm font-black uppercase tracking-widest opacity-40">记录详情</h1>
        <div className="flex gap-2">
          <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
            <Share2 size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto p-6 space-y-8 pb-32">
          {/* Mood Hero Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("p-10 rounded-[40px] shadow-sm border border-black/5 text-center space-y-6 relative overflow-hidden", moodInfo.bg)}
          >
             {/* Decorative Background Icon */}
            <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 opacity-5 rotate-12">
               <moodInfo.icon size={200} />
            </div>

            <div className="relative z-10 flex flex-col items-center gap-4">
              <div className={cn("w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg bg-white", moodInfo.color)}>
                <moodInfo.icon size={48} />
              </div>
              <div className="space-y-1">
                <h3 className={cn("text-2xl font-black uppercase tracking-widest", moodInfo.color)}>
                  {moodInfo.label}
                </h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">{date}</p>
              </div>
            </div>
          </motion.div>

          {/* Content Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-8 rounded-[40px] shadow-sm border border-black/5 space-y-6"
          >
            {mood.imageUrl && (
              <div className="rounded-3xl overflow-hidden border border-black/5 aspect-video bg-gray-50">
                <img 
                  src={mood.imageUrl} 
                  alt="Snapshot" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-1 rounded-full bg-gray-200" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">此刻记录</span>
              </div>
              <p className="text-lg font-bold text-gray-800 leading-relaxed italic">
                “{mood.content}”
              </p>
            </div>

            {mood.tags && mood.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-50">
                {mood.tags.map((tag: string) => (
                  <span key={tag} className="px-3 py-1.5 bg-gray-50 rounded-xl text-[10px] font-black text-gray-400 uppercase tracking-widest border border-black/5">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </motion.div>

          <div className="text-center py-4">
             <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest flex items-center justify-center gap-2">
                <Clock size={12} />
                发布于 {time}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
