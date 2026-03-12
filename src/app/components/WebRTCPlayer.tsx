import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef, ForwardRefRenderFunction } from 'react';
import { Wifi, WifiOff, Loader, AlertCircle, RefreshCw } from 'lucide-react';
import { getStreamWhepUrl } from '../utils/streamUrl';

export interface WebRTCPlayerRef {
  captureFrame: () => string | null;
}

interface WebRTCPlayerProps {
  streamUrl: string; // WebRTC WHEP URL or WebSocket URL
  rtspUrl?: string;
  className?: string;
  onError?: (error: Error) => void;
  onConnected?: () => void;
  enableDebug?: boolean;
}

/**
 * Main WebRTC Player Component
 */
const WebRTCPlayerRender: ForwardRefRenderFunction<WebRTCPlayerRef, WebRTCPlayerProps> = (props, ref) => {
  const {
    streamUrl,
    rtspUrl = '',
    className = '',
    onError,
    onConnected,
    enableDebug = false,
  } = props;

  const playerRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    captureFrame: () => {
      if (playerRef.current && playerRef.current.captureFrame) {
        return playerRef.current.captureFrame();
      }
      return null;
    }
  }));

  // Auto-detect stream type and fix potentially mispassed RTSP URLs
  const isWebSocket = streamUrl.startsWith('ws://') || streamUrl.startsWith('wss://');
  const isRtsp = streamUrl.startsWith('rtsp://');

  // If someone passed an RTSP URL as streamUrl (which should be HTTP/WHEP), 
  // we fix it by using it as rtspUrl and falling back to the app's WHEP URL (走代理时无 CORS)
  const effectiveStreamUrl = isRtsp ? getStreamWhepUrl('heartplant') : streamUrl;
    
  const effectiveRtspUrl = isRtsp ? streamUrl : rtspUrl;
  
  if (isWebSocket) {
    // Use WebSocket stream player
    return <WebSocketStreamPlayer 
      ref={playerRef}
      streamUrl={effectiveStreamUrl}
      className={className}
      onError={onError}
      onConnected={onConnected}
      enableDebug={enableDebug}
    />;
  }
  
  // Use WebRTC stream player
  return <WebRTCStreamPlayer 
    ref={playerRef}
    streamUrl={effectiveStreamUrl}
    rtspUrl={effectiveRtspUrl}
    className={className}
    onError={onError}
    onConnected={onConnected}
    enableDebug={enableDebug}
  />;
};

export const WebRTCPlayer = forwardRef(WebRTCPlayerRender);

/**
 * WebSocket Stream Player
 */
