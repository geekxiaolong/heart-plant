import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  User, 
  BookOpen,
  Share2,
  Heart,
  MessageCircle,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { apiGet } from '../utils/api';
import { useEmotionalTheme } from '../context/ThemeContext';
import { cn } from '../utils/cn';

export default function JournalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { themeConfig } = useEmotionalTheme();
  
  const [journal, setJournal] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      try {
        const data = await apiGet<any>(`/journal-detail/${id}`);
        setJournal(data);
      } catch (err: any) {
        console.error('Error fetching journal detail:', err);
        toast.error('无法加载日记详情');
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

  if (!journal) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-xl font-black mb-4">未找到日记内容</h2>
        <button onClick={() => navigate(-1)} className="px-6 py-2 bg-black text-white rounded-xl font-bold">返回</button>
      </div>
    );
  }

  const date = new Date(journal.timestamp).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  const time = new Date(journal.timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-black/5 px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-sm font-black uppercase tracking-widest opacity-40">日记详情</h1>
        <div className="flex gap-2">
          <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
            <Share2 size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-6 space-y-8 pb-32">
          {/* Article Header */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                {journal.style === 'poetic' ? '诗意随笔' : journal.style === 'diary' ? '成长日记' : '日常记录'}
              </span>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-auto">
                <Clock size={12} />
                {time}
              </div>
            </div>
            <h1 className="text-3xl font-black text-gray-900 leading-tight">
              {journal.title}
            </h1>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar size={14} />
              <span>{date}</span>
            </div>
          </div>

          {/* Entries */}
          <div className="space-y-12 relative">
            {/* Connection Line */}
            <div className="absolute left-[19px] top-4 bottom-4 w-0.5 border-l-2 border-dashed border-gray-200" />

            {journal.entries.map((entry: any, index: number) => (
              <motion.div
                key={entry.id || `entry-${index}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative pl-12"
              >
                {/* Timeline Dot */}
                <div 
                  className="absolute left-0 top-1.5 w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md z-10"
                  style={{ backgroundColor: themeConfig.primary }}
                >
                  <span className="text-xs font-black">{entry.author[0]}</span>
                </div>

                <div className="bg-white p-6 rounded-[32px] shadow-sm border border-black/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-gray-900">{entry.author}</span>
                      <span className="text-[10px] font-bold text-gray-400">• {entry.timestamp}</span>
                    </div>
                  </div>

                  {entry.imageUrl && (
                    <div className="rounded-2xl overflow-hidden border border-black/5 aspect-video bg-gray-50">
                      <img 
                        src={entry.imageUrl} 
                        alt="Moment" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap italic font-serif text-lg">
                    {entry.content}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom Card */}
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-black/5 text-center space-y-4">
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-2">
              <Sparkles size={32} />
            </div>
            <h3 className="text-xl font-black">一段美好的共同回忆</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              这篇日记记录了你们对植物倾注的爱与耐心。<br />
              每一次记录，都是生命成长的见证。
            </p>
            <div className="pt-4 flex items-center justify-center gap-6">
              <button className="flex items-center gap-2 text-xs font-black text-gray-400 hover:text-rose-500 transition-colors">
                <Heart size={18} />
                <span>点赞 12</span>
              </button>
              <button className="flex items-center gap-2 text-xs font-black text-gray-400 hover:text-blue-500 transition-colors">
                <MessageCircle size={18} />
                <span>评论 4</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
