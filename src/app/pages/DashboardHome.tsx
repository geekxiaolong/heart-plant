import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { 
  Sprout, 
  Activity, 
  BookOpen, 
  ClipboardList, 
  TrendingUp, 
  Users, 
  AlertTriangle,
  ArrowRight,
  TrendingDown
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { projectId, publicAnonKey } from '/utils/supabase/info';

const data = [
  { name: '周一', value: 45, color: '#22c55e' },
  { name: '周二', value: 52, color: '#22c55e' },
  { name: '周三', value: 38, color: '#22c55e' },
  { name: '周四', value: 65, color: '#22c55e' },
  { name: '周五', value: 48, color: '#22c55e' },
  { name: '周六', value: 72, color: '#22c55e' },
  { name: '周日', value: 58, color: '#22c55e' },
];

export const DashboardHome = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [stats, setStats] = useState({
    totalPlants: 0,
    onlineDevices: 0,
    activeUsers: 1420,
    alerts: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (!session?.access_token) return;
      try {
        const headers = { 
          'Authorization': `Bearer ${publicAnonKey}`,
          'apikey': publicAnonKey,
          'X-User-JWT': session.access_token
        };

        const libraryRes = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-4b732228/library`, { headers });
        if (!libraryRes.ok) {
          const errText = await libraryRes.text();
          console.error('Library fetch failed:', errText);
          throw new Error('Library fetch failed');
        }
        
        let library;
        try {
          library = await libraryRes.json();
        } catch (jsonErr) {
          const rawBody = await libraryRes.clone().text();
          console.error('Failed to parse library JSON. Raw body:', rawBody);
          throw jsonErr;
        }
        
        const plantsRes = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-4b732228/plants?admin_view=true`, { headers });
        if (!plantsRes.ok) {
          const errText = await plantsRes.text();
          console.error('Plants fetch failed:', errText);
          throw new Error('Plants fetch failed');
        }
        
        let plants;
        try {
          plants = await plantsRes.json();
        } catch (jsonErr) {
          const rawBody = await plantsRes.clone().text();
          console.error('Failed to parse plants JSON. Raw body:', rawBody);
          throw jsonErr;
        }
        
        setStats({
          totalPlants: Array.isArray(library) ? library.length : 0,
          onlineDevices: Array.isArray(plants) ? plants.length : 0,
          activeUsers: 1420 + Math.floor(Math.random() * 50),
          alerts: Array.isArray(plants) ? plants.filter((p: any) => p.alert).length : 0
        });
      } catch (error) {
        console.error('Dashboard stats fetch error:', error);
      }
    };
    fetchStats();
  }, [session]);

  const cards = [
    { label: '植物名录', value: stats.totalPlants, icon: Sprout, color: 'text-green-500', bg: 'bg-green-50', trend: '+12%', trendUp: true },
    { label: '在线设备', value: stats.onlineDevices, icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50', trend: '+5%', trendUp: true },
    { label: '活跃用户', value: stats.activeUsers, icon: Users, color: 'text-purple-500', bg: 'bg-purple-50', trend: '-2%', trendUp: false },
    { label: '待处理预警', value: stats.alerts, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50', trend: '稳定', trendUp: true },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">管理概览 Dashboard</h2>
          <p className="text-sm text-gray-500 mt-1 italic font-medium">欢迎回来，这是您今天的 "心植" 系统实时运行状况报告。</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-4 py-2 shadow-sm text-xs font-bold text-gray-400">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          系统状态：运行良好
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all hover:scale-[1.02] cursor-default group">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 ${card.bg} ${card.color} rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-all`}>
                <card.icon size={24} />
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${
                card.trendUp ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
              }`}>
                {card.trendUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {card.trend}
              </div>
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{card.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Charts Section */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="text-green-500" size={24} />
                用户活跃趋势 (过去7天)
              </h3>
              <select className="bg-gray-50 border-none rounded-xl py-2 px-4 text-xs font-bold text-gray-500 focus:ring-2 focus:ring-green-500/20">
                <option>按周展示</option>
                <option>按月展示</option>
              </select>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#f9fafb' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} 
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex items-center gap-6 group hover:border-green-100 transition-all">
              <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center text-green-500 group-hover:scale-110 transition-all">
                <Sprout size={32} />
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-bold text-gray-900">植物名录管理</h4>
                <p className="text-xs text-gray-500 mt-1">管理可供认领的 4 种模式植物</p>
                <button 
                  onClick={() => navigate('/admin/plants')}
                  className="mt-3 text-green-600 text-xs font-bold flex items-center gap-1"
                >
                  前往管理 <ArrowRight size={14} />
                </button>
              </div>
            </div>
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex items-center gap-6 group hover:border-blue-100 transition-all">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-all">
                <Activity size={32} />
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-bold text-gray-900">设备运行中心</h4>
                <p className="text-xs text-gray-500 mt-1">监控传感器与云端实时连接</p>
                <button 
                  onClick={() => navigate('/admin/monitoring')}
                  className="mt-3 text-blue-600 text-xs font-bold flex items-center gap-1"
                >
                  前往监控 <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity List */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <ClipboardList className="text-gray-400" size={20} />
              近期动态
            </h3>
            <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-50">
              {[
                { label: '名录更新', desc: '银皇后养护指南已更新', time: '10 分钟前', color: 'bg-green-500' },
                { label: '认领预警', desc: '用户 2039 提交了认领反馈', time: '25 分钟前', color: 'bg-orange-500' },
                { label: '设备离线', desc: 'DB-019 失去了 WiFi 连接', time: '1 小时前', color: 'bg-red-500' },
                { label: '新日记发布', desc: '用户 ID 202发布了成长日记', time: '2 小时前', color: 'bg-blue-500', link: '/admin/diary' },
                { label: '系统维护', desc: '数据库已完成例行自动清理', time: '4 小时前', color: 'bg-gray-300' },
              ].map((item, i) => (
                <div key={i} className="relative pl-8 group cursor-pointer" onClick={() => item.link && navigate(item.link)}>
                  <div className={`absolute left-1.5 top-1 w-3 h-3 rounded-full border-2 border-white ring-4 ring-white ${item.color} z-10 transition-transform group-hover:scale-125`}></div>
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-bold text-gray-900">{item.label}</span>
                      <span className="text-[10px] text-gray-400 italic font-medium tabular-nums">{item.time}</span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <button 
              onClick={() => navigate('/admin/logs')}
              className="w-full mt-8 py-3 bg-gray-50 text-gray-500 text-xs font-bold rounded-2xl hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
            >
              查看全部日志 <ArrowRight size={14} />
            </button>
          </div>

          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[32px] p-6 text-white shadow-xl shadow-indigo-500/20 overflow-hidden relative group">
             <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-all">
                <Users size={120} />
             </div>
             <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest mb-1">社群动态</p>
             <h4 className="text-xl font-bold leading-tight">心植用户规模<br/>本月突破 2W</h4>
             <p className="text-xs text-indigo-100/70 mt-3 leading-relaxed">
               亲情模式认领增长最快，已成为核心增长动力。
             </p>
             <button className="mt-6 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-xs font-bold transition-all backdrop-blur-md">
               查阅增长报告
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
