import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import { 
  ArrowLeft, Download, Sparkles, 
  Heart, Users, Baby, 
  Check, Loader2, Copy, Send, Mail, Search,
  QrCode
} from 'lucide-react';
import { useEmotionalTheme } from '../context/ThemeContext';
import { cn } from '../utils/cn';
import { motion as Motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';

export function AdoptionCeremony() {
  const navigate = useNavigate();
  const { plantId } = useParams();
  const { user, session, loading: authLoading } = useAuth();
  const { theme, themeConfig } = useEmotionalTheme();
  
  const [plant, setPlant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPoster, setShowPoster] = useState(false);
  const [targetEmail, setTargetEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (authLoading) return;
    
    const fetchPlant = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        const token = currentSession?.access_token;
        
        if (!token) return;

        const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-4b732228/plants`, {
          headers: { 
            'X-User-JWT': token, 
            'Authorization': `Bearer ${publicAnonKey}`,
            'apikey': publicAnonKey 
          }
        });
        const data = await res.json();
        const found = data.find((p: any) => p.id === plantId);
        if (found) setPlant(found);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchPlant();
  }, [plantId, session, authLoading]);

  const handleSendDirectInvite = async () => {
    if (!targetEmail || !plant || !user) {
      toast.error('请填写对方的注册邮箱账号');
      return;
    }
    setIsSending(true);
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const token = currentSession?.access_token;
      
      if (!token) {
        toast.error('认证失败');
        return;
      }

      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-4b732228/send-direct-invite`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-JWT': token,
          'Authorization': `Bearer ${publicAnonKey}`,
          'apikey': publicAnonKey
        },
        body: JSON.stringify({
          plantId: plant.id,
          inviterId: user.id,
          inviterName: user.user_metadata?.name || user.email?.split('@')[0] || '我',
          targetEmail: targetEmail.trim().toLowerCase()
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`结缘契约已投递至 ${targetEmail}！ ✨`);
        setTargetEmail('');
      } else {
        toast.error('发送失败，请确保该账号已注册');
      }
    } catch (e) {
      toast.error('网络请求失败');
    } finally {
      setIsSending(false);
    }
  };

  const generateInvitePoster = async () => {
    if (!plant || !user) return;
    setIsGenerating(true);
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const token = currentSession?.access_token;

      if (!token) {
        toast.error('认证失败');
        return;
      }

      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-4b732228/generate-invite`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-JWT': token,
          'Authorization': `Bearer ${publicAnonKey}`,
          'apikey': publicAnonKey
        },
        body: JSON.stringify({
          plantId: plant.id,
          inviterId: user.id,
          inviterName: user.user_metadata?.name || user.email?.split('@')[0] || '我'
        })
      });
      const data = await res.json();
      setInviteCode(data.code);
      setShowPoster(true);
      setTimeout(() => renderPoster(data.code), 100);
    } catch (e) {
      toast.error('海报生成失败');
    } finally {
      setIsGenerating(false);
    }
  };

  const renderPoster = (code: string) => {
    const canvas = canvasRef.current;
    if (!canvas || !plant) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 400;
    canvas.height = 750;

    // Gradient Background
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, themeConfig.primary);
    grad.addColorStop(1, '#FFFFFF');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Load Image
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = plant.image;
    img.onload = () => {
      const imgSize = 340;
      const x = (canvas.width - imgSize) / 2;
      const y = 80;

      // Draw Main Image
      ctx.save();
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, imgSize, imgSize, 50);
      else ctx.rect(x, y, imgSize, imgSize);
      ctx.clip();
      ctx.drawImage(img, x, y, imgSize, imgSize);
      ctx.restore();

      // Title & Text
      ctx.fillStyle = "#1A1A1A";
      ctx.textAlign = "center";
      
      ctx.font = "bold 32px sans-serif";
      ctx.fillText(`结 缘 契 约`, canvas.width / 2, 480);
      
      ctx.font = "bold 20px sans-serif";
      ctx.fillStyle = themeConfig.primary;
      ctx.fillText(`正在守护: ${plant.name}`, canvas.width / 2, 520);

      ctx.font = "italic 16px sans-serif";
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillText(`"${theme === 'romance' ? '愿我们的爱如草木，岁岁长青' : '见证每一刻的生命成长'}"`, canvas.width / 2, 560);

      // Invite Code Section (Identifying Fields)
      ctx.fillStyle = "#F8F8F8";
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(40, 600, 320, 100, 24);
      else ctx.rect(40, 600, 320, 100);
      ctx.fill();

      ctx.fillStyle = "#000000";
      ctx.font = "900 12px sans-serif";
      ctx.fillText("凭此契约编码，在 App 首页输入即可加入", canvas.width / 2, 630);
      
      ctx.font = "black 48px sans-serif";
      ctx.letterSpacing = "8px";
      ctx.fillText(code, canvas.width / 2, 685);
      
      toast.success('结缘海报已就绪，快发给 TA 吧 ✨');
    };
  };

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="animate-spin text-green-500" /></div>;

  return (
    <div className="flex flex-col transition-colors duration-700 min-h-full" style={{ backgroundColor: themeConfig.bg }}>
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl px-4 py-4 flex items-center justify-between border-b border-black/5">
        <button onClick={() => navigate(-1)} className="p-2 text-gray-400">
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1 text-center">
           <h1 className="text-sm font-black uppercase tracking-widest opacity-30">
             发起结缘
           </h1>
        </div>
        <div className="w-10" />
      </div>

      <div className="flex-1 px-6 pt-8 flex flex-col gap-8 pb-10">
        {!showPoster && (
          <Motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-[40px] shadow-xl space-y-6 border border-black/5"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center">
                 <Mail size={24} />
              </div>
              <div>
                <h3 className="font-black text-lg">填��对方账号</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Direct Account Invite</p>
              </div>
            </div>

            <div className="space-y-4">
               <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                     <Search size={18} />
                  </div>
                  <input 
                    type="email" 
                    placeholder="请输入对方的注册邮箱..."
                    value={targetEmail}
                    onChange={(e) => setTargetEmail(e.target.value)}
                    className="w-full bg-gray-50 border-none rounded-2xl py-5 px-6 pl-12 text-sm font-bold focus:ring-4 focus:ring-black/5 transition-all"
                  />
               </div>
               <button 
                 onClick={handleSendDirectInvite}
                 disabled={isSending}
                 className="w-full py-5 bg-black text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all"
               >
                 {isSending ? <Loader2 className="animate-spin" /> : <Send size={18} />}
                 {isSending ? '正在投递契约...' : '发送实时邀请通知'}
               </button>
            </div>
            <p className="text-[10px] text-center text-gray-400 font-medium">发送后对方将在首页“结缘信箱”即刻收到通知</p>
          </Motion.div>
        )}

        <div className="flex flex-col items-center gap-6">
           <div className="w-full flex items-center gap-4">
              <div className="h-[1px] flex-1 bg-black/5" />
              <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">或者生成海报分享</span>
              <div className="h-[1px] flex-1 bg-black/5" />
           </div>

           {!showPoster ? (
             <button 
               onClick={generateInvitePoster}
               disabled={isGenerating}
               className="w-full py-5 bg-white border-2 border-dashed border-black/10 rounded-[32px] font-black text-sm text-gray-500 flex items-center justify-center gap-3 active:scale-95 transition-all"
             >
               {isGenerating ? <Loader2 className="animate-spin" /> : <QrCode size={20} />}
               {isGenerating ? '正在绘制精美海报...' : '生成结缘海报 (含 6 位加入码)'}
             </button>
           ) : (
             <Motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="w-full flex flex-col items-center gap-6"
             >
               <canvas ref={canvasRef} className="rounded-[40px] shadow-2xl border-4 border-white w-full max-w-[320px] mx-auto" />
               <div className="flex gap-4 w-full max-w-[320px]">
                  <button onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/join/${inviteCode}`);
                    toast.success('结缘链接已复制');
                  }} className="flex-1 bg-white p-4 rounded-3xl shadow-sm border flex flex-col items-center gap-1">
                     <Copy size={18} className="text-blue-500" />
                     <span className="text-[10px] font-black uppercase">复制链接</span>
                  </button>
                  <button onClick={() => toast.info('请截图并发送海报给对方')} className="flex-1 bg-white p-4 rounded-3xl shadow-sm border flex flex-col items-center gap-1">
                     <Download size={18} className="text-rose-500" />
                     <span className="text-[10px] font-black uppercase">保存海报</span>
                  </button>
               </div>
               <button onClick={() => setShowPoster(false)} className="text-xs font-black text-gray-400 uppercase tracking-widest">
                 返回输入账号
               </button>
             </Motion.div>
           )}
        </div>
      </div>
    </div>
  );
}

