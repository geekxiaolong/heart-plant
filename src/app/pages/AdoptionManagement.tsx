import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { 
  Search, 
  Filter, 
  ChevronRight,
  Loader2,
  AlertCircle,
  Users,
  Calendar,
  Heart,
  Droplet,
  History
} from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

interface AdoptedPlant {
  id: string;
  name: string;
  type: string;
  health: number;
  temp: number;
  humidity: number;
  image: string;
  owners: string[];
  days: number;
  alert: boolean;
  created_at: string;
}

export const AdoptionManagement = () => {
  const navigate = useNavigate();
  const [plants, setPlants] = useState<AdoptedPlant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const fetchAdoptedPlants = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-4b732228/plants`, {
        headers: { 
          'Authorization': `Bearer ${publicAnonKey}`,
          'apikey': publicAnonKey
        }
      });
      if (!response.ok) throw new Error('Failed to fetch adopted plants');
      const data = await response.json();
      setPlants(data);
    } catch (error) {
      toast.error('获取已认领植物失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdoptedPlants();
  }, []);

  const filteredPlants = plants.filter(plant => {
    const matchesSearch = plant.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          plant.owners.some(owner => owner.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterType === 'all' || plant.type === filterType;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-green-500 mb-4" size={32} />
        <p className="text-gray-500 font-medium">正在加载已认领植物...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">已认领植物管理</h2>
          <p className="text-sm text-gray-500 mt-1">监控所有用户认领的植物状态与成长记录</p>
        </div>
        <div className="flex gap-4 bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
           <div className="px-4 py-2 text-center">
             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">总认领数</p>
             <p className="text-lg font-black text-gray-900">{plants.length}</p>
           </div>
           <div className="w-px bg-gray-100 my-2"></div>
           <div className="px-4 py-2 text-center">
             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">异常告警</p>
             <p className="text-lg font-black text-red-500">{plants.filter(p => p.alert).length}</p>
           </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 relative min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="搜索植物名称或认领人..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-100 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          {['all', 'kinship', 'romance', 'friendship', 'solo'].map((type) => (
            <button 
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-lg text-sm transition-all capitalize ${
                filterType === type 
                ? 'bg-green-600 text-white font-medium shadow-md' 
                : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'
              }`}
            >
              {type === 'all' ? '全部模式' : 
               type === 'kinship' ? '亲情' : 
               type === 'romance' ? '爱情' : 
               type === 'friendship' ? '友情' : '悦己'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {filteredPlants.map((plant) => (
          <div key={plant.id} className="bg-white border border-gray-100 rounded-[32px] p-6 transition-all hover:shadow-xl group flex gap-6">
            <div className="relative w-40 h-40 shrink-0 rounded-[24px] overflow-hidden bg-gray-50">
              <ImageWithFallback src={plant.image} alt={plant.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              {plant.alert && (
                <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full ring-4 ring-red-500/20 animate-pulse"></div>
              )}
            </div>
            
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-black text-gray-900">{plant.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        plant.type === 'kinship' ? 'bg-blue-100 text-blue-600' :
                        plant.type === 'romance' ? 'bg-red-100 text-red-600' :
                        plant.type === 'friendship' ? 'bg-orange-100 text-orange-600' : 'bg-purple-100 text-purple-600'
                      }`}>
                        {plant.type === 'kinship' ? '亲情模式' : 
                         plant.type === 'romance' ? '爱情模式' : 
                         plant.type === 'friendship' ? '友情模式' : '悦己模式'}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar size={12} />
                        陪伴 {plant.days} 天
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => navigate(`/admin/timeline/${plant.id}`)}
                    className="flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 px-3 py-1.5 rounded-full hover:bg-green-100 transition-colors"
                  >
                    成长轨迹 <History size={14} />
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="bg-gray-50 rounded-xl p-2 text-center">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">健康度</p>
                    <p className={`text-sm font-black ${plant.health < 80 ? 'text-orange-500' : 'text-green-600'}`}>{plant.health}%</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-2 text-center">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">温度</p>
                    <p className="text-sm font-black text-gray-900">{plant.temp}°C</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-2 text-center">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">湿度</p>
                    <p className="text-sm font-black text-gray-900">{plant.humidity}%</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {plant.owners.map((owner, i) => (
                      <div key={i} className="w-6 h-6 rounded-full bg-green-500 border-2 border-white flex items-center justify-center text-[10px] text-white font-bold uppercase">
                        {owner.charAt(0)}
                      </div>
                    ))}
                  </div>
                  <span className="text-xs text-gray-500 font-medium">
                    认领人: {plant.owners.join(' & ')}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                   <button className="p-2 text-gray-400 hover:text-blue-500 transition-colors">
                     <Droplet size={18} />
                   </button>
                   <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                     <Heart size={18} />
                   </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredPlants.length === 0 && (
          <div className="col-span-full bg-white border border-gray-100 rounded-3xl p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Users className="text-gray-300" size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">未找到认领记录</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-xs">当前筛选条件下没有匹配的已认领植物信息。</p>
          </div>
        )}
      </div>
    </div>
  );
};
