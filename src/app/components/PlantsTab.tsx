import React, { useState, useEffect } from 'react';
import { apiUrl, buildApiHeaders } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  X, 
  Leaf,
  Heart,
  Users,
  Smile,
  Home as HomeIcon,
  AlertCircle,
  CheckCircle,
  Power,
  PowerOff,
} from 'lucide-react';

interface Plant {
  id: number;
  name: string;
  type: string;
  description: string;
  imageUrl: string;
  difficulty: 'easy' | 'medium' | 'hard';
  scene: 'self' | 'family' | 'love' | 'friend';
  status: 'active' | 'inactive';
  addedDate: string;
  adoptCount: number;
}

const MOCK_PLANTS: Plant[] = [
  {
    id: 1,
    name: '绿萝',
    type: '观叶植物',
    description: '生命力顽强，适合新手养护，能净化空气',
    imageUrl: 'https://images.unsplash.com/photo-1572688484438-313a6e50c333?w=400',
    difficulty: 'easy',
    scene: 'self',
    status: 'active',
    addedDate: '2024-01-15',
    adoptCount: 156,
  },
  {
    id: 2,
    name: '多肉植物',
    type: '景天科',
    description: '萌萌的外形，耐旱易养，适合办公桌摆放',
    imageUrl: 'https://images.unsplash.com/photo-1459156212016-c812468e2115?w=400',
    difficulty: 'easy',
    scene: 'friend',
    status: 'active',
    addedDate: '2024-01-20',
    adoptCount: 203,
  },
  {
    id: 3,
    name: '仙人掌',
    type: '仙人掌科',
    description: '极度耐旱，象征坚强与守护',
    imageUrl: 'https://images.unsplash.com/photo-1509587584298-0f3b3a3a1797?w=400',
    difficulty: 'easy',
    scene: 'love',
    status: 'active',
    addedDate: '2024-02-01',
    adoptCount: 89,
  },
  {
    id: 4,
    name: '薰衣草',
    type: '香草植物',
    description: '浪漫的紫色花朵，散发宁静香气',
    imageUrl: 'https://images.unsplash.com/photo-1611735341450-74d61e660ad2?w=400',
    difficulty: 'medium',
    scene: 'family',
    status: 'active',
    addedDate: '2024-02-10',
    adoptCount: 78,
  },
  {
    id: 5,
    name: '虎皮兰',
    type: '观叶植物',
    description: '坚韧挺拔，净化能力强，适合卧室',
    imageUrl: 'https://images.unsplash.com/photo-1593482892290-f54927ae1bb8?w=400',
    difficulty: 'easy',
    scene: 'self',
    status: 'active',
    addedDate: '2024-02-15',
    adoptCount: 45,
  },
  {
    id: 6,
    name: '吊兰',
    type: '观叶植物',
    description: '优雅垂吊，能吸收有害气体',
    imageUrl: 'https://images.unsplash.com/photo-1586910148479-c5d3e18f9f77?w=400',
    difficulty: 'easy',
    scene: 'friend',
    status: 'inactive',
    addedDate: '2024-02-20',
    adoptCount: 34,
  },
];

const DIFFICULTY_MAP = {
  easy: { label: '容易', color: 'text-green-600 bg-green-50' },
  medium: { label: '中等', color: 'text-yellow-600 bg-yellow-50' },
  hard: { label: '困难', color: 'text-red-600 bg-red-50' },
};

const SCENE_MAP = {
  self: { label: '悦己', icon: Smile, color: 'text-purple-600 bg-purple-50' },
  family: { label: '亲情', icon: HomeIcon, color: 'text-orange-600 bg-orange-50' },
  love: { label: '爱情', icon: Heart, color: 'text-pink-600 bg-pink-50' },
  friend: { label: '友情', icon: Users, color: 'text-blue-600 bg-blue-50' },
};

interface PlantFormData {
  name: string;
  type: string;
  description: string;
  imageUrl: string;
  difficulty: 'easy' | 'medium' | 'hard';
  scene: 'self' | 'family' | 'love' | 'friend';
  status: 'active' | 'inactive';
}

