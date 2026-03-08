import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { 
  ArrowLeft, 
  Upload, 
  Check, 
  Loader2, 
  Image as ImageIcon,
  X,
  Plus,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { apiGet } from '../utils/api';

export const EditPlant = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    type: '',
    difficulty: 'easy',
    description: '',
    habits: '',
    lifespan: '',
    emotionalMeaning: '',
    emotionalSummary: '',
    goldenSentence: '',
    dimensions: {
      healing: 80,
      companion: 80,
      vitality: 80,
      beauty: 80,
      growth: 80,
    },
    imageUrl: '',
    streamUrl: 'rtsp://admin:reolink123@192.168.92.202:554',
    scene: 'self',
    status: 'active',
  });

  useEffect(() => {
    const fetchPlant = async () => {
      if (!id) return;
      try {
        const library = await apiGet<any[]>('/library');
        const plant = library.find(p => p.id === id);
        if (plant) {
          setFormData({
            ...plant,
            dimensions: plant.dimensions || {
              healing: 80,
              companion: 80,
              vitality: 80,
              beauty: 80,
              growth: 80,
            }
          });
          setTags(plant.tags || []);
          setImagePreview(plant.imageUrl);
        } else {
          toast.error('未找到该植物');
          navigate('/admin/plants');
        }
      } catch (error) {
        console.error('Fetch plant error:', error);
        toast.error('获取植物信息失败');
      } finally {
        setFetching(false);
      }
    };
    fetchPlant();
  }, [id, navigate]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过 5MB');
      return;
    }

    setUploading(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-4b732228/upload-url`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
          'apikey': publicAnonKey
        },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type
        })
      });

      if (!response.ok) throw new Error('Failed to get upload URL');
      const { uploadUrl, path } = await response.json();

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type }
      });

      if (!uploadResponse.ok) throw new Error('Failed to upload image');

      const urlResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-4b732228/image-url/${encodeURIComponent(path)}`, {
        headers: { 
          'Authorization': `Bearer ${publicAnonKey}`,
          'apikey': publicAnonKey
        }
      });
      const { url } = await urlResponse.json();

      setFormData(prev => ({ ...prev, imageUrl: url }));
      setImagePreview(URL.createObjectURL(file));
      toast.success('图片更新成功');
    } catch (error) {
      console.error(error);
      toast.error('图片上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  const handleAddTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.imageUrl) {
      toast.error('请填写必要信息并上传图片');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-4b732228/library`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
          'apikey': publicAnonKey
        },
        body: JSON.stringify({
          ...formData,
          id, // Maintain the same ID
          tags
        })
      });

      if (!response.ok) throw new Error('Failed to save');
      toast.success('植物名录已更新');
      navigate('/admin/plants');
    } catch (error) {
      toast.error('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-green-500 mb-4" size={32} />
        <p className="text-gray-500 font-medium">加载植物信息...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => navigate('/admin/plants')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-all font-medium"
        >
          <ArrowLeft size={20} />
          返回名录
        </button>
        <div className="text-center flex-1 pr-12">
          <h2 className="text-2xl font-bold text-gray-900 leading-tight">编辑植物名录</h2>
          <p className="text-sm text-gray-500 mt-1">修改植物的详细信息与情感定义</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Image Upload Area */}
        <div className="lg:col-span-5 space-y-4">
          <label className="block text-sm font-bold text-gray-900 mb-2">植物展示图</label>
          <div className="relative aspect-square rounded-3xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-200 group transition-all hover:border-green-500 flex items-center justify-center">
            {imagePreview ? (
              <>
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <label className="cursor-pointer bg-white text-black px-4 py-2 rounded-xl text-sm font-bold shadow-xl active:scale-95 transition-all flex items-center gap-2">
                    <Upload size={16} />
                    更换图片
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                  </label>
                </div>
              </>
            ) : (
              <label className="cursor-pointer flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm text-gray-400 mb-4 group-hover:text-green-500 group-hover:scale-110 transition-all">
                  {uploading ? <Loader2 className="animate-spin" size={32} /> : <Upload size={32} />}
                </div>
                <p className="text-sm font-bold text-gray-900 mb-1">点击上传图片</p>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
              </label>
            )}
          </div>
          {uploading && (
             <div className="flex items-center gap-2 text-xs text-green-600 font-bold bg-green-50 p-3 rounded-xl">
                <Loader2 size={14} className="animate-spin" />
                正在上传图片并同步到云端...
             </div>
          )}
        </div>

        {/* Form Fields Area */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-gray-100 rounded-3xl p-8 space-y-6 shadow-sm">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-900">植物名称</label>
                <input 
                  type="text" 
                  required
                  placeholder="例如：银皇后" 
                  className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500/20"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-900">植物类型</label>
                <input 
                  type="text" 
                  required
                  placeholder="例如：观叶植物" 
                  className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500/20"
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-900">养护难度</label>
                <select 
                  className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500/20"
                  value={formData.difficulty}
                  onChange={e => setFormData({...formData, difficulty: e.target.value as any})}
                >
                  <option value="easy">简单 (新手友好)</option>
                  <option value="medium">中等 (需要经验)</option>
                  <option value="hard">困难 (挑战级别)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-900">推荐场景</label>
                <select 
                  className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500/20"
                  value={formData.scene}
                  onChange={e => setFormData({...formData, scene: e.target.value})}
                >
                  <option value="family">亲情模式 (家人互动)</option>
                  <option value="love">爱情模式 (情侣养成)</option>
                  <option value="friend">友情模式 (挚友合种)</option>
                  <option value="self">悦己模式 (独享时光)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-900">植物描述</label>
              <textarea 
                rows={2}
                placeholder="简短介绍植物的特点..." 
                className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500/20 resize-none"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              ></textarea>
            </div>

            {/* Emotional Module */}
            <div className="space-y-4 p-6 bg-pink-50/50 rounded-3xl border border-pink-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
                <h3 className="text-sm font-black text-pink-900 uppercase tracking-widest">情感寓意模块</h3>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-pink-700">情感寓意描述</label>
                <textarea 
                  rows={2}
                  className="w-full bg-white border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-pink-500/20 resize-none font-medium"
                  value={formData.emotionalMeaning}
                  onChange={e => setFormData({...formData, emotionalMeaning: e.target.value})}
                ></textarea>
              </div>

              <div className="space-y-4 pt-2 border-t border-pink-100">
                <label className="text-xs font-black text-pink-900 uppercase tracking-widest">情感互动画像 (0-100)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  {[
                    { key: 'healing', label: '治愈力' },
                    { key: 'companion', label: '陪伴感' },
                    { key: 'vitality', label: '生命力' },
                  ].map((dim) => (
                    <div key={dim.key} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-pink-600 uppercase tracking-widest">{dim.label}</span>
                        <span className="text-[10px] font-black text-pink-900">{(formData.dimensions as any)[dim.key]}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        step="5"
                        className="w-full h-1 bg-pink-100 rounded-lg appearance-none cursor-pointer accent-pink-500"
                        value={(formData.dimensions as any)[dim.key]}
                        onChange={e => setFormData({
                          ...formData, 
                          dimensions: {
                            ...formData.dimensions,
                            [dim.key]: parseInt(e.target.value)
                          }
                        })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-900">生长习性</label>
                <input 
                  type="text" 
                  className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500/20"
                  value={formData.habits}
                  onChange={e => setFormData({...formData, habits: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-900">预计寿命</label>
                <input 
                  type="text" 
                  className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500/20"
                  value={formData.lifespan}
                  onChange={e => setFormData({...formData, lifespan: e.target.value})}
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading || uploading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-green-600/20 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Check size={20} />}
              <span>{loading ? '正在更新...' : '保存修改'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
