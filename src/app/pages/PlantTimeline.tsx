import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { 
  ChevronLeft, 
  Droplet, 
  Wind, 
  Sun, 
  BookOpen, 
  Loader2, 
  Calendar,
  User,
  Clock,
  ExternalLink,
  Plus,
  Smile,
  Frown,
  Meh,
  Heart
} from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl, buildApiHeaders } from '../utils/api';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

interface TimelineItem {
  id: string;
  type: 'journal' | 'activity' | 'mood';
  actionType?: string;
  title?: string;
  content?: string;
  timestamp: string;
  author?: string;
  userName?: string;
  details?: string;
  style?: string;
  mood?: string;
  tags?: string[];
}

interface Plant {
  id: string;
  name: string;
  type: string;
  imageUrl: string;
}

export const PlantTimeline = () => {
  const { plantId } = useParams();
  const navigate = useNavigate();
  const [selectedPlantId, setSelectedPlantId] = useState(plantId || '');
  const [plants, setPlants] = useState<Plant[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [timelineLoading, setTimelineLoading] = useState(false);

  // Fetch all claimed plants for the selector
  const fetchPlants = async () => {
    try {
      const response = await fetch(apiUrl('/plants'), {
        headers: await buildApiHeaders()
      });
      const data = await response.json();
      setPlants(data);
      if (!selectedPlantId && data.length > 0) {
        setSelectedPlantId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch plants', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch timeline for the selected plant
  const fetchTimeline = async (id: string) => {
    if (!id) return;
    setTimelineLoading(true);
    try {
      const response = await fetch(apiUrl('/plant-timeline/${id}'), {
        headers: await buildApiHeaders()
      });
      const data = await response.json();
      setTimeline(data);
    } catch (error) {
      toast.error('无法加载时间轴数据');
      console.error(error);
    } finally {
      setTimelineLoading(false);
    }
  };

  useEffect(() => {
    fetchPlants();
  }, []);

  useEffect(() => {
    if (selectedPlantId) {
      fetchTimeline(selectedPlantId);
    }
  }, [selectedPlantId]);

  const getMoodIcon = (mood?: string) => {
    switch (mood) {
      case 'happy': return <Smile className="text-pink-500" size={16} />;
      case 'sad': return <Frown className="text-blue-400" size={16} />;
      default: return <Meh className="text-gray-400" size={16} />;
    }
  };

  const getActionIcon = (actionType?: string) => {
    switch (actionType) {
      case 'watering': return <Droplet className="text-blue-500" size={16} />;
      case 'mist': return <Wind className="text-cyan-400" size={16} />;
      case 'fertilizing': return <Sun className="text-orange-400" size={16} />;
      default: return <Droplet className="text-blue-500" size={16} />;
    }
  };

  const getActionLabel = (actionType?: string) => {
    switch (actionType) {
      case 'watering': return '完成了一次浇水';
      case 'mist': return '为植物进行了喷雾';
      case 'fertilizing': return '施肥加餐';
      default: return '植物关怀操作';
    }
  };

  const currentPlant = plants.find(p => p.id === selectedPlantId);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-green-500 mb-4" size={32} />
        <p className="text-gray-500 font-medium">正在初始化时间轴...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-all shadow-sm"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">成长时间轴</h2>
            <p className="text-sm text-gray-500 mt-1">记录植物从入驻到成长的每一个足迹</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-500">选择植物:</label>
          <select 
            value={selectedPlantId}
            onChange={(e) => setSelectedPlantId(e.target.value)}
            className="bg-white border border-gray-100 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 shadow-sm"
          >
            {plants.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {currentPlant && (
        <div className="bg-white border border-gray-100 rounded-3xl p-6 flex items-center gap-6 shadow-sm mb-12">
          <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-50">
            <ImageWithFallback src={currentPlant.imageUrl} alt={currentPlant.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900">{currentPlant.name}</h3>
            <p className="text-sm text-gray-500 mb-2">{currentPlant.type}</p>
            <div className="flex gap-4">
              <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-md">
                <Calendar size={12} />
                入驻时间: 2024-05-12
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 uppercase tracking-widest bg-green-50 px-2 py-1 rounded-md">
                <Plus size={12} />
                累计日志: {timeline.filter(i => i.type === 'journal').length} 篇
              </div>
            </div>
          </div>
        </div>
      )}

      {timelineLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-green-500 mb-4" size={32} />
          <p className="text-gray-500">正在生成成长曲线...</p>
        </div>
      ) : timeline.length > 0 ? (
        <div className="relative pl-8 space-y-8 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100 before:content-['']">
          {timeline.map((item, index) => (
            <div key={item.id} className="relative group animate-in fade-in slide-in-from-left-4" style={{ animationDelay: `${index * 100}ms` }}>
              {/* Timeline dot */}
              <div className={`absolute -left-8 top-1 w-8 h-8 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10 ${
                item.type === 'journal' ? 'bg-green-500 text-white' : 
                item.type === 'mood' ? 'bg-pink-100 text-pink-500' : 'bg-gray-100'
              }`}>
                {item.type === 'journal' ? <BookOpen size={14} /> : 
                 item.type === 'mood' ? getMoodIcon(item.mood) : getActionIcon(item.actionType)}
              </div>

              <div className={`bg-white border rounded-2xl p-5 shadow-sm transition-all group-hover:shadow-md ${
                item.type === 'journal' ? 'border-green-100' : 
                item.type === 'mood' ? 'border-pink-100' : 'border-gray-50'
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                        item.type === 'journal' ? 'bg-green-100 text-green-700' : 
                        item.type === 'mood' ? 'bg-pink-100 text-pink-700' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {item.type === 'journal' ? '成长日志' : 
                         item.type === 'mood' ? '心情动态' : '日常护理'}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(item.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-gray-900">
                      {item.type === 'journal' ? item.title : 
                       item.type === 'mood' ? `记录了心情: ${item.mood === 'happy' ? '开心' : item.mood === 'sad' ? '低落' : '平静'}` : 
                       getActionLabel(item.actionType)}
                    </h4>
                  </div>
                  
                  {item.type === 'journal' && (
                    <button 
                      onClick={() => navigate(`/admin/diary/${item.id}`)}
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                    >
                      <ExternalLink size={16} />
                    </button>
                  )}
                </div>

                <div className="text-sm text-gray-600 leading-relaxed mb-4">
                  {item.type === 'journal' ? (
                    <p className="line-clamp-2">{item.content}</p>
                  ) : item.type === 'mood' ? (
                    <div>
                      <p className="mb-2 italic">“{item.content}”</p>
                      <div className="flex gap-2">
                        {item.tags?.map(tag => (
                          <span key={tag} className="px-2 py-0.5 bg-gray-50 rounded text-[10px] text-gray-400 font-medium">#{tag}</span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p>{item.details || '管理员执行了该日常护理操作，植物目前生长状态良好。'}</p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                      <User size={12} />
                    </div>
                    <span className="text-xs font-medium text-gray-500">
                      由 {item.author || item.userName || '系统管理员'} 操作
                    </span>
                  </div>
                  
                  {item.style && (
                    <span className="text-[10px] text-gray-400 font-medium">
                      风格: {item.style}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-[32px] p-20 text-center">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mx-auto mb-4">
            <History className="text-gray-300" size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">尚无成长轨迹</h3>
          <p className="text-sm text-gray-500 mt-1">该植物入驻时间较短，暂未产生日志或护理记录。</p>
        </div>
      )}
    </div>
  );
};

// Re-import missing icons for the empty state
import { History } from 'lucide-react';