const WebSocketStreamPlayerRender: ForwardRefRenderFunction<any, Omit<WebRTCPlayerProps, 'rtspUrl'>> = (props, ref) => {
  const {
    streamUrl,
    className = '',
    onError,
    onConnected,
    enableDebug = false,
  } = props;
  
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const wsRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [fps, setFps] = useState<number>(0);
  const frameCountRef = useRef(0);
  const lastFpsUpdateRef = useRef(Date.now());
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  useImperativeHandle(ref, () => ({
    captureFrame: () => {
      if (!imgRef.current) return null;
      const canvas = canvasRef.current;
      canvas.width = imgRef.current.naturalWidth;
      canvas.height = imgRef.current.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(imgRef.current, 0, 0);
        return canvas.toDataURL('image/png');
      }
      return null;
    }
  }));

  const addDebugLog = (message: string) => {
    if (enableDebug) {
      const timestamp = new Date().toLocaleTimeString();
      setDebugLogs(prev => [...prev.slice(-4), `[${timestamp}] ${message}`]);
      console.log(`[WebSocket] ${message}`);
    }
  };

  useEffect(() => {
    addDebugLog(`Initializing WebSocket connection to: ${streamUrl}`);
    
    let ws: WebSocket | null = null;
    let objectUrls: string[] = [];
    let reconnectTimer: any = null;

    function connect() {
      try {
        setStatus('connecting');
        setErrorMessage('');
        addDebugLog('Creating WebSocket connection...');

        ws = new WebSocket(streamUrl);
        ws.binaryType = 'arraybuffer';
        wsRef.current = ws;

        ws.onopen = () => {
          addDebugLog('✅ WebSocket connected successfully');
          setStatus('connected');
          onConnected?.();
        };

        ws.onmessage = (event) => {
          if (!(event.data instanceof ArrayBuffer)) {
            addDebugLog('⚠️ Received non-binary data');
            return;
          }

          const blob = new Blob([event.data], { type: 'image/jpeg' });
          const url = URL.createObjectURL(blob);

          if (imgRef.current) {
            if (imgRef.current.src.startsWith('blob:')) {
              objectUrls.push(imgRef.current.src);
              if (objectUrls.length > 5) {
                const oldUrl = objectUrls.shift();
                if (oldUrl) URL.revokeObjectURL(oldUrl);
              }
            }
            imgRef.current.src = url;
          }

          frameCountRef.current++;
          const now = Date.now();
          if (now - lastFpsUpdateRef.current >= 1000) {
            setFps(frameCountRef.current);
            frameCountRef.current = 0;
            lastFpsUpdateRef.current = now;
          }
        };

        ws.onerror = (error) => {
          addDebugLog(`❌ WebSocket error: ${error}`);
          setStatus('error');
          setErrorMessage('WebSocket 连接失败');
        };

        ws.onclose = (event) => {
          addDebugLog(`🔌 WebSocket closed: code=${event.code}, reason=${event.reason}`);
          setStatus('disconnected');
          if (event.code !== 1000) {
            addDebugLog('🔄 Attempting reconnect in 3 seconds...');
            reconnectTimer = setTimeout(() => {
              connect();
            }, 3000);
          }
        };
      } catch (error) {
        addDebugLog(`❌ Failed to create WebSocket: ${error}`);
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : '未知错误');
        onError?.(error instanceof Error ? error : new Error('WebSocket creation failed'));
      }
    }

    connect();

    return () => {
      addDebugLog('🧹 Cleaning up WebSocket connection');
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) ws.close(1000, 'Component unmounted');
      objectUrls.forEach(url => URL.revokeObjectURL(url));
      if (imgRef.current?.src.startsWith('blob:')) {
        URL.revokeObjectURL(imgRef.current.src);
      }
    };
  }, [streamUrl]);

  return (
    <div className={`relative w-full h-full bg-black ${className}`}>
      <img
        ref={imgRef}
        alt="Live stream"
        className="w-full h-full object-contain"
        style={{ display: status === 'connected' ? 'block' : 'none' }}
      />

      {status === 'connecting' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 text-white">
          <Loader size={24} className="animate-spin mb-2 opacity-50" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">正在连接视频流</p>
        </div>
      )}

      {status === 'disconnected' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 text-white">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">连接已断开</p>
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white p-8 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">视频流暂时不可用</p>
        </div>
      )}

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

      {enableDebug && debugLogs.length > 0 && (
        <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-3 text-xs text-white font-mono space-y-1 max-h-32 overflow-y-auto">
          {debugLogs.map((log, i) => (
            <div key={i} className="text-green-400">{log}</div>
          ))}
        </div>
      )}
    </div>
  );
};

const WebSocketStreamPlayer = forwardRef(WebSocketStreamPlayerRender);

/**
 * WebRTC Stream Player
 */
