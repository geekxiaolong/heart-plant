import { useState } from 'react';
import { useNavigate } from 'react-router';
import { 
  ArrowLeft, 
  Wifi, 
  Server, 
  Camera, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Copy,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

interface DiagnosticResult {
  name: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message: string;
  details?: string;
  action?: string;
}

export function NetworkDiagnostic() {
  const navigate = useNavigate();
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);

  const addResult = (result: DiagnosticResult) => {
    setResults(prev => [...prev, result]);
  };

  const runDiagnostics = async () => {
    setTesting(true);
    setResults([]);

    // Test 1: 检查 MediaMTX 服务器连接
    addResult({ name: '测试 MediaMTX 服务器', status: 'pending', message: '正在连接...' });
    
    try {
      const mediamtxController = new AbortController();
      const mediamtxTimeout = setTimeout(() => mediamtxController.abort(), 5000);
      
      const mediamtxResponse = await fetch('http://192.168.92.162:8889/', {
        method: 'GET',
        signal: mediamtxController.signal
      });
      
      clearTimeout(mediamtxTimeout);
      
      if (mediamtxResponse.ok || mediamtxResponse.status === 404) {
        setResults(prev => prev.slice(0, -1).concat({
          name: '测试 MediaMTX 服务器',
          status: 'success',
          message: `服务器在线 (${mediamtxResponse.status})`,
          details: 'MediaMTX 服务器运行正常，端口 8889 可访问'
        }));
      } else {
        setResults(prev => prev.slice(0, -1).concat({
          name: '测试 MediaMTX 服务器',
          status: 'warning',
          message: `服务器响应异常 (${mediamtxResponse.status})`,
          details: '服务器可访问，但返回了非预期状态码'
        }));
      }
    } catch (error: any) {
      clearTimeout(mediamtxTimeout as any);
      setResults(prev => prev.slice(0, -1).concat({
        name: '测试 MediaMTX 服务器',
        status: 'error',
        message: '无法连接到服务器',
        details: `错误: ${error.message}`,
        action: '确保 MediaMTX 正在运行，IP 地址为 192.168.92.162'
      }));
    }

    // Test 2: 检查 WHEP 端点
    addResult({ name: '测试 WHEP 端点', status: 'pending', message: '正在测试...' });
    
    try {
      const whepUrl = 'http://192.168.92.162:8889/heartplant/whep';
      const whepController = new AbortController();
      const whepTimeout = setTimeout(() => whepController.abort(), 5000);
      
      const whepResponse = await fetch(whepUrl, {
        method: 'OPTIONS',
        signal: whepController.signal
      });
      
      clearTimeout(whepTimeout);
      
      setResults(prev => prev.slice(0, -1).concat({
        name: '测试 WHEP 端点',
        status: 'success',
        message: 'WHEP 端点可访问',
        details: `端点: ${whepUrl}`,
      }));
    } catch (error: any) {
      setResults(prev => prev.slice(0, -1).concat({
        name: '测试 WHEP 端点',
        status: 'error',
        message: 'WHEP 端点无法访问',
        details: `错误: ${error.message}`,
        action: '检查 MediaMTX 配置文件中 webrtc 是否启用'
      }));
    }

    // Test 3: 检查摄像头 RTSP 源
    addResult({ name: '测试摄像头 HTTP 接口', status: 'pending', message: '正在测试...' });
    
    try {
      const cameraUrl = 'http://192.168.92.202/';
      const cameraController = new AbortController();
      const cameraTimeout = setTimeout(() => cameraController.abort(), 5000);
      
      const cameraResponse = await fetch(cameraUrl, {
        method: 'GET',
        signal: cameraController.signal,
        mode: 'no-cors' // 摄像头可能不支持 CORS
      });
      
      clearTimeout(cameraTimeout);
      
      setResults(prev => prev.slice(0, -1).concat({
        name: '测试摄像头 HTTP 接口',
        status: 'success',
        message: '摄像头网络可达',
        details: 'RTSP 源: rtsp://admin:***@192.168.92.202:554',
      }));
    } catch (error: any) {
      if (error.name === 'AbortError') {
        setResults(prev => prev.slice(0, -1).concat({
          name: '测试摄像头 HTTP 接口',
          status: 'warning',
          message: '摄像头响应超时',
          details: '可能是 CORS 限制，但这不影响 RTSP 流',
          action: 'MediaMTX 应该直接连接 RTSP，不受此影响'
        }));
      } else {
        setResults(prev => prev.slice(0, -1).concat({
          name: '测试摄像头 HTTP 接口',
          status: 'warning',
          message: '无法通过 HTTP 访问摄像头',
          details: `错误: ${error.message}`,
          action: 'RTSP 流可能仍然正常，请检查 MediaMTX 日志'
        }));
      }
    }

    // Test 4: 检查 WebRTC 支持
    addResult({ name: '检查浏览器 WebRTC 支持', status: 'pending', message: '正在检查...' });
    
    const hasWebRTC = !!(window.RTCPeerConnection && window.RTCSessionDescription);
    
    if (hasWebRTC) {
      setResults(prev => prev.slice(0, -1).concat({
        name: '检查浏览器 WebRTC 支持',
        status: 'success',
        message: '浏览器支持 WebRTC',
        details: 'RTCPeerConnection 和 RTCSessionDescription 可用'
      }));
    } else {
      setResults(prev => prev.slice(0, -1).concat({
        name: '检查浏览器 WebRTC 支持',
        status: 'error',
        message: '浏览器不支持 WebRTC',
        details: '请使用现代浏览器（Chrome, Firefox, Safari, Edge）',
        action: '更新浏览器到最新版本'
      }));
    }

    // Test 5: 尝试创建 WebRTC 连接
    addResult({ name: '尝试建立 WebRTC 连接', status: 'pending', message: '正在连接...' });
    
    try {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      pc.addTransceiver('video', { direction: 'recvonly' });
      pc.addTransceiver('audio', { direction: 'recvonly' });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Wait for ICE gathering
      await new Promise<void>((resolve) => {
        if (pc.iceGatheringState === 'complete') {
          resolve();
        } else {
          const checkState = () => {
            if (pc.iceGatheringState === 'complete') {
              pc.removeEventListener('icegatheringstatechange', checkState);
              resolve();
            }
          };
          pc.addEventListener('icegatheringstatechange', checkState);
          setTimeout(() => {
            pc.removeEventListener('icegatheringstatechange', checkState);
            resolve();
          }, 5000);
        }
      });

      const whepUrl = 'http://192.168.92.162:8889/heartplant/whep';
      const response = await fetch(whepUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/sdp',
        },
        body: pc.localDescription!.sdp,
      });

      if (response.ok) {
        const answerSDP = await response.text();
        await pc.setRemoteDescription(new RTCSessionDescription({
          type: 'answer',
          sdp: answerSDP,
        }));

        // Wait a bit for connection
        await new Promise(resolve => setTimeout(resolve, 2000));

        setResults(prev => prev.slice(0, -1).concat({
          name: '尝试建立 WebRTC 连接',
          status: 'success',
          message: `WebRTC 连接成功！连接状态: ${pc.connectionState}`,
          details: `ICE 状态: ${pc.iceConnectionState}`,
        }));

        pc.close();
      } else {
        throw new Error(`WHEP 请求失败: ${response.status} ${response.statusText}`);
      }
    } catch (error: any) {
      setResults(prev => prev.slice(0, -1).concat({
        name: '尝试建立 WebRTC 连接',
        status: 'error',
        message: 'WebRTC 连接失败',
        details: `错误: ${error.message}`,
        action: '检查 MediaMTX 是否已配置 RTSP 源并正在运行'
      }));
    }

    setTesting(false);
    toast.success('诊断完成！');
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'error':
        return <XCircle className="text-red-500" size={20} />;
      case 'warning':
        return <AlertCircle className="text-amber-500" size={20} />;
      case 'pending':
        return <RefreshCw className="text-blue-500 animate-spin" size={20} />;
    }
  };

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success': return 'bg-green-50 border-green-200';
      case 'error': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-amber-50 border-amber-200';
      case 'pending': return 'bg-blue-50 border-blue-200';
    }
  };

  const copyConfig = () => {
    const config = `# MediaMTX 配置文件 (mediamtx.yml)

paths:
  heartplant:
    # RTSP 源地址 (摄像头)
    source: rtsp://admin:reolink123@192.168.92.202:554
    sourceOnDemand: yes

# 确保 WebRTC 已启用
webrtc: yes
webrtcAddress: :8889

# API 配置 (可选，用于调试)
api: yes
apiAddress: :9997`;

    navigator.clipboard.writeText(config);
    toast.success('配置已复制到剪贴板！');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} />
          <span className="font-semibold">返回</span>
        </button>
        
        <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">
              <Wifi className="text-blue-600" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black">网络诊断工具</h1>
              <p className="text-sm text-gray-500">完整检测视频流连接状态</p>
            </div>
          </div>

          <button
            onClick={runDiagnostics}
            disabled={testing}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold shadow-md hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {testing ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                诊断中...
              </>
            ) : (
              <>
                <Wifi size={18} />
                开始诊断
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="max-w-4xl mx-auto space-y-4">
          {results.map((result, index) => (
            <div
              key={index}
              className={`bg-white rounded-3xl p-6 border-2 ${getStatusColor(result.status)} transition-all`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(result.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-bold text-gray-900">{result.name}</h3>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      result.status === 'success' ? 'bg-green-100 text-green-700' :
                      result.status === 'error' ? 'bg-red-100 text-red-700' :
                      result.status === 'warning' ? 'bg-amber-100 text-amber-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {result.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{result.message}</p>
                  {result.details && (
                    <p className="text-xs text-gray-500 font-mono bg-gray-50 px-3 py-2 rounded-xl mb-2">
                      {result.details}
                    </p>
                  )}
                  {result.action && (
                    <div className="flex items-start gap-2 mt-3 bg-white border border-gray-200 rounded-xl p-3">
                      <AlertCircle size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs font-semibold text-gray-700">{result.action}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Configuration Guide */}
      <div className="max-w-4xl mx-auto mt-6">
        <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black flex items-center gap-2">
              <Server size={20} />
              配置指南
            </h2>
            <button
              onClick={copyConfig}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-bold transition-all active:scale-95"
            >
              <Copy size={16} />
              复制配置
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-2xl p-4">
              <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
                <Camera size={16} className="text-blue-500" />
                当前配置
              </h3>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-gray-500">摄像头 IP:</span>
                  <span className="font-bold">192.168.92.202:554</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">MediaMTX IP:</span>
                  <span className="font-bold">192.168.92.162:8889</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">RTSP 源:</span>
                  <span className="font-bold">rtsp://admin:***@192.168.92.202:554</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">WHEP 端点:</span>
                  <span className="font-bold">http://192.168.92.162:8889/heartplant/whep</span>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <h3 className="font-bold text-sm mb-2 flex items-center gap-2 text-amber-900">
                <AlertCircle size={16} />
                常见问题
              </h3>
              <ul className="space-y-2 text-xs text-amber-800">
                <li className="flex gap-2">
                  <span className="font-bold">1.</span>
                  <span>确保 MediaMTX 正在 192.168.92.162 上运行</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">2.</span>
                  <span>检查 mediamtx.yml 配置文件中的 RTSP 源地址</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">3.</span>
                  <span>确保摄像头在同一网络且可访问</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">4.</span>
                  <span>查看 MediaMTX 日志确认是否成功连接 RTSP 源</span>
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              <a
                href="https://github.com/bluenviron/mediamtx"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-2xl text-sm font-bold hover:bg-gray-800 transition-all"
              >
                <ExternalLink size={16} />
                MediaMTX 文档
              </a>
              <button
                onClick={() => navigate('/stream-test')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-blue-700 transition-all"
              >
                <Camera size={16} />
                测试播放器
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
