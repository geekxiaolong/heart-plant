import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { 
  ArrowLeft, 
  Calendar, 
  BookOpen, 
  MessageSquare, 
  ThumbsUp, 
  User, 
  Clock,
  Layout,
  Tag,
  Share2,
  MoreVertical,
  Heart
} from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl, buildApiHeaders } from '../utils/api';

export const GrowthDiaryDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [journal, setJournal] = useState<any>(null);
  const [plant, setPlant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchJournalDetail = async () => {
    try {
      // 1. Fetch the journal
      const response = await fetch(apiUrl('/journal-detail/${id}'), {
        headers: { Authorization: `Bearer ${publicAnonKey}` }
      });
      if (!response.ok) throw new Error('Failed to fetch journal');
      const data = await response.json();
      setJournal(data);

      // 2. Fetch the plant info for context
      if (data.plantId) {
        const plantResponse = await fetch(apiUrl('/plants'), {
          headers: { Authorization: `Bearer ${publicAnonKey}` }
        });
        const plants = await plantResponse.json();
        const foundPlant = plants.find((p: any) => p.id === data.plantId);
        setPlant(foundPlant);
      }
    } catch (error) {
      toast.error('获取详情失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeatured = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch(apiUrl('/journal-feature/${id}'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${publicAnonKey}` }
      });
      const data = await response.json();
      if (data.success) {
        setJournal({ ...journal, isFeatured: data.isFeatured });
        toast.success(data.isFeatured ? '已设为精选' : '已取消精选');
      }
    } catch (error) {
      toast.error('操作失败');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteJournal = async () => {
    if (!confirm('确定要下架并删除该篇日记吗？此操作不可撤销。')) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch(apiUrl('/journal/${id}'), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${publicAnonKey}` }
      });
      const data = await response.json();
      if (data.success) {
        toast.success('日记已成功下架');
        navigate('/admin/diary');
      }
    } catch (error) {
      toast.error('删除失败');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (id) fetchJournalDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!journal) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
        <p className="text-gray-500 mb-4">未找到该日记记录</p>
        <button 
          onClick={() => navigate('/admin/diary')}
          className="bg-green-600 text-white px-6 py-2 rounded-xl text-sm font-bold"
        >
          返回列表
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Navigation */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/admin/diary')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors group bg-white border border-gray-100 px-4 py-2 rounded-xl shadow-sm"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold">返回列表</span>
        </button>
        <div className="flex gap-2">
          <button className="p-2 text-gray-400 hover:bg-white hover:text-green-600 rounded-xl transition-all border border-transparent hover:border-gray-100 shadow-sm">
            <Share2 size={18} />
          </button>
          <button className="p-2 text-gray-400 hover:bg-white hover:text-red-600 rounded-xl transition-all border border-transparent hover:border-gray-100 shadow-sm">
            <Heart size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                journal.style === 'cute' ? 'bg-pink-100 text-pink-600' : 
                journal.style === 'minimal' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-600'
              }`}>
                {journal.style || 'Default'} Style
              </span>
              {journal.isFeatured && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                  Featured 精选
                </span>
              )}
              <span className="text-xs text-gray-400 flex items-center gap-1 ml-auto">
                <Clock size={12} />
                发布于 {new Date(journal.timestamp).toLocaleString()}
              </span>
            </div>

            <h1 className="text-3xl font-black text-gray-900 mb-6 leading-tight">
              {journal.title}
            </h1>

            <div className="space-y-8">
              {journal.entries?.map((entry: any, index: number) => (
                <div key={index} className="relative pl-8 border-l-2 border-dashed border-gray-100 last:border-0 pb-2">
                  <div className="absolute -left-[11px] top-0 w-5 h-5 rounded-full bg-white border-4 border-green-100 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  </div>
                  <div className="flex items-start gap-4 mb-2">
                    <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100">
                      <User size={18} className="text-gray-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{entry.author}</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">记录者 • 共同守护者</p>
                    </div>
                  </div>
                  <div className="bg-gray-50/50 rounded-2xl p-4 mt-2">
                    <p className="text-gray-600 leading-relaxed text-sm">
                      {entry.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 pt-8 border-t border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center overflow-hidden">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} alt="user" />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400">
                  <span className="font-bold text-gray-900">24</span> 位用户点赞了这篇日记
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 text-green-600 text-xs font-bold hover:bg-green-100 transition-colors">
                  <ThumbsUp size={14} /> 点赞
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 text-gray-600 text-xs font-bold hover:bg-gray-100 transition-colors">
                  <MessageSquare size={14} /> 评论
                </button>
              </div>
            </div>
          </div>

          {/* Comment Section Mockup */}
          <div className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <MessageSquare size={20} className="text-blue-500" />
              评论互动 (8)
            </h3>
            <div className="space-y-6">
              {[1, 2].map(i => (
                <div key={i} className="flex gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-gray-100 shrink-0"></div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="text-sm font-bold text-gray-900">用户_{i}732</h4>
                      <span className="text-[10px] text-gray-400">2小时前</span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">真是一段温馨的时光，希望植物能茁壮成长！</p>
                  </div>
                </div>
              ))}
              <div className="pt-4">
                <button className="w-full py-3 rounded-2xl bg-gray-50 text-gray-400 text-sm font-medium hover:bg-gray-100 transition-all border border-dashed border-gray-200">
                  查看更多评论...
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Associated Plant */}
          {plant && (
            <div className="bg-white border border-gray-100 rounded-[32px] overflow-hidden shadow-sm">
              <div className="aspect-square relative">
                <img src={plant.image} alt={plant.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">关联植物</p>
                  <h3 className="text-xl font-bold">{plant.name}</h3>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 flex items-center gap-1"><Calendar size={14} /> 认领时长</span>
                  <span className="font-bold text-gray-900">{plant.days} 天</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 flex items-center gap-1"><Layout size={14} /> 情感模式</span>
                  <span className={`font-bold ${
                    plant.type === 'romance' ? 'text-red-500' : 
                    plant.type === 'kinship' ? 'text-blue-500' : 
                    plant.type === 'friendship' ? 'text-orange-500' : 'text-purple-500'
                  }`}>
                    {plant.type === 'romance' ? '爱情模式' : 
                     plant.type === 'kinship' ? '亲情模式' : 
                     plant.type === 'friendship' ? '友情模式' : '悦己模式'}
                  </span>
                </div>
                <button 
                  onClick={() => navigate('/admin/monitoring')}
                  className="w-full py-3 mt-2 rounded-2xl bg-green-600 text-white text-sm font-bold shadow-lg shadow-green-500/20 hover:bg-green-700 transition-all"
                >
                  实时监控
                </button>
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm">
            <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Tag size={16} className="text-purple-500" />
              标签云
            </h4>
            <div className="flex flex-wrap gap-2">
              {['温馨', '治愈', '第一天', '银皇后', '成长记录', '亲情模式'].map(tag => (
                <span key={tag} className="px-3 py-1 bg-gray-50 border border-gray-100 rounded-lg text-xs text-gray-500 hover:border-green-200 hover:bg-green-50 transition-all cursor-default">
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-900 rounded-[32px] p-6 text-white shadow-xl shadow-gray-200">
            <h4 className="text-sm font-bold mb-4 opacity-60">管理操作</h4>
            <div className="space-y-3">
              <button 
                disabled={isProcessing}
                onClick={handleToggleFeatured}
                className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all group ${
                  journal.isFeatured ? 'bg-green-600/20 text-green-400' : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                <span className="text-sm font-bold">{journal.isFeatured ? '取消精选' : '精选日记'}</span>
                <div className={`w-8 h-4 rounded-full relative transition-colors ${
                  journal.isFeatured ? 'bg-green-500' : 'bg-gray-700'
                }`}>
                  <div className={`absolute top-1 w-2 h-2 rounded-full bg-white transition-all ${
                    journal.isFeatured ? 'right-1' : 'left-1'
                  }`}></div>
                </div>
              </button>
              <button 
                disabled={isProcessing}
                onClick={handleDeleteJournal}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/10 hover:bg-red-600/20 transition-all text-red-400 disabled:opacity-50"
              >
                <span className="text-sm font-bold">下架内容</span>
                <MoreVertical size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