export function JoinInvitation() {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const [isAccepting, setIsAccepting] = useState(false);

  const handleJoin = async () => {
    if (!user) { navigate('/login', { state: { from: `/join/${inviteCode}` } }); return; }
    setIsAccepting(true);
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const token = currentSession?.access_token;
      
      if (!token) {
        toast.error('认证失败');
        return;
      }

      const userName = user.user_metadata?.name || user.email?.split('@')[0] || '守护者';
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-4b732228/accept-invite`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'X-User-JWT': token, 
          'Authorization': `Bearer ${publicAnonKey}`,
          'apikey': publicAnonKey 
        },
        body: JSON.stringify({ inviteCode: inviteCode?.toUpperCase(), userName })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`结缘成功！你已开启对 ${data.plant.name} 的守护`);
        setTimeout(() => navigate('/interaction'), 1500);
      } else {
        toast.error(data.error || '该结缘码已失效，请联系发起人重新提供');
      }
    } catch (e) {
      toast.error('网络连接异常或契约解析失败');
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <div className="min-h-full bg-white flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl px-4 py-4 flex items-center justify-between border-b border-black/5">
        <button onClick={() => navigate(-1)} className="p-2 text-gray-400">
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1 text-center">
           <h1 className="text-sm font-black uppercase tracking-widest opacity-30">
             接受契约
           </h1>
        </div>
        <div className="w-10" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 gap-10 relative">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-rose-50 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-50" />

        <div className="w-full flex flex-col items-center justify-center text-center gap-8 relative z-10">
          <div className="w-24 h-24 bg-rose-50 rounded-[40px] flex items-center justify-center text-rose-500 shadow-xl">
            <Sparkles size={48} />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black italic">你收到一份结缘契约</h1>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Emotional Connection Protocol</p>
          </div>
          <div className="bg-gray-50 p-8 rounded-[40px] w-full max-w-sm">
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">待解锁契约编码</p>
             <span className="text-4xl font-black tracking-[8px] text-gray-900">{inviteCode}</span>
          </div>
          <Motion.button 
            whileTap={{ scale: 0.95 }} 
            onClick={handleJoin} 
            disabled={isAccepting}
            className="w-full max-w-sm py-5 bg-black text-white rounded-[32px] font-black text-lg shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all"
          >
            {isAccepting ? <Loader2 className="animate-spin" /> : <Heart size={24} fill="white" />}
            {isAccepting ? '正在同步契约内容...' : '接受契约并开启守护'}
          </Motion.button>
        </div>
      </div>
    </div>
  );
}
