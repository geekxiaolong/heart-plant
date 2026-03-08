import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  Trash2, 
  Edit3, 
  ChevronRight,
  Loader2,
  AlertCircle,
  History,
  Heart
} from 'lucide-react';
import { toast } from 'sonner';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { apiGet, apiDelete } from '../utils/api';

interface Plant {
  id: string;
  name: string;
  type: string;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
  imageUrl: string;
  scene: string;
  status: string;
  tags: string[];
  adoptCount: number;
  addedDate: string;
  habits: string;
  lifespan: string;
  emotionalMeaning: string;
}

export const PlantLibrary = () => {
  const navigate = useNavigate();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const fetchLibrary = async () => {
    try {
      const data = await apiGet<Plant[]>('/library');
      setPlants(data);
    } catch (error: any) {
      toast.error('获取植物库失败：' + error.message);
      console.error('Fetch library error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLibrary();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('确定要从植物库中移除这种植物吗？')) return;
    try {
      await apiDelete(`/library/${id}`);
      toast.success('已从植物库中移除');
      setPlants(plants.filter(p => p.id !== id));
    } catch (error: any) {
      toast.error('删除失败：' + error.message);
      console.error('Delete error:', error);
    }
  };

  const filteredPlants = plants.filter(plant => {
    const matchesSearch = plant.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          plant.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || plant.scene === filterType;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-green-500 mb-4" size={32} />
        <p className="text-gray-500 font-medium">正在加载植物库...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">植物名录管理</h2>
          <p className="text-sm text-gray-500 mt-1">管理系统内可供认领的植物信息</p>
        </div>
        <button 
          onClick={() => navigate('/admin/plants/add')}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-md active:scale-95"
        >
          <Plus size={20} />
          <span>添加新植物</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlants.map((plant) => (
          <div key={plant.id} className="bg-white border border-gray-100 rounded-3xl p-4 transition-all hover:shadow-xl hover:border-green-100 group">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-4 bg-gray-50">
              <ImageWithFallback src={plant.imageUrl} alt={plant.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute top-3 left-3 flex gap-2">
                <span className={`px-2 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase backdrop-blur-md bg-white/70 text-gray-900 border border-white/20`}>
                  {plant.type}
                </span>
                <span className={`px-2 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase backdrop-blur-md ${
                  plant.difficulty === 'easy' ? 'bg-green-500/80 text-white' : 
                  plant.difficulty === 'medium' ? 'bg-orange-500/80 text-white' : 'bg-red-500/80 text-white'
                }`}>
                  {plant.difficulty === 'easy' ? '初级' : plant.difficulty === 'medium' ? '中级' : '高级'}
                </span>
              </div>
            </div>
            
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1">{plant.name}</h3>
                  <p className="text-xs text-gray-500 line-clamp-1">{plant.description}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => navigate(`/admin/timeline/${plant.id}`)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    title="查看成长时间轴"
                  >
                    <History size={16} />
                  </button>
                  <button 
                    onClick={() => navigate(`/admin/plants/edit/${plant.id}`)}
                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(plant.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-50 flex flex-col gap-3">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">已认领</p>
                    <p className="text-sm font-black text-gray-900">{plant.adoptCount || 0}</p>
                  </div>
                  <div className="h-4 w-px bg-gray-100"></div>
                  <div className="text-center">
                    <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">预计寿命</p>
                    <p className="text-sm font-black text-gray-900">{plant.lifespan || '未知'}</p>
                  </div>
                  <div className="h-4 w-px bg-gray-100"></div>
                  <div className="text-center flex-1">
                    <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">模式</p>
                    <p className="text-sm font-black text-gray-900">
                      {plant.scene === 'family' ? '亲情' : 
                       plant.scene === 'love' ? '爱情' : 
                       plant.scene === 'friend' ? '友情' : '悦己'}
                    </p>
                  </div>
                </div>
                
                <div className="bg-pink-50/50 p-3 rounded-xl border border-pink-100/30">
                   <p className="text-[8px] font-black uppercase tracking-widest text-pink-400 mb-1 flex items-center gap-1"><Heart size={8} fill="currentColor" /> 情感寓意 & 互动画像</p>
                   <p className="text-[10px] font-bold text-pink-700 italic line-clamp-2 leading-relaxed mb-2">
                      {plant.emotionalMeaning || '“静待花开，守护你我”'}
                   </p>
                   <div className="flex gap-2">
                      {['治愈', '陪伴', '活力'].map((dim, i) => (
                        <div key={dim} className="flex-1 bg-white/60 rounded-lg p-1.5 flex flex-col items-center">
                           <span className="text-[7px] font-black text-pink-300 uppercase">{dim}</span>
                           <span className="text-[10px] font-black text-pink-600">
                             {(plant as any).dimensions?.[i === 0 ? 'healing' : i === 1 ? 'companion' : 'vitality'] ?? '-'}%
                           </span>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-xl">
                   <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1">生长习性</p>
                   <p className="text-[10px] font-medium text-gray-500 line-clamp-2">{plant.habits || '尚未配置习性描述'}</p>
                </div>
                
                <div className="flex items-center justify-between mt-1">
                   <p className="text-[8px] font-black uppercase tracking-widest text-gray-300">入库: {plant.addedDate}</p>
                   <button 
                      onClick={() => navigate(`/admin/plants/edit/${plant.id}`)}
                      className="text-green-600 text-xs font-black flex items-center gap-1 hover:gap-2 transition-all"
                   >
                      编辑详情 <ChevronRight size={14} />
                   </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredPlants.length === 0 && (
          <div className="col-span-full bg-white border border-gray-100 rounded-3xl p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="text-gray-300" size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">未找到符合条件的植物</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-xs">请尝试更换关键词搜索，或在当前分类下尚无植物。</p>
            <button 
              onClick={() => { setSearchTerm(''); setFilterType('all'); }}
              className="mt-6 text-green-600 font-medium hover:underline"
            >
              清空筛选条件
            </button>
          </div>
        )}
      </div>
    </div>
  );
};