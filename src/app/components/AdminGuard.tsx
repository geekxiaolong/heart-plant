import React, { useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router';
import { supabase, useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export const AdminGuard = () => {
  const { session, loading, isAdmin: isUserAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) {
      navigate('/admin/login', { replace: true });
    }
  }, [session, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-[24px] bg-green-500 flex items-center justify-center text-white mb-6 shadow-lg shadow-green-500/20">
          <Loader2 className="animate-spin" size={32} />
        </div>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">正在验证访问权限...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (!isUserAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-[32px] bg-red-50 text-red-500 flex items-center justify-center mb-6 border border-red-100 shadow-sm">
          <ShieldCheck size={40} />
        </div>
        <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">访问权限不足</h2>
        <p className="text-gray-500 text-sm max-w-xs mb-8">
          当前账户没有管理员权限。如果您是管理员，请使用 <span className="text-gray-900 font-bold">776427024@qq.com</span> 账号登录。
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
           <button 
             onClick={() => supabase.auth.signOut().then(() => navigate('/admin/login'))}
             className="w-full py-4 bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
           >
             切换账号
           </button>
           <button 
             onClick={() => navigate('/')}
             className="w-full py-4 bg-white text-gray-400 border border-gray-100 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
           >
             返回主页
           </button>
        </div>
      </div>
    );
  }

  return <Outlet />;
};
