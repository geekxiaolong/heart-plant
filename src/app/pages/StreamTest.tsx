import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Play, Wifi, AlertCircle, CheckCircle, Settings as SettingsIcon, Copy } from 'lucide-react';
import { WebRTCPlayer } from '../components/WebRTCPlayer';
import { toast } from 'sonner';

export function StreamTest() {
  const navigate = useNavigate();
  const [testResult, setTestResult] = useState<string>('');
  const [isTestingServer, setIsTestingServer] = useState(false);
  const [serverStatus, setServerStatus] = useState<'unknown' | 'online' | 'offline'>('unknown');
  const [showPlayer, setShowPlayer] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [mode, setMode] = useState<'webrtc' | 'websocket'>('webrtc');
  const [serverIp, setServerIp] = useState('192.168.92.162');
  const [serverPort, setServerPort] = useState('8889');
  const [streamPath, setStreamPath] = useState('heartplant');
  const [rtspUrl, setRtspUrl] = useState('rtsp://admin:reolink123@192.168.92.202:554');

  // Generate URLs based on mode
  const webrtcStreamUrl = `http://${serverIp}:${serverPort}/${streamPath}/whep`;
  const websocketStreamUrl = `ws://${serverIp}:${serverPort}/stream/${streamPath}`;
  const streamUrl = mode === 'websocket' ? websocketStreamUrl : webrtcStreamUrl;
  const serverBaseUrl = `http://${serverIp}:${serverPort}/`;

  const testServerConnection = async () => {
    setIsTestingServer(true);
    setTestResult('Testing mediamtx server connection...\n');

    try {
      // Test 1: Check if server is reachable
      setTestResult(prev => prev + '📡 Testing server reachability...\n');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      try {
        const response = await fetch(serverBaseUrl, { 
          method: 'GET',
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (response.ok || response.status === 404) {
          setTestResult(prev => prev + '✅ Server is reachable\n');
          setServerStatus('online');
        } else {
          setTestResult(prev => prev + `⚠️ Server returned status: ${response.status}\n`);
          setServerStatus('offline');
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        throw fetchError;
      }

      // Test 2: Check WHEP endpoint
      setTestResult(prev => prev + '\n📡 Testing WHEP endpoint...\n');
      
      const whepController = new AbortController();
      const whepTimeoutId = setTimeout(() => whepController.abort(), 5000);
      
      const whepTest = await fetch(streamUrl, {
        method: 'OPTIONS',
        signal: whepController.signal
      }).catch(() => {
        clearTimeout(whepTimeoutId);
        return null;
      });

      clearTimeout(whepTimeoutId);

      if (whepTest) {
        setTestResult(prev => prev + '✅ WHEP endpoint is accessible\n');
      } else {
        setTestResult(prev => prev + '❌ WHEP endpoint is not accessible\n');
      }

      setTestResult(prev => prev + '\n✨ Tests complete! Try starting the video player.\n');

    } catch (error: any) {
      setTestResult(prev => prev + `\n❌ Error: ${error.message}\n`);
      setServerStatus('offline');
      
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        setTestResult(prev => prev + '\n⚠️ Cannot reach server. Possible issues:\n');
        setTestResult(prev => prev + '  1. mediamtx server is not running\n');
        setTestResult(prev => prev + '  2. Server is running on different IP/port\n');
        setTestResult(prev => prev + '  3. Firewall is blocking connection\n');
        setTestResult(prev => prev + '  4. CORS is not configured\n');
      }
    } finally {
      setIsTestingServer(false);
    }
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
              <h1 className="text-2xl font-black">视频流测试工具</h1>
              <p className="text-sm text-gray-500">诊断 WebRTC/RTSP 流连接问题</p>
            </div>
          </div>

          {/* Configuration Info */}
          <div className="bg-gray-50 rounded-2xl p-4 mb-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">当前配置</h3>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-xs font-mono text-gray-400 min-w-24">RTSP源:</span>
                <span className="text-xs font-mono text-gray-700 break-all">{rtspUrl}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-xs font-mono text-gray-400 min-w-24">WHEP端点:</span>
                <span className="text-xs font-mono text-gray-700 break-all">{streamUrl}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-xs font-mono text-gray-400 min-w-24">服务器状态:</span>
                <span className={`text-xs font-bold ${
                  serverStatus === 'online' ? 'text-green-600' : 
                  serverStatus === 'offline' ? 'text-red-600' : 
                  'text-gray-400'
                }`}>
                  {serverStatus === 'online' ? '🟢 在线' : 
                   serverStatus === 'offline' ? '🔴 离线' : 
                   '⚪ 未知'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={testServerConnection}
              disabled={isTestingServer}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold shadow-md hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isTestingServer ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  测试中...
                </>
              ) : (
                <>
                  <Wifi size={18} />
                  测试服务器连接
                </>
              )}
            </button>

            <button
              onClick={() => setShowPlayer(!showPlayer)}
              className="flex-1 bg-green-600 text-white px-6 py-3 rounded-2xl font-bold shadow-md hover:bg-green-700 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Play size={18} />
              {showPlayer ? '隐藏播放器' : '启动播放器'}
            </button>
          </div>
        </div>
      </div>

      {/* Test Results */}
      {testResult && (
        <div className="max-w-4xl mx-auto mb-6">
          <div className="bg-black rounded-3xl p-6 shadow-lg">
            <h3 className="text-sm font-bold text-white/80 uppercase mb-3 flex items-center gap-2">
              <AlertCircle size={16} />
              测试日志
            </h3>
            <pre className="text-xs font-mono text-green-400 whitespace-pre-wrap leading-relaxed">
              {testResult}
            </pre>
          </div>
        </div>
      )}

      {/* Video Player */}
      {showPlayer && (
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-200">
            <h3 className="text-lg font-black mb-4 flex items-center gap-2">
              <Play size={20} />
              实时视频流
            </h3>
            <div className="aspect-video w-full bg-black rounded-2xl overflow-hidden">
              <WebRTCPlayer 
                streamUrl={streamUrl}
                rtspUrl={rtspUrl}
                onError={(err) => console.error('Player Error:', err)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Setup Guide */}
      <div className="max-w-4xl mx-auto mt-6">
        <div className="bg-amber-50 rounded-3xl p-6 border border-amber-200">
          <h3 className="text-lg font-black mb-4 flex items-center gap-2 text-amber-900">
            <AlertCircle size={20} />
            设置指南
          </h3>
          
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center text-amber-900 font-bold text-sm">
                1
              </div>
              <div>
                <h4 className="font-bold text-amber-900 mb-1">下载 mediamtx</h4>
                <p className="text-sm text-amber-800 mb-2">
                  从 <a href="https://github.com/bluenviron/mediamtx/releases" target="_blank" rel="noopener noreferrer" className="underline font-semibold">GitHub Releases</a> 下载适合你系统的版本
                </p>
                <div className="bg-white rounded-xl p-3 border border-amber-200">
                  <code className="text-xs font-mono text-amber-900">
                    # Windows: mediamtx_xxx_windows_amd64.zip<br />
                    # macOS: mediamtx_xxx_darwin_amd64.tar.gz<br />
                    # Linux: mediamtx_xxx_linux_amd64.tar.gz
                  </code>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center text-amber-900 font-bold text-sm">
                2
              </div>
              <div>
                <h4 className="font-bold text-amber-900 mb-1">配置 mediamtx.yml</h4>
                <p className="text-sm text-amber-800 mb-2">
                  在 mediamtx 目录下编辑 mediamtx.yml 文件，添加以下配置：
                </p>
                <div className="bg-white rounded-xl p-3 border border-amber-200">
                  <code className="text-xs font-mono text-amber-900 whitespace-pre">
{`paths:
  heartplant:
    source: rtsp://admin:reolink123@192.168.92.202:554

# 确保 WebRTC 已启用
webrtc: yes
webrtcAddress: :8889`}
                  </code>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center text-amber-900 font-bold text-sm">
                3
              </div>
              <div>
                <h4 className="font-bold text-amber-900 mb-1">启动服务器</h4>
                <p className="text-sm text-amber-800 mb-2">
                  在终端运行：
                </p>
                <div className="bg-white rounded-xl p-3 border border-amber-200">
                  <code className="text-xs font-mono text-amber-900">
                    # Windows<br />
                    ./mediamtx.exe<br /><br />
                    # macOS/Linux<br />
                    ./mediamtx
                  </code>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-200 flex items-center justify-center text-green-900 font-bold text-sm">
                <CheckCircle size={16} />
              </div>
              <div>
                <h4 className="font-bold text-green-900 mb-1">验证运行</h4>
                <p className="text-sm text-green-800">
                  服务器启动后应该显示：<br />
                  <code className="text-xs font-mono bg-white px-2 py-1 rounded mt-1 inline-block">
                    2024/xx/xx xx:xx:xx INF [WebRTC] listener opened on :8889
                  </code>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}