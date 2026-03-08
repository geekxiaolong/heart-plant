import { useEffect, useRef, useState } from 'react';
import { Wifi, WifiOff, Loader, AlertCircle } from 'lucide-react';

interface WebSocketStreamPlayerProps {
  streamUrl: string; // ws://host:port/stream/path
  className?: string;
  onError?: (error: Error) => void;
  onConnected?: () => void;
}

export function WebSocketStreamPlayer({
  streamUrl,
  className = '',
  onError,
  onConnected,
}: WebSocketStreamPlayerProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [fps, setFps] = useState<number>(0);
  const frameCountRef = useRef(0);
  const lastFpsUpdateRef = useRef(Date.now());

  useEffect(() => {
    console.log('🎥 WebSocketStreamPlayer: Initializing connection to:', streamUrl);
    
    let ws: WebSocket | null = null;
    let objectUrls: string[] = [];
    let reconnectTimer: number | null = null;

    function connect() {
      try {
        setStatus('connecting');
        setErrorMessage('');

        ws = new WebSocket(streamUrl);
        ws.binaryType = 'arraybuffer';
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('✅ WebSocket connected');
          setStatus('connected');
          onConnected?.();
        };

        ws.onmessage = (event) => {
          if (!(event.data instanceof ArrayBuffer)) {
            console.warn('⚠️ Received non-binary data');
            return;
          }

          // 创建 Blob URL 并显示图片
          const blob = new Blob([event.data], { type: 'image/jpeg' });
          const url = URL.createObjectURL(blob);

          // 更新图片
          if (imgRef.current) {
            // 释放旧的 URL
            if (imgRef.current.src.startsWith('blob:')) {
              objectUrls.push(imgRef.current.src);
              // 只保留最近 5 个 URL，防止内存泄漏
              if (objectUrls.length > 5) {
                const oldUrl = objectUrls.shift();
                if (oldUrl) URL.revokeObjectURL(oldUrl);
              }
            }
            
            imgRef.current.src = url;
          }

          // 计算 FPS
          frameCountRef.current++;
          const now = Date.now();
          if (now - lastFpsUpdateRef.current >= 1000) {
            setFps(frameCountRef.current);
            frameCountRef.current = 0;
            lastFpsUpdateRef.current = now;
          }
        };

        ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          setStatus('error');
          setErrorMessage('连接失败');
          // 静默处理错误，不调用 onError 回调
        };

        ws.onclose = (event) => {
          console.log('🔌 WebSocket closed:', event.code, event.reason);
          setStatus('disconnected');
          
          // 尝试重连（非正常关闭）
          if (event.code !== 1000) {
            console.log('🔄 Attempting to reconnect in 3 seconds...');
            reconnectTimer = window.setTimeout(() => {
              connect();
            }, 3000);
          }
        };
      } catch (error) {
        console.error('❌ Failed to create WebSocket:', error);
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : '未知错误');
        onError?.(error instanceof Error ? error : new Error('WebSocket creation failed'));
      }
    }

    connect();

    // 清理函数
    return () => {
      console.log('🧹 Cleaning up WebSocketStreamPlayer');
      
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      
      if (ws) {
        ws.close(1000, 'Component unmounted');
      }
      
      // 释放所有 Blob URLs
      objectUrls.forEach(url => URL.revokeObjectURL(url));
      if (imgRef.current?.src.startsWith('blob:')) {
        URL.revokeObjectURL(imgRef.current.src);
      }
    };
  }, [streamUrl, onError, onConnected]);

  return (
    <div className={`relative w-full h-full bg-black ${className}`}>
      {/* 视频画面 */}
      <img
        ref={imgRef}
        alt="Live stream"
        className="w-full h-full object-contain"
        style={{ display: status === 'connected' ? 'block' : 'none' }}
      />

      {/* 连接中状态 */}
      {status === 'connecting' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 text-white">
          <Loader size={48} className="animate-spin mb-4" />
          <p className="text-sm font-bold">正在连接视频流...</p>
          <p className="text-xs text-gray-400 mt-2">{streamUrl}</p>
        </div>
      )}

      {/* 断开连接状态 */}
      {status === 'disconnected' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 text-white">
          <WifiOff size={48} className="mb-4 text-gray-400" />
          <p className="text-sm font-bold">连接已断开</p>
          <p className="text-xs text-gray-400 mt-2">正在尝试重新连接...</p>
        </div>
      )}

      {/* 错误状态 */}
      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white p-8">
          <WifiOff size={32} className="mb-2 opacity-50" />
          <p className="text-xs text-center opacity-60">视频流暂时不可用</p>
        </div>
      )}

      {/* 状态指示器 */}
      {status === 'connected' && (
        <div className="absolute top-4 left-4 flex gap-2">
          <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2 text-white text-xs font-bold">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span>LIVE</span>
          </div>
          <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2 text-white text-xs font-bold">
            <Wifi size={12} />
            <span>{fps} FPS</span>
          </div>
        </div>
      )}
    </div>
  );
}