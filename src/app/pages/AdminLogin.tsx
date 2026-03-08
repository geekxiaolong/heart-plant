import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Leaf, Shield, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { toast } from 'sonner';

export function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { session, isAdmin } = useAuth();

  // If already logged in and is admin, redirect to admin dashboard
  useEffect(() => {
    if (session && isAdmin) {
      navigate('/admin');
    }
  }, [session, isAdmin, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message === 'Invalid login credentials' 
          ? '邮箱或密码错误，请检查后再试' 
          : authError.message);
        return;
      }

      if (data.session) {
        const userEmail = data.session.user?.email?.toLowerCase();
        const userRole = data.session.user?.user_metadata?.role;
        
        const isUserAdmin = userRole === 'admin' || userEmail === '776427024@qq.com';
        
        if (!isUserAdmin) {
          // If logged in with non-admin account, show error but don't force logout 
          // yet so user knows what's happening
          setError('权限不足：该账户不具备管理员访问权限');
          setIsLoading(false);
          return;
        }

        toast.success('登录成功，欢迎回来');
        navigate('/admin');
      }
    } catch (err) {
      setError('登录过程中发生错误，请稍后重试');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {/* Background patterns */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-200 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-200 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-white rounded-[40px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] max-w-md w-full overflow-hidden border border-gray-100"
      >
        {/* Decorative element */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-green-400 to-emerald-500" />

        <div className="p-10">
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 rounded-[24px] bg-green-500 flex items-center justify-center text-white mb-6 shadow-lg shadow-green-500/20">
              <Leaf size={32} />
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">心植管理系统</h1>
            <p className="text-sm text-gray-500 font-medium mt-2">HEARTPLANT MANAGEMENT CONSOLE</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1">
                管理员邮箱
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@heartplant.com"
                className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-green-500 focus:bg-white outline-none font-bold text-sm transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1">
                安全密码
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-green-500 focus:bg-white outline-none font-bold text-sm transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-600 transition-colors p-2"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 text-sm font-bold border border-red-100"
              >
                <AlertCircle size={18} />
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-base hover:bg-black hover:shadow-xl hover:shadow-black/10 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 mt-4"
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  验证中...
                </>
              ) : (
                <>
                  安全登录
                  <Shield size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-gray-50 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-xs font-bold text-gray-400 hover:text-green-600 transition-colors uppercase tracking-widest"
            >
              ← 返回系统门户
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
