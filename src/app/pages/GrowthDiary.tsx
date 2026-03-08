import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, 
  Search, 
  Filter, 
  Calendar, 
  MessageSquare, 
  ThumbsUp, 
  ChevronRight,
  MoreHorizontal,
  Plus,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { apiUrl, buildApiHeaders } from '../utils/api';

export const GrowthDiary = () => {
  const navigate = useNavigate();
  const [plants, setPlants] = useState<any[]>([]);
  const [allJournals, setAllJournals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      // 1. Fetch plants for mapping
      const plantResponse = await fetch(apiUrl('/plants'), {
        headers: await buildApiHeaders()
      });
      const plantData = await plantResponse.json();
      setPlants(plantData);

    // 2. Fetch all journals using the new efficient endpoint
    const url = apiUrl('/all-journals');
    console.log('Fetching journals from:', url);
    const journalResponse = await fetch(url, {
      headers: { 
        'Authorization': `Bearer ${publicAnonKey}`,
        'apikey': publicAnonKey
      }
    });
    
    if (journalResponse.ok) {
      const journalData = await journalResponse.json();
      
      // Enhance journal data with plant info
      const enhancedJournals = journalData.map((journal: any) => {
        const plant = plantData.find((p: any) => p.id === journal.plantId);
        return {
          ...journal,
          plantName: plant?.name || '未知植物',
          plantImage: plant?.image || 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?q=80&w=100'
        };
      });
      
      setAllJournals(enhancedJournals);
    } else {
      const errorText = await journalResponse.text();
      console.error('Server error response:', errorText);
      throw new Error(`Failed to fetch journals: ${journalResponse.status} ${errorText}`);
    }
    } catch (error) {
      toast.error('加载日记数据失败');
      console.error(error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredJournals = useMemo(() => {
    if (!searchTerm.trim()) return allJournals;
    
    const term = searchTerm.toLowerCase();
    return allJournals.filter(j => 
      j.title?.toLowerCase().includes(term) || 
      j.plantName?.toLowerCase().includes(term) ||
      j.entries?.some((e: any) => e.text?.toLowerCase().includes(term) || e.author?.toLowerCase().includes(term))
    );
  }, [allJournals, searchTerm]);

  const stats = useMemo(() => {
    const today = new Date().toLocaleDateString();
    const todayCount = allJournals.filter(j => new Date(j.timestamp).toLocaleDateString() === today).length;
    
    const modeDistribution = allJournals.reduce((acc: any, j) => {
      const plant = plants.find(p => p.id === j.plantId);
      const mode = plant?.type || 'unknown';
      acc[mode] = (acc[mode] || 0) + 1;
      return acc;
    }, {});

    return { todayCount, modeDistribution };
  }, [allJournals, plants]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 text-shadow-sm">成长日记管理</h2>
          <p className="text-sm text-gray-500 mt-1 italic">查阅用户与其心植之间的温情时刻</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchData}
            disabled={isRefreshing}
            className="flex items-center gap-2 bg-white border border-gray-100 hover:bg-gray-50 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            <span>刷新</span>
          </button>
          <button className="flex items-center gap-2 bg-white border border-gray-100 hover:bg-gray-50 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm">
            <Filter size={16} />
            <span>导出报告</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Statistics Column */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-[32px] p-6 text-white shadow-lg shadow-green-500/20">
            <p className="text-green-100 text-[10px] font-bold uppercase tracking-widest mb-1 opacity-80">今日新增记录</p>
            <h3 className="text-3xl font-black">{stats.todayCount} <span className="text-sm font-medium text-green-100 opacity-60">篇</span></h3>
            <div className="mt-4 flex items-center gap-2 text-[10px] text-green-100 bg-white/10 w-fit px-2 py-1 rounded-lg border border-white/5">
              <Plus size={10} />
              <span>环比昨日增长 15%</span>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm">
            <h4 className="text-sm font-black text-gray-900 mb-6 flex items-center justify-between">
              活跃模式分布
              <span className="text-[10px] text-gray-400 font-normal">实时数据</span>
            </h4>
            <div className="space-y-5">
              {[
                { label: '亲情模式', key: 'kinship', color: 'bg-blue-500', shadow: 'shadow-blue-500/20' },
                { label: '爱情模式', key: 'romance', color: 'bg-red-500', shadow: 'shadow-red-500/20' },
                { label: '友情模式', key: 'friendship', color: 'bg-orange-500', shadow: 'shadow-orange-500/20' },
                { label: '悦己模式', key: 'solo', color: 'bg-purple-500', shadow: 'shadow-purple-500/20' },
              ].map(item => {
                const count = stats.modeDistribution[item.key] || 0;
                const percentage = allJournals.length > 0 ? (count / allJournals.length) * 100 : 0;
                return (
                  <div key={item.key}>
                    <div className="flex justify-between text-[11px] mb-1.5">
                      <span className="text-gray-500 font-bold">{item.label}</span>
                      <span className="text-gray-900 font-black">{count} 篇</span>
                    </div>
                    <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100/50">
                      <div className={`h-full ${item.color} rounded-full transition-all duration-1000 ${item.shadow} shadow-lg`} style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Journals Feed */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center gap-4 bg-white border border-gray-100 rounded-3xl p-3 pl-6 shadow-sm focus-within:ring-2 focus-within:ring-green-500/20 transition-all">
            <Search className="text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="搜索日记标题、内容、参与者或植物..." 
              className="flex-1 bg-transparent border-none text-sm font-medium focus:ring-0 placeholder:text-gray-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="flex items-center gap-2 pr-2">
              <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                {filteredJournals.length} 结果
              </span>
            </div>
          </div>

          <div className="space-y-4 min-h-[500px]">
            {filteredJournals.map((journal) => (
              <div 
                key={journal.id} 
                className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer"
                onClick={() => navigate(`/admin/diary/${journal.id}`)}
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg border-2 border-white">
                      <img src={journal.plantImage} alt={journal.plantName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="text-lg font-black text-gray-900 group-hover:text-green-600 transition-colors">{journal.title}</h4>
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider ${
                          journal.style === 'cute' ? 'bg-pink-100 text-pink-600' : 
                          journal.style === 'minimal' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {journal.style}
                        </span>
                        {journal.isFeatured && (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-600 rounded-lg text-[9px] font-black uppercase tracking-wider">
                            Featured
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-[10px] text-gray-400 font-bold">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(journal.timestamp).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><BookOpen size={12} /> {journal.plantName}</span>
                      </div>
                    </div>
                  </div>
                  <button className="p-2 text-gray-300 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-all">
                    <MoreHorizontal size={20} />
                  </button>
                </div>

                <div className={`p-5 rounded-[24px] mb-5 border border-transparent group-hover:border-white transition-all ${
                  journal.style === 'cute' ? 'bg-pink-50/50' : 
                  journal.style === 'minimal' ? 'bg-gray-50/50' : 'bg-blue-50/50'
                }`}>
                  <div className="space-y-4">
                    {journal.entries?.slice(0, 2).map((entry: any, i: number) => (
                      <div key={i} className="flex gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-sm text-xs font-black text-gray-400 border border-gray-50">
                          {entry.author?.[0] || 'U'}
                        </div>
                        <div className="flex-1">
                          <p className="text-[11px] font-black text-gray-900">{entry.author}</p>
                          <p className="text-sm text-gray-600 mt-1 leading-relaxed line-clamp-2">{entry.text}</p>
                        </div>
                      </div>
                    ))}
                    {journal.entries?.length > 2 && (
                      <div className="flex items-center gap-2 pl-12 text-[10px] font-bold text-gray-400">
                        <div className="h-[1px] w-4 bg-gray-200"></div>
                        还有 {journal.entries.length - 2} 条共同记录...
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-5 border-t border-gray-50/80">
                  <div className="flex items-center gap-6">
                    <button className="flex items-center gap-2 text-[11px] font-black text-gray-400 hover:text-pink-600 transition-all">
                      <ThumbsUp size={14} className="group-hover:animate-bounce" /> 24 <span className="font-medium opacity-60">赞</span>
                    </button>
                    <button className="flex items-center gap-2 text-[11px] font-black text-gray-400 hover:text-blue-600 transition-all">
                      <MessageSquare size={14} /> 8 <span className="font-medium opacity-60">评论</span>
                    </button>
                  </div>
                  <button className="text-green-600 text-[11px] font-black flex items-center gap-1 group-hover:gap-2 transition-all">
                    查看完整内容 <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ))}

            {loading && !isRefreshing && (
              <div className="py-20 flex flex-col items-center justify-center space-y-4">
                <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-bold text-gray-400 animate-pulse">正在获取温情记录...</p>
              </div>
            )}

            {!loading && filteredJournals.length === 0 && (
              <div className="py-20 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                  <BookOpen size={40} className="text-gray-200" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-1">未找到相关记录</h4>
                <p className="text-sm text-gray-400">尝试更换搜索关键词或重置过滤器</p>
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="mt-6 text-green-600 text-xs font-bold hover:underline"
                  >
                    清空搜索条件
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
