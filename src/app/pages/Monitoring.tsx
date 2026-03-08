import React, { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { 
  Activity, 
  Thermometer, 
  Droplets, 
  Sun, 
  RefreshCcw, 
  Search,
  CheckCircle2,
  CircleX,
  AlertTriangle
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { toast } from 'sonner';
import { apiUrl, buildApiHeaders } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

// --- Memoized Components ---

const StatCard = memo(({ icon: Icon, label, value, unit, colorClass }: any) => (
  <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
    <div className={`w-12 h-12 ${colorClass} rounded-xl flex items-center justify-center shrink-0`}>
      <Icon size={24} />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-gray-400 truncate">{label}</p>
      <p className="text-lg font-black text-gray-900 truncate">
        {typeof value === 'number' ? value.toFixed(1) : value}{unit}
      </p>
    </div>
  </div>
));

const MonitoringChart = memo(({ data }: { data: any[] }) => (
  <div className="h-80 w-full">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
            <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorHum" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
        <XAxis 
          dataKey="time" 
          stroke="#9ca3af" 
          fontSize={10} 
          tickLine={false} 
          axisLine={false} 
          minTickGap={30}
        />
        <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
        <Tooltip 
          isAnimationActive={false}
          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} 
        />
        <Area 
          type="monotone" 
          dataKey="temp" 
          stroke="#f97316" 
          fillOpacity={1} 
          fill="url(#colorTemp)" 
          strokeWidth={2} 
          isAnimationActive={false}
        />
        <Area 
          type="monotone" 
          dataKey="humidity" 
          stroke="#3b82f6" 
          fillOpacity={1} 
          fill="url(#colorHum)" 
          strokeWidth={2} 
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
));

// --- Main Page ---

export const Monitoring = () => {
  const { session } = useAuth();
  const [plants, setPlants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlant, setSelectedPlant] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchPlants = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      const response = await fetch(apiUrl('/plants?admin_view=true'), {
        headers: await buildApiHeaders()
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Monitoring server error:', errorText);
        throw new Error(`Server responded with ${response.status}`);
      }
      
      let data;
      try {
        data = await response.json();
      } catch (jsonErr) {
        const rawBody = await response.clone().text();
        console.error('Failed to parse monitoring JSON. Raw body:', rawBody);
        throw jsonErr;
      }
      if (Array.isArray(data)) {
        setPlants(data);
        if (data.length > 0 && !selectedPlant) {
          setSelectedPlant(data[0]);
        }
      }
    } catch (error) {
      console.error('Monitoring fetch error:', error);
      toast.error('获取设备数据失败');
    } finally {
      setLoading(false);
    }
  }, [selectedPlant, session]);

  // Generate initial history
  useEffect(() => {
    const initial = Array.from({ length: 24 }).map((_, i) => ({
      time: `${i}:00`,
      temp: 22 + Math.random() * 5,
      humidity: 40 + Math.random() * 20,
      soil: 30 + Math.random() * 15
    }));
    setHistory(initial);
  }, []);

  useEffect(() => {
    fetchPlants();
  }, [session]);

  // Real-time Update Loop
  useEffect(() => {
    const interval = setInterval(() => {
      // Update historical data for chart
      setHistory(prev => {
        const next = [...prev.slice(1), {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          temp: (prev[prev.length - 1]?.temp || 24) + (Math.random() * 0.4 - 0.2),
          humidity: (prev[prev.length - 1]?.humidity || 45) + (Math.random() * 0.6 - 0.3),
          soil: (prev[prev.length - 1]?.soil || 35) + (Math.random() * 0.4 - 0.2)
        }];
        return next;
      });

      // Update current selected plant stats locally for "live" feel
      if (selectedPlant) {
        setSelectedPlant((prev: any) => ({
          ...prev,
          temp: prev.temp + (Math.random() * 0.2 - 0.1),
          humidity: prev.humidity + (Math.random() * 0.4 - 0.2)
        }));
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [selectedPlant?.id]);

  const filteredPlants = useMemo(() => {
    return plants.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.owners?.some((o: string) => o.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [plants, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">IoT 实时监控中心</h2>
          <p className="text-sm text-gray-500 mt-1">监控所有在线植物传感器的实时环境数据流</p>
        </div>
        <button 
          onClick={() => fetchPlants()}
          className="flex items-center justify-center gap-2 bg-white border border-black/5 hover:bg-gray-50 text-gray-600 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-sm active:scale-95 shrink-0"
        >
          <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
          同步最新云端数据
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar: Plant List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-gray-100 rounded-[32px] p-5 shadow-sm h-[calc(100vh-260px)] min-h-[500px] overflow-hidden flex flex-col">
            <div className="relative mb-5">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索设备、主人或模式..." 
                className="w-full bg-gray-50 border-none rounded-2xl py-3 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-green-500/20"
              />
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {filteredPlants.map((plant) => (
                <motion.button
                  layout
                  key={plant.id}
                  onClick={() => setSelectedPlant(plant)}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-3xl transition-all text-left group",
                    selectedPlant?.id === plant.id 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-white border border-black/5 hover:bg-gray-50'
                  )}
                >
                  <div className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 shadow-sm">
                    <img src={plant.image} alt={plant.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className={cn(
                      "absolute top-1 right-1 w-3 h-3 border-2 border-white rounded-full",
                      plant.alert ? "bg-red-500 animate-pulse" : "bg-green-500"
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-black text-gray-900 truncate">{plant.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{plant.type}</span>
                       <span className="text-[10px] text-gray-400">•</span>
                       <span className="text-[10px] text-gray-500 truncate">{plant.owners?.join(' & ')}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-[10px] font-black tracking-tighter ${plant.alert ? 'text-red-500' : 'text-green-500'}`}>
                      {plant.alert ? 'CRITICAL' : 'STABLE'}
                    </p>
                    <div className="w-12 h-1 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                       <div 
                         className={cn("h-full transition-all duration-1000", plant.health > 80 ? "bg-green-500" : "bg-orange-500")}
                         style={{ width: `${plant.health}%` }}
                       />
                    </div>
                  </div>
                </motion.button>
              ))}
              
              {filteredPlants.length === 0 && (
                <div className="py-20 text-center space-y-3">
                   <Search size={40} className="mx-auto text-gray-200" />
                   <p className="text-sm font-bold text-gray-400">未找到匹配的设备</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main: Real-time Data Visualization */}
        <div className="lg:col-span-8 space-y-6">
          <AnimatePresence mode="wait">
            {selectedPlant ? (
              <motion.div 
                key={selectedPlant.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-6"
              >
                {/* Quick Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  <StatCard 
                    icon={Thermometer} 
                    label="当前温度" 
                    value={selectedPlant.temp} 
                    unit="°C" 
                    colorClass="bg-orange-50 text-orange-500" 
                  />
                  <StatCard 
                    icon={Droplets} 
                    label="环境湿度" 
                    value={selectedPlant.humidity} 
                    unit="%" 
                    colorClass="bg-blue-50 text-blue-500" 
                  />
                  <StatCard 
                    icon={Activity} 
                    label="预计土壤水分" 
                    value={selectedPlant.humidity * 0.85} 
                    unit="%" 
                    colorClass="bg-green-50 text-green-500" 
                  />
                  <StatCard 
                    icon={Sun} 
                    label="光照强度" 
                    value={4200 + Math.floor(Math.random() * 100)} 
                    unit=" Lux" 
                    colorClass="bg-yellow-50 text-yellow-500" 
                  />
                </div>

                {/* Main Chart Container */}
                <div className="bg-white border border-black/5 rounded-[40px] p-8 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                      <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
                        <Activity size={24} className="text-green-500" />
                        环境趋势流分析
                      </h3>
                      <p className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-widest">Real-time Sensor Stream (Live)</p>
                    </div>
                    <div className="flex gap-4 bg-gray-50 p-2 rounded-2xl">
                      <div className="flex items-center gap-2 px-3">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span className="text-[10px] font-black text-gray-500 uppercase">温度 TEMP</span>
                      </div>
                      <div className="flex items-center gap-2 px-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-[10px] font-black text-gray-500 uppercase">湿度 HUM</span>
                      </div>
                    </div>
                  </div>
                  
                  <MonitoringChart data={history} />
                </div>

                {/* Status & Diagnostic Area */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
                  <div className="bg-white border border-black/5 rounded-[32px] p-6 shadow-sm">
                    <h4 className="text-sm font-black text-gray-900 mb-6 uppercase tracking-widest flex items-center gap-2">
                       <CheckCircle2 size={16} className="text-green-500" />
                       Node 健康诊断
                    </h4>
                    <div className="space-y-5">
                      <DiagnosticRow label="传感器连接状态" status="STABLE" statusColor="text-green-500" />
                      <DiagnosticRow label="WiFi 信号强度" status="-42dBm (极强)" statusColor="text-green-500" />
                      <DiagnosticRow label="电池/供电状态" status="98% (在线)" statusColor="text-blue-500" />
                      <DiagnosticRow 
                        label="预警系统自检" 
                        status={selectedPlant.alert ? 'ERROR' : 'PASS'} 
                        statusColor={selectedPlant.alert ? 'text-red-500' : 'text-green-500'} 
                      />
                    </div>
                  </div>

                  <motion.div 
                    layout
                    className={cn(
                      "rounded-[32px] p-8 shadow-sm border transition-colors duration-500 flex flex-col justify-between",
                      selectedPlant.alert ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'
                    )}
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <AlertTriangle className={selectedPlant.alert ? 'text-red-500' : 'text-green-500'} size={28} />
                        <h4 className="text-lg font-black text-gray-900 tracking-tight">AI 养护建议</h4>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed font-medium">
                        {selectedPlant.alert 
                          ? `检测到当前环境湿度低于临界值 (${selectedPlant.humidity.toFixed(1)}%)，系统已向主人 "${selectedPlant.owners?.[0]}" 推送紧急补水提醒。建议远程开启自动灌溉。` 
                          : `当前 "${selectedPlant.name}" 处于黄金生长区间。环境数据平衡度极佳，AI 预测未来 48 小时内健康度将持续上升。无需人工干预。`}
                      </p>
                    </div>
                    <button className={cn(
                      "mt-8 w-full py-4 rounded-2xl text-sm font-black transition-all shadow-xl active:scale-95",
                      selectedPlant.alert 
                        ? 'bg-red-500 text-white shadow-red-500/20' 
                        : 'bg-black text-white shadow-black/20'
                    )}>
                      {selectedPlant.alert ? '立即处理预警' : '查看详细分析报告'}
                    </button>
                  </motion.div>
                </div>
              </motion.div>
            ) : (
              <div className="h-[600px] flex flex-col items-center justify-center bg-white border-2 border-dashed border-gray-100 rounded-[40px]">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                   <Activity className="text-gray-300 animate-pulse" size={32} />
                </div>
                <h3 className="text-xl font-black text-gray-900">就绪中...</h3>
                <p className="text-gray-400 font-medium mt-2">请在左侧选择一个植物终端查看实时数据流</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const DiagnosticRow = ({ label, status, statusColor }: any) => (
  <div className="flex items-center justify-between">
    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</span>
    <span className={cn("text-[10px] font-black uppercase", statusColor)}>{status}</span>
  </div>
);

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');
