import { useEffect, useState } from 'react';
import { Wifi, WifiOff, Activity, Clock, Loader } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';

interface VideoConnectionStatusProps {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  fps?: number;
  latency?: number;
  className?: string;
  compact?: boolean; // 紧凑模式
  showDetails?: boolean; // 显示详细信息
}

export function VideoConnectionStatus({
  status,
  fps = 0,
  latency = 0,
  className = '',
  compact = false,
  showDetails = true,
}: VideoConnectionStatusProps) {
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    if (status !== 'connected') {
      setUptime(0);
      return;
    }

    const startTime = Date.now();
    const timer = setInterval(() => {
      setUptime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [status]);

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const statusConfig = {
    connecting: {
      label: '连接中',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20',
      icon: Loader,
      animate: true,
    },
    connected: {
      label: '已连接',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      icon: Wifi,
      animate: false,
    },
    disconnected: {
      label: '未连接',
      color: 'text-gray-400',
      bgColor: 'bg-gray-400/10',
      borderColor: 'border-gray-400/20',
      icon: WifiOff,
      animate: false,
    },
    error: {
      label: '连接失败',
      color: 'text-red-400',
      bgColor: 'bg-red-400/10',
      borderColor: 'border-red-400/20',
      icon: WifiOff,
      animate: false,
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  // 紧凑模式：只显示图标和状态
  if (compact) {
    return (
      <Motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-full',
          'backdrop-blur-sm border',
          config.bgColor,
          config.borderColor,
          className
        )}
      >
        <Icon
          size={14}
          className={cn(config.color, config.animate && 'animate-spin')}
        />
        <span className={cn('text-xs font-bold', config.color)}>
          {config.label}
        </span>
        {status === 'connected' && fps > 0 && (
          <span className="text-xs font-mono opacity-60">{fps} FPS</span>
        )}
      </Motion.div>
    );
  }

  // 完整模式：显示详细信息
  return (
    <Motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'bg-white/80 backdrop-blur-lg rounded-2xl border shadow-lg overflow-hidden',
        config.borderColor,
        className
      )}
    >
      {/* 状态头 */}
      <div className={cn('px-4 py-3 flex items-center gap-3', config.bgColor)}>
        <div className="relative">
          <Icon
            size={20}
            className={cn(config.color, config.animate && 'animate-spin')}
          />
          {status === 'connected' && (
            <Motion.div
              className={cn(
                'absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full',
                'bg-green-500'
              )}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </div>
        <div className="flex-1">
          <div className={cn('text-sm font-bold', config.color)}>
            视频流{config.label}
          </div>
          {status === 'connected' && (
            <div className="text-xs text-gray-500 font-mono">
              运行时长: {formatUptime(uptime)}
            </div>
          )}
        </div>
      </div>

      {/* 详细信息 */}
      {showDetails && status === 'connected' && (
        <div className="px-4 py-3 grid grid-cols-2 gap-3 border-t border-gray-100">
          {/* 帧率 */}
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-blue-500" />
            <div>
              <div className="text-xs text-gray-400 font-bold">帧率</div>
              <div className="text-lg font-black text-gray-800">
                {fps}
                <span className="text-xs font-normal opacity-50 ml-1">FPS</span>
              </div>
            </div>
          </div>

          {/* 延迟 */}
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-purple-500" />
            <div>
              <div className="text-xs text-gray-400 font-bold">延迟</div>
              <div className="text-lg font-black text-gray-800">
                {latency}
                <span className="text-xs font-normal opacity-50 ml-1">ms</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {status === 'error' && showDetails && (
        <div className="px-4 py-3 border-t border-red-100">
          <p className="text-xs text-red-600/80">
            视频流暂时不可用，系统将自动重试连接
          </p>
        </div>
      )}

      {/* 连接中提示 */}
      {status === 'connecting' && showDetails && (
        <div className="px-4 py-3 border-t border-yellow-100">
          <p className="text-xs text-yellow-600/80">
            正在建立连接，请稍候...
          </p>
        </div>
      )}
    </Motion.div>
  );
}

// 浮动状态指示器（用于覆盖在视频上方）
export function VideoConnectionBadge({
  status,
  fps = 0,
  className = '',
}: Pick<VideoConnectionStatusProps, 'status' | 'fps' | 'className'>) {
  const statusConfig = {
    connecting: {
      label: '连接中',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/20',
      icon: Loader,
      animate: true,
    },
    connected: {
      label: 'LIVE',
      color: 'text-red-500',
      bgColor: 'bg-black/60',
      icon: Activity,
      animate: true,
    },
    disconnected: {
      label: '未连接',
      color: 'text-gray-400',
      bgColor: 'bg-gray-900/60',
      icon: WifiOff,
      animate: false,
    },
    error: {
      label: '离线',
      color: 'text-gray-400',
      bgColor: 'bg-gray-900/60',
      icon: WifiOff,
      animate: false,
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      <Motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-full',
          'backdrop-blur-md text-white text-xs font-bold',
          config.bgColor,
          className
        )}
      >
        {status === 'connected' ? (
          <>
            <Motion.div
              className="w-2 h-2 rounded-full bg-red-500"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span>{config.label}</span>
            {fps > 0 && (
              <>
                <div className="w-px h-3 bg-white/30" />
                <Wifi size={12} />
                <span className="font-mono">{fps} FPS</span>
              </>
            )}
          </>
        ) : (
          <>
            <Icon
              size={14}
              className={cn(config.color, config.animate && 'animate-spin')}
            />
            <span className={config.color}>{config.label}</span>
          </>
        )}
      </Motion.div>
    </AnimatePresence>
  );
}
