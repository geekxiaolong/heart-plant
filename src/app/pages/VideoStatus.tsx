import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { 
  Video, 
  Wifi, 
  Activity, 
  Clock, 
  Signal,
  ArrowLeft,
  RefreshCw,
  Monitor,
  Server
} from 'lucide-react';
import { VideoConnectionStatus } from '../components/VideoConnectionStatus';
import { WebRTCPlayer } from '../components/WebRTCPlayer';
import { motion as Motion } from 'motion/react';

export function VideoStatus() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [fps, setFps] = useState(0);
  const [latency, setLatency] = useState(0);
  const [streamUrl] = useState('ws://localhost:8889/mystream/whep');
  const [bytesReceived, setBytesReceived] = useState(0);
  const [packetsLost, setPacketsLost] = useState(0);
  const [isPlayerMounted, setIsPlayerMounted] = useState(false);

  // 模拟网络统计数据（实际应从 WebRTC 获取）
  useEffect(() => {
    if (status !== 'connected') return;

    const interval = setInterval(() => {
      setBytesReceived(prev => prev + Math.random() * 50000);
      setPacketsLost(Math.floor(Math.random() * 5));
      setLatency(Math.floor(20 + Math.random() * 30));
    }, 1000);

    return () => clearInterval(interval);
  }, [status]);

  const formatBytes = (bytes: number) => {
    const mb = bytes / 1024 / 1024;
    return mb.toFixed(2) + ' MB';
  };

  const handleError = () => {
    setStatus('error');
  };

  const handleConnected = () => {
    setStatus('connected');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* 头部 */}
        <Motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/interaction')}
              className="p-2 hover:bg-white/50 rounded-full transition-colors"
            >
              <ArrowLeft size={24} className="text-gray-700" />
            </button>
            <div>
              <h1 className="text-3xl font-black text-gray-800 flex items-center gap-3">
                <Video className="text-green-600" />
                视频流状态监控
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                实时监控视频流连接状态与性能指标
              </p>
            </div>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-white rounded-full shadow-sm hover:shadow-md transition-all flex items-center gap-2 font-bold text-sm"
          >
            <RefreshCw size={16} />
            刷新
          </button>
        </Motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：视频预览 */}
          <Motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* 视频播放器 */}
            <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-200">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Monitor size={20} className="text-gray-600" />
                  <h2 className="text-lg font-black text-gray-800">实时视频流</h2>
                </div>
                <div className="text-xs text-gray-500 font-mono">{streamUrl}</div>
              </div>
              
              <div className="aspect-video bg-gray-900">
                <WebRTCPlayer
                  streamUrl={streamUrl}
                  className="w-full h-full"
                  onError={handleError}
                  onConnected={handleConnected}
                />
              </div>
            </div>

            {/* 网络统计 */}
            <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <Signal size={20} className="text-purple-600" />
                <h3 className="text-lg font-black text-gray-800">网络统计</h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  label="已接收数据"
                  value={formatBytes(bytesReceived)}
                  color="text-blue-600"
                  bgColor="bg-blue-50"
                />
                <StatCard
                  label="丢包数"
                  value={packetsLost.toString()}
                  color="text-orange-600"
                  bgColor="bg-orange-50"
                  suffix="packets"
                />
                <StatCard
                  label="当前帧率"
                  value={fps.toString()}
                  color="text-green-600"
                  bgColor="bg-green-50"
                  suffix="FPS"
                />
                <StatCard
                  label="延迟"
                  value={latency.toString()}
                  color="text-purple-600"
                  bgColor="bg-purple-50"
                  suffix="ms"
                />
              </div>
            </div>
          </Motion.div>

          {/* 右侧：状态面板 */}
          <Motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* 连接状态 */}
            <VideoConnectionStatus
              status={status}
              fps={fps}
              latency={latency}
              showDetails={true}
            />

            {/* 服务器信息 */}
            <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <Server size={20} className="text-indigo-600" />
                <h3 className="text-lg font-black text-gray-800">服务器配置</h3>
              </div>

              <div className="space-y-3">
                <InfoRow label="协议" value="WebRTC/WHEP" />
                <InfoRow label="地址" value="localhost:8889" />
                <InfoRow label="路径" value="/mystream/whep" />
                <InfoRow 
                  label="状态" 
                  value={status === 'connected' ? '✅ 运行中' : '⭕ 未连接'} 
                />
              </div>
            </div>

            {/* 连接质量 */}
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl shadow-lg p-6 text-white">
              <div className="flex items-center gap-2 mb-4">
                <Wifi size={20} />
                <h3 className="text-lg font-black">连接质量</h3>
              </div>

              <div className="flex items-end justify-center gap-1 h-24 mb-4">
                {[...Array(12)].map((_, i) => (
                  <Motion.div
                    key={i}
                    className="flex-1 bg-white/30 rounded-t-lg"
                    initial={{ height: 0 }}
                    animate={{ 
                      height: status === 'connected' 
                        ? `${20 + (i * 6) + (Math.random() * 10)}%`
                        : '10%'
                    }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                  />
                ))}
              </div>

              <div className="text-center">
                <div className="text-3xl font-black mb-1">
                  {status === 'connected' ? '优秀' : '离线'}
                </div>
                <div className="text-sm opacity-80">
                  {status === 'connected' 
                    ? '连接稳定，画面流畅'
                    : '等待连接建立'
                  }
                </div>
              </div>
            </div>

            {/* 操作建议 */}
            {status !== 'connected' && (
              <Motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-amber-50 rounded-2xl p-4 border border-amber-200"
              >
                <h4 className="text-sm font-bold text-amber-800 mb-2">💡 连接提示</h4>
                <ul className="text-xs text-amber-700 space-y-1">
                  <li>• 确保 MediaMTX 服务器已启动</li>
                  <li>• 检查 RTSP 源是否正常推流</li>
                  <li>• 验证网络连接状态</li>
                  <li>• 查看浏览器控制台日志</li>
                </ul>
              </Motion.div>
            )}
          </Motion.div>
        </div>
      </div>
    </div>
  );
}

// 统计卡片
function StatCard({ 
  label, 
  value, 
  color, 
  bgColor, 
  suffix = '' 
}: { 
  label: string; 
  value: string; 
  color: string; 
  bgColor: string;
  suffix?: string;
}) {
  return (
    <div className={`${bgColor} rounded-2xl p-4`}>
      <div className="text-xs text-gray-600 font-bold mb-1">{label}</div>
      <div className={`text-2xl font-black ${color}`}>
        {value}
        {suffix && <span className="text-sm font-normal ml-1 opacity-60">{suffix}</span>}
      </div>
    </div>
  );
}

// 信息行
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-500 font-bold">{label}</span>
      <span className="text-sm font-mono text-gray-800">{value}</span>
    </div>
  );
}