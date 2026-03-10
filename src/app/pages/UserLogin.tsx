import { useState, useEffect, FormEvent } from 'react';
import { motion as Motion, AnimatePresence } from 'motion/react';
import { Sprout, Mail, Lock, Eye, EyeOff, Loader2, Heart, ArrowRight, User } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { toast } from 'sonner';
import { apiUrl } from '../utils/api';
import { publicAnonKey } from '/utils/supabase/info';

export function UserLogin() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { session } = useAuth();

  const loginWithPassword = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message === 'Invalid login credentials' ? '账号或密码错误' : error.message);
      return false;
    }

    if (data.session) {
      toast.success('欢迎回到心植世界');
      navigate('/');
      return true;
    }

    return false;
  };

  useEffect(() => {
    if (session) {
      navigate('/');
    }
  }, [session, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        await loginWithPassword();
      } else {
        // Registration logic via custom server route to enable auto-confirm
        const response = await fetch(apiUrl('/signup'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': publicAnonKey
          },
          body: JSON.stringify({ email, password, name })
        });

        const result = await response.json();

        if (!response.ok) {
          if (result.code === 'USER_ALREADY_EXISTS' || result.error?.includes('already been registered')) {
            toast.info('该邮箱已被注册，正在为您切换到登录模式...');
            setIsLogin(true);
            await loginWithPassword();
          } else {
            toast.error(result.error || '注册失败');
          }
          return;
        }

        toast.success('注册成功！正在为您自动登录...');

        // Auto-login after successful registration
        const loggedIn = await loginWithPassword();
        if (!loggedIn) {
          setIsLogin(true);
          toast.info('请尝试手动登录');
        }
      }
    } catch (err) {
      toast.error('操作失败，请检查网络连接');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col items-center justify-center p-6 max-w-md mx-auto relative overflow-hidden">
      <div className="absolute -top-20 -left-20 w-64 h-64 bg-green-100 rounded-full blur-3xl opacity-50" />
      <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-emerald-100 rounded-full blur-3xl opacity-50" />

      <Motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full relative z-10"
      >
        <div className="flex flex-col items-center mb-10">
          <Motion.div 
            layoutId="logo"
            className="w-20 h-20 bg-black rounded-[32px] flex items-center justify-center text-white mb-6 shadow-2xl shadow-black/20"
          >
            <Sprout size={40} />
          </Motion.div>
          <h1 className="text-4xl font-black tracking-tighter text-gray-900">
            {isLogin ? '心植 HeartPlant' : '加入心植'}
          </h1>
          <p className="text-sm text-gray-400 font-bold uppercase tracking-[0.3em] mt-3">
            {isLogin ? 'IoT Social App' : '开启你的守护之旅'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 w-full">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <Motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-1 overflow-hidden"
              >
                <div className="relative">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    placeholder="您的昵称"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white border border-gray-100 rounded-[28px] py-5 pl-14 pr-6 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all shadow-sm"
                    required={!isLogin}
                  />
                </div>
              </Motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-1">
            <div className="relative">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">
                <Mail size={18} />
              </div>
              <input
                type="email"
                placeholder="您的注册邮箱"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-gray-100 rounded-[28px] py-5 pl-14 pr-6 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all shadow-sm"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="relative">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="您的安全密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-gray-100 rounded-[28px] py-5 pl-14 pr-14 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all shadow-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600 transition-colors p-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-500 text-white rounded-[28px] py-5 font-black text-sm uppercase tracking-widest hover:bg-green-600 active:scale-95 transition-all shadow-xl shadow-green-500/20 flex items-center justify-center gap-3 mt-4"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                {isLogin ? '进入心植世界' : '创建心植账号'}
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs font-black text-gray-400 uppercase tracking-widest hover:text-green-500 transition-colors"
          >
            {isLogin ? '还没有账号？立即加入' : '已有账号？点此登录'}
          </button>
        </div>

        <div className="mt-12 text-center opacity-20 grayscale pointer-events-none">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">第三方快捷登录</p>
          <div className="flex justify-center gap-4">
            <button className="w-14 h-14 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-gray-400">
              <Heart size={24} />
            </button>
          </div>
        </div>
      </Motion.div>

      <div className="mt-auto pt-10 text-center flex flex-col items-center gap-4">
        <p className="text-[10px] font-black text-gray-200 uppercase tracking-widest">
          HeartPlant v2.0.4
        </p>
      </div>
    </div>
  );
}
