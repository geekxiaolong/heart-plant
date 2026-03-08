import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Settings, 
  Calendar, 
  BookOpen, 
  Activity, 
  Droplets, 
  Thermometer, 
  Sun,
  History,
  MessageSquare,
  AlertTriangle,
  Heart,
  User,
  Clock,
  ExternalLink,
  ChevronRight,
  MoreVertical,
  Camera,
  Edit2,
  Leaf
} from 'lucide-react';
import { cn } from '../utils/cn';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';

interface DiaryEntry {
  id: string;
  date: string;
  content: string;
  mood: string;
  images?: string[];
}

interface LogEntry {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  status: 'info' | 'success' | 'warning' | 'error';
}

const MOCK_DIARIES: DiaryEntry[] = [
  {
    id: 'd1',
    date: '2024-03-01 10:30',
    content: '今天小绿长出了一个新芽！看来最近的水分和光照都很合适。希望能继续茁壮成长。',
    mood: '开心',
    images: ['https://images.unsplash.com/photo-1572688484438-313a6e50c333?w=400'],
  },
  {
    id: 'd2',
    date: '2024-02-28 16:45',
    content: '最近天气转凉，把它移到了离窗户远一点的地方。',
    mood: '平静',
  },
];

const MOCK_LOGS: LogEntry[] = [
  { id: 'l1', timestamp: '2024-03-02 09:15', action: '系统自检', details: '所有传感器在线，数据同步正常', status: 'success' },
  { id: 'l2', timestamp: '2024-03-02 08:30', action: '自动浇水', details: '土壤湿度低于40%，触发水泵运行 5s', status: 'info' },
  { id: 'l3', timestamp: '2024-03-01 22:10', action: '环境预警', details: '检测到环境温度过低 (18°C)，已发送提醒', status: 'warning' },
  { id: 'l4', timestamp: '2024-03-01 14:20', action: '用户记录', details: '用户上传了新的成长日记', status: 'info' },
  { id: 'l5', timestamp: '2024-03-01 08:00', action: '光照异常', details: '光照不足，建议检查植物位置', status: 'error' },
];

const MOCK_SENSOR_DATA = [
  { time: '00:00', humidity: 45, temp: 22 },
  { time: '04:00', humidity: 48, temp: 21 },
  { time: '08:00', humidity: 42, temp: 23 },
  { time: '12:00', humidity: 38, temp: 26 },
  { time: '16:00', humidity: 40, temp: 25 },
  { time: '20:00', humidity: 44, temp: 23 },
];

interface Props {
  plantId: string;
  onBack: () => void;
}

