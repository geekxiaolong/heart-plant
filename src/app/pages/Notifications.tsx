import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Bell, 
  Sparkles, 
  ArrowLeft, 
  Clock, 
  ChevronRight, 
  Heart,
  MessageCircle,
  ShieldCheck,
  X
} from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';
import { getCache, setCache } from '../utils/cache';
import { apiGet } from '../utils/api';
import { cn } from '../utils/cn';

export default function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = getCache<any[]>(`notifications-${user?.email}`, 60000);
      return cached || [];
    }
    return [];
  });
  const [loading, setLoading] = useState(!notifications.length);

  const fetchNotifications = async () => {
    if (!user?.email) return;
    try {
      const data = await apiGet<any[]>(`/notifications/${user.email}`);
      if (Array.isArray(data)) {
        const sorted = data.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setNotifications(sorted);
        setCache(`notifications-${user.email}`, sorted);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user?.email]);

  const handleAccept = (inviteCode: string) => {
    navigate(`/join/${inviteCode}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-black/5 px-6 py-4 flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-900 active:scale-90 transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-sm font-black uppercase tracking-widest opacity-40">消息中心</h1>
          <div className="flex items-center gap-1.5">
             <Bell size={12} className="text-rose-500" />
             <span className="font-bold text-lg">Inbox</span>
          </div>
        </div>
        <div className="w-10" /> {/* Spacer */}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {loading && notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
             <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
             <p className="text-xs font-black text-gray-300 uppercase tracking-widest">寻找结缘信息...</p>
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-4">
             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2 px-2">结缘信件 ({notifications.length})</h3>
             <AnimatePresence>
                {notifications.map((notif, index) => (
                  <Motion.div 
                    key={notif.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white p-6 rounded-[32px] shadow-sm border border-black/5 space-y-4 relative overflow-hidden group"
                  >
                     {/* Decorative background icon */}
                     <Sparkles className="absolute -right-4 -bottom-4 text-rose-500/5 w-24 h-24" />
                     
                     <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                           <div className="w-14 h-14 rounded-3xl bg-rose-50 text-rose-500 flex items-center justify-center shadow-inner">
                              <Heart size={28} />
                           </div>
                           <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                 <span className="text-sm font-black text-gray-900">共同守护邀请</span>
                                 <div className="px-1.5 py-0.5 bg-rose-100 text-rose-600 rounded text-[8px] font-black uppercase tracking-widest">
                                    INVITE
                                 </div>
                              </div>
                              <p className="text-xs font-bold text-gray-400">来自 <span className="text-gray-900">{notif.from}</span> 的契约申请</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <div className="flex items-center gap-1 text-[10px] font-bold text-gray-300 uppercase tracking-tighter">
                              <Clock size={10} />
                              {new Date(notif.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                           </div>
                        </div>
                     </div>

                     <div className="bg-gray-50/50 rounded-2xl p-4 border border-black/5 flex items-center justify-between">
                        <div>
                           <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">契约编号</p>
                           <p className="font-mono text-sm font-black text-rose-500">{notif.inviteCode}</p>
                        </div>
                        <ShieldCheck size={20} className="text-gray-200" />
                     </div>

                     <button 
                        onClick={() => handleAccept(notif.inviteCode)}
                        className="w-full py-4 bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-black/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                     >
                        开启结缘仪式
                        <ChevronRight size={14} />
                     </button>
                  </Motion.div>
                ))}
             </AnimatePresence>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 gap-6 text-center">
             <div className="w-24 h-24 rounded-[40px] bg-white shadow-sm flex items-center justify-center text-gray-200 border border-black/5">
                <Bell size={40} className="opacity-20" />
             </div>
             <div className="space-y-2">
                <h3 className="font-black text-lg">邮箱空空的</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">暂无未处理的结缘邀请</p>
             </div>
             <button 
               onClick={() => navigate('/')}
               className="px-8 py-3 bg-gray-100 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black hover:text-white transition-all"
             >
               回到空间
             </button>
          </div>
        )}

        {/* Informational Card */}
        <div className="bg-white/40 border border-black/5 rounded-[32px] p-6 text-center space-y-2">
           <div className="flex items-center justify-center gap-2 text-gray-400">
              <MessageCircle size={14} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Tips</span>
           </div>
           <p className="text-[10px] font-bold text-gray-400 leading-relaxed uppercase tracking-wider">
              您可以在“发现”页生成属于自己的契约邀请码，<br />
              邀请好友共同守护心仪的植物。
           </p>
        </div>
      </div>
    </div>
  );
}
