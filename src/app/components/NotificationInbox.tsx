import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, Check, X, Sparkles, Loader2 } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';
import { getCache, setCache } from '../utils/cache';
import { cn } from '../utils/cn';
import { apiGet } from '../utils/api';

export function NotificationInbox() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
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
    const interval = setInterval(fetchNotifications, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [user?.email]);

  const handleAccept = (inviteCode: string) => {
    navigate(`/join/${inviteCode}`);
  };

  if (notifications.length === 0 && !loading) return null;

  return (
    <div className="px-6 mb-8">
      <div 
        className="flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Bell size={16} className={cn("text-rose-500", notifications.length > 0 && "animate-bounce")} />
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">结缘信箱</h3>
          {notifications.length > 0 && (
            <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {notifications.length}
            </span>
          )}
        </div>
        <div className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
          {isExpanded ? '收起' : '展开'}
        </div>
      </div>
      
      <AnimatePresence>
        {isExpanded && (
          <Motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mt-4"
          >
            <div className="space-y-3">
              {notifications.map((notif) => (
                <Motion.div 
                  key={notif.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white p-4 rounded-3xl shadow-sm border border-rose-100 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500">
                        <Sparkles size={20} />
                     </div>
                     <div>
                        <p className="text-xs font-black">来自 {notif.from} 的邀请</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">契约编号: {notif.inviteCode}</p>
                     </div>
                  </div>
                  <button 
                    onClick={() => handleAccept(notif.inviteCode)}
                    className="bg-black text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                  >
                    前往仪式
                  </button>
                </Motion.div>
              ))}
            </div>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
