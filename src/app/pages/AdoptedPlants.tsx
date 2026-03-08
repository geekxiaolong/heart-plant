import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  History,
  Heart,
  Droplets,
  Thermometer,
  Users,
  Calendar,
  Loader2,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

interface ClaimedPlant {
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

export const AdoptedPlants = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [plants, setPlants] = useState<ClaimedPlant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchClaimedPlants = async () => {
    if (!session?.access_token) return;
    try {
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-4b732228/plants?admin_view=true`;
      console.log('Fetching adoptions from:', url);
      const response = await fetch(url, {
        headers: { 
          'X-User-JWT': session.access_token,
          'Authorization': `Bearer ${publicAnonKey}`,
          'apikey': publicAnonKey
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      setPlants(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error('获取认领数据失败: ' + (error.message || '网络错误'));
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaimedPlants();
  }, [session]);

  const filteredPlants = plants.filter(plant => 
    plant.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    plant.owners.some(owner => owner.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-green-500 mb-4" size={32} />
        <p className="text-gray-500 font-medium">加载认领数据...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">已认领植物管理</h2>
          <p className="text-sm text-gray-500 mt-1">监控用户认领的植物状态及成长历程</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl px-4 py-2 flex items-center gap-4 shadow-sm">
          <div className="text-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase">总认领数</p>
            <p className="text-lg font-black text-green-600">{plants.length}</p>
          </div>
          <div className="w-px h-8 bg-gray-100"></div>
          <div className="text-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase">预警中</p>
            <p className="text-lg font-black text-red-500">{plants.filter(p => p.alert).length}</p>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text" 
          placeholder="搜索植物名称、认领人..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-gray-100 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlants.map((plant) => (
          <div key={plant.id} className="bg-white border border-gray-100 rounded-[32px] overflow-hidden transition-all hover:shadow-xl hover:border-green-100 group">
            <div className="relative h-48 bg-gray-50">
              <ImageWithFallback src={plant.image} alt={plant.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              
              <div className="absolute top-4 right-4">
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md ${
                  plant.alert ? 'bg-red-500/80 text-white animate-pulse' : 'bg-green-500/80 text-white'
                }`}>
                  {plant.alert ? '需要关注' : '生长良好'}
                </div>
              </div>

              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-end justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white leading-tight">{plant.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-white/80 font-medium uppercase tracking-widest">{plant.type} 模式</span>
                    </div>
                  </div>
                  <div className="bg-white/20 backdrop-blur-md rounded-xl p-2 text-white border border-white/20">
                    <p className="text-[10px] font-bold opacity-80 leading-none">认领天数</p>
                    <p className="text-sm font-black mt-0.5">{plant.days} DAYS</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="flex flex-col items-center p-2 rounded-2xl bg-gray-50 border border-gray-100">
                  <Heart size={14} className="text-red-400 mb-1" />
                  <p className="text-[10px] text-gray-400 font-bold uppercase">健康度</p>
                  <p className="text-sm font-black text-gray-900">{plant.health}%</p>
                </div>
                <div className="flex flex-col items-center p-2 rounded-2xl bg-gray-50 border border-gray-100">
                  <Thermometer size={14} className="text-orange-400 mb-1" />
                  <p className="text-[10px] text-gray-400 font-bold uppercase">温度</p>
                  <p className="text-sm font-black text-gray-900">{plant.temp}°C</p>
                </div>
                <div className="flex flex-col items-center p-2 rounded-2xl bg-gray-50 border border-gray-100">
                  <Droplets size={14} className="text-blue-400 mb-1" />
                  <p className="text-[10px] text-gray-400 font-bold uppercase">湿度</p>
                  <p className="text-sm font-black text-gray-900">{plant.humidity}%</p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {plant.owners.map((owner, i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-green-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-green-700">
                        {owner.charAt(0)}
                      </div>
                    ))}
                  </div>
                  <span className="text-xs font-medium text-gray-500">
                    {plant.owners.join(' & ')}
                  </span>
                </div>
                <Users size={16} className="text-gray-300" />
              </div>

              <div className="pt-4 border-t border-gray-50 flex gap-3">
                <button 
                  onClick={() => navigate(`/admin/timeline/${plant.id}`)}
                  className="flex-1 bg-gray-900 text-white py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-95"
                >
                  <History size={16} />
                  成长时间轴
                </button>
                <button className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center text-gray-400 hover:text-green-600 hover:bg-green-50 transition-all">
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredPlants.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-gray-200">
              <AlertTriangle className="text-gray-300" size={32} />
            </div>
            <p className="text-gray-500 font-medium">暂无符合条件的认领记录</p>
          </div>
        )}
      </div>
    </div>
  );
};
