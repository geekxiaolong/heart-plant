import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Search, 
  ChevronRight, 
  User, 
  Calendar, 
  Activity, 
  Clock,
  ExternalLink,
  Filter
} from 'lucide-react';
import { cn } from '../utils/cn';

interface ClaimedPlant {
  id: string;
  name: string;
  species: string;
  ownerName: string;
  ownerAvatar?: string;
  claimedDate: string;
  status: 'healthy' | 'warning' | 'critical';
  healthScore: number;
  mode: 'family' | 'love' | 'friend' | 'self';
  lastActivity: string;
  image: string;
}

const MOCK_CLAIMED_PLANTS: ClaimedPlant[] = [
  {
    id: 'CP001',
    name: '小绿',
    species: '绿萝',
    ownerName: '张三',
    claimedDate: '2024-02-15',
    status: 'healthy',
    healthScore: 95,
    mode: 'family',
    lastActivity: '10分钟前 浇水',
    image: 'https://images.unsplash.com/photo-1572688484438-313a6e50c333?w=400',
  },
  {
    id: 'CP002',
    name: '肉肉',
    species: '多肉',
    ownerName: '李四',
    claimedDate: '2024-02-20',
    status: 'warning',
    healthScore: 78,
    mode: 'love',
    lastActivity: '2小时前 传感器预警',
    image: 'https://images.unsplash.com/photo-1459156212016-c812468e2115?w=400',
  },
  {
    id: 'CP003',
    name: '守护者',
    species: '仙人掌',
    ownerName: '王五',
    claimedDate: '2024-02-28',
    status: 'healthy',
    healthScore: 92,
    mode: 'self',
    lastActivity: '1天前 记录日记',
    image: 'https://images.unsplash.com/photo-1509587584298-0f3b3a3a1797?w=400',
  },
];

const MODE_LABELS = {
  family: { label: '亲情', color: 'bg-orange-100 text-orange-600' },
  love: { label: '爱情', color: 'bg-pink-100 text-pink-600' },
  friend: { label: '友情', color: 'bg-blue-100 text-blue-600' },
  self: { label: '悦己', color: 'bg-purple-100 text-purple-600' },
};

interface Props {
  onSelectPlant: (id: string) => void;
}

export function ClaimedPlantsTab({ onSelectPlant }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<string>('all');

  const filtered = MOCK_CLAIMED_PLANTS.filter(p => {
    const matchesSearch = p.name.includes(searchTerm) || p.ownerName.includes(searchTerm) || p.id.includes(searchTerm);
    const matchesMode = filterMode === 'all' || p.mode === filterMode;
    return matchesSearch && matchesMode;
  });

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[300px] relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="搜索植物名称、ID或认领者..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none font-medium transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-400" />
          <select 
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
            className="bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-700 outline-none focus:border-green-500"
          >
            <option value="all">所有情感模式</option>
            <option value="family">亲情模式</option>
            <option value="love">爱情模式</option>
            <option value="friend">友情模式</option>
            <option value="self">悦己模式</option>
          </select>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <p className="text-sm font-black text-gray-500 uppercase tracking-wider">已认领总数</p>
          <p className="text-3xl font-black mt-1 text-green-600">{MOCK_CLAIMED_PLANTS.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <p className="text-sm font-black text-gray-500 uppercase tracking-wider">异常预警</p>
          <p className="text-3xl font-black mt-1 text-amber-500">1</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <p className="text-sm font-black text-gray-500 uppercase tracking-wider">今日活跃</p>
          <p className="text-3xl font-black mt-1 text-blue-500">3</p>
        </div>
      </div>

      {/* Table / List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 text-left border-b border-gray-100">
              <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase">植物详情</th>
              <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase">认领者</th>
              <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase">情感模式</th>
              <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase">健康状况</th>
              <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase">最近活动</th>
              <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(plant => (
              <tr key={plant.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={plant.image} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                    <div>
                      <p className="font-black text-gray-900">{plant.name}</p>
                      <p className="text-xs text-gray-500 font-bold">{plant.id} · {plant.species}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      <User size={16} className="text-gray-500" />
                    </div>
                    <span className="font-bold text-gray-700">{plant.ownerName}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={cn("px-3 py-1 rounded-lg text-xs font-black", MODE_LABELS[plant.mode].color)}>
                    {MODE_LABELS[plant.mode].label}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full max-w-[60px]">
                      <div 
                        className={cn(
                          "h-full rounded-full",
                          plant.healthScore > 90 ? "bg-green-500" : plant.healthScore > 70 ? "bg-amber-500" : "bg-red-500"
                        )}
                        style={{ width: `${plant.healthScore}%` }}
                      />
                    </div>
                    <span className="text-sm font-black text-gray-700">{plant.healthScore}%</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                  {plant.lastActivity}
                </td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => onSelectPlant(plant.id)}
                    className="flex items-center gap-1 px-4 py-2 bg-gray-100 hover:bg-green-500 hover:text-white text-gray-700 rounded-xl font-black text-sm transition-all group"
                  >
                    管理
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-gray-500 font-bold">没有找到符合条件的植物</p>
          </div>
        )}
      </div>
    </div>
  );
}
