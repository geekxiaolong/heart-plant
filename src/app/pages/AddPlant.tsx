import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { 
  ArrowLeft, 
  Upload, 
  Check, 
  Loader2, 
  Image as ImageIcon,
  X,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl, buildApiHeaders } from '../utils/api';

export const AddPlant = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过 5MB');
      return;
    }

    setUploading(true);
    try {
      // 1. Get signed upload URL
      const response = await fetch(apiUrl('/upload-url'), {
        method: 'POST',
        headers: await buildApiHeaders(true),
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type
        })
      });

      if (!response.ok) throw new Error('Failed to get upload URL');
      const { uploadUrl, path } = await response.json();

      // 2. Upload to storage
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type }
      });

      if (!uploadResponse.ok) throw new Error('Failed to upload image');

      // 3. Get public URL (via our server's signed URL route for the final link)
      const urlResponse = await fetch(apiUrl('/image-url/${encodeURIComponent(path)}'), {
        headers: await buildApiHeaders()
      });
      const { url } = await urlResponse.json();

      setFormData(prev => ({ ...prev, imageUrl: url }));
      setImagePreview(URL.createObjectURL(file));
      toast.success('图片上传成功');
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
      const response = await fetch(apiUrl('/library'), {
        method: 'POST',
        headers: await buildApiHeaders(true),
        body: JSON.stringify({
          ...formData,
          tags,
          adoptCount: 0
        })
      });

      if (!response.ok) throw new Error('Failed to save');
      toast.success('植物已成功添加到名录');
      navigate('/admin/plants');
    } catch (error) {
      toast.error('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

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
          <h2 className="text-2xl font-bold text-gray-900 leading-tight">添加新植物名录</h2>
          <p className="text-sm text-gray-500 mt-1">输入植物的详细信息以供用户认领</p>
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
                <button 
                  type="button"
                  onClick={() => { setImagePreview(null); setFormData(prev => ({ ...prev, imageUrl: '' })); }}
                  className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-all"
                >
                  <X size={20} />
                </button>
              </>
            ) : (
              <label className="cursor-pointer flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm text-gray-400 mb-4 group-hover:text-green-500 group-hover:scale-110 transition-all">
                  {uploading ? <Loader2 className="animate-spin" size={32} /> : <Upload size={32} />}
                </div>
                <p className="text-sm font-bold text-gray-900 mb-1">点击上传图片</p>
                <p className="text-xs text-gray-400">支持 JPG, PNG (最大 5MB)</p>
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
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
            <p className="text-xs text-blue-600 flex items-start gap-2 leading-relaxed">
              <ImageIcon size={14} className="mt-0.5 shrink-0" />
              提示：优质的图片能提高用户的认领意愿。建议使用 4:3 或 1:1 比例的植物特写照。
            </p>
          </div>
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
                  <option value="friend">友情模式 (��友合种)</option>
                  <option value="self">悦己模式 (独享时光)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-900">植物描述</label>
              <textarea 
                rows={2}
                placeholder="简短介绍植物的特点、象征意义或摆放建议..." 
                className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500/20 resize-none"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              ></textarea>
            </div>

            <div className="space-y-4 p-6 bg-pink-50/50 rounded-3xl border border-pink-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
                <h3 className="text-sm font-black text-pink-900 uppercase tracking-widest">情感寓意模块</h3>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-pink-700">情感寓意描述 (详情页展示)</label>
                <textarea 
                  rows={2}
                  placeholder="该植物背后蕴含的情感寓意，例如：银皇后象征着守护与长久的陪伴..." 
                  className="w-full bg-white border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-pink-500/20 resize-none font-medium"
                  value={formData.emotionalMeaning}
                  onChange={e => setFormData({...formData, emotionalMeaning: e.target.value})}
                ></textarea>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-pink-700">情感摘要 (广场展示)</label>
                <input 
                  type="text" 
                  placeholder="一句话概括：如“愿你在这段慢时光里，找回最真实的自己。”" 
                  className="w-full bg-white border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-pink-500/20 font-medium"
                  value={formData.emotionalSummary}
                  onChange={e => setFormData({...formData, emotionalSummary: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-pink-700">寓意金句 (金句卡片)</label>
                <input 
                  type="text" 
                  placeholder="触动人心的金句：如“每一次新芽的破土，都是生命对时光最温柔的回应。”" 
                  className="w-full bg-white border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-pink-500/20 font-medium italic"
                  value={formData.goldenSentence}
                  onChange={e => setFormData({...formData, goldenSentence: e.target.value})}
                />
              </div>

              <div className="space-y-4 pt-2 border-t border-pink-100">
                <label className="text-xs font-black text-pink-900 uppercase tracking-widest">情感互动画像 (0-100)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  {[
                    { key: 'healing', label: '治愈力' },
                    { key: 'companion', label: '陪伴感' },
                    { key: 'vitality', label: '生命力' },
                    { key: 'beauty', label: '美感' },
                    { key: 'growth', label: '成长性' },
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
                  placeholder="如：喜光、耐旱、15-25℃" 
                  className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500/20"
                  value={formData.habits}
                  onChange={e => setFormData({...formData, habits: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-900">预计寿命</label>
                <input 
                  type="text" 
                  placeholder="如：5-10年" 
                  className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500/20"
                  value={formData.lifespan}
                  onChange={e => setFormData({...formData, lifespan: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-900">标签 (回车添加)</label>
              <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-xl min-h-[46px]">
                {tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 bg-white border border-gray-100 text-xs px-2 py-1 rounded-md text-gray-600 font-medium">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)}><X size={12} /></button>
                  </span>
                ))}
                <input 
                  type="text" 
                  className="bg-transparent border-none focus:ring-0 text-sm flex-1 min-w-[100px]"
                  placeholder="输入标签..."
                  value={newTag}
                  onChange={e => setNewTag(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                />
              </div>
            </div>

            <div className="space-y-4 p-6 bg-blue-50/30 rounded-3xl border border-blue-100/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <h3 className="text-sm font-black text-blue-900 uppercase tracking-widest">IoT 实时流配置</h3>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-blue-700">RTSP/WebRTC 流地址 (用于认领前实时观察)</label>
                <input 
                  type="text" 
                  placeholder="rtsp://... 或 http://.../whep" 
                  className="w-full bg-white border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 font-mono"
                  value={formData.streamUrl}
                  onChange={e => setFormData({...formData, streamUrl: e.target.value})}
                />
                <p className="text-[10px] text-blue-400 font-medium">默认使用内网开发流: rtsp://admin:reolink123@192.168.92.202:554</p>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading || uploading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-green-600/20 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Check size={20} />}
              <span>{loading ? '正在保存...' : '完成并发布名录'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
