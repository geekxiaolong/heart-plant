import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutGrid, ShieldCheck, CircleHelp, LogOut, 
  ChevronRight, Award, MapPin, SquarePen, Smartphone, Wifi, X, LoaderCircle, Camera, Save, Users
} from 'lucide-react';
import { useEmotionalTheme } from '../context/ThemeContext';
import { cn } from '../utils/cn';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, NavLink } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { toast } from 'sonner';
import { apiUrl, buildApiHeaders } from '../utils/api';
import { getCache, setCache } from '../utils/cache';

// Menu items for profile settings - v2.0.6
const menuItems = [
  { label: '硬件设置', sub: 'WiFi 传感器与摄像头绑定', icon: Wifi, color: 'text-blue-500', link: '/profile' },
  { label: '安全中心', sub: '账号与隐私管理', icon: ShieldCheck, color: 'text-green-500', link: '/profile' },
  { label: '帮助与支持', sub: '常见问题与反馈', icon: CircleHelp, color: 'text-gray-400', link: '/profile' },
];

export function Profile() {
  const { themeConfig } = useEmotionalTheme();
  const { user, signOut, isAdmin: isUserAdmin } = useAuth();
  const navigate = useNavigate();
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef(true);
  const [followingList, setFollowingList] = useState<any[]>(() => {
    if (user?.id) return getCache<any[]>(`following_${user.id}`) || [];
    return [];
  });
  const [followingCount, setFollowingCount] = useState(() => {
    if (user?.id) return getCache<any[]>(`following_${user.id}`)?.length || 0;
    return 0;
  });
  const [userStats, setUserStats] = useState<any>(() => {
    if (user?.id) return getCache<any>(`stats_${user.id}`) || null;
    return null;
  });
  
  // Profile form state
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    location: '',
    avatar: ''
  });
  const [avatarPreview, setAvatarPreview] = useState('');

  useEffect(() => {
    mountedRef.current = true;
    if (user) {
      setFormData({
        name: user.user_metadata?.name || user.email?.split('@')[0] || '',
        bio: user.user_metadata?.bio || '',
        location: user.user_metadata?.location || '',
        avatar: user.user_metadata?.avatar || ''
      });
      setAvatarPreview(user.user_metadata?.avatar || '');
    }
    return () => {
      mountedRef.current = false;
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [user]);

  // Load data from cache first
  useEffect(() => {
    if (!user) return;
    
    const cachedFollowing = getCache<any[]>(`following_${user.id}`);
    if (cachedFollowing) {
      setFollowingList(cachedFollowing);
      setFollowingCount(cachedFollowing.length);
    }

    const cachedStats = getCache<any>(`stats_${user.id}`);
    if (cachedStats) {
      setUserStats(cachedStats);
    }
  }, [user]);

  // Load following list
  useEffect(() => {
    if (!user) return;

    const loadFollowing = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(apiUrl('/following'), {
          headers: await buildApiHeaders()
        });

        if (res.ok && mountedRef.current) {
          const data = await res.json();
          setFollowingList(data);
          setFollowingCount(data.length);
          setCache(`following_${user.id}`, data);
        }
      } catch (e) {
        console.error('Error loading following list:', e);
      }
    };

    const loadUserStats = async () => {
      try {
        const res = await fetch(apiUrl('/stats/${user.id}'), {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'apikey': publicAnonKey
          }
        });

        if (res.ok && mountedRef.current) {
          const data = await res.json();
          setUserStats(data);
          setCache(`stats_${user.id}`, data);
        }
      } catch (e) {
        console.error('Error loading user stats:', e);
      }
    };

    loadFollowing();
    loadUserStats();
  }, [user]);

  // Cleanup avatar preview URL when it changes
  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过 5MB');
      return;
    }

    setIsUploading(true);
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const res = await fetch(apiUrl('/upload-url'), {
        method: 'POST',
        headers: await buildApiHeaders(true),
        body: JSON.stringify({ 
          fileName: file.name,
          contentType: file.type
        })
      });

      if (!res.ok) throw new Error('Failed to get upload URL');
      
      const { uploadUrl, path } = await res.json();

      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type
        },
        body: file
      });

      if (!uploadRes.ok) throw new Error('Upload failed');

      if (mountedRef.current) {
        setFormData(prev => ({ ...prev, avatar: `storage:${path}` }));
        toast.success('头像上传成功');
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      if (mountedRef.current) {
        toast.error('头像上传失败，请重试');
        setAvatarPreview(formData.avatar);
      }
    } finally {
      if (mountedRef.current) {
        setIsUploading(false);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUpdateProfile = async () => {
    if (!formData.name.trim()) {
      toast.error('请输入用户名');
      return;
    }

    setIsUpdating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(apiUrl('/profile'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-JWT': session?.access_token || '',
          'Authorization': `Bearer ${publicAnonKey}`,
          'apikey': publicAnonKey
        },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update profile');
      }

      if (mountedRef.current) {
        toast.success('资料更新成功！✨');
        setShowEditModal(false);
        // Refresh session/user metadata locally if needed, but the auth listener should pick it up
        // Removed window.location.reload() to prevent iframe message port destruction
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      if (mountedRef.current) {
        toast.error(error.message || '更新失败，请重试');
      }
    } finally {
      if (mountedRef.current) {
        setIsUpdating(false);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('已安全退出登录');
      navigate('/login');
    } catch (error) {
      toast.error('退出失败，请稍后重试');
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="flex flex-col gap-8 p-6 pb-32">
      {/* Profile Header */}
      <header className="flex flex-col items-center gap-6 pt-8">
        <div className="relative">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-32 h-32 rounded-[48px] bg-white shadow-2xl p-2 border-4 border-white overflow-hidden relative"
          >
            <img 
              src={avatarPreview || "https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=1080"} 
              className="w-full h-full object-cover rounded-[40px]"
              alt="Avatar"
            />
          </motion.div>
          <button 
            onClick={() => setShowEditModal(true)}
            className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shadow-xl active:scale-90 transition-all"
          >
             <SquarePen size={18} />
          </button>
        </div>
        
        <div className="text-center">
          <h2 className="text-3xl font-black tracking-tighter">{user?.user_metadata?.name || user?.email?.split('@')[0] || '访客用户'}</h2>
          <div className="flex items-center gap-2 mt-2 opacity-40 justify-center">
             <MapPin size={14} />
             <span className="text-[10px] font-black uppercase tracking-widest">{user?.user_metadata?.location || user?.email || 'OFFLINE'}</span>
          </div>
          {user?.user_metadata?.bio && (
            <p className="text-sm text-gray-600 mt-3 px-8">{user.user_metadata.bio}</p>
          )}
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <button 
          onClick={() => navigate('/following')}
          className="bg-white p-5 rounded-[32px] shadow-sm border border-black/5 flex flex-col items-center gap-3 transition-all hover:shadow-md active:scale-95 cursor-pointer"
        >
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-purple-50 text-purple-500">
            <Users size={20} />
          </div>
          <div className="text-center">
            <p className="text-lg font-black">{followingCount}</p>
            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">我的关注</p>
          </div>
        </button>

        <button 
          onClick={() => navigate('/achievements')}
          className="bg-white p-5 rounded-[32px] shadow-sm border border-black/5 flex flex-col items-center gap-3 transition-all hover:shadow-md active:scale-95 cursor-pointer"
        >
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-amber-50 text-amber-500">
            <Award size={20} />
          </div>
          <div className="text-center">
            <p className="text-lg font-black">{userStats?.achievements?.length || 0}</p>
            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">成就勋章</p>
          </div>
        </button>

        <button 
          onClick={() => navigate('/')}
          className="bg-white p-5 rounded-[32px] shadow-sm border border-black/5 flex flex-col items-center gap-3 transition-all hover:shadow-md active:scale-95 cursor-pointer"
        >
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-green-50 text-green-500">
            <Smartphone size={20} />
          </div>
          <div className="text-center">
            <p className="text-lg font-black">{userStats?.plantsAdopted || 0}</p>
            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">我的植物</p>
          </div>
        </button>
      </div>

      {/* Menu List */}
      <div className="flex flex-col gap-4">
        {isUserAdmin && (
          <div className="mb-4">
             <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2 mb-2">系统管理</h3>
             <button 
                onClick={() => navigate('/admin')}
                className="w-full flex items-center justify-between p-5 rounded-[32px] bg-green-50/50 border border-green-100 hover:bg-green-50 transition-all active:scale-98 group"
             >
                <div className="flex items-center gap-5">
                   <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-green-100 text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                      <ShieldCheck size={24} />
                   </div>
                   <div className="text-left">
                      <p className="text-sm font-black tracking-tight text-green-700">管理后台</p>
                      <p className="text-[10px] font-medium text-green-600/60 mt-0.5">进入系统全局监控与配置中心</p>
                   </div>
                </div>
                <ChevronRight size={18} className="text-green-300 group-hover:text-green-500 group-hover:translate-x-1 transition-all" />
             </button>
          </div>
        )}
        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2 mb-2">应用设置</h3>
        <div className="bg-white rounded-[48px] shadow-sm border border-black/5 overflow-hidden p-4 flex flex-col gap-2">
          {menuItems.map((item, i) => (
            <NavLink 
              key={i}
              to={item.link}
              className="flex items-center justify-between p-5 rounded-[32px] hover:bg-gray-50 transition-all active:scale-98 group"
            >
              <div className="flex items-center gap-5">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center bg-gray-50 group-hover:bg-white transition-colors", item.color)}>
                   <item.icon size={24} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-black tracking-tight">{item.label}</p>
                  <p className="text-[10px] font-medium text-gray-400 mt-0.5">{item.sub}</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-200 group-hover:text-gray-400 group-hover:translate-x-1 transition-all" />
            </NavLink>
          ))}
        </div>
      </div>

      {/* Logout */}
      <button 
        onClick={handleLogout}
        className="flex items-center justify-center gap-3 p-6 rounded-[32px] bg-red-50 text-red-500 font-black text-xs uppercase tracking-widest active:scale-95 transition-all mt-4 border border-red-100 hover:bg-red-100"
      >
        <LogOut size={18} />
        退出登录
      </button>

      {/* App Info Footer */}
      <div className="text-center mt-4">
         <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">HeartPlant v2.0.4</p>
         <p className="text-[10px] font-bold text-gray-200 mt-1 italic italic">Made with Love & Sensors</p>
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showEditModal && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-6"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowEditModal(false);
              }
            }}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              className="bg-white rounded-[48px] shadow-2xl w-full max-w-lg overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-8 border-b border-black/5">
                <h3 className="text-2xl font-black tracking-tight">编辑资料</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 bg-gray-100 rounded-full text-gray-400 hover:text-black transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="p-8 flex flex-col gap-6">
                {/* Avatar Upload */}
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="w-28 h-28 rounded-[40px] bg-white shadow-xl p-2 border-4 border-white overflow-hidden">
                      <img 
                        src={avatarPreview || "https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=1080"} 
                        className="w-full h-full object-cover rounded-[32px]"
                        alt="Avatar Preview"
                      />
                    </div>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="absolute -bottom-2 -right-2 w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center shadow-xl active:scale-90 transition-all disabled:opacity-50"
                    >
                      {isUploading ? <LoaderCircle size={20} className="animate-spin" /> : <Camera size={20} />}
                    </button>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">点击相机图标上传头像</p>
                </div>

                {/* Form Fields */}
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2 block">用户名</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="请输入用户名"
                      className="w-full bg-gray-50 rounded-[24px] px-6 py-4 text-sm font-bold border-none focus:ring-4 ring-black/5 transition-all outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2 block">个人简介</label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="介绍一下自己吧..."
                      rows={3}
                      className="w-full bg-gray-50 rounded-[24px] px-6 py-4 text-sm font-bold border-none focus:ring-4 ring-black/5 transition-all outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2 block">位置</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="如: 北京 / Beijing"
                      className="w-full bg-gray-50 rounded-[24px] px-6 py-4 text-sm font-bold border-none focus:ring-4 ring-black/5 transition-all outline-none"
                    />
                  </div>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleUpdateProfile}
                  disabled={isUpdating || !formData.name.trim()}
                  className="w-full py-6 bg-black text-white rounded-[32px] font-black text-sm uppercase tracking-widest shadow-2xl disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  {isUpdating ? (
                    <>
                      <LoaderCircle size={18} className="animate-spin" />
                      更新中...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      保存更改
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}