export function ClaimedPlantDetail({ plantId, onBack }: Props) {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'diaries' | 'logs'>('overview');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border-2 border-gray-100 hover:border-green-500 hover:text-green-600 font-black text-gray-700 transition-all shadow-sm"
        >
          <ArrowLeft size={18} />
          返回列表
        </button>
        <div className="flex items-center gap-3">
          <button className="p-2 bg-white rounded-xl border-2 border-gray-100 text-gray-400 hover:text-gray-600 hover:border-gray-200 transition-all">
            <Settings size={20} />
          </button>
          <button className="px-6 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl font-black shadow-lg hover:shadow-xl transition-all flex items-center gap-2">
            <Heart size={18} />
            紧急干预
          </button>
        </div>
      </div>

      {/* Main Stats Card */}
      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-50 rounded-full -mr-32 -mt-32 opacity-50 blur-3xl" />
        <div className="relative flex flex-col md:flex-row gap-8 items-center">
          <div className="w-48 h-48 rounded-3xl overflow-hidden border-4 border-white shadow-xl flex-shrink-0">
            <img src="https://images.unsplash.com/photo-1572688484438-313a6e50c333?w=400" alt="" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 text-center md:text-left space-y-4">
            <div>
              <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                <h1 className="text-3xl font-black text-gray-900">小绿 <span className="text-sm font-bold text-gray-400 font-mono">#{plantId}</span></h1>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-black rounded-full uppercase">健康成长中</span>
              </div>
              <p className="text-gray-500 font-bold flex items-center justify-center md:justify-start gap-2">
                <Leaf size={16} /> 绿萝 · 观叶植物 · 亲情模式
              </p>
            </div>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                  <User size={18} className="text-gray-500" />
                </div>
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase leading-none mb-1">养护者</p>
                  <p className="font-bold text-gray-900 leading-none">张三</p>
                </div>
              </div>
              <div className="flex items-center gap-3 border-l border-gray-100 pl-6">
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase leading-none mb-1">认领时间</p>
                  <p className="font-bold text-gray-900 leading-none">2024-02-15</p>
                </div>
              </div>
              <div className="flex items-center gap-3 border-l border-gray-100 pl-6">
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase leading-none mb-1">健康指数</p>
                  <p className="font-bold text-green-600 leading-none">95%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs for detail view */}
      <div className="flex items-center gap-4 bg-gray-100 p-1 rounded-2xl w-fit">
        {[
          { id: 'overview', label: '状态监控', icon: Activity },
          { id: 'diaries', label: '成长日记', icon: BookOpen },
          { id: 'logs', label: '操作日志', icon: History },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-black transition-all",
              activeSubTab === tab.id 
                ? "bg-white text-green-600 shadow-sm" 
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        {activeSubTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Sensor Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                    <Droplets size={20} />
                  </div>
                  <span className="text-sm font-black text-gray-500 uppercase">土壤湿度</span>
                </div>
                <div className="flex items-end justify-between">
                  <p className="text-3xl font-black text-gray-900">42%</p>
                  <span className="text-xs font-bold text-green-500 mb-1">正常</span>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                    <Thermometer size={20} />
                  </div>
                  <span className="text-sm font-black text-gray-500 uppercase">环境温度</span>
                </div>
                <div className="flex items-end justify-between">
                  <p className="text-3xl font-black text-gray-900">24°C</p>
                  <span className="text-xs font-bold text-green-500 mb-1">正常</span>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-yellow-50 text-yellow-500 flex items-center justify-center">
                    <Sun size={20} />
                  </div>
                  <span className="text-sm font-black text-gray-500 uppercase">光照强度</span>
                </div>
                <div className="flex items-end justify-between">
                  <p className="text-3xl font-black text-gray-900">850 lux</p>
                  <span className="text-xs font-bold text-amber-500 mb-1">偏高</span>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center">
                    <Clock size={20} />
                  </div>
                  <span className="text-sm font-black text-gray-500 uppercase">下次浇水</span>
                </div>
                <div className="flex items-end justify-between">
                  <p className="text-2xl font-black text-gray-900">预计 24h 后</p>
                </div>
              </div>
            </div>

            {/* Sensor Trends */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-lg font-black mb-6">湿度变化趋势</h3>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={MOCK_SENSOR_DATA}>
                      <defs>
                        <linearGradient id="colorHum" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="humidity" stroke="#3B82F6" fillOpacity={1} fill="url(#colorHum)" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-lg font-black mb-6">温度变化趋势</h3>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={MOCK_SENSOR_DATA}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="temp" stroke="#EF4444" strokeWidth={3} dot={{ fill: '#EF4444', r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeSubTab === 'diaries' && (
          <motion.div
            key="diaries"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900">成长日记 ({MOCK_DIARIES.length})</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-500">按时间倒序</span>
              </div>
            </div>
            <div className="space-y-6">
              {MOCK_DIARIES.map((diary) => (
                <div key={diary.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex gap-6">
                  <div className="flex flex-col items-center gap-2 flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center font-black">
                      {diary.mood}
                    </div>
                    <div className="w-px flex-1 bg-gray-100" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                      <p className="font-black text-gray-500 text-sm flex items-center gap-2">
                        <Calendar size={14} /> {diary.date}
                      </p>
                      <button className="text-gray-400 hover:text-gray-600 transition-colors">
                        <MoreVertical size={20} />
                      </button>
                    </div>
                    <p className="text-gray-700 font-medium leading-relaxed">
                      {diary.content}
                    </p>
                    {diary.images && diary.images.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {diary.images.map((img, i) => (
                          <div key={i} className="aspect-square rounded-2xl overflow-hidden border border-gray-100">
                            <img src={img} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeSubTab === 'logs' && (
          <motion.div
            key="logs"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
          >
            <div className="p-6 border-b border-gray-50 bg-gray-50/30">
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <History size={20} className="text-green-600" />
                系统操作与成长日志
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/50 text-left border-b border-gray-100">
                    <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">时间戳</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">动作</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">详细信息</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {MOCK_LOGS.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-gray-400 font-mono">{log.timestamp}</td>
                      <td className="px-6 py-4">
                        <span className="font-black text-gray-800">{log.action}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-600">{log.details}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                          log.status === 'success' ? "bg-green-100 text-green-700" :
                          log.status === 'warning' ? "bg-amber-100 text-amber-700" :
                          log.status === 'error' ? "bg-red-100 text-red-700" :
                          "bg-blue-100 text-blue-700"
                        )}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-6 text-center border-t border-gray-50 bg-gray-50/20">
              <button className="text-sm font-black text-green-600 hover:text-green-700 transition-colors">
                查看完整历史记录
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