const WebRTCStreamPlayerRender: ForwardRefRenderFunction<any, WebRTCPlayerProps> = (props, ref) => {
  const {
    streamUrl = getStreamWhepUrl('heartplant'),
    rtspUrl = (import.meta.env.VITE_DEFAULT_RTSP_URL || ''),
    className = '',
    onError,
    onConnected,
    enableDebug = false,
  } = props;
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error' | 'disconnected'>('connecting');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const reconnectTimeoutRef = useRef<any>();

  useImperativeHandle(ref, () => ({
    captureFrame: () => {
      if (!videoRef.current) return null;
      const canvas = canvasRef.current;
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        return canvas.toDataURL('image/png');
      }
      return null;
    }
  }));

  const addDebugLog = (message: string) => {
    if (enableDebug) {
      const timestamp = new Date().toLocaleTimeString();
      const logMessage = `[${timestamp}] ${message}`;
      console.log(logMessage);
      setDebugInfo(prev => [...prev.slice(-4), logMessage]);
    }
  };

  useEffect(() => {
    let isActive = true;
    let currentPc: RTCPeerConnection | null = null;

    const connect = async () => {
      try {
        setStatus('connecting');
        setErrorMessage('');
        addDebugLog(`Connecting to: ${streamUrl}`);

        if (currentPc) {
          currentPc.close();
          currentPc = null;
        }

        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
          bundlePolicy: 'max-bundle'
        });

        currentPc = pc;
        pcRef.current = pc;
        addDebugLog('RTCPeerConnection created');

        pc.ontrack = (event) => {
          if (!isActive) return;
          addDebugLog(`Received track: ${event.track.kind}`);
          if (videoRef.current && event.streams[0]) {
            videoRef.current.srcObject = event.streams[0];
            videoRef.current.play().then(() => {
              if (!isActive) return;
              addDebugLog('Video playback started');
              setStatus('connected');
              onConnected?.();
            }).catch(err => {
              if (!isActive) return;
              addDebugLog(`Play error: ${err.message}`);
              setStatus('connected');
              onConnected?.();
            });
          }
        };

        pc.onconnectionstatechange = () => {
          if (!isActive) return;
          addDebugLog(`Connection state: ${pc.connectionState}`);
          if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
            if (isActive && pc.signalingState !== 'closed') {
              setStatus('disconnected');
              if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
              reconnectTimeoutRef.current = setTimeout(() => {
                if (isActive) connect();
              }, 3000);
            }
          }
        };

        pc.addTransceiver('video', { direction: 'recvonly' });
        pc.addTransceiver('audio', { direction: 'recvonly' });

        const offer = await pc.createOffer();
        if (!isActive || pc.signalingState === 'closed') return;
        
        await pc.setLocalDescription(offer);
        
        await new Promise<void>((resolve) => {
          if (pc.iceGatheringState === 'complete') resolve();
          else {
            const checkState = () => {
              if (pc.iceGatheringState === 'complete') {
                pc.removeEventListener('icegatheringstatechange', checkState);
                resolve();
              }
            };
            pc.addEventListener('icegatheringstatechange', checkState);
            setTimeout(resolve, 5000);
          }
        });
        
        if (!isActive || pc.signalingState === 'closed') return;

        const response = await fetch(streamUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/sdp' },
          body: pc.localDescription!.sdp,
        });

        if (!response.ok) throw new Error(`WHEP request failed: ${response.status}`);

        const answerSDP = await response.text();
        if (!isActive || pc.signalingState === 'closed') return;
        
        await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: answerSDP }));
      } catch (error: any) {
        if (!isActive) return;
        console.error('WebRTC connection error:', error);
        setErrorMessage(error.message || 'Failed to connect to stream');
        setStatus('error');
        onError?.(error);
        if (isActive) {
          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isActive) connect();
          }, 5000);
        }
      }
    };

    connect();

    return () => {
      isActive = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (currentPc) currentPc.close();
      if (pcRef.current) pcRef.current.close();
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [streamUrl]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover ${status === 'connected' ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}
      />

      {status === 'connecting' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-3">
          <Loader className="text-white/20 animate-spin" size={24} />
          <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Connecting Stream</span>
        </div>
      )}

      {status === 'disconnected' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-3">
          <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Connection Lost</span>
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-4 text-center">
          <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Stream Unavailable</span>
        </div>
      )}

      {status === 'connected' && (
        <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full z-10">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] text-white/90 font-mono tracking-tight">WebRTC • LIVE</span>
        </div>
      )}
    </div>
  );
};

const WebRTCStreamPlayer = forwardRef(WebRTCStreamPlayerRender);