interface PlantFormModalProps {
  plant?: Plant;
  onClose: () => void;
  onSubmit: (data: PlantFormData) => void;
}

function PlantDetailModal({ plant, onClose, onEdit }: { plant: Plant, onClose: () => void, onEdit: () => void }) {
  const sceneInfo = SCENE_MAP[plant.scene];
  const difficultyInfo = DIFFICULTY_MAP[plant.difficulty];
  const SceneIcon = sceneInfo.icon;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl"
      >
        <div className="relative h-64">
          <img src={plant.imageUrl} alt={plant.name} className="w-full h-full object-cover" />
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-700 hover:bg-white transition-colors"
          >
            <X size={20} />
          </button>
          <div className="absolute bottom-4 left-4">
             <div className={`px-4 py-2 rounded-xl ${sceneInfo.color} flex items-center gap-2 font-black text-sm backdrop-blur-md shadow-lg`}>
                <SceneIcon size={18} />
                {sceneInfo.label}
             </div>
          </div>
        </div>
        
        <div className="p-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-3xl font-black mb-1">{plant.name}</h2>
              <p className="text-gray-500 font-bold">{plant.type}</p>
            </div>
            <span className={`px-4 py-2 rounded-xl text-sm font-black ${difficultyInfo.color} border-2 border-black/5`}>
              {difficultyInfo.label}
            </span>
          </div>

          <div className="bg-gray-50 rounded-2xl p-6 mb-8">
             <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">植物介绍</h4>
             <p className="text-gray-600 font-medium leading-relaxed">{plant.description}</p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-50 rounded-2xl p-4 text-center">
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">认领次数</p>
               <p className="text-2xl font-black text-green-600">{plant.adoptCount}</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 text-center">
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">入库日期</p>
               <p className="text-sm font-black">{plant.addedDate}</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 text-center">
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">状态</p>
               <div className="flex items-center justify-center gap-1">
                 <div className={`w-2 h-2 rounded-full ${plant.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                 <p className="text-sm font-black">{plant.status === 'active' ? '已启用' : '未启用'}</p>
               </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={onEdit}
              className="flex-1 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-black hover:shadow-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
            >
              <Edit size={20} />
              编辑信息
            </button>
            <button 
              onClick={onClose}
              className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-black hover:bg-gray-200 transition-colors active:scale-95"
            >
              返回列表
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function PlantFormModal({ plant, onClose, onSubmit }: PlantFormModalProps) {
  const [formData, setFormData] = useState<PlantFormData>({
    name: plant?.name || '',
    type: plant?.type || '',
    description: plant?.description || '',
    imageUrl: plant?.imageUrl || '',
    difficulty: plant?.difficulty || 'easy',
    scene: plant?.scene || 'self',
    status: plant?.status || 'active',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-t-3xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <Leaf size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black">{plant ? '编辑植物' : '添加植物'}</h2>
              <p className="text-sm opacity-90">{plant ? '修改植物信息' : '添加新的可认领植物'}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name & Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-black text-gray-700 uppercase tracking-wider mb-2">
                植物名称 *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="如：绿萝"
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-black text-gray-700 uppercase tracking-wider mb-2">
                植物类型 *
              </label>
              <input
                type="text"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                placeholder="如：观叶植物"
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none font-medium"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-black text-gray-700 uppercase tracking-wider mb-2">
              植物描述 *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="简要描述植物的特点和养护要点"
              className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none font-medium resize-none"
              rows={3}
              required
            />
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-black text-gray-700 uppercase tracking-wider mb-2">
              图片链接 *
            </label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder="https://..."
              className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none font-medium"
              required
            />
            {formData.imageUrl && (
              <div className="mt-3 rounded-xl overflow-hidden border-2 border-gray-200">
                <img src={formData.imageUrl} alt="预览" className="w-full h-40 object-cover" />
              </div>
            )}
          </div>

          {/* Difficulty & Scene & Status */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-black text-gray-700 uppercase tracking-wider mb-2">
                养护难度
              </label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none font-medium"
              >
                <option value="easy">容易</option>
                <option value="medium">中等</option>
                <option value="hard">困难</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-black text-gray-700 uppercase tracking-wider mb-2">
                适合场景
              </label>
              <select
                value={formData.scene}
                onChange={(e) => setFormData({ ...formData, scene: e.target.value as any })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none font-medium"
              >
                <option value="self">悦己</option>
                <option value="family">亲情</option>
                <option value="love">爱情</option>
                <option value="friend">友情</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-black text-gray-700 uppercase tracking-wider mb-2">
                状态
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none font-medium"
              >
                <option value="active">启用</option>
                <option value="inactive">禁用</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-black hover:shadow-lg transition-all"
            >
              {plant ? '保存修改' : '添加植物'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export function PlantsTab() {
  const { session } = useAuth();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingPlant, setEditingPlant] = useState<Plant | null>(null);

  useEffect(() => {
    fetchLibrary();
  }, []);

  const fetchLibrary = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(apiUrl('/library'), {
        headers: await buildApiHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setPlants(data);
      }
    } catch (e) {
      console.error('Error fetching library:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPlants = plants.filter(plant => 
    plant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plant.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: plants.length,
    active: plants.filter(p => p.status === 'active').length,
    inactive: plants.filter(p => p.status === 'inactive').length,
    totalAdopts: plants.reduce((sum, p) => sum + p.adoptCount, 0),
  };

  const handleAddPlant = async (data: PlantFormData) => {
    try {
      const res = await fetch(apiUrl('/library'), {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${publicAnonKey}`,
          'apikey': publicAnonKey,
          'X-User-JWT': session?.access_token || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...data, adoptCount: 0 })
      });
      if (res.ok) {
        await fetchLibrary();
        setShowFormModal(false);
      }
    } catch (e) {
      console.error('Error adding plant:', e);
    }
  };

  const handleEditPlant = async (data: PlantFormData) => {
    if (!editingPlant) return;
    try {
      const res = await fetch(apiUrl('/library'), {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${publicAnonKey}`,
          'apikey': publicAnonKey,
          'X-User-JWT': session?.access_token || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...editingPlant, ...data })
      });
      if (res.ok) {
        await fetchLibrary();
        setEditingPlant(null);
        setShowFormModal(false);
      }
    } catch (e) {
      console.error('Error editing plant:', e);
    }
  };

  const handleDeletePlant = async (id: number | string) => {
    if (confirm('确定要删除这个植物吗？此操作不可撤销。')) {
      try {
      const res = await fetch(apiUrl('/library/${id}'), {
        method: 'DELETE',
        headers: await buildApiHeaders()
      });
        if (res.ok) {
          await fetchLibrary();
          setSelectedPlant(null);
        }
      } catch (e) {
        console.error('Error deleting plant:', e);
      }
    }
  };

  const handleToggleStatus = async (id: number | string) => {
    const plant = plants.find(p => p.id === id);
    if (!plant) return;
      const res = await fetch(apiUrl('/library'), {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${publicAnonKey}`,
          'apikey': publicAnonKey,
          'X-User-JWT': session?.access_token || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...plant, status: plant.status === 'active' ? 'inactive' : 'active' })
      });
      if (res.ok) {
        await fetchLibrary();
      }
    } catch (e) {
      console.error('Error toggling status:', e);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold opacity-90">全部植物</span>
            <Leaf size={20} className="opacity-75" />
          </div>
          <div className="text-3xl font-black">{stats.total}</div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold opacity-90">启用中</span>
            <CheckCircle size={20} className="opacity-75" />
          </div>
          <div className="text-3xl font-black">{stats.active}</div>
        </div>
        <div className="bg-gradient-to-br from-gray-500 to-slate-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold opacity-90">已禁用</span>
            <PowerOff size={20} className="opacity-75" />
          </div>
          <div className="text-3xl font-black">{stats.inactive}</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold opacity-90">累计认领</span>
            <Heart size={20} className="opacity-75" />
          </div>
          <div className="text-3xl font-black">{stats.totalAdopts}</div>
        </div>
      </div>

      {/* Search & Add */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="搜索植物名称或类型..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none font-medium"
            />
          </div>
          <button
            onClick={() => {
              setEditingPlant(null);
              setShowFormModal(true);
            }}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center gap-2"
          >
            <Plus size={20} />
            添加植物
          </button>
        </div>
      </div>

      {/* Plants Grid */}
      <div className="grid grid-cols-3 gap-4">
        {filteredPlants.map(plant => {
          const sceneInfo = SCENE_MAP[plant.scene];
          const difficultyInfo = DIFFICULTY_MAP[plant.difficulty];
          const SceneIcon = sceneInfo.icon;

          return (
            <motion.div
              key={plant.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all"
            >
              {/* Image */}
              <div className="relative h-48 bg-gray-100">
                <img src={plant.imageUrl} alt={plant.name} className="w-full h-full object-cover" />
                <div className="absolute top-3 right-3 flex gap-2">
                  <button
                    onClick={() => handleToggleStatus(plant.id)}
                    className={`w-8 h-8 rounded-lg ${
                      plant.status === 'active' 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-500 text-white'
                    } flex items-center justify-center shadow-lg transition-all`}
                    title={plant.status === 'active' ? '点击禁用' : '点击启用'}
                  >
                    {plant.status === 'active' ? <Power size={16} /> : <PowerOff size={16} />}
                  </button>
                </div>
                <div className="absolute bottom-3 left-3">
                  <div className={`px-3 py-1 rounded-lg ${sceneInfo.color} flex items-center gap-1.5 font-bold text-sm backdrop-blur-sm`}>
                    <SceneIcon size={14} />
                    {sceneInfo.label}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-black text-gray-900">{plant.name}</h3>
                    <p className="text-sm text-gray-500 font-medium">{plant.type}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-xs font-bold ${difficultyInfo.color}`}>
                    {difficultyInfo.label}
                  </span>
                </div>

                <p className="text-sm text-gray-600 font-medium mb-4 line-clamp-2">
                  {plant.description}
                </p>

                {/* Stats */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span className="font-bold">已认领 {plant.adoptCount} 次</span>
                  <span className="font-medium">{plant.addedDate}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedPlant(plant);
                    }}
                    className="flex-1 py-2 bg-gray-50 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Search size={16} />
                    详情
                  </button>
                  <button
                    onClick={() => {
                      setEditingPlant(plant);
                      setShowFormModal(true);
                    }}
                    className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Edit size={16} />
                    编辑
                  </button>
                  <button
                    onClick={() => handleDeletePlant(plant.id)}
                    className="w-10 py-2 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors flex items-center justify-center shadow-sm"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredPlants.length === 0 && (
        <div className="bg-white rounded-2xl p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <Leaf size={32} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-2">暂无植物</h3>
          <p className="text-gray-500 font-medium mb-6">
            {searchTerm ? '没有找到匹配的植物' : '还没有添加任何可认领的植物'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => {
                setEditingPlant(null);
                setShowFormModal(true);
              }}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold hover:shadow-lg transition-all inline-flex items-center gap-2"
            >
              <Plus size={20} />
              添加第一个植物
            </button>
          )}
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedPlant && (
          <PlantDetailModal
            plant={selectedPlant}
            onClose={() => setSelectedPlant(null)}
            onEdit={() => {
              setEditingPlant(selectedPlant);
              setSelectedPlant(null);
              setShowFormModal(true);
            }}
          />
        )}
      </AnimatePresence>

      {/* Form Modal */}
      <AnimatePresence>
        {showFormModal && (
          <PlantFormModal
            plant={editingPlant || undefined}
            onClose={() => {
              setShowFormModal(false);
              setEditingPlant(null);
            }}
            onSubmit={editingPlant ? handleEditPlant : handleAddPlant}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